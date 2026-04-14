'use client'

import { useEffect, useRef, useCallback } from 'react'

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
  saturation: number
  type: 'shard' | 'orb' | 'ring'
}

export function GlassParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef<number>(0)
  const textZoneRef = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const initParticles = useCallback((w: number, h: number) => {
    const count = Math.min(28, Math.floor((w * h) / 35000))
    const particles: Particle[] = []

    // Reserve center-left for text — spawn particles around it
    const centerX = w * 0.35
    const centerY = h * 0.5

    for (let i = 0; i < count; i++) {
      const type = i < count * 0.35 ? 'shard' : i < count * 0.7 ? 'orb' : 'ring'
      let x: number, y: number
      // Try to spawn outside the text zone (center-left area)
      do {
        x = Math.random() * w
        y = Math.random() * h
      } while (
        Math.abs(x - centerX) < w * 0.25 &&
        Math.abs(y - centerY) < h * 0.3
      )
      particles.push({
        x, y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: type === 'orb' ? 30 + Math.random() * 60 : type === 'ring' ? 50 + Math.random() * 80 : 15 + Math.random() * 35,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.012,
        opacity: type === 'ring' ? 0.15 + Math.random() * 0.12 : 0.2 + Math.random() * 0.2,
        hue: 230 + Math.random() * 50,
        saturation: 50 + Math.random() * 30,
        type,
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particlesRef.current = initParticles(w, h)

      // Detect text content zone
      const heroContent = parent.querySelector('[data-hero-content]') as HTMLElement | null
      if (heroContent) {
        const parentRect = parent.getBoundingClientRect()
        const contentRect = heroContent.getBoundingClientRect()
        textZoneRef.current = {
          x: contentRect.left - parentRect.left,
          y: contentRect.top - parentRect.top,
          w: contentRect.width,
          h: contentRect.height,
        }
      }
    }

    resize()
    window.addEventListener('resize', resize)

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handleLeave = () => { mouseRef.current = { x: -1000, y: -1000 } }

    canvas.addEventListener('mousemove', handleMouse)
    canvas.addEventListener('mouseleave', handleLeave)

    const animate = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      const mouse = mouseRef.current
      const particles = particlesRef.current
      const t = Date.now() * 0.001

      for (const p of particles) {
        // Ambient drift with sine wave
        p.x += p.vx + Math.sin(t * 0.6 + p.baseY * 0.005) * 0.25
        p.y += p.vy + Math.cos(t * 0.4 + p.baseX * 0.005) * 0.2
        p.rotation += p.rotationSpeed

        // Mouse repulsion — STRONG
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const repelRadius = 250
        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) ** 1.5 * 6
          p.vx += (dx / dist) * force * 0.12
          p.vy += (dy / dist) * force * 0.12
        }

        // Text zone repulsion — soft gradient force field around content
        const tz = textZoneRef.current
        if (tz.w > 0) {
          const pad = 80
          const cx = tz.x + tz.w / 2
          const cy = tz.y + tz.h / 2
          const hw = tz.w / 2 + pad
          const hh = tz.h / 2 + pad

          // Distance from center of text zone, normalized to zone bounds
          const nx = (p.x - cx) / hw
          const ny = (p.y - cy) / hh

          // If inside the soft zone (elliptical)
          const ellipseDist = nx * nx + ny * ny
          if (ellipseDist < 1) {
            // Push outward proportional to how deep inside
            const strength = (1 - ellipseDist) * 0.4
            const angle = Math.atan2(p.y - cy, p.x - cx)
            p.vx += Math.cos(angle) * strength
            p.vy += Math.sin(angle) * strength
          }
        }

        // Spring back to base
        p.vx += (p.baseX - p.x) * 0.0015
        p.vy += (p.baseY - p.y) * 0.0015

        // Damping
        p.vx *= 0.96
        p.vy *= 0.96

        // Clamp velocity so nothing flies off
        const maxSpeed = 4
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed
          p.vy = (p.vy / speed) * maxSpeed
        }

        // Soft boundary — push back instead of wrapping
        const margin = 50
        if (p.x < -margin) p.vx += 0.5
        if (p.x > w + margin) p.vx -= 0.5
        if (p.y < -margin) p.vy += 0.5
        if (p.y > h + margin) p.vy -= 0.5

        // Proximity glow — stronger
        const mDist = Math.sqrt((p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2)
        const glow = mDist < 300 ? (1 - mDist / 300) * 0.35 : 0
        const alpha = p.opacity + glow

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        if (p.type === 'shard') {
          const s = p.size
          ctx.beginPath()
          ctx.moveTo(0, -s)
          ctx.lineTo(s * 0.7, -s * 0.15)
          ctx.lineTo(s * 0.35, s * 0.75)
          ctx.lineTo(-s * 0.45, s * 0.55)
          ctx.lineTo(-s * 0.75, -s * 0.25)
          ctx.closePath()

          const grad = ctx.createLinearGradient(-s, -s, s, s)
          grad.addColorStop(0, `hsla(${p.hue}, ${p.saturation}%, 65%, ${alpha})`)
          grad.addColorStop(0.5, `hsla(${p.hue + 25}, ${p.saturation - 10}%, 75%, ${alpha * 0.7})`)
          grad.addColorStop(1, `hsla(${p.hue + 50}, ${p.saturation - 20}%, 85%, ${alpha * 0.4})`)
          ctx.fillStyle = grad
          ctx.fill()

          // Edge highlight
          ctx.strokeStyle = `hsla(${p.hue}, 80%, 85%, ${alpha * 0.7})`
          ctx.lineWidth = 1
          ctx.stroke()

          // Inner refraction line
          ctx.beginPath()
          ctx.moveTo(-s * 0.2, -s * 0.6)
          ctx.lineTo(s * 0.1, s * 0.4)
          ctx.strokeStyle = `hsla(0, 0%, 100%, ${alpha * 0.25})`
          ctx.lineWidth = 0.8
          ctx.stroke()

        } else if (p.type === 'orb') {
          const grad = ctx.createRadialGradient(
            -p.size * 0.15, -p.size * 0.15, p.size * 0.1,
            0, 0, p.size
          )
          grad.addColorStop(0, `hsla(${p.hue}, ${p.saturation}%, 80%, ${alpha * 0.9})`)
          grad.addColorStop(0.3, `hsla(${p.hue + 15}, ${p.saturation}%, 72%, ${alpha * 0.6})`)
          grad.addColorStop(0.6, `hsla(${p.hue + 30}, ${p.saturation - 10}%, 80%, ${alpha * 0.25})`)
          grad.addColorStop(1, `hsla(${p.hue}, 20%, 90%, 0)`)

          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()

          // Specular highlight
          ctx.beginPath()
          ctx.ellipse(-p.size * 0.25, -p.size * 0.3, p.size * 0.25, p.size * 0.15, -0.5, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(0, 0%, 100%, ${alpha * 0.5})`
          ctx.fill()

          // Outer ring
          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.strokeStyle = `hsla(${p.hue}, ${p.saturation}%, 75%, ${alpha * 0.3})`
          ctx.lineWidth = 1
          ctx.stroke()

        } else {
          // Ring — double ring with fill
          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, 85%, ${alpha * 0.08})`
          ctx.fill()
          ctx.strokeStyle = `hsla(${p.hue}, ${p.saturation}%, 70%, ${alpha * 0.8})`
          ctx.lineWidth = 2
          ctx.stroke()

          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2)
          ctx.strokeStyle = `hsla(${p.hue + 20}, ${p.saturation - 10}%, 75%, ${alpha * 0.4})`
          ctx.lineWidth = 1
          ctx.stroke()
        }

        ctx.restore()
      }

      // Connection lines — more visible
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
          if (d < 200) {
            const lineAlpha = (1 - d / 200) * 0.12
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `hsla(260, 60%, 65%, ${lineAlpha})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      // Cursor glow halo
      if (mouse.x > 0 && mouse.y > 0) {
        const cursorGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120)
        cursorGrad.addColorStop(0, 'hsla(270, 70%, 70%, 0.06)')
        cursorGrad.addColorStop(0.5, 'hsla(260, 60%, 75%, 0.03)')
        cursorGrad.addColorStop(1, 'hsla(250, 50%, 80%, 0)')
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2)
        ctx.fillStyle = cursorGrad
        ctx.fill()
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
