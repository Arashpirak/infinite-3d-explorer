import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
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
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ]
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, message: 'رمز عبور انتخاب شده ضعیف است' }
  }
  
  return { isValid: true }
}

export async function POST(request: NextRequest) {
  try {
    const { password, confirmPassword } = await request.json()
    
    // Validate inputs
    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: true, message: 'رمز عبور و تأیید آن الزامی است' },
        { status: 400 }
      )
    }
    
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: true, message: 'رمز عبور و تأیید آن مطابقت ندارند' },
        { status: 400 }
      )
    }
    
    // Validate password strength
    const validation = validatePassword(password)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: true, message: validation.message },
        { status: 400 }
      )
    }
    
    // Get user from session
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: true, message: 'جلسه کاربری یافت نشد' },
        { status: 401 }
      )
    }
    
    const decoded = verifyToken(sessionToken)
    if (!decoded) {
      return NextResponse.json(
        { error: true, message: 'جلسه کاربری نامعتبر است' },
        { status: 401 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Update user with password
    const user = await db.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    })
    
    return NextResponse.json({
      success: true,
      message: 'رمز عبور با موفقیت ایجاد شد'
    })
    
  } catch (error) {
    console.error('Create password error:', error)
    return NextResponse.json(
      { error: true, message: 'خطا در ایجاد رمز عبور' },
      { status: 500 }
    )
  }
}
