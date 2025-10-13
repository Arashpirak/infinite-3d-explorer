import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { getSMSService } from '@/lib/sms-service'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

function generateInvitationCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { mobile, otp, inviteCode } = await request.json()
    
    // Validate inputs
    if (!mobile || !otp) {
      return NextResponse.json(
        { error: true, message: 'شماره موبایل و کد تأیید الزامی است' },
        { status: 400 }
      )
    }
    
    // Find the OTP record
    const otpRecord = await db.phoneOtp.findFirst({
      where: {
        phone: mobile,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!otpRecord) {
      return NextResponse.json(
        { error: true, message: 'کد تأیید یافت نشد یا منقضی شده است' },
        { status: 400 }
      )
    }
    
    // Check attempts
    if (otpRecord.attempts >= 3) {
      return NextResponse.json(
        { error: true, message: 'تعداد تلاش‌ها بیش از حد مجاز است' },
        { status: 400 }
      )
    }
    
    // Verify OTP
    const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash)
    
    if (!isValidOtp) {
      // Increment attempts only on failure
      await db.phoneOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      })
      
      return NextResponse.json(
        { error: true, message: 'کد تأیید اشتباه است' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    let user = await db.user.findUnique({
      where: { phone: mobile }
    })
    
    const isNewUser = !user
    
    if (isNewUser) {
      // Validate invite code for new users (00000 allowed)
      const normalizedInvite = (inviteCode || '').toString().toUpperCase()
      if (!normalizedInvite || normalizedInvite.length !== 5) {
        return NextResponse.json(
          { error: true, message: 'کد دعوت نامعتبر است' },
          { status: 400 }
        )
      }
      if (normalizedInvite !== '00000') {
        const foundInvite = await db.invite.findUnique({ where: { code: normalizedInvite } })
        if (!foundInvite) {
          return NextResponse.json(
            { error: true, message: 'کد دعوت یافت نشد' },
            { status: 400 }
          )
        }
        const now = new Date()
        if (foundInvite.expiresAt && foundInvite.expiresAt < now) {
          return NextResponse.json(
            { error: true, message: 'کد دعوت منقضی شده است' },
            { status: 400 }
          )
        }
        if (foundInvite.uses >= foundInvite.maxUses) {
          return NextResponse.json(
            { error: true, message: 'کد دعوت به حداکثر استفاده رسیده است' },
            { status: 400 }
          )
        }
        // increment uses and capture inviter
        await db.invite.update({ where: { id: foundInvite.id }, data: { uses: { increment: 1 } } })
        // Save inviter for the new user after creation
        var inviterUserId = foundInvite.userId
      }

      // Create new user with generated invitation code saved
      const invitationCode = generateInvitationCode()
      user = await db.user.create({
        data: {
          phone: mobile,
          status: 'active'
        }
      })

      // Save user's own invite code onto users table
      await db.$executeRawUnsafe(
        `UPDATE users SET invite_code = $1${inviterUserId ? ', invited_by_user_id = $2' : ''} WHERE id = $${inviterUserId ? 3 : 2}`,
        invitationCode,
        ...(inviterUserId ? [inviterUserId, user.id] : [user.id])
      )
      
      // Create invitation record
      await db.invite.create({
        data: {
          userId: user.id,
          code: invitationCode,
          maxUses: 10, // Allow 10 people to use this code
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      })

      // Record invite usage audit when inviter exists and not 00000
      if (typeof inviterUserId === 'string' && normalizedInvite !== '00000') {
        await db.$executeRawUnsafe(
          `INSERT INTO invite_uses (inviter_user_id, invited_user_id, code) VALUES ($1, $2, $3)`,
          inviterUserId,
          user.id,
          normalizedInvite
        )
      }
      
      // Welcome SMS removed as requested
    }
    
    // Create session token
    const sessionToken = generateToken({ userId: user.id, phone: user.phone })
    
    // Save session to database
    await db.session.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(sessionToken, 10),
        userAgent: request.headers.get('user-agent') || '',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })
    
    // Clean up used OTP
    await db.phoneOtp.delete({
      where: { id: otpRecord.id }
    })
    
    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: isNewUser ? 'حساب کاربری جدید ایجاد شد' : 'ورود موفقیت‌آمیز',
      isNewUser,
      hasPassword: !!user.password, // We'll add password field to schema
      invitationCode: isNewUser ? invitationCode : undefined
    })
    
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: true, message: 'خطا در تأیید کد' },
      { status: 500 }
    )
  }
}
