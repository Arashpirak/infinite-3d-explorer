interface SMSConfig {
  username: string
  password: string
  from: string
}

interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
  details?: any
}

class SMSService {
  private config: SMSConfig

  constructor(config: SMSConfig) {
    this.config = config
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<SMSResult> {
    try {
      // Format phone number for Iranian SMS service
      const formattedPhone = phoneNumber.startsWith('09') ? phoneNumber : `09${phoneNumber}`
      
      // Persian SMS message for OTP
      const message = `کد تأیید شما: ${otp}\nاین کد تا ۵ دقیقه معتبر است.\n\nدر صورت عدم درخواست این کد، لطفاً آن را نادیده بگیرید.`
      
      const response = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
          to: formattedPhone,
          from: this.config.from,
          text: message,
        }),
      })

      const data = await response.json()
      
      if (response.ok && data) {
        return {
          success: true,
          messageId: data.toString(),
          details: data
        }
      } else {
        return {
          success: false,
          error: 'خطا در ارسال پیامک',
          details: data
        }
      }
    } catch (error) {
      console.error('SMS sending error:', error)
      return {
        success: false,
        error: 'خطا در ارتباط با سرویس پیامک',
        details: error
      }
    }
  }

  async sendPasswordResetOTP(phoneNumber: string, otp: string): Promise<SMSResult> {
    try {
      const formattedPhone = phoneNumber.startsWith('09') ? phoneNumber : `09${phoneNumber}`
      
      // Persian SMS message for password reset
      const message = `کد تأیید برای تغییر رمز عبور: ${otp}\nاین کد تا ۱۰ دقیقه معتبر است.\n\nدر صورت عدم درخواست این کد، لطفاً آن را نادیده بگیرید.`
      
      const response = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
          to: formattedPhone,
          from: this.config.from,
          text: message,
        }),
      })

      const data = await response.json()
      
      if (response.ok && data) {
        return {
          success: true,
          messageId: data.toString(),
          details: data
        }
      } else {
        return {
          success: false,
          error: 'خطا در ارسال پیامک',
          details: data
        }
      }
    } catch (error) {
      console.error('Password reset SMS sending error:', error)
      return {
        success: false,
        error: 'خطا در ارتباط با سرویس پیامک',
        details: error
      }
    }
  }

  async sendWelcomeMessage(phoneNumber: string, userName?: string): Promise<SMSResult> {
    try {
      const formattedPhone = phoneNumber.startsWith('09') ? phoneNumber : `09${phoneNumber}`
      
      const message = userName 
        ? `سلام ${userName} عزیز!\nبه سرویس ما خوش آمدید.`
        : 'به سرویس ما خوش آمدید!'
      
      const response = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
          to: formattedPhone,
          from: this.config.from,
          text: message,
        }),
      })

      const data = await response.json()
      
      if (response.ok && data) {
        return {
          success: true,
          messageId: data.toString(),
          details: data
        }
      } else {
        return {
          success: false,
          error: 'خطا در ارسال پیامک',
          details: data
        }
      }
    } catch (error) {
      console.error('Welcome SMS sending error:', error)
      return {
        success: false,
        error: 'خطا در ارتباط با سرویس پیامک',
        details: error
      }
    }
  }
}

// Create singleton instance
let smsService: SMSService | null = null

export function getSMSService(): SMSService {
  if (!smsService) {
    const config: SMSConfig = {
      username: process.env.MP_USERNAME || '',
      password: process.env.MP_PASSWORD || '',
      from: process.env.MP_FROM || '5000****' // Default sender number
    }
    
    if (!config.username || !config.password) {
      throw new Error('Melipayamak credentials not configured. Please set MP_USERNAME and MP_PASSWORD environment variables.')
    }
    
    smsService = new SMSService(config)
  }
  
  return smsService
}

export { SMSService, type SMSResult }
