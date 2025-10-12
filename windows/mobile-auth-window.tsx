"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Eye, EyeOff, Copy, Check, Phone, Loader2 } from "lucide-react"

interface MobileAuthWindowProps {
  onContinue?: () => void
}

export function MobileAuthWindow({ onContinue }: MobileAuthWindowProps) {
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"mobile" | "otp" | "password" | "login">("mobile")
  const [invitationCode, setInvitationCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [error, setError] = useState("")
  const [smsStatus, setSmsStatus] = useState<"idle" | "sending" | "success" | "failed">("idle")

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^09\d{9}$/ // فرمت ایرانی: ۰۹xxxxxxxxx
    return mobileRegex.test(mobile)
  }

  const testSmsService = async () => {
    if (!validateMobile(mobile)) {
      setError("لطفاً ابتدا شماره موبایل معتبر وارد کنید")
      return
    }

    setError("")
    setSmsStatus("sending")
    try {
      console.log("🧪 Testing Melipayamak SMS service with:", mobile)
      const response = await fetch("/api/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: mobile, 
          message: "تست سرویس Melipayamak - این یک پیام تستی است" 
        }),
      })

      const data = await response.json()
      console.log("🧪 Melipayamak Test Response:", data)
      
      if (data.success) {
        setSmsStatus("success")
        setError("") // Clear any previous errors
        alert("✅ تست Melipayamak موفق بود! پیامک ارسال شد.")
      } else {
        setSmsStatus("failed")
        setError(data.message || "خطا در تست سرویس Melipayamak")
        alert("❌ تست Melipayamak ناموفق: " + (data.message || "خطای نامشخص"))
      }
    } catch (error) {
      console.error("❌ Melipayamak Test Error:", error)
      setSmsStatus("failed")
      setError("خطا در تست سرویس Melipayamak")
      alert("❌ خطا در تست سرویس Melipayamak")
    }
  }

  const handleSendOtp = async () => {
    setError("")
    setSmsStatus("idle")
    if (!validateMobile(mobile)) {
      setError("شماره موبایل نامعتبر است")
      return
    }

    setIsLoading(true)
    setSmsStatus("sending")
    try {
      console.log("📱 Sending OTP via Melipayamak to:", mobile)
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      })

      const data = await response.json()
      console.log("📱 Melipayamak OTP Response:", data)
      
      if (data.success) {
        console.log("✅ OTP sent successfully via Melipayamak")
        setSmsStatus("success")
        setStep("otp")
        setError("") // Clear any previous errors
      } else {
        console.log("❌ Melipayamak SMS sending failed:", data.message)
        setSmsStatus("failed")
        setError(data.message || "خطا در ارسال کد تأیید از طریق Melipayamak")
      }
    } catch (error) {
      console.error("❌ Melipayamak SMS API Error:", error)
      setSmsStatus("failed")
      setError("خطا در ارتباط با سرویس Melipayamak. لطفاً دوباره تلاش کنید.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError("")
    if (otp.length !== 6) {
      setError("کد تأیید باید ۶ رقم باشد")
      return
    }

    setIsLoading(true)
    try {
      console.log("🔐 Verifying OTP for:", mobile)
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      })

      const data = await response.json()
      console.log("🔐 OTP Verification Response:", data)
      
      if (data.success) {
        console.log("✅ OTP verified successfully")
        setIsNewUser(data.isNewUser)
        setError("") // Clear any previous errors
        if (data.isNewUser) {
          setInvitationCode(data.invitationCode)
          setStep("password")
        } else if (data.hasPassword) {
          setStep("login")
        } else {
          setStep("password")
        }
      } else {
        console.log("❌ OTP verification failed:", data.message)
        setError(data.message || "کد تأیید اشتباه است")
      }
    } catch (error) {
      console.error("❌ OTP Verification API Error:", error)
      setError("خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePassword = async () => {
    setError("")
    if (password !== confirmPassword) {
      setError("رمز عبور و تأیید آن مطابقت ندارند")
      return
    }

    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/create-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      })

      const data = await response.json()
      if (data.success) {
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("userPhone", mobile)
        onContinue?.()
      } else {
        setError(data.message || "خطا در ایجاد رمز عبور")
      }
    } catch (error) {
      setError("خطا در ارتباط با سرور")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    setError("")
    if (!password) {
      setError("رمز عبور الزامی است")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      })

      const data = await response.json()
      if (data.success) {
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("userPhone", mobile)
        onContinue?.()
      } else {
        setError(data.message || "خطا در ورود")
      }
    } catch (error) {
      setError("خطا در ارتباط با سرور")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setError("")
    setIsLoading(true)
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      })

      const data = await response.json()
      if (data.success) {
        setError("") // Clear any previous errors
        setStep("otp")
      } else {
        setError(data.message || "خطا در ارسال کد")
      }
    } catch (error) {
      setError("خطا در ارتباط با سرور")
    } finally {
      setIsLoading(false)
    }
  }

  const copyInvitationCode = () => {
    navigator.clipboard.writeText(invitationCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-md mx-auto" dir="rtl">
      <h2 className="text-3xl font-bold text-[#08075C] mb-6 text-center">احراز هویت موبایل</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {step === "mobile" && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="mobile" className="text-right block text-[#08075C] font-medium mb-2">
              شماره موبایل
            </Label>
            <div className="relative">
              <Input
                id="mobile"
                type="tel"
                placeholder="09123456789"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="text-right pr-10 py-3 text-lg border-2 border-gray-300 focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/20 transition-all duration-200"
                dir="ltr"
              />
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <p className="text-gray-500 text-xs mt-2 text-right">
              شماره موبایل خود را با فرمت ۰۹xxxxxxxxx وارد کنید
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleSendOtp}
              className="w-full bg-[#01ADEF] hover:bg-[#0194D1] text-white py-3 font-medium text-lg"
              disabled={isLoading || !mobile || !validateMobile(mobile)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  در حال ارسال کد...
                </>
              ) : (
                <>
                  <Phone className="ml-2 h-5 w-5" />
                  ارسال کد تأیید
                </>
              )}
            </Button>

            <Button
              onClick={testSmsService}
              variant="outline"
              className="w-full border-[#01ADEF] text-[#01ADEF] hover:bg-[#01ADEF] hover:text-white"
              disabled={isLoading || !mobile || !validateMobile(mobile)}
            >
              🧪 تست سرویس Melipayamak
            </Button>
          </div>

          {mobile && !validateMobile(mobile) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                ⚠️ لطفاً شماره موبایل را با فرمت صحیح وارد کنید (۰۹xxxxxxxxx)
              </p>
            </div>
          )}

          {/* SMS Status Indicator */}
          {smsStatus === "sending" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-blue-800 text-sm">
                  در حال ارسال پیامک از طریق Melipayamak...
                </p>
              </div>
            </div>
          )}

          {smsStatus === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-green-800 text-sm">
                  ✅ پیامک با موفقیت از طریق Melipayamak ارسال شد
                </p>
              </div>
            </div>
          )}

          {smsStatus === "failed" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-red-800 text-sm">
                  ❌ خطا در ارسال پیامک از طریق Melipayamak
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-green-800 text-sm font-medium">
                کد تأیید از طریق Melipayamak به شماره {mobile} ارسال شد
              </p>
            </div>
            <p className="text-green-600 text-xs mt-1">
              لطفاً کد ۶ رقمی دریافتی را وارد کنید
            </p>
          </div>

          <div>
            <Label htmlFor="otp" className="text-right block text-[#08075C] font-medium mb-3">
              کد تأیید
            </Label>
            <div className="flex justify-center">
              <InputOTP
                id="otp"
                value={otp}
                onChange={setOtp}
                maxLength={6}
                className="gap-2"
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot 
                    index={0} 
                    className="w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/20 transition-all duration-200"
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/20 transition-all duration-200"
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/20 transition-all duration-200"
                  />
                  <InputOTPSlot 
                    index={3} 
                    className="w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/20 transition-all duration-200"
                  />
                  <InputOTPSlot 
                    index={4} 
                    className="w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/20 transition-all duration-200"
                  />
                  <InputOTPSlot 
                    index={5} 
                    className="w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/20 transition-all duration-200"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-gray-500 text-xs text-center mt-3">
              کد تأیید ۶ رقمی را وارد کنید
            </p>
          </div>

          <Button
            onClick={handleVerifyOtp}
            className="w-full bg-[#01ADEF] hover:bg-[#0194D1] text-white py-3 font-medium"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال تأیید...
              </>
            ) : (
              "تأیید کد"
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => setStep("mobile")}
              variant="outline"
              className="flex-1"
            >
              تغییر شماره
            </Button>
            <Button
              onClick={handleSendOtp}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              ارسال مجدد
            </Button>
          </div>
        </div>
      )}

      {step === "password" && (
        <div className="space-y-6">
          {isNewUser && invitationCode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-800 font-semibold mb-2">کد دعوت شما:</h3>
              <div className="flex items-center gap-2">
                <code className="bg-green-100 px-3 py-1 rounded text-green-800 font-mono">
                  {invitationCode}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyInvitationCode}
                  className="text-green-600 border-green-300"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
              <p className="text-green-700 text-sm mt-2">
                این کد را با دوستان خود به اشتراک بگذارید تا بتوانند در سایت ثبت‌نام کنند
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="password" className="text-right block text-[#08075C] font-medium">
              رمز عبور
            </Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="رمز عبور خود را وارد کنید"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-right pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-right block text-[#08075C] font-medium">
              تأیید رمز عبور
            </Label>
            <div className="relative mt-2">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="رمز عبور را مجدداً وارد کنید"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-right pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>رمز عبور باید:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>حداقل ۸ کاراکتر باشد</li>
              <li>شامل حروف و اعداد باشد</li>
            </ul>
          </div>

          <Button
            onClick={handleCreatePassword}
            className="w-full bg-[#01ADEF] hover:bg-[#0194D1] text-white py-3"
            disabled={isLoading || !password || !confirmPassword}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال ایجاد...
              </>
            ) : (
              "ایجاد رمز عبور"
            )}
          </Button>
        </div>
      )}

      {step === "login" && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="loginPassword" className="text-right block text-[#08075C] font-medium">
              رمز عبور
            </Label>
            <div className="relative mt-2">
              <Input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                placeholder="رمز عبور خود را وارد کنید"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-right pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full bg-[#01ADEF] hover:bg-[#0194D1] text-white py-3"
            disabled={isLoading || !password}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال ورود...
              </>
            ) : (
              "ورود"
            )}
          </Button>

          <Button
            onClick={handleResetPassword}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            فراموشی رمز عبور
          </Button>

          <Button
            onClick={() => setStep("mobile")}
            variant="ghost"
            className="w-full"
          >
            تغییر شماره موبایل
          </Button>
        </div>
      )}
    </div>
  )
}