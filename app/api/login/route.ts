import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { mobile, password } = await request.json()
    
    // Validate inputs
    if (!mobile || !password) {
      return NextResponse.json(
        { error: true, message: 'شماره موبایل و رمز عبور الزامی است' },
        { status: 400 }
      )
    }
    
    // Find user
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
        { error: true, message: 'رمز عبور تنظیم نشده است. لطفاً ابتدا ثبت‌نام کنید' },
        { status: 400 }
      )
    }
    
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: true, message: 'حساب کاربری غیرفعال است' },
        { status: 403 }
      )
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: true, message: 'رمز عبور اشتباه است' },
        { status: 401 }
      )
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
    
    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'ورود موفقیت‌آمیز',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email
      }
    })
    
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: true, message: 'خطا در ورود' },
      { status: 500 }
    )
  }
}
