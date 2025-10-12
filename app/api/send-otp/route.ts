import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSMSService } from '@/lib/sms-service'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(phone: string): boolean {
  const now = Date.now()
  const key = `otp_${phone}`
  const limit = rateLimitStore.get(key)
  
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }
  
  if (limit.count >= 3) { // Max 3 attempts per minute
    return false
  }
  
  limit.count++
  return true
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function generateInvitationCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { mobile } = await request.json()
    
    // Validate phone number (Iranian format)
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(mobile)) {
      return NextResponse.json(
        { error: true, message: 'شماره موبایل نامعتبر است' },
        { status: 400 }
      )
    }
    
    // Check rate limit
    if (!checkRateLimit(mobile)) {
      return NextResponse.json(
        { error: true, message: 'تعداد درخواست‌ها زیاد است. لطفاً یک دقیقه صبر کنید' },
        { status: 429 }
      )
    }
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { phone: mobile }
    })
    
    // Generate OTP
    const otp = generateOTP()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    
    // Clean up old OTPs for this phone
    await db.phoneOtp.deleteMany({
      where: {
        phone: mobile,
        expiresAt: { lt: new Date() }
      }
    })
    
    // Save OTP to database
    await db.phoneOtp.create({
      data: {
        phone: mobile,
        otpHash,
        expiresAt,
        attempts: 0,
        sentChannel: 'sms'
      }
    })
    
    // Send SMS using Melipayamak service
    try {
      const smsService = getSMSService()
      const smsResult = await smsService.sendOTP(mobile, otp)
      
      if (!smsResult.success) {
        console.error('❌ SMS sending failed:', smsResult.error)
        console.error('SMS Details:', smsResult.details)
        // Still return success to user but log the error
        // In production, you might want to handle this differently
      } else {
        console.log(`✅ SMS sent successfully to ${mobile}`)
        console.log('SMS Message ID:', smsResult.messageId)
        console.log('SMS Details:', smsResult.details)
      }
    } catch (error) {
      console.error('❌ SMS service error:', error)
      // Continue with the flow even if SMS fails
      // In production, you might want to handle this differently
    }
    
    return NextResponse.json({
      success: true,
      message: existingUser ? 'کد تأیید برای ورود ارسال شد' : 'کد تأیید برای ثبت‌نام ارسال شد',
      isExistingUser: !!existingUser,
      hasPassword: !!existingUser?.password,
      requestId: crypto.randomUUID()
    })
    
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: true, message: 'خطا در ارسال کد تأیید' },
      { status: 500 }
    )
  }
}
