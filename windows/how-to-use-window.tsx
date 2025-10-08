"use client"

import { Button } from "@/components/ui/button"

interface HowToUseWindowProps {
  onContinue?: () => void
}

export function HowToUseWindow({ onContinue }: HowToUseWindowProps) {
  return (
    <div className="text-center p-8" dir="rtl">
      <h2 className="text-3xl font-bold text-[#08075C] mb-6">اتصال ساده در ۳ مرحله</h2>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
          <div className="bg-[#01ADEF] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
            ۱
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-[#08075C]">نصب افزونه</h3>
            <p className="text-gray-700">افزونه وردپرس ما را نصب کنید یا از API استفاده کنید</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
          <div className="bg-[#01ADEF] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
            ۲
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-[#08075C]">پیکربندی تنظیمات</h3>
            <p className="text-gray-700">دستیار هوش مصنوعی را مطابق برند و نیاز خود تنظیم کنید</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
          <div className="bg-[#01ADEF] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
            ۳
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-[#08075C]">راه‌اندازی</h3>
            <p className="text-gray-700">دستیار شما آماده کمک به مشتریان است!</p>
          </div>
        </div>
      </div>
      <Button onClick={onContinue} className="mt-6 bg-[#01ADEF] hover:bg-[#0194D1] text-white">
        ادامه
      </Button>
    </div>
  )
}
