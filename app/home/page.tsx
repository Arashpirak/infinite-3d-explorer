"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Stars } from "@react-three/drei"
import { StarWarsChat, type ChatMessage } from "@/components/star-wars-chat"

export default function HomePage() {
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

      {/* Centered chat box */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-6">
          <h1 className="text-2xl font-bold text-[#08075C] mb-4 text-center">AI chat box</h1>
          <StarWarsChat messages={messages} isTyping={false} showControls={false} />
        </div>
      </div>
    </div>
  )
}