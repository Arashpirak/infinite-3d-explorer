"use client"

export default function LoadHome() {
  return (
    <div className="w-full h-screen" style={{ background: '#0b1533' }}>
      {/* Simple page with widget only */}
      <script src="/dist2/widget.js" data-project-id="DEMO" data-api-key="PUBLIC_DEMO" async></script>
    </div>
  )
}

