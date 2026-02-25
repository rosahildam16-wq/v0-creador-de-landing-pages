"use client"

import { useEffect, useRef } from "react"

export function LoginPremiumBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let t = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const cw = () => canvas.offsetWidth
    const ch = () => canvas.offsetHeight

    // --- Large smooth glow orbs (inspired by the Synthetix premium style) ---
    const orbs = [
      // Main top-center purple glow
      { cx: 0.50, cy: 0.08, rx: 0.55, ry: 0.35, color: [124, 58, 237], alpha: 0.30, phase: 0, speed: 0.0015 },
      // Left mid blob
      { cx: 0.15, cy: 0.40, rx: 0.32, ry: 0.28, color: [139, 92, 246], alpha: 0.22, phase: 1.5, speed: 0.002 },
      // Right mid blob
      { cx: 0.82, cy: 0.35, rx: 0.28, ry: 0.25, color: [109, 40, 217], alpha: 0.18, phase: 3.0, speed: 0.0025 },
      // Center large ambient
      { cx: 0.45, cy: 0.55, rx: 0.45, ry: 0.40, color: [88, 28, 195], alpha: 0.12, phase: 2.0, speed: 0.001 },
      // Bottom left glow
      { cx: 0.20, cy: 0.80, rx: 0.30, ry: 0.25, color: [99, 102, 241], alpha: 0.14, phase: 4.0, speed: 0.003 },
      // Bottom right subtle
      { cx: 0.75, cy: 0.75, rx: 0.25, ry: 0.22, color: [168, 85, 247], alpha: 0.10, phase: 5.0, speed: 0.002 },
    ]

    function drawOrbs() {
      const w = cw(), h = ch()
      for (const orb of orbs) {
        const breathe = Math.sin(t * 0.002 + orb.phase) * 0.08
        const driftX = Math.sin(t * orb.speed + orb.phase) * 0.03
        const driftY = Math.cos(t * orb.speed * 0.7 + orb.phase) * 0.025

        const x = (orb.cx + driftX) * w
        const y = (orb.cy + driftY) * h
        const rx = orb.rx * w * (1 + breathe)
        const ry = orb.ry * h * (1 + breathe)

        const [cr, cg, cb] = orb.color
        const alphaModulated = orb.alpha * (1 + Math.sin(t * 0.003 + orb.phase * 2) * 0.15)

        ctx.save()
        ctx.translate(x, y)
        ctx.scale(1, ry / rx)

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alphaModulated})`)
        grad.addColorStop(0.3, `rgba(${cr},${cg},${cb},${alphaModulated * 0.5})`)
        grad.addColorStop(0.6, `rgba(${cr},${cg},${cb},${alphaModulated * 0.15})`)
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(0, 0, rx, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }
    }

    // --- Soft aurora wave bands ---
    function drawAurora() {
      const w = cw(), h = ch()

      for (let i = 0; i < 3; i++) {
        const yBase = h * (0.25 + i * 0.2)
        const amplitude = h * 0.08
        const waveSpeed = 0.0008 + i * 0.0003
        const alpha = 0.04 - i * 0.008

        ctx.beginPath()
        ctx.moveTo(0, yBase)

        for (let x = 0; x <= w; x += 4) {
          const normalizedX = x / w
          const y = yBase +
            Math.sin(normalizedX * Math.PI * 2 + t * waveSpeed + i * 1.5) * amplitude +
            Math.sin(normalizedX * Math.PI * 4 + t * waveSpeed * 1.3) * amplitude * 0.3
          ctx.lineTo(x, y)
        }

        ctx.lineTo(w, h)
        ctx.lineTo(0, h)
        ctx.closePath()

        const grad = ctx.createLinearGradient(0, yBase - amplitude, 0, yBase + amplitude * 3)
        grad.addColorStop(0, `rgba(139,92,246,${alpha})`)
        grad.addColorStop(0.4, `rgba(124,58,237,${alpha * 0.6})`)
        grad.addColorStop(1, `rgba(124,58,237,0)`)
        ctx.fillStyle = grad
        ctx.fill()
      }
    }

    // --- Floating soft particles (no sparkles, just smooth dots) ---
    const floaters = Array.from({ length: 30 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00012,
      vy: (Math.random() - 0.5) * 0.00012,
      size: Math.random() * 2 + 0.8,
      alpha: Math.random() * 0.15 + 0.05,
      phase: Math.random() * Math.PI * 2,
    }))

    function drawFloaters() {
      const w = cw(), h = ch()
      for (const f of floaters) {
        f.x += f.vx
        f.y += f.vy
        if (f.x < -0.02) f.x = 1.02
        if (f.x > 1.02) f.x = -0.02
        if (f.y < -0.02) f.y = 1.02
        if (f.y > 1.02) f.y = -0.02

        const px = f.x * w
        const py = f.y * h
        const pulse = f.alpha * (0.6 + Math.sin(t * 0.008 + f.phase) * 0.4)

        // Soft glow circle
        const glow = ctx.createRadialGradient(px, py, 0, px, py, f.size * 6)
        glow.addColorStop(0, `rgba(167,139,250,${pulse * 0.5})`)
        glow.addColorStop(0.5, `rgba(139,92,246,${pulse * 0.15})`)
        glow.addColorStop(1, `rgba(139,92,246,0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(px, py, f.size * 6, 0, Math.PI * 2)
        ctx.fill()

        // Core dot
        ctx.fillStyle = `rgba(196,181,253,${pulse})`
        ctx.beginPath()
        ctx.arc(px, py, f.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // --- Top radial light (like spotlight from above) ---
    function drawTopLight() {
      const w = cw(), h = ch()
      const pulse = 0.20 + Math.sin(t * 0.002) * 0.04

      // Main top-center radial glow
      const grad = ctx.createRadialGradient(w * 0.5, -h * 0.15, 0, w * 0.5, -h * 0.15, h * 0.8)
      grad.addColorStop(0, `rgba(124,58,237,${pulse})`)
      grad.addColorStop(0.3, `rgba(109,40,217,${pulse * 0.4})`)
      grad.addColorStop(0.6, `rgba(88,28,195,${pulse * 0.1})`)
      grad.addColorStop(1, `rgba(88,28,195,0)`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h * 0.75)
    }

    // --- Subtle vignette ---
    function drawVignette() {
      const w = cw(), h = ch()
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.25, w * 0.5, h * 0.5, w * 0.85)
      grad.addColorStop(0, "rgba(5,0,18,0)")
      grad.addColorStop(0.7, "rgba(5,0,18,0.3)")
      grad.addColorStop(1, "rgba(5,0,18,0.7)")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
    }

    function animate() {
      t++
      const w = cw(), h = ch()
      ctx.clearRect(0, 0, w, h)

      // Base dark
      ctx.fillStyle = "#050012"
      ctx.fillRect(0, 0, w, h)

      drawTopLight()
      drawAurora()
      drawOrbs()
      drawFloaters()
      drawVignette()

      animId = requestAnimationFrame(animate)
    }

    animate()
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
