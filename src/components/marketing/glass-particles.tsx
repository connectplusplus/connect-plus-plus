'use client'

import { useEffect, useRef, useCallback } from 'react'

interface GlassBox {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  size: number
  rotX: number
  rotY: number
  rotZ: number
  spinX: number
  spinY: number
  spinZ: number
  hue: number
  saturation: number
  opacity: number
  depth: number // parallax layer 0-1
}

export function GlassParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const boxesRef = useRef<GlassBox[]>([])
  const animRef = useRef<number>(0)
  const textZoneRef = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const initBoxes = useCallback((w: number, h: number) => {
    const count = Math.min(20, Math.floor((w * h) / 50000))
    const boxes: GlassBox[] = []

    // Distribute boxes across a grid with jitter for even coverage
    const cols = Math.ceil(Math.sqrt(count * (w / h)))
    const rows = Math.ceil(count / cols)
    const cellW = w / cols
    const cellH = h / rows

    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      // Grid position with random jitter
      let x = (col + 0.15 + Math.random() * 0.7) * cellW
      let y = (row + 0.15 + Math.random() * 0.7) * cellH

      // Nudge away from text zone center (left-center area)
      const textCX = w * 0.3
      const textCY = h * 0.5
      const tdx = x - textCX
      const tdy = y - textCY
      if (Math.abs(tdx) < w * 0.2 && Math.abs(tdy) < h * 0.25) {
        // Push outward
        const angle = Math.atan2(tdy, tdx)
        x += Math.cos(angle) * w * 0.15
        y += Math.sin(angle) * h * 0.15
      }

      const depth = Math.random()
      const sizeBase = 20 + depth * 60 + Math.random() * 30

      boxes.push({
        x, y,
        baseX: x,
        baseY: y,
        vx: 0,
        vy: 0,
        size: sizeBase,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        spinX: (Math.random() - 0.5) * 0.006,
        spinY: (Math.random() - 0.5) * 0.008,
        spinZ: (Math.random() - 0.5) * 0.004,
        hue: 80 + Math.random() * 60, // sage green to warm olive
        saturation: 20 + Math.random() * 25,
        opacity: 0.12 + depth * 0.18 + Math.random() * 0.08,
        depth,
      })
    }

    // Sort by depth so far boxes render first
    boxes.sort((a, b) => a.depth - b.depth)
    return boxes
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
      boxesRef.current = initBoxes(w, h)

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

    // Project a 3D point to 2D with perspective
    function project(px: number, py: number, pz: number, size: number) {
      const fov = 600
      const scale = fov / (fov + pz)
      return { x: px * scale, y: py * scale, s: scale, z: pz }
    }

    // Rotate a 3D point
    function rotate3D(
      x: number, y: number, z: number,
      rx: number, ry: number, rz: number
    ) {
      // Rotate X
      let y1 = y * Math.cos(rx) - z * Math.sin(rx)
      let z1 = y * Math.sin(rx) + z * Math.cos(rx)
      // Rotate Y
      let x1 = x * Math.cos(ry) + z1 * Math.sin(ry)
      let z2 = -x * Math.sin(ry) + z1 * Math.cos(ry)
      // Rotate Z
      let x2 = x1 * Math.cos(rz) - y1 * Math.sin(rz)
      let y2 = x1 * Math.sin(rz) + y1 * Math.cos(rz)
      return { x: x2, y: y2, z: z2 }
    }

    const animate = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      const mouse = mouseRef.current
      const boxes = boxesRef.current
      const t = Date.now() * 0.001

      for (const b of boxes) {
        // Ambient float
        b.x += b.vx + Math.sin(t * 0.4 + b.baseY * 0.003) * 0.2
        b.y += b.vy + Math.cos(t * 0.3 + b.baseX * 0.003) * 0.15

        // Gentle continuous rotation
        b.rotX += b.spinX
        b.rotY += b.spinY
        b.rotZ += b.spinZ

        // Mouse repulsion
        const dx = b.x - mouse.x
        const dy = b.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const repelRadius = 220
        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) ** 1.5 * 5
          b.vx += (dx / dist) * force * 0.1
          b.vy += (dy / dist) * force * 0.1

          // Mouse proximity increases spin
          const spinBoost = (1 - dist / repelRadius) * 0.02
          b.rotY += spinBoost
          b.rotX += spinBoost * 0.5
        }

        // Text zone repulsion (soft ellipse)
        const tz = textZoneRef.current
        if (tz.w > 0) {
          const cx = tz.x + tz.w / 2
          const cy = tz.y + tz.h / 2
          const hw = tz.w / 2 + 60
          const hh = tz.h / 2 + 60
          const nx = (b.x - cx) / hw
          const ny = (b.y - cy) / hh
          const eDist = nx * nx + ny * ny
          if (eDist < 1) {
            const strength = (1 - eDist) * 0.35
            const angle = Math.atan2(b.y - cy, b.x - cx)
            b.vx += Math.cos(angle) * strength
            b.vy += Math.sin(angle) * strength
          }
        }

        // Spring back
        b.vx += (b.baseX - b.x) * 0.0012
        b.vy += (b.baseY - b.y) * 0.0012

        // Damping
        b.vx *= 0.965
        b.vy *= 0.965

        // Soft boundary
        const margin = 60
        if (b.x < -margin) b.vx += 0.4
        if (b.x > w + margin) b.vx -= 0.4
        if (b.y < -margin) b.vy += 0.4
        if (b.y > h + margin) b.vy -= 0.4

        // Clamp
        const maxSpd = 3.5
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
        if (spd > maxSpd) { b.vx = (b.vx / spd) * maxSpd; b.vy = (b.vy / spd) * maxSpd }

        // Proximity glow
        const mDist = Math.sqrt((b.x - mouse.x) ** 2 + (b.y - mouse.y) ** 2)
        const glow = mDist < 280 ? (1 - mDist / 280) * 0.2 : 0

        // ── Draw 3D glass box ──
        const s = b.size / 2
        const alpha = b.opacity + glow

        // Define cube vertices
        const vertices = [
          { x: -s, y: -s, z: -s }, // 0 back-bottom-left
          { x:  s, y: -s, z: -s }, // 1 back-bottom-right
          { x:  s, y:  s, z: -s }, // 2 back-top-right
          { x: -s, y:  s, z: -s }, // 3 back-top-left
          { x: -s, y: -s, z:  s }, // 4 front-bottom-left
          { x:  s, y: -s, z:  s }, // 5 front-bottom-right
          { x:  s, y:  s, z:  s }, // 6 front-top-right
          { x: -s, y:  s, z:  s }, // 7 front-top-left
        ]

        // Rotate and project vertices
        const projected = vertices.map(v => {
          const r = rotate3D(v.x, v.y, v.z, b.rotX, b.rotY, b.rotZ)
          const p = project(r.x, r.y, r.z, b.size)
          return { x: b.x + p.x, y: b.y + p.y, z: r.z }
        })

        ctx.save()

        // Draw all edges as wireframe with colored lines
        const edges = [
          [0,1],[1,2],[2,3],[3,0], // back face
          [4,5],[5,6],[6,7],[7,4], // front face
          [0,4],[1,5],[2,6],[3,7], // connecting edges
        ]

        for (const [a, b2] of edges) {
          const pa = projected[a]
          const pb = projected[b2]
          // Vary hue slightly per edge for glass refraction effect
          const edgeHue = b.hue + ((a + b2) * 7) % 30 - 15
          const edgeLightness = 55 + ((pa.z + pb.z) / (s * 2) + 1) * 15
          const edgeAlpha = alpha * (0.6 + ((pa.z + pb.z) / (s * 4) + 0.5) * 0.4)

          ctx.beginPath()
          ctx.moveTo(pa.x, pa.y)
          ctx.lineTo(pb.x, pb.y)
          ctx.strokeStyle = `hsla(${edgeHue}, ${b.saturation + 10}%, ${edgeLightness}%, ${edgeAlpha})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        ctx.restore()
      }

      // Cursor glow
      if (mouse.x > 0 && mouse.y > 0) {
        const cursorGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100)
        cursorGrad.addColorStop(0, 'hsla(100, 30%, 60%, 0.05)')
        cursorGrad.addColorStop(1, 'hsla(100, 30%, 60%, 0)')
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2)
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
  }, [initBoxes])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 1 }}
    />
  )
}
