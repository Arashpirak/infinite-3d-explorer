import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { mobile } = await request.json()

    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(mobile)) {
      return NextResponse.json({ error: true, message: 'شماره موبایل نامعتبر است' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { phone: mobile } })
    return NextResponse.json({ success: true, exists: !!user, hasPassword: !!user?.password })
  } catch (error) {
    return NextResponse.json({ error: true, message: 'خطای سرور' }, { status: 500 })
  }
}


