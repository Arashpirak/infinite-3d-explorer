import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = {
      hasUsername: !!process.env.MP_USERNAME,
      hasPassword: !!process.env.MP_PASSWORD,
      hasFrom: !!process.env.MP_FROM,
      username: process.env.MP_USERNAME ? 'Set' : 'Not Set',
      from: process.env.MP_FROM || 'Not Set'
    }
    
    console.log('SMS Configuration Check:', config)
    
    return NextResponse.json({
      success: true,
      message: 'Configuration check completed',
      config: {
        ...config,
        // Don't expose actual credentials
        username: config.hasUsername ? 'Set' : 'Not Set',
        password: config.hasPassword ? 'Set' : 'Not Set'
      }
    })
    
  } catch (error) {
    console.error('Config Test Error:', error)
    return NextResponse.json(
      { 
        error: true, 
        message: 'خطا در بررسی تنظیمات',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
