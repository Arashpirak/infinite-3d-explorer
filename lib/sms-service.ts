import MelipayamakApi from 'melipayamak'

interface SMSConfig {
  username: string
  password: string
  from: string
}

interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

class SMSService {
  private api: MelipayamakApi
  private from: string

  constructor(config: SMSConfig) {
    this.api = new MelipayamakApi(config.username, config.password)
    this.from = config.from
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<SMSResult> {
    try {
      // Format phone number for Iranian SMS service
      const formattedPhone = phoneNumber.startsWith('09') ? phoneNumber : `09${phoneNumber}`
      
      // Persian SMS message for OTP
      const message = `کد تأیید شما: ${otp}\nاین کد تا ۵ دقیقه معتبر است.\n\nدر صورت عدم درخواست این کد، لطفاً آن را نادیده بگیرید.`
      
      const response = await this.api.send(formattedPhone, this.from, message)
      
      if (response && response.RetStatus === 1) {
        return {
          success: true,
          messageId: response.StrRetStatus
        }
      } else {
        return {
          success: false,
          error: response?.StrRetStatus || 'خطا در ارسال پیامک'
        }
      }
    } catch (error) {
      console.error('SMS sending error:', error)
      return {
        success: false,
        error: 'خطا در ارتباط با سرویس پیامک'
      }
    }
  }

  async sendPasswordResetOTP(phoneNumber: string, otp: string): Promise<SMSResult> {
    try {
      const formattedPhone = phoneNumber.startsWith('09') ? phoneNumber : `09${phoneNumber}`
      
      // Persian SMS message for password reset
      const message = `کد تأیید برای تغییر رمز عبور: ${otp}\nاین کد تا ۱۰ دقیقه معتبر است.\n\nدر صورت عدم درخواست این کد، لطفاً آن را نادیده بگیرید.`
      
      const response = await this.api.send(formattedPhone, this.from, message)
      
      if (response && response.RetStatus === 1) {
        return {
          success: true,
          messageId: response.StrRetStatus
        }
      } else {
        return {
          success: false,
          error: response?.StrRetStatus || 'خطا در ارسال پیامک'
        }
      }
    } catch (error) {
      console.error('Password reset SMS sending error:', error)
      return {
        success: false,
        error: 'خطا در ارتباط با سرویس پیامک'
      }
    }
  }

  async sendWelcomeMessage(phoneNumber: string, userName?: string): Promise<SMSResult> {
    try {
      const formattedPhone = phoneNumber.startsWith('09') ? phoneNumber : `09${phoneNumber}`
      
      const message = userName 
        ? `سلام ${userName} عزیز!\nبه سرویس ما خوش آمدید.`
        : 'به سرویس ما خوش آمدید!'
      
      const response = await this.api.send(formattedPhone, this.from, message)
      
      if (response && response.RetStatus === 1) {
        return {
          success: true,
          messageId: response.StrRetStatus
        }
      } else {
        return {
          success: false,
          error: response?.StrRetStatus || 'خطا در ارسال پیامک'
        }
      }
    } catch (error) {
      console.error('Welcome SMS sending error:', error)
      return {
        success: false,
        error: 'خطا در ارتباط با سرویس پیامک'
      }
    }
  }
}

// Create singleton instance
let smsService: SMSService | null = null

export function getSMSService(): SMSService {
  if (!smsService) {
    const config: SMSConfig = {
      username: process.env.MELIPAYAMAK_USERNAME || '',
      password: process.env.MELIPAYAMAK_PASSWORD || '',
      from: process.env.MELIPAYAMAK_FROM || '5000****' // Default sender number
    }
    
    if (!config.username || !config.password) {
      throw new Error('Melipayamak credentials not configured. Please set MELIPAYAMAK_USERNAME and MELIPAYAMAK_PASSWORD environment variables.')
    }
    
    smsService = new SMSService(config)
  }
  
  return smsService
}

export { SMSService, type SMSResult }
