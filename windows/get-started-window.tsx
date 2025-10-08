import { Button } from "@/components/ui/button"

interface GetStartedWindowProps {
  onContinue?: () => void
}

export function GetStartedWindow({ onContinue }: GetStartedWindowProps) {
  return (
    <div className="text-center p-8">
      <h2 className="text-3xl font-bold text-[#08075C] mb-6">آماده شروع هستید؟</h2>
      <div className="space-y-6 max-w-2xl mx-auto">
        <p className="text-lg text-gray-700">
          به هزاران کسب‌وکاری بپیوندید که هم‌اکنون از دستیار صوتی هوش مصنوعی ما برای بهبود تجربه مشتری استفاده می‌کنند.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="bg-[#01ADEF] hover:bg-[#0194D1] text-white px-8 py-3">شروع آزمایشی رایگان</Button>
          <Button
            variant="outline"
            className="border-[#01ADEF] text-[#01ADEF] hover:bg-[#01ADEF] hover:text-white px-8 py-3 bg-transparent"
          >
            درخواست دمو
          </Button>
        </div>
      </div>
    </div>
  )
}
