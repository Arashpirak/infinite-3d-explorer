import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'رمز عبور نباید بیش از ۱۲۸ کاراکتر باشد' }
  }
  
  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  if (!hasLetter || !hasNumber) {
    return { isValid: false, message: 'رمز عبور باید شامل حروف و اعداد باشد' }
  }
  
  return { isValid: true }
}

export async function POST(request: NextRequest) {
  try {
    const { mobile, otp, newPassword, confirmPassword } = await request.json()
    
    // Validate inputs
    if (!mobile || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: true, message: 'تمام فیلدها الزامی است' },
        { status: 400 }
      )
    }
    
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: true, message: 'رمز عبور جدید و تأیید آن مطابقت ندارند' },
        { status: 400 }
      )
    }
    
    // Validate password strength
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: true, message: validation.message },
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
    
    // Increment attempts
    await db.phoneOtp.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 }
    })
    
    if (!isValidOtp) {
      return NextResponse.json(
        { error: true, message: 'کد تأیید اشتباه است' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await db.user.findUnique({
      where: { phone: mobile }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: true, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    
    // Clean up used OTP
    await db.phoneOtp.delete({
      where: { id: otpRecord.id }
    })
    
    // Revoke all existing sessions for security
    await db.session.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() }
    })
    
    return NextResponse.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد'
    })
    
  } catch (error) {
    console.error('Confirm reset password error:', error)
    return NextResponse.json(
      { error: true, message: 'خطا در تغییر رمز عبور' },
      { status: 500 }
    )
  }
}
