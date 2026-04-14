'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
  hue: number
  type: 'shard' | 'orb' | 'ring'
  blur: number
}

export function GlassParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef<number>(0)
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 })

  const initParticles = useCallback((w: number, h: number) => {
    const count = Math.min(35, Math.floor((w * h) / 25000))
    const particles: Particle[] = []

    for (let i = 0; i < count; i++) {
      const type = i < count * 0.4 ? 'shard' : i < count * 0.75 ? 'orb' : 'ring'
      const x = Math.random() * w
      const y = Math.random() * h
      particles.push({
        x, y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: type === 'orb' ? 15 + Math.random() * 40 : type === 'ring' ? 30 + Math.random() * 50 : 8 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.008,
        opacity: type === 'ring' ? 0.08 + Math.random() * 0.1 : 0.06 + Math.random() * 0.12,
        hue: 240 + Math.random() * 40, // blue-purple range
        type,
        blur: type === 'orb' ? 1 + Math.random() * 2 : 0,
      })
    }
    return particles
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)
      setDimensions({ w, h })
      particlesRef.current = initParticles(w, h)
    }

    resize()
    window.addEventListener('resize', resize)

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handleLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    canvas.addEventListener('mousemove', handleMouse)
    canvas.addEventListener('mouseleave', handleLeave)

    const animate = () => {
      const { w, h } = { w: canvas.clientWidth, h: canvas.clientHeight }
      ctx.clearRect(0, 0, w, h)

      const mouse = mouseRef.current
      const particles = particlesRef.current
      const time = Date.now() * 0.001

      for (const p of particles) {
        // Ambient drift
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed

        // Gentle sine wave motion
        p.x += Math.sin(time * 0.5 + p.baseY * 0.01) * 0.15
        p.y += Math.cos(time * 0.3 + p.baseX * 0.01) * 0.1

        // Mouse repulsion (anti-gravity)
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const repelRadius = 180
        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) * 3.5
          p.vx += (dx / dist) * force * 0.08
          p.vy += (dy / dist) * force * 0.08
        }

        // Spring back to base position (very gentle)
        p.vx += (p.baseX - p.x) * 0.001
        p.vy += (p.baseY - p.y) * 0.001

        // Damping
        p.vx *= 0.985
        p.vy *= 0.985

        // Wrap edges
        if (p.x < -50) p.x = w + 50
        if (p.x > w + 50) p.x = -50
        if (p.y < -50) p.y = h + 50
        if (p.y > h + 50) p.y = -50

        // Dynamic opacity based on mouse proximity
        const mouseDist = Math.sqrt((p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2)
        const proximityBoost = mouseDist < 250 ? (1 - mouseDist / 250) * 0.15 : 0

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        const alpha = p.opacity + proximityBoost

        if (p.type === 'shard') {
          // Glass shard — angular polygon
          ctx.beginPath()
          const s = p.size
          ctx.moveTo(0, -s)
          ctx.lineTo(s * 0.6, -s * 0.2)
          ctx.lineTo(s * 0.3, s * 0.7)
          ctx.lineTo(-s * 0.4, s * 0.5)
          ctx.lineTo(-s * 0.7, -s * 0.3)
          ctx.closePath()

          const grad = ctx.createLinearGradient(-s, -s, s, s)
          grad.addColorStop(0, `hsla(${p.hue}, 70%, 75%, ${alpha})`)
          grad.addColorStop(0.5, `hsla(${p.hue + 20}, 60%, 85%, ${alpha * 0.6})`)
          grad.addColorStop(1, `hsla(${p.hue + 40}, 50%, 90%, ${alpha * 0.3})`)
          ctx.fillStyle = grad
          ctx.fill()

          // Glass edge highlight
          ctx.strokeStyle = `hsla(${p.hue}, 80%, 90%, ${alpha * 0.5})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        } else if (p.type === 'orb') {
          // Frosted glass orb
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
          grad.addColorStop(0, `hsla(${p.hue}, 60%, 80%, ${alpha * 0.8})`)
          grad.addColorStop(0.4, `hsla(${p.hue + 15}, 50%, 85%, ${alpha * 0.4})`)
          grad.addColorStop(0.7, `hsla(${p.hue + 30}, 40%, 90%, ${alpha * 0.15})`)
          grad.addColorStop(1, `hsla(${p.hue}, 30%, 95%, 0)`)

          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()

          // Inner light reflection
          ctx.beginPath()
          ctx.arc(-p.size * 0.25, -p.size * 0.25, p.size * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(0, 0%, 100%, ${alpha * 0.3})`
          ctx.fill()
        } else {
          // Glass ring
          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.strokeStyle = `hsla(${p.hue}, 50%, 80%, ${alpha})`
          ctx.lineWidth = 1.5
          ctx.stroke()

          // Inner glow
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.85, 0, Math.PI * 2)
          ctx.strokeStyle = `hsla(${p.hue + 20}, 40%, 85%, ${alpha * 0.4})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }

        ctx.restore()
      }

      // Draw connection lines between nearby particles (glass web)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
          if (d < 150) {
            const lineAlpha = (1 - d / 150) * 0.04
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `hsla(260, 50%, 70%, ${lineAlpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouse)
      canvas.removeEventListener('mouseleave', handleLeave)
    }
  }, [initParticles])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 1 }}
    />
  )
}
