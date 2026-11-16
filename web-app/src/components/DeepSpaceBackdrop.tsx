import { useEffect, useRef } from 'react'

interface Star { x: number; y: number; r: number; z: number; ph: number; sp: number; dust: boolean }

/** Parallax starfield + dust motes on a canvas, over a drifting CSS nebula. */
export default function DeepSpaceBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, raf = 0, stars: Star[] = []
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = c.clientWidth; h = c.clientHeight
      c.width = w * dpr; c.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round((w * h) / 2600)
      stars = Array.from({ length: n }, (_, i) => {
        const z = Math.random()
        const dust = i % 6 === 0
        return { x: Math.random() * w, y: Math.random() * h, z, r: dust ? 1.4 + Math.random() * 1.6 : 0.3 + z * 1.1, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.8, dust }
      })
    }
    const draw = (ms: number) => {
      const t = ms / 1000
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        if (!reduce) { s.x -= (0.05 + s.z * 0.45) * (s.dust ? 0.5 : 1); if (s.x < -4) { s.x = w + 4; s.y = Math.random() * h } }
        const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph)
        if (s.dust) {
          ctx.fillStyle = `rgba(150,170,255,${0.05 * tw + 0.03})`
        } else {
          ctx.fillStyle = `rgba(${s.z > 0.7 ? '255,240,225' : '200,220,255'},${(0.25 + s.z * 0.6) * tw})`
        }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill()
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    resize(); raf = requestAnimationFrame(draw)
    const ro = new ResizeObserver(resize); ro.observe(c)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-[#04060f] via-[#0a0b24] to-[#140a2e]" />
      <div className="nebula nebula-a" /><div className="nebula nebula-b" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
    </div>
  )
}
