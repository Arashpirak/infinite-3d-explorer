"use client"

import type React from "react"
import { EnglishQuizWindow } from "./english-quiz-window"
import { SignInWindow } from "./sign-in-window"
import { ChatboxWindow } from "./chatbox-window"
import { MobileAuthWindow } from "./mobile-auth-window"

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
    title: "Sign In",
    description: "Welcome & Authentication",
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
    title: "AI Chat",
    description: "Conversation with Arash",
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
    title: "How We Help",
    description: "24/7 Voice-Powered Customer Support",
    component: ({ onContinue }) => (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-[#08075C] mb-6">How We Help</h2>
        <p className="text-gray-700 mb-6">24/7 Voice-Powered Customer Support</p>
        <button onClick={onContinue} className="bg-[#01ADEF] text-white px-6 py-2 rounded">
          Continue
        </button>
      </div>
    ),
    initialPosition: { x: -25, y: -5, scale: 0.5, depth: 2 },
    unlocked: true,
  },
  {
    id: "features",
    title: "Features",
    description: "Advanced AI Conversation Capabilities",
    component: ({ onContinue }) => (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-[#08075C] mb-6">Features</h2>
        <p className="text-gray-700 mb-6">Advanced AI Conversation Capabilities</p>
        <button onClick={onContinue} className="bg-[#01ADEF] text-white px-6 py-2 rounded">
          Continue
        </button>
      </div>
    ),
    initialPosition: { x: 20, y: -12, scale: 0.35, depth: 3 },
    unlocked: true,
  },
  {
    id: "pricing",
    title: "Pricing Plans",
    description: "Flexible Solutions for Every Business",
    component: ({ onContinue }) => (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-[#08075C] mb-6">Pricing Plans</h2>
        <p className="text-gray-700 mb-6">Flexible Solutions for Every Business</p>
        <button onClick={onContinue} className="bg-[#01ADEF] text-white px-6 py-2 rounded">
          Continue
        </button>
      </div>
    ),
    initialPosition: { x: -12, y: -18, scale: 0.25, depth: 4 },
    unlocked: true,
  },
  {
    id: "get-started",
    title: "Get Started",
    description: "WordPress Plugin & Custom Integration",
    component: ({ onContinue }) => (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-[#08075C] mb-6">Get Started</h2>
        <p className="text-gray-700 mb-6">WordPress Plugin & Custom Integration</p>
        <button onClick={onContinue} className="bg-[#01ADEF] text-white px-6 py-2 rounded">
          Continue
        </button>
      </div>
    ),
    initialPosition: { x: 8, y: -22, scale: 0.18, depth: 5 },
    unlocked: true,
  },
]
