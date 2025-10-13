"use client"

import type React from "react"
import { EnglishQuizWindow } from "./english-quiz-window"
import { SignInWindow } from "./sign-in-window"
import { ChatboxWindow } from "./chatbox-window"
import { MobileAuthWindow } from "./mobile-auth-window"
import { UserDashboardWindow } from "./user-dashboard-window"

export interface WindowConfig {
  id: string
  title: string
  description: string
  component: React.ComponentType<{ onContinue?: () => void; jsonFilePath?: string }>
  initialPosition: { x: number; y: number; scale: number; depth: number }
  unlocked: boolean
  requiresAuth?: boolean
}

export const WINDOW_REGISTRY: WindowConfig[] = [
  {
    id: "sign-in",
    title: "ورود",
    description: "خوش‌آمدگویی و احراز هویت",
    component: SignInWindow,
    initialPosition: { x: -45, y: 15, scale: 1.0, depth: 0 },
    unlocked: true,
  },
  {
    id: "mobile-auth",
    title: "احراز هویت موبایل",
    description: "تأیید هویت با شماره موبایل و OTP",
    component: MobileAuthWindow,
    initialPosition: { x: -35, y: 10, scale: 0.9, depth: 0.2 },
    unlocked: true,
    requiresAuth: false,
  },
  {
    id: "chatbox",
    title: "گفتگو با هوش مصنوعی",
    description: "گفتگو با آرش",
    component: ChatboxWindow,
    initialPosition: { x: 45, y: 8, scale: 0.8, depth: 0.5 },
    unlocked: true,
  },
  {
    id: "english-quiz",
    title: "English Quiz",
    description: "Vocabulary Learning & Testing",
    component: EnglishQuizWindow,
    initialPosition: { x: 35, y: 5, scale: 0.7, depth: 1 },
    unlocked: true,
    requiresAuth: false,
  },
  {
    id: "how-we-help",
    title: "چگونه کمک می‌کنیم",
    description: "پشتیبانی مشتری ۲۴/۷ با قدرت صدا",
    component: ({ onContinue }) => (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-[#08075C] mb-6">چگونه کمک می‌کنیم</h2>
        <p className="text-gray-700 mb-6">پشتیبانی مشتری ۲۴/۷ با استفاده از صدا</p>
        <button onClick={onContinue} className="bg-[#01ADEF] text-white px-6 py-2 rounded">
          ادامه
        </button>
      </div>
    ),
    initialPosition: { x: -25, y: -5, scale: 0.5, depth: 2 },
    unlocked: true,
  },
  {
    id: "features",
    title: "ویژگی‌ها",
    description: "قابلیت‌های پیشرفته گفتگو با هوش مصنوعی",
    component: ({ onContinue }) => (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-[#08075C] mb-6">ویژگی‌ها</h2>
        <p className="text-gray-700 mb-6">قابلیت‌های پیشرفته مکالمه با هوش مصنوعی</p>
        <button onClick={onContinue} className="bg-[#01ADEF] text-white px-6 py-2 rounded">
          ادامه
        </button>
      </div>
    ),
    initialPosition: { x: 20, y: -12, scale: 0.35, depth: 3 },
    unlocked: true,
  },
  {
    id: "user-dashboard",
    title: "داشبورد کاربر",
    description: "نمای کلی حساب، اعتبار و تاریخچه",
    component: UserDashboardWindow,
    initialPosition: { x: 15, y: -8, scale: 0.32, depth: 3 },
    unlocked: true,
    requiresAuth: true,
  },
  {
    id: "pricing",
    title: "پلن‌های قیمت‌گذاری",
    description: "راهکارهای انعطاف‌پذیر برای هر کسب‌وکار",
    component: ({ onContinue }) => (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-[#08075C] mb-6">پلن‌های قیمت‌گذاری</h2>
        <p className="text-gray-700 mb-6">راهکارهای منعطف برای هر کسب‌وکار</p>
        <button onClick={onContinue} className="bg-[#01ADEF] text-white px-6 py-2 rounded">
          ادامه
        </button>
      </div>
    ),
    initialPosition: { x: -12, y: -18, scale: 0.25, depth: 4 },
    unlocked: true,
  },
  {
    id: "get-started",
    title: "شروع کنید",
    description: "افزونه وردپرس و یکپارچه‌سازی سفارشی",
    component: ({ onContinue }) => (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-[#08075C] mb-6">شروع کنید</h2>
        <p className="text-gray-700 mb-6">افزونه وردپرس و یکپارچه‌سازی سفارشی</p>
        <button onClick={onContinue} className="bg-[#01ADEF] text-white px-6 py-2 rounded">
          ادامه
        </button>
      </div>
    ),
    initialPosition: { x: 8, y: -22, scale: 0.18, depth: 5 },
    unlocked: true,
  },
]
