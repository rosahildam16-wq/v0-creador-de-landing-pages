"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
  life: number
  maxLife: number
  type: "ambient" | "funnel-flow" | "sparkle" | "converted"
}

const COLORS = {
  purple: "168, 85, 247",
  fuchsia: "217, 70, 239",
  pink: "236, 72, 153",
  violet: "139, 92, 246",
  gold: "251, 191, 36",
  white: "255, 255, 255",
}

export function LoginFunnelBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let w = 0
    let h = 0
    const particles: Particle[] = []
    let time = 0

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    const dw = () => w / window.devicePixelRatio
    const dh = () => h / window.devicePixelRatio

    // Funnel geometry helpers
    const funnelCx = () => dw() * 0.45
    const funnelTop = () => dh() * 0.15
    const funnelMid = () => dh() * 0.55
    const funnelBot = () => dh() * 0.85
    const funnelWidthTop = () => dw() * 0.5
    const funnelWidthMid = () => dw() * 0.08

    function createAmbient(): Particle {
      return {
        x: Math.random() * dw(),
        y: Math.random() * dh(),
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.25 + 0.05,
        color: [COLORS.purple, COLORS.violet, COLORS.fuchsia][Math.floor(Math.random() * 3)],
        life: 0,
        maxLife: Infinity,
        type: "ambient",
      }
    }

    function createFunnelFlow(): Particle {
      const cx = funnelCx()
      const topW = funnelWidthTop()
      return {
        x: cx + (Math.random() - 0.5) * topW,
        y: funnelTop() - Math.random() * 40,
        vx: 0,
        vy: Math.random() * 0.8 + 0.4,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.6 + 0.3,
        color: [COLORS.purple, COLORS.fuchsia, COLORS.pink, COLORS.violet][Math.floor(Math.random() * 4)],
        life: 0,
        maxLife: 400 + Math.random() * 200,
        type: "funnel-flow",
      }
    }

    function createSparkle(): Particle {
      const cx = funnelCx()
      return {
        x: cx + (Math.random() - 0.5) * 60,
        y: funnelBot() + Math.random() * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -(Math.random() * 1.5 + 0.5),
        size: Math.random() * 2 + 1,
        alpha: 1,
        color: COLORS.gold,
        life: 0,
        maxLife: 80 + Math.random() * 60,
        type: "sparkle",
      }
    }

    function createConverted(): Particle {
      const cx = funnelCx()
      return {
        x: cx + (Math.random() - 0.5) * 20,
        y: funnelBot(),
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.5 + 0.3,
        size: Math.random() * 3 + 2,
        alpha: 0.8,
        color: COLORS.gold,
        life: 0,
        maxLife: 120 + Math.random() * 60,
        type: "converted",
      }
    }

    // Initialize ambient particles
    for (let i = 0; i < 40; i++) particles.push(createAmbient())

    // Draw the funnel shape (glass-like)
    function drawFunnel() {
      const cx = funnelCx()
      const top = funnelTop()
      const mid = funnelMid()
      const bot = funnelBot()
      const wTop = funnelWidthTop() / 2
      const wMid = funnelWidthMid() / 2

      // Outer glow
      const glowGrad = ctx!.createRadialGradient(cx, mid, 0, cx, mid, wTop * 1.2)
      glowGrad.addColorStop(0, "rgba(168, 85, 247, 0.06)")
      glowGrad.addColorStop(0.5, "rgba(217, 70, 239, 0.03)")
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx!.fillStyle = glowGrad
      ctx!.fillRect(0, 0, dw(), dh())

      // Funnel body
      ctx!.beginPath()
      ctx!.moveTo(cx - wTop, top)
      ctx!.quadraticCurveTo(cx - wTop * 0.9, mid * 0.7, cx - wMid, mid)
      ctx!.lineTo(cx - wMid, bot)
      ctx!.lineTo(cx + wMid, bot)
      ctx!.lineTo(cx + wMid, mid)
      ctx!.quadraticCurveTo(cx + wTop * 0.9, mid * 0.7, cx + wTop, top)
      ctx!.closePath()

      const funnelGrad = ctx!.createLinearGradient(cx - wTop, top, cx + wTop, bot)
      funnelGrad.addColorStop(0, "rgba(139, 92, 246, 0.08)")
      funnelGrad.addColorStop(0.3, "rgba(168, 85, 247, 0.05)")
      funnelGrad.addColorStop(0.6, "rgba(217, 70, 239, 0.06)")
      funnelGrad.addColorStop(1, "rgba(236, 72, 153, 0.04)")
      ctx!.fillStyle = funnelGrad
      ctx!.fill()

      // Funnel edges (glowing lines)
      ctx!.beginPath()
      ctx!.moveTo(cx - wTop, top)
      ctx!.quadraticCurveTo(cx - wTop * 0.9, mid * 0.7, cx - wMid, mid)
      ctx!.lineTo(cx - wMid, bot)
      ctx!.strokeStyle = `rgba(168, 85, 247, ${0.15 + Math.sin(time * 0.02) * 0.05})`
      ctx!.lineWidth = 1.5
      ctx!.stroke()

      ctx!.beginPath()
      ctx!.moveTo(cx + wTop, top)
      ctx!.quadraticCurveTo(cx + wTop * 0.9, mid * 0.7, cx + wMid, mid)
      ctx!.lineTo(cx + wMid, bot)
      ctx!.strokeStyle = `rgba(217, 70, 239, ${0.15 + Math.sin(time * 0.02 + 1) * 0.05})`
      ctx!.lineWidth = 1.5
      ctx!.stroke()

      // Top rim glow
      ctx!.beginPath()
      ctx!.moveTo(cx - wTop, top)
      ctx!.lineTo(cx + wTop, top)
      ctx!.strokeStyle = `rgba(168, 85, 247, ${0.2 + Math.sin(time * 0.03) * 0.1})`
      ctx!.lineWidth = 2
      ctx!.stroke()

      // Bottom opening glow
      const botGlow = ctx!.createRadialGradient(cx, bot, 0, cx, bot, wMid * 3)
      botGlow.addColorStop(0, `rgba(251, 191, 36, ${0.15 + Math.sin(time * 0.025) * 0.05})`)
      botGlow.addColorStop(0.5, "rgba(217, 70, 239, 0.05)")
      botGlow.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx!.fillStyle = botGlow
      ctx!.beginPath()
      ctx!.arc(cx, bot, wMid * 3, 0, Math.PI * 2)
      ctx!.fill()
    }

    function updateFunnelFlow(p: Particle) {
      const cx = funnelCx()
      const top = funnelTop()
      const mid = funnelMid()
      const bot = funnelBot()
      const wTop = funnelWidthTop() / 2
      const wMid = funnelWidthMid() / 2

      const progress = Math.min(1, (p.y - top) / (bot - top))

      // Narrow particles toward center as they flow down
      const currentWidth = wTop + (wMid - wTop) * Math.pow(progress, 0.6)
      const targetX = cx + (p.x - cx) * (currentWidth / wTop)

      p.x += (targetX - p.x) * 0.02
      p.y += p.vy * (1 + progress * 0.5)

      // Speed up in the narrow section
      if (progress > 0.5) {
        p.vy += 0.01
        p.size *= 0.999
      }

      // Fade in/out
      if (progress < 0.1) p.alpha = Math.min(p.alpha, progress * 6)
      if (progress > 0.85) p.alpha *= 0.97

      // When reaching bottom, spawn sparkle
      if (p.y > bot) {
        p.life = p.maxLife
        if (Math.random() < 0.4) particles.push(createSparkle())
        if (Math.random() < 0.2) particles.push(createConverted())
      }
    }

    function drawParticle(p: Particle) {
      if (p.alpha <= 0.01) return

      ctx!.beginPath()
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(${p.color}, ${p.alpha})`
      ctx!.fill()

      // Glow for non-ambient particles
      if (p.type !== "ambient" && p.size > 1) {
        const glowSize = p.type === "sparkle" ? p.size * 5 : p.size * 3
        const grd = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize)
        grd.addColorStop(0, `rgba(${p.color}, ${p.alpha * 0.3})`)
        grd.addColorStop(1, `rgba(${p.color}, 0)`)
        ctx!.fillStyle = grd
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, glowSize, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    function animate() {
      time++
      ctx!.clearRect(0, 0, dw(), dh())

      // Dark base
      ctx!.fillStyle = "#05010d"
      ctx!.fillRect(0, 0, dw(), dh())

      // Draw funnel
      drawFunnel()

      // Spawn funnel flow particles
      if (time % 3 === 0) particles.push(createFunnelFlow())

      // Update & draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++

        if (p.type === "ambient") {
          p.x += p.vx
          p.y += p.vy
          p.alpha = (Math.sin(time * 0.01 + p.x * 0.01) * 0.5 + 0.5) * 0.2 + 0.05
          if (p.x < -10) p.x = dw() + 10
          if (p.x > dw() + 10) p.x = -10
          if (p.y < -10) p.y = dh() + 10
          if (p.y > dh() + 10) p.y = -10
        } else if (p.type === "funnel-flow") {
          updateFunnelFlow(p)
        } else if (p.type === "sparkle") {
          p.x += p.vx
          p.y += p.vy
          p.vy -= 0.01
          p.alpha = Math.max(0, 1 - p.life / p.maxLife)
          p.size *= 0.995
        } else if (p.type === "converted") {
          p.x += p.vx
          p.y += p.vy
          p.alpha = Math.max(0, 0.8 - p.life / p.maxLife)
          p.size *= 0.998
        }

        drawParticle(p)

        if (p.life >= p.maxLife || p.alpha <= 0.01) {
          particles.splice(i, 1)
        }
      }

      // Draw connections between nearby ambient particles
      const ambient = particles.filter((p) => p.type === "ambient")
      for (let i = 0; i < ambient.length; i++) {
        for (let j = i + 1; j < ambient.length; j++) {
          const dx = ambient[i].x - ambient[j].x
          const dy = ambient[i].y - ambient[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            const opacity = (1 - dist / 100) * 0.06
            ctx!.beginPath()
            ctx!.moveTo(ambient[i].x, ambient[i].y)
            ctx!.lineTo(ambient[j].x, ambient[j].y)
            ctx!.strokeStyle = `rgba(168, 85, 247, ${opacity})`
            ctx!.lineWidth = 0.5
            ctx!.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    window.addEventListener("resize", () => {
      resize()
    })

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: "blur(1px)" }}
      />
      {/* Extra blur overlay for dreamy effect */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 45% 50%, rgba(168,85,247,0.08) 0%, transparent 60%)",
        }}
      />
    </div>
  )
}
