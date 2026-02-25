"use client"

import { useEffect, useRef } from "react"

export function LoginParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      alpha: number
      pulseSpeed: number
      pulsePhase: number
    }[] = []

    const colors = [
      "168, 85, 247",   // violet
      "217, 70, 239",   // fuchsia
      "236, 72, 153",   // pink
      "139, 92, 246",   // purple
      "251, 191, 36",   // gold sparkle
    ]

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }

    function animate() {
      ctx!.clearRect(0, 0, width, height)

      const time = Date.now() * 0.001

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        const pulse = Math.sin(time * p.pulseSpeed * 60 + p.pulsePhase) * 0.3 + 0.7
        const currentAlpha = p.alpha * pulse

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${p.color}, ${currentAlpha})`
        ctx!.fill()

        // Glow
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        const grd = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        grd.addColorStop(0, `rgba(${p.color}, ${currentAlpha * 0.4})`)
        grd.addColorStop(1, `rgba(${p.color}, 0)`)
        ctx!.fillStyle = grd
        ctx!.fill()
      }

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.08
            ctx!.beginPath()
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.strokeStyle = `rgba(168, 85, 247, ${opacity})`
            ctx!.lineWidth = 0.5
            ctx!.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  )
}
