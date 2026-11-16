import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Brain, EyeOff, Video, ClipboardCheck, Hammer, Pause, Play, RotateCcw, Satellite, Sprout, User, Volume2, VolumeX, type LucideIcon } from 'lucide-react'
import { Badge, Card } from './ui'

const DURATION = 50

export const CHAPTERS = [
  { label: '01 B.I.O.M.E. SI', start: 0 },
  { label: '02 F.L.O.R.A. Survey', start: 6.42 },
  { label: '03 Dome Construction', start: 12.84 },
  { label: '04 Botanical Setup', start: 19.26 },
  { label: '05 Orbital Telemetry', start: 25.68 },
  { label: '06 A.C.E. Handover', start: 30.82 },
]

export function MissionBriefingVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [shown, setShown] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [t, setT] = useState(0)
  const chapter = CHAPTERS.reduce((a, c, i) => (t >= c.start ? i : a), 0)

  // Hiding pauses; reopening resumes.
  useEffect(() => {
    const v = ref.current
    if (!shown || !v) return
    v.play().catch(() => undefined)
    return () => v.pause()
  }, [shown])

  const toggle = () => { const v = ref.current; if (!v) return; v.paused ? v.play().catch(() => undefined) : v.pause() }
  const toggleMute = () => { const v = ref.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted) }
  const replay = () => { const v = ref.current; if (!v) return; v.currentTime = 0; v.play().catch(() => undefined) }
  const seek = (time: number) => { const v = ref.current; if (!v) return; v.currentTime = time + 0.01; v.play().catch(() => undefined) }
  const btn = 'glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-gray-100 hover:bg-white/10'

  if (!shown) return <button onClick={() => setShown(true)} className={`${btn} !px-4 !py-2 text-sm`}><Video size={16} /> Show Briefing Video</button>
  return (
    <Card className="mx-auto w-full max-w-3xl space-y-2 !p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold"><Video size={16} className="text-ios-blue" /> Mission Briefing · 29s</div>
        <button onClick={() => setShown(false)} className={btn}><EyeOff size={14} /> Hide Video</button>
      </div>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <video ref={ref} src="/videos/mission-briefing.mp4" autoPlay muted playsInline preload="auto" className="h-full w-full object-cover"
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={toggle} className={btn} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={14} /> : <Play size={14} />}{playing ? 'Pause' : 'Play'}</button>
        <button onClick={toggleMute} className={btn} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}{muted ? 'Unmute' : 'Mute'}</button>
        <button onClick={replay} className={btn}><RotateCcw size={14} /> Replay</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CHAPTERS.map((c, i) => (
          <button key={c.label} onClick={() => seek(c.start)} className={`rounded-full px-3 py-1 text-[11px] transition ${i === chapter ? 'bg-ios-blue/50 ring-1 ring-white/40' : 'glass text-gray-300 hover:bg-white/10'}`}>{c.label}</button>
        ))}
      </div>
    </Card>
  )
}

interface Stage {
  id: string; label: string; icon: LucideIcon; color: string; start: number; end: number; tone: number; subtitle: string
}

const STAGES: Stage[] = [
  { id: 'human', label: 'Human', icon: User, color: '#0a84ff', start: 0, end: 6, tone: 392, subtitle: 'A human commander issues a directive: “Build a Red Romaine Lettuce bio-dome on Mars, Jezero Crater.”' },
  { id: 'si', label: 'Trained Mission Memory', icon: Brain, color: '#bf5af2', start: 6, end: 14, tone: 440, subtitle: 'The trained Mission Memory model validates the directive, predicts survival using machine learning, and drafts a mission plan.' },
  { id: 'manager', label: 'Manager Robot', icon: Bot, color: '#ff9f0a', start: 14, end: 21, tone: 494, subtitle: 'The Manager Robot splits the plan into construction and botanical work orders and assigns crews.' },
  { id: 'supervisor', label: 'Supervisor Robot', icon: ClipboardCheck, color: '#ffd60a', start: 21, end: 28, tone: 523, subtitle: 'The Supervisor Robot schedules both teams, checks safety limits and approves the launch of work.' },
  { id: 'construction', label: 'Construction Core Team', icon: Hammer, color: '#ff453a', start: 28, end: 42, tone: 587, subtitle: 'Construction Core Team raises the pressurized dome, seals airlocks and installs the radiation shield.' },
  { id: 'botanical', label: 'Botanical Setup Team', icon: Sprout, color: '#30d158', start: 28, end: 42, tone: 659, subtitle: 'In parallel, the Botanical Setup Team prepares beds, water loops and grow lights, then plants the crop.' },
  { id: 'nasa', label: 'Continuous NASA Reporting', icon: Satellite, color: '#64d2ff', start: 42, end: 50, tone: 784, subtitle: 'Telemetry streams to NASA Mission Control continuously: crop health, dome pressure, power and space weather.' },
]

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`

export default function ChainOfCommand() {
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [sound, setSound] = useState(false)
  const last = useRef<number | null>(null)
  const audio = useRef<AudioContext | null>(null)
  const lastTone = useRef<string | null>(null)

  const beep = useCallback((freq: number) => {
    try {
      audio.current ??= new AudioContext()
      const ctx = audio.current
      const osc = ctx.createOscillator(), gain = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(); osc.stop(ctx.currentTime + 0.4)
    } catch { /* audio unavailable */ }
  }, [])

  useEffect(() => {
    if (!playing) { last.current = null; return }
    let raf = 0
    const tick = (now: number) => {
      const dt = last.current == null ? 0 : (now - last.current) / 1000
      last.current = now
      setT((prev) => {
        const next = Math.min(DURATION, prev + dt)
        if (next >= DURATION) setPlaying(false)
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const active = STAGES.filter((s) => t >= s.start && (t < s.end || (t >= DURATION && s.end === DURATION)))
  const activeKey = active.map((s) => s.id).join('+')
  useEffect(() => {
    if (!sound || !playing || !activeKey || lastTone.current === activeKey) return
    lastTone.current = activeKey
    active.forEach((s, i) => setTimeout(() => beep(s.tone), i * 120))
  }, [activeKey, sound, playing, active, beep])

  const toggle = () => { if (t >= DURATION) setT(0); lastTone.current = null; setPlaying((p) => !p) }
  const restart = () => { setT(0); lastTone.current = null; setPlaying(true) }
  const progress = (id: string) => { const s = STAGES.find((x) => x.id === id)!; return Math.max(0, Math.min(1, (t - s.start) / (s.end - s.start))) }
  const state = (id: string) => { const s = STAGES.find((x) => x.id === id)!; return t >= s.end && s.end < DURATION ? 'done' : active.includes(s) ? 'active' : 'idle' }

  const Node = ({ id, className = '' }: { id: string; className?: string }) => {
    const s = STAGES.find((x) => x.id === id)!, st = state(id), I = s.icon
    return (
      <div className={`relative flex-1 rounded-2xl border p-3 text-center transition-all duration-500 ${className}`}
        style={{ borderColor: st === 'idle' ? 'rgb(255 255 255 / 0.1)' : s.color, background: st === 'active' ? `${s.color}26` : 'rgb(255 255 255 / 0.04)', boxShadow: st === 'active' ? `0 0 24px ${s.color}66` : 'none', opacity: st === 'idle' ? 0.55 : 1 }}>
        <I size={26} className={`mx-auto ${st === 'active' ? 'animate-pulse' : ''}`} style={{ color: s.color }} />
        <div className="mt-1 text-xs font-semibold leading-tight">{s.label}</div>
        <div className="mx-auto mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${progress(id) * 100}%`, background: s.color }} /></div>
        {st === 'done' && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-ios-green px-1.5 text-[10px] font-bold text-black">✓</span>}
      </div>
    )
  }
  const Arrow = ({ on }: { on: boolean }) => <div className={`mx-auto h-5 w-0.5 rounded transition-colors duration-500 ${on ? 'bg-white/70' : 'bg-white/15'}`} />

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Chain of Command · 50-second walkthrough</h2>
          <p className="text-sm text-gray-400">How a human directive becomes a living outpost, step by step.</p>
        </div>
        <Badge tone="purple">{fmt(t)} / {fmt(DURATION)}</Badge>
      </div>

      <div className="mx-auto flex max-w-xl flex-col gap-0">
        <Node id="human" /><Arrow on={t >= 6} />
        <Node id="si" /><Arrow on={t >= 14} />
        <Node id="manager" /><Arrow on={t >= 21} />
        <Node id="supervisor" /><Arrow on={t >= 28} />
        <div className="flex gap-3"><Node id="construction" /><Node id="botanical" /></div>
        <Arrow on={t >= 42} />
        <Node id="nasa" />
        <div className={`mt-1 text-center text-[11px] ${t >= 42 ? 'animate-pulse text-ios-blue' : 'text-gray-600'}`}>↻ reports loop back to the human commander</div>
      </div>

      <div role="status" aria-live="polite" className="min-h-[3.5rem] rounded-xl bg-black/40 p-3 text-center text-sm text-gray-100">
        {active.length ? active[0].subtitle : 'Press play to watch the mission chain of command.'}
        {active.length > 1 && <div className="mt-1 text-gray-300">{active[1].subtitle}</div>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="inline-flex items-center gap-2 rounded-xl bg-ios-blue px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
          {playing ? <Pause size={16} /> : <Play size={16} />}{playing ? 'Pause' : t >= DURATION ? 'Replay' : 'Play'}
        </button>
        <button onClick={restart} aria-label="Restart" className="glass inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-200 hover:bg-white/10"><RotateCcw size={16} /> Restart</button>
        <input type="range" min={0} max={DURATION} step={0.1} value={t} aria-label="Timeline scrubber" className="min-w-[8rem] flex-1 accent-ios-blue"
          onChange={(e) => { setT(Number(e.target.value)); lastTone.current = null }} />
        <button onClick={() => setSound(!sound)} aria-pressed={sound} aria-label="Toggle telemetry sound" className="glass rounded-xl p-2 text-gray-300 hover:bg-white/10">{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
      </div>
    </Card>
  )
}
