"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Stars } from "@react-three/drei"
import { StarWarsChat, type ChatMessage } from "@/components/star-wars-chat"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  
  // Simple chat demo state; replace with your real chat later
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: "Hello! How can I help you today?", sender: "ai", timestamp: Date.now() },
  ])

  // Delayed audio playback after page fully loads
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio("/music/welcome-harp.mp3")

    const tryPlay = async () => {
      try {
        // delay a few seconds to ensure the page feels loaded
        await new Promise((r) => setTimeout(r, 2500))
        if (!audioRef.current) return
        audioRef.current.volume = 0.25
        audioRef.current.currentTime = 0
        await audioRef.current.play()
      } catch {
        // Autoplay blocked -> wait for any user interaction to start
        const onFirstInteract = async () => {
          if (!audioRef.current) return
          try {
            audioRef.current.volume = 0.25
            audioRef.current.currentTime = 0
            await audioRef.current.play()
          } finally {
            window.removeEventListener("click", onFirstInteract)
            window.removeEventListener("keydown", onFirstInteract)
          }
        }
        window.addEventListener("click", onFirstInteract, { once: true })
        window.addEventListener("keydown", onFirstInteract, { once: true })
      }
    }

    tryPlay()
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient like the explorer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#08075C] via-[#01ADEF] to-[#08075C]" />

      {/* Star field */}
      <Canvas className="absolute inset-0">
        <Stars radius={100} depth={50} count={6000} factor={5} saturation={0} fade speed={1.5} />
      </Canvas>

      {/* Centered content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-8">
          <h1 className="text-3xl font-bold text-[#08075C] mb-6 text-center">AI Chatbot Widget Demo</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Original Chat Interface */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-[#01ADEF] mb-4">Built-in Chat Interface</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <StarWarsChat messages={messages} isTyping={false} showControls={false} />
              </div>
            </div>

            {/* Widget Integration Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-[#01ADEF] mb-4">Widget Integration</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <p className="text-gray-700">
                  This page demonstrates both the built-in chat interface and the embeddable widget.
                  Look for the robot icon (🤖) in the bottom-right corner!
                </p>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Integration Code:</h3>
                  <code className="text-green-400 text-sm block">
                    {`<script src="https://your-domain.com/dist2/embed.js"></script>`}
                  </code>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Widget Features:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>✅ Draggable and resizable</li>
                    <li>✅ Minimizable to floating icon</li>
                    <li>✅ Persian language support</li>
                    <li>✅ Real-time AI chat</li>
                    <li>✅ One-line integration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add to My Website Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <Button
          onClick={() => router.push('/pathway')}
          className="bg-gradient-to-r from-[#08075C] to-[#01ADEF] hover:from-[#01ADEF] hover:to-[#08075C] text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
        >
          به سایت خودم اضافه کنم
        </Button>
      </div>

      {/* Chatbot Widget - This is how other websites will integrate it */}
      <Script 
        src="/dist2/embed.js" 
        strategy="afterInteractive"
        data-debug="true"
        data-custom-title="Demo Widget"
        data-custom-subtitle="Try the widget here!"
      />
    </div>
  )
}