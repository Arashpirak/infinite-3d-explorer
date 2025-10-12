import { NextRequest, NextResponse } from 'next/server'
import { getSMSService } from '@/lib/sms-service'

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()
    
    if (!phone || !message) {
      return NextResponse.json(
        { error: true, message: 'شماره موبایل و متن پیام الزامی است' },
        { status: 400 }
      )
    }

    // Validate phone number (Iranian format)
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: true, message: 'شماره موبایل نامعتبر است' },
        { status: 400 }
      )
    }

    console.log('Testing SMS service with:', { phone, message })
    
    const smsService = getSMSService()
    const result = await smsService.sendOTP(phone, message)
    
    console.log('SMS Test Result:', result)
    
    return NextResponse.json({
      success: result.success,
      message: result.message || (result.success ? 'پیامک با موفقیت ارسال شد' : 'خطا در ارسال پیامک'),
      details: result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('SMS Test Error:', error)
    return NextResponse.json(
      { 
        error: true, 
        message: 'خطا در تست سرویس پیامک',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'SMS Test API is working',
    usage: 'POST with { phone: "09123456789", message: "test message" }'
  })
}
