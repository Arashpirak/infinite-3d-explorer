"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UserSettingsWindowProps {
  onContinue?: () => void
}

export function UserSettingsWindow({ onContinue }: UserSettingsWindowProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [interests, setInterests] = useState<string>("")
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  useEffect(() => {
    const storedInterests = localStorage.getItem("userInterests") || ""
    setInterests(storedInterests)
  }, [])

  const saveSettings = async () => {
    setStatus("saving")
    try {
      if (password && password !== confirmPassword) {
        setStatus("error")
        alert("رمز عبور و تأیید آن یکسان نیست")
        return
      }

      if (password) {
        await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, confirmPassword }),
        })
      }

      localStorage.setItem("userInterests", interests)
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 1200)
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto" dir="rtl">
      <h2 className="text-3xl font-bold text-[#08075C] mb-6 text-center">تنظیمات کاربر</h2>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>تغییر رمز عبور</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">رمز عبور جدید</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="confirm">تأیید رمز عبور</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>علایق</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="مثلاً: AI, NLP, Voice, English"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button onClick={saveSettings} className="bg-[#01ADEF] hover:bg-[#0194D1] text-white">
            {status === "saving" ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </Button>
          {onContinue && (
            <Button onClick={onContinue} variant="outline">
              ادامه
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}


