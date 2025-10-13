"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { ArrowLeft, Users, Pin, PinOff, Lock, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { WINDOW_REGISTRY, type WindowConfig } from "@/windows/window-registry"
import { useSearchParams } from "next/navigation"

type RecordingState =
  | "idle"
  | "requesting-permission"
  | "ready"
  | "recording"
  | "processing"
  | "waiting-llm"
  | "generating-voice"
  | "playing-response"

interface WindowState extends WindowConfig {
  position: { x: number; y: number; scale: number; depth: number }
  isPinned: boolean
}

export default function PathwayPage() {
  const searchParams = useSearchParams()
  const [currentWindowId, setCurrentWindowId] = useState<string>("sign-in")
  const [aiVolumeLevel, setAiVolumeLevel] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [windows, setWindows] = useState<WindowState[]>(() =>
    WINDOW_REGISTRY.map((window) => ({
      ...window,
      position: { ...window.initialPosition },
      isPinned: ["how-we-help", "features", "pricing", "chatbox", "user-dashboard"].includes(window.id),
    })),
  )
  const [pinnedWindows, setPinnedWindows] = useState<string[]>(["how-we-help", "features", "pricing", "chatbox", "user-dashboard"])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isNavigationLocked, setIsNavigationLocked] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const voiceAudioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isRecordingRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const hasProcessedUrlParam = useRef(false)

  useEffect(() => {
    const handleStorageChange = () => {
      const loginStatus = localStorage.getItem("isLoggedIn") === "true"
      setIsLoggedIn(loginStatus)
    }

    handleStorageChange()
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("loginStatusChanged", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("loginStatusChanged", handleStorageChange)
    }
  }, [])

  // Load pinned windows per user on auth change
  useEffect(() => {
    try {
      const phone = localStorage.getItem("userPhone") || "guest"
      const saved = localStorage.getItem(`pinned-windows:${phone}`)
      if (saved) {
        const arr = JSON.parse(saved) as string[]
        setPinnedWindows(arr)
        setWindows((prev) => prev.map((w) => ({ ...w, isPinned: arr.includes(w.id) })))
      }
    } catch {}
  }, [isLoggedIn])

  // Persist pinned windows per user
  useEffect(() => {
    try {
      const phone = localStorage.getItem("userPhone") || "guest"
      localStorage.setItem(`pinned-windows:${phone}`, JSON.stringify(pinnedWindows))
    } catch {}
  }, [pinnedWindows])

  useEffect(() => {
    const windowParam = searchParams.get("window")
    if (windowParam) {
      const targetWindow = WINDOW_REGISTRY.find((w) => w.id === windowParam)
      if (targetWindow) {
        setCurrentWindowId(windowParam)
        setWindows((prev) =>
          prev.map((window) => {
            if (window.id === windowParam) {
              return { ...window, position: { x: 0, y: 0, scale: 1.0, depth: 0 } }
            }
            return window
          }),
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount

  const DEFAULT_LOCKED_WINDOWS = ["user-dashboard", "user-settings"]

  const visibleWindows = useMemo(() => {
    return windows.filter((window) => {
      const isDefaultLocked = DEFAULT_LOCKED_WINDOWS.includes(window.id)
      if (window.requiresAuth && !isLoggedIn && window.id !== "user-dashboard") {
        return false
      }
      // Lock mobile-auth when logged in
      if (window.id === "mobile-auth" && isLoggedIn) {
        return true
      }
      return true
    })
  }, [windows, isLoggedIn])

  const navigateToPreviousWindow = () => {
    if (isNavigationLocked) return
    const currentIndex = visibleWindows.findIndex((w) => w.id === currentWindowId)
    if (currentIndex > 0) {
      navigateToWindow(visibleWindows[currentIndex - 1].id)
    }
  }

  const navigateToNextWindow = () => {
    if (isNavigationLocked) return
    const currentIndex = visibleWindows.findIndex((w) => w.id === currentWindowId)
    if (currentIndex < visibleWindows.length - 1) {
      navigateToWindow(visibleWindows[currentIndex + 1].id)
    }
  }

  const navigateToWindow = async (windowId: string) => {
    if (isNavigationLocked) return

    const targetWindow = visibleWindows.find((w) => w.id === windowId)
    if (!targetWindow || windowId === currentWindowId || isTransitioning) return

    setIsTransitioning(true)

    setWindows((prev) =>
      prev.map((window) => {
        if (window.id === currentWindowId) {
          return { ...window, position: { ...window.initialPosition } }
        } else if (window.id === windowId) {
          return { ...window, position: { x: 0, y: 0, scale: 1.0, depth: 0 } }
        }
        return window
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 600))

    setCurrentWindowId(windowId)
    setIsTransitioning(false)
  }

  const togglePin = (windowId: string) => {
    const window = visibleWindows.find((w) => w.id === windowId)
    if (!window) return

    if (pinnedWindows.includes(windowId)) {
      setPinnedWindows((prev) => prev.filter((id) => id !== windowId))
      setWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, isPinned: false } : w)))
    } else {
      if (pinnedWindows.length < 10) {
        setPinnedWindows((prev) => [...prev, windowId])
        setWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, isPinned: true } : w)))
      }
    }
  }

  const navigateToPinnedWindow = (windowId: string) => {
    navigateToWindow(windowId)
  }

  useEffect(() => {
    // Disable scroll-based navigation entirely
    const handleWheelEvent = (e: WheelEvent) => {
      return
    }

    window.addEventListener("wheel", handleWheelEvent, { passive: true })
    return () => window.removeEventListener("wheel", handleWheelEvent)
  }, [])

  const currentWindow = visibleWindows.find((w) => w.id === currentWindowId)
  const CurrentWindowComponent = currentWindow?.component

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#08075C] via-[#01ADEF] to-[#08075C] overflow-hidden relative">
      {/* Static Pathway Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full">
          <line
            x1="5%"
            y1="20%"
            x2="48%"
            y2="85%"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="2"
            className="drop-shadow-lg"
          />
          <line
            x1="95%"
            y1="20%"
            x2="52%"
            y2="85%"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            className="drop-shadow-lg"
          />
          <line x1="48%" y1="85%" x2="52%" y2="85%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        </svg>

        {/* All Pathway Windows in Background */}
        {visibleWindows.map((window, index) => {
          const isActive = window.id === currentWindowId
          const opacityEffect = isActive ? 0 : Math.max(0.3, 1 - window.position.depth * 0.15)

          return (
            <div
              key={window.id}
              className={`absolute transition-all duration-600 ease-out cursor-pointer hover:scale-105`}
              style={{
                left: `${50 + window.position.x}%`,
                top: `${40 + window.position.y}%`,
                transform: `translate(-50%, -50%) scale(${Math.max(0.05, window.position.scale)})`,
                opacity: opacityEffect,
                zIndex: isActive ? 0 : 10 - window.position.depth,
                pointerEvents: "auto",
              }}
            >
              <div className="relative">
                <div className="absolute -top-2 -left-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePin(window.id)
                    }}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm
                      ${
                        window.isPinned
                          ? "bg-[#01ADEF] text-white shadow-lg shadow-[#01ADEF]/50 border border-white/20"
                          : "bg-white/20 text-white hover:bg-[#01ADEF] hover:text-white border border-white/30"
                      }
                    `}
                  >
                    {window.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                </div>

                {(window.requiresAuth && !isLoggedIn) || (window.id === "mobile-auth" && isLoggedIn) ? (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-500 text-white shadow-lg border border-white/20">
                      <Lock size={14} />
                    </div>
                  </div>
                ) : null}

                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg border transition-all duration-300 ${
                      (window.requiresAuth && !isLoggedIn) || (window.id === "mobile-auth" && isLoggedIn)
                        ? "bg-gray-300/70 text-gray-500 border-gray-400/30 cursor-not-allowed"
                        : "bg-white/90 text-[#08075C] border-[#01ADEF]/30 hover:bg-[#01ADEF] hover:text-white cursor-pointer transform hover:scale-110"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      const isLocked =
                        (window.requiresAuth && !isLoggedIn) || (window.id === "mobile-auth" && isLoggedIn)
                      if (!isActive && !isLocked) {
                        navigateToWindow(window.id)
                      }
                    }}
                  >
                    {window.title}
                    {((window.requiresAuth && !isLoggedIn) || (window.id === "mobile-auth" && isLoggedIn)) && " 🔒"}
                  </div>
                </div>

                <div
                  className={`border-3 bg-white/10 backdrop-blur-sm rounded-lg p-8 min-w-[250px] min-h-[180px] flex flex-col justify-center items-center shadow-2xl transition-all duration-300 hover:bg-white/20 border-white/60 relative`}
                  style={{
                    boxShadow: `0 0 40px rgba(1, 173, 239, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)`,
                    borderColor: index % 2 === 0 ? "#01ADEF" : "#ffffff",
                    filter:
                      (window.requiresAuth && !isLoggedIn) || (window.id === "mobile-auth" && isLoggedIn)
                        ? "grayscale(100%) brightness(0.8)"
                        : "none",
                  }}
                  onClick={() => {
                    const isLocked =
                      (window.requiresAuth && !isLoggedIn) || (window.id === "mobile-auth" && isLoggedIn)
                    if (!isActive && !isLocked) navigateToWindow(window.id)
                  }}
                >
                  <div className="text-center">
                    <h3 className="font-bold text-xl mb-3 text-white">{window.title}</h3>
                    <p className="text-sm leading-relaxed text-white/90">{window.description}</p>
                    {((window.requiresAuth && !isLoggedIn) || (window.id === "mobile-auth" && isLoggedIn)) && (
                      <div className="mt-3 text-orange-300 text-xs">🔒 Sign in required</div>
                    )}
                  </div>
                  {((window.requiresAuth && !isLoggedIn) || (window.id === "mobile-auth" && isLoggedIn)) && (
                    <div className="absolute inset-0 bg-black/30 rounded-lg pointer-events-none" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Assistant
          </Button>
        </Link>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex gap-4 z-20">
        <Link href="/">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
          >
            <Users size={20} />
          </Button>
        </Link>
      </div>

      {isLoggedIn && (
        <div className="absolute top-4 right-20 z-20">
          <div className="bg-green-500/20 border border-green-400/30 text-green-100 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            ✓ Signed In
          </div>
        </div>
      )}

      {/* Main Active Window */}
      <div className="flex items-center justify-center min-h-screen p-8 relative z-15">
        <div
          className={`bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-[#01ADEF]/20 max-w-4xl w-full transition-all duration-600 ease-out relative ${
            isTransitioning ? "scale-90 opacity-70" : "scale-100 opacity-100"
          }`}
        >
          {pinnedWindows.length > 0 && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex flex-wrap gap-2 justify-center max-w-3xl">
                {pinnedWindows.map((windowId) => {
                  const window = visibleWindows.find((w) => w.id === windowId)
                  if (!window) return null

                  return (
                    <button
                      key={windowId}
                      onClick={() => navigateToPinnedWindow(windowId)}
                      disabled={isNavigationLocked}
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 backdrop-blur-sm shadow-md
                        ${
                          windowId === currentWindowId
                            ? "bg-[#01ADEF] text-white border border-white/30 shadow-[#01ADEF]/50"
                            : isNavigationLocked
                              ? "bg-gray-300/50 text-gray-400 border border-gray-400/30 cursor-not-allowed"
                              : "bg-white/80 text-[#08075C] border border-[#01ADEF]/20 hover:bg-[#01ADEF] hover:text-white hover:scale-105"
                        }
                      `}
                      title={isNavigationLocked ? "Navigation locked" : `Go to ${window.title}`}
                    >
                      {window.title}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="absolute left-0 top-0 bottom-0 w-[5%] flex items-center justify-center">
            <button
              onClick={navigateToPreviousWindow}
              disabled={isNavigationLocked || visibleWindows.findIndex((w) => w.id === currentWindowId) === 0}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm shadow-lg
                ${
                  isNavigationLocked || visibleWindows.findIndex((w) => w.id === currentWindowId) === 0
                    ? "bg-gray-300/50 text-gray-400 cursor-not-allowed"
                    : "bg-[#01ADEF]/20 text-[#01ADEF] hover:bg-[#01ADEF] hover:text-white border border-[#01ADEF]/30 hover:scale-110"
                }
              `}
              title={isNavigationLocked ? "Navigation locked" : "Previous window"}
            >
              <ChevronLeft size={24} />
            </button>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-[5%] flex items-center justify-center">
            <button
              onClick={navigateToNextWindow}
              disabled={
                isNavigationLocked ||
                visibleWindows.findIndex((w) => w.id === currentWindowId) === visibleWindows.length - 1
              }
              className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm shadow-lg
                ${
                  isNavigationLocked ||
                  visibleWindows.findIndex((w) => w.id === currentWindowId) === visibleWindows.length - 1
                    ? "bg-gray-300/50 text-gray-400 cursor-not-allowed"
                    : "bg-[#01ADEF]/20 text-[#01ADEF] hover:bg-[#01ADEF] hover:text-white border border-[#01ADEF]/30 hover:scale-110"
                }
              `}
              title={isNavigationLocked ? "Navigation locked" : "Next window"}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {CurrentWindowComponent && (
            <CurrentWindowComponent
              onContinue={() => {
                if (currentWindow?.id === "mobile-auth") {
                  navigateToWindow("user-dashboard")
                }
              }}
              onLockNavigation={setIsNavigationLocked}
            />
          )}

          {currentWindow && (
            <div className="absolute bottom-4 right-4">
              <button
                onClick={() => togglePin(currentWindow.id)}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm shadow-lg
                  ${
                    currentWindow.isPinned
                      ? "bg-[#01ADEF] text-white shadow-[#01ADEF]/50 border-2 border-white/20 hover:bg-[#0194D1]"
                      : "bg-white/20 text-[#08075C] hover:bg-[#01ADEF] hover:text-white border-2 border-[#01ADEF]/30"
                  }
                  hover:scale-110 active:scale-95
                `}
                title={currentWindow.isPinned ? "Unpin this window" : "Pin this window"}
              >
                {currentWindow.isPinned ? <PinOff size={20} /> : <Pin size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
          از دکمه‌های کناری یا کلیک روی پنجره‌ها استفاده کنید • 🔒 = نیازمند ورود
        </div>
      </div>

      {/* Lock Indicator */}
      {isNavigationLocked && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-red-500/90 backdrop-blur-sm rounded-full px-6 py-3 text-white text-sm font-semibold shadow-lg flex items-center gap-2">
            <Lock size={16} />
            Navigation locked during quiz
          </div>
        </div>
      )}
    </div>
  )
}
