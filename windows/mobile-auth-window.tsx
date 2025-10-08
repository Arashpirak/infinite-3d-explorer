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

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^09\d{9}$/ // فرمت ایرانی: ۰۹xxxxxxxxx
    return mobileRegex.test(mobile)
  }

  const handleSendOtp = async () => {
    setError("")
    if (!validateMobile(mobile)) {
      setError("شماره موبایل نامعتبر است")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      })

      const data = await response.json()
      if (data.success) {
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

  const handleVerifyOtp = async () => {
    setError("")
    if (otp.length !== 6) {
      setError("کد تأیید باید ۶ رقم باشد")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      })

      const data = await response.json()
      if (data.success) {
        setIsNewUser(data.isNewUser)
        if (data.isNewUser) {
          setInvitationCode(data.invitationCode)
          setStep("password")
        } else if (data.hasPassword) {
          setStep("login")
        } else {
          setStep("password")
        }
      } else {
        setError(data.message || "خطا در تأیید کد")
      }
    } catch (error) {
      setError("خطا در ارتباط با سرور")
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
            <Label htmlFor="mobile" className="text-right block text-[#08075C] font-medium">
              شماره موبایل
            </Label>
            <div className="relative mt-2">
              <Input
                id="mobile"
                type="tel"
                placeholder="09123456789"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="text-right pr-10"
              />
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          <Button
            onClick={handleSendOtp}
            className="w-full bg-[#01ADEF] hover:bg-[#0194D1] text-white py-3"
            disabled={isLoading || !mobile}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال ارسال...
              </>
            ) : (
              "ارسال کد تأیید"
            )}
          </Button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="otp" className="text-right block text-[#08075C] font-medium">
              کد تأیید ارسال شده به {mobile}
            </Label>
            <InputOTP
              id="otp"
              value={otp}
              onChange={setOtp}
              maxLength={6}
              className="mt-4"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerifyOtp}
            className="w-full bg-[#01ADEF] hover:bg-[#0194D1] text-white py-3"
            disabled={isLoading || !otp}
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

          <Button
            onClick={() => setStep("mobile")}
            variant="outline"
            className="w-full"
          >
            تغییر شماره موبایل
          </Button>
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