"use client"

interface ModernPinButtonProps {
  title: string
  onClick: () => void
  isActive: boolean
}

export function ModernPinButton({ title, onClick, isActive }: ModernPinButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 rounded-full font-semibold transition-all duration-300 backdrop-blur-sm
        ${
          isActive
            ? "bg-[#01ADEF] text-white shadow-lg shadow-[#01ADEF]/50 scale-110 border-2 border-white/20"
            : "bg-white/20 text-white hover:bg-white/30 border-2 border-white/30 hover:scale-105"
        }
      `}
    >
      {title}
    </button>
  )
}
