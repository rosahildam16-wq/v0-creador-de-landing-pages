"use client"

import { useEffect, useRef } from "react"

interface Orb {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  color1: string
  color2: string
  phase: number
  speed: number
}

export function LoginOrbBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let time = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const w = () => canvas.offsetWidth
    const h = () => canvas.offsetHeight

    const orbs: Orb[] = [
      {
        x: 0.25, y: 0.3, radius: 0.35,
        vx: 0.00008, vy: 0.00006,
        color1: "rgba(99,102,241,0.35)", color2: "rgba(99,102,241,0)",
        phase: 0, speed: 0.008,
      },
      {
        x: 0.7, y: 0.6, radius: 0.4,
        vx: -0.00006, vy: 0.00009,
        color1: "rgba(139,92,246,0.3)", color2: "rgba(139,92,246,0)",
        phase: 2, speed: 0.006,
      },
      {
        x: 0.5, y: 0.2, radius: 0.28,
        vx: 0.00007, vy: -0.00005,
        color1: "rgba(79,70,229,0.25)", color2: "rgba(79,70,229,0)",
        phase: 4, speed: 0.01,
      },
      {
        x: 0.8, y: 0.15, radius: 0.22,
        vx: -0.0001, vy: 0.00004,
        color1: "rgba(168,85,247,0.2)", color2: "rgba(168,85,247,0)",
        phase: 1, speed: 0.007,
      },
      {
        x: 0.15, y: 0.75, radius: 0.3,
        vx: 0.00005, vy: -0.00007,
        color1: "rgba(59,130,246,0.2)", color2: "rgba(59,130,246,0)",
        phase: 3, speed: 0.009,
      },
    ]

    // Grid lines data
    const gridLines = Array.from({ length: 12 }, (_, i) => ({
      offset: i / 12,
      alpha: 0.03 + Math.random() * 0.02,
      speed: 0.0005 + Math.random() * 0.001,
      phase: Math.random() * Math.PI * 2,
    }))

    function drawGrid() {
      const cw = w()
      const ch = h()

      // Horizontal lines
      for (const line of gridLines) {
        const y = (line.offset + Math.sin(time * line.speed + line.phase) * 0.02) * ch
        const alpha = line.alpha * (0.7 + Math.sin(time * 0.01 + line.phase) * 0.3)
        ctx!.beginPath()
        ctx!.moveTo(0, y)
        ctx!.lineTo(cw, y)
        ctx!.strokeStyle = `rgba(148,163,184,${alpha})`
        ctx!.lineWidth = 0.5
        ctx!.stroke()
      }

      // Vertical lines
      for (const line of gridLines) {
        const x = (line.offset + Math.cos(time * line.speed + line.phase) * 0.015) * cw
        const alpha = line.alpha * 0.6 * (0.7 + Math.cos(time * 0.01 + line.phase) * 0.3)
        ctx!.beginPath()
        ctx!.moveTo(x, 0)
        ctx!.lineTo(x, ch)
        ctx!.strokeStyle = `rgba(148,163,184,${alpha})`
        ctx!.lineWidth = 0.5
        ctx!.stroke()
      }
    }

    function drawOrbs() {
      const cw = w()
      const ch = h()

      for (const orb of orbs) {
        // Animate position with sine/cosine for organic movement
        const ox = (orb.x + Math.sin(time * orb.speed + orb.phase) * 0.08) * cw
        const oy = (orb.y + Math.cos(time * orb.speed * 0.7 + orb.phase) * 0.06) * ch
        const or = orb.radius * Math.min(cw, ch) * (1 + Math.sin(time * 0.005 + orb.phase) * 0.1)

        const grad = ctx!.createRadialGradient(ox, oy, 0, ox, oy, or)
        grad.addColorStop(0, orb.color1)
        grad.addColorStop(0.6, orb.color2.replace("0)", "0.05)"))
        grad.addColorStop(1, orb.color2)

        ctx!.fillStyle = grad
        ctx!.beginPath()
        ctx!.arc(ox, oy, or, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    // Small floating dots
    const dots = Array.from({ length: 50 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.0002,
      speedY: (Math.random() - 0.5) * 0.0002,
      phase: Math.random() * Math.PI * 2,
      baseAlpha: Math.random() * 0.4 + 0.1,
    }))

    function drawDots() {
      const cw = w()
      const ch = h()

      for (const dot of dots) {
        dot.x += dot.speedX
        dot.y += dot.speedY
        if (dot.x < -0.05) dot.x = 1.05
        if (dot.x > 1.05) dot.x = -0.05
        if (dot.y < -0.05) dot.y = 1.05
        if (dot.y > 1.05) dot.y = -0.05

        const alpha = dot.baseAlpha * (0.5 + Math.sin(time * 0.02 + dot.phase) * 0.5)
        const dx = dot.x * cw
        const dy = dot.y * ch

        ctx!.beginPath()
        ctx!.arc(dx, dy, dot.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(165,180,252,${alpha})`
        ctx!.fill()
      }
    }

    // Connect nearby dots
    function drawConnections() {
      const cw = w()
      const ch = h()

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = (dots[i].x - dots[j].x) * cw
          const dy = (dots[i].y - dots[j].y) * ch
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.06
            ctx!.beginPath()
            ctx!.moveTo(dots[i].x * cw, dots[i].y * ch)
            ctx!.lineTo(dots[j].x * cw, dots[j].y * ch)
            ctx!.strokeStyle = `rgba(139,92,246,${alpha})`
            ctx!.lineWidth = 0.5
            ctx!.stroke()
          }
        }
      }
    }

    function animate() {
      time++
      const cw = w()
      const ch = h()

      ctx!.clearRect(0, 0, cw, ch)

      // Deep dark base
      ctx!.fillStyle = "#030014"
      ctx!.fillRect(0, 0, cw, ch)

      drawGrid()
      drawOrbs()
      drawConnections()
      drawDots()

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
        style={{ filter: "blur(0.5px)" }}
      />
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  )
}
