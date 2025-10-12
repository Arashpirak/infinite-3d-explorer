import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSMSService } from '@/lib/sms-service'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(phone: string): boolean {
  const now = Date.now()
  const key = `reset_${phone}`
  const limit = rateLimitStore.get(key)
  
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 300000 }) // 5 minute window
    return true
  }
  
  if (limit.count >= 2) { // Max 2 attempts per 5 minutes
    return false
  }
  
  limit.count++
  return true
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { mobile } = await request.json()
    
    // Validate phone number
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(mobile)) {
      return NextResponse.json(
        { error: true, message: 'شماره موبایل نامعتبر است' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { phone: mobile }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: true, message: 'کاربری با این شماره موبایل یافت نشد' },
        { status: 404 }
      )
    }
    
    if (!user.password) {
      return NextResponse.json(
        { error: true, message: 'رمز عبور تنظیم نشده است' },
        { status: 400 }
      )
    }
    
    // Check rate limit
    if (!checkRateLimit(mobile)) {
      return NextResponse.json(
        { error: true, message: 'تعداد درخواست‌ها زیاد است. لطفاً ۵ دقیقه صبر کنید' },
        { status: 429 }
      )
    }
    
    // Generate OTP
    const otp = generateOTP()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
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
        userId: user.id,
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
      const smsResult = await smsService.sendPasswordResetOTP(mobile, otp)
      
      if (!smsResult.success) {
        console.error('Password reset SMS sending failed:', smsResult.error)
        // Still return success to user but log the error
        // In production, you might want to handle this differently
      } else {
        console.log(`Password reset SMS sent successfully to ${mobile}, Message ID: ${smsResult.messageId}`)
      }
    } catch (error) {
      console.error('Password reset SMS service error:', error)
      // Continue with the flow even if SMS fails
      // In production, you might want to handle this differently
    }
    
    return NextResponse.json({
      success: true,
      message: 'کد تأیید برای بازنشانی رمز عبور ارسال شد',
      requestId: crypto.randomUUID()
    })
    
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: true, message: 'خطا در ارسال کد تأیید' },
      { status: 500 }
    )
  }
}
