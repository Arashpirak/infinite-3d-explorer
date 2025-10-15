"use client"

import { useEffect, useRef, useState } from "react"

export default function LoadHome() {
  const [phase, setPhase] = useState<"dark" | "fade" | "galaxy">("dark")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasTriedPlayRef = useRef(false)

  useEffect(() => {
    // Preload welcome harp
    try {
      audioRef.current = new Audio("/music/welcome-harp.mp3")
      if (audioRef.current) {
        audioRef.current.volume = 0.4
        audioRef.current.currentTime = 0
      }
    } catch {}

    const t1 = setTimeout(() => {
      setPhase("fade")
      // Trigger music exactly at fade start
      if (!hasTriedPlayRef.current && audioRef.current) {
        hasTriedPlayRef.current = true
        audioRef.current.play().catch(() => {
          const onFirstInteract = async () => {
            if (!audioRef.current) return
            try { await audioRef.current.play() } finally {
              window.removeEventListener("click", onFirstInteract)
              window.removeEventListener("keydown", onFirstInteract)
            }
          }
          window.addEventListener("click", onFirstInteract, { once: true })
          window.addEventListener("keydown", onFirstInteract, { once: true })
        })
      }
    }, 300)
    const t2 = setTimeout(() => setPhase("galaxy"), 1200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      if (audioRef.current) {
        try { audioRef.current.pause() } catch {}
        audioRef.current = null
      }
    }
  }, [])

  // (moved music trigger into the phase change timer above to ensure exact sync)

  // Colors
  const darkColor = "#0b1533"
  const galaxyColor = "#0b1533" // base; overlay gradient adds galaxy vibe

  return (
    <div className="w-full h-screen relative overflow-hidden" style={{ background: galaxyColor }}>
      {/* Initial dark overlay that fades out */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: darkColor,
          opacity: phase === "dark" ? 1 : phase === "fade" ? 0.5 : 0,
          pointerEvents: "none",
        }}
      />

      {/* Subtle galaxy-like gradient background (matches explorer family) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${phase === "galaxy" ? "opacity-100" : "opacity-0"}`}
        style={{
          background: "linear-gradient(135deg, #08075C 0%, #01ADEF 50%, #08075C 100%)",
        }}
      />

      {/* Simple page with widget only */}
      <div className="relative z-10 w-full h-full">
        <script src="/dist2/widget.js" data-project-id="DEMO" data-api-key="PUBLIC_DEMO" async></script>
      </div>
    </div>
  )
}

