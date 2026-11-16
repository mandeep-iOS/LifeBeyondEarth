import { useEffect, useRef, useState } from 'react'
import { Database, EyeOff, Brain, Pause, Play, RotateCcw, Video, Volume2, VolumeX, Wrench } from 'lucide-react'
import { CHAPTERS } from './ChainOfCommand'

const PILLARS = [
  { icon: Database, title: 'Real NASA Data', text: 'Live POWER, exoplanet, GeneLab and space-weather feeds.' },
  { icon: Wrench, title: 'Outpost Engineering Trade-Offs', text: 'Balance shielding, heat, water and light on a power budget.' },
  { icon: Brain, title: 'Autonomous Bio-Dome SI', text: 'An SI predicts survival and directs the robot caretakers.' },
]

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`

export default function SplitHero() {
  const ref = useRef<HTMLVideoElement>(null)
  const [shown, setShown] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [t, setT] = useState(0)
  const [duration, setDuration] = useState(0)
  const chapter = CHAPTERS.reduce((a, c, i) => (t >= c.start ? i : a), 0)

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
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { seek(Number(e.target.value)) }
  const btn = 'glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-gray-100 hover:bg-white/10'

  return (
    <section className="glass overflow-hidden rounded-3xl p-4 sm:p-6">
      <div className={`flex items-center justify-between ${shown ? 'mb-3' : ''}`}>
        <div className="flex items-center gap-2 text-sm font-semibold"><Video size={16} className="text-ios-blue" /> Mission Briefing</div>
        <button onClick={() => setShown(!shown)} className={btn}>
          {shown ? <><EyeOff size={14} /> Hide Briefing</> : <><Video size={14} /> Show Briefing</>}
        </button>
      </div>
      <div className={`flex-col gap-6 lg:flex-row lg:items-start ${shown ? 'flex' : 'hidden'}`}>
        {(
          <div className="w-full space-y-2 lg:w-[55%] lg:shrink-0">
            <div className="space-y-2">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                <video ref={ref} src="/videos/mission-briefing.mp4" muted playsInline preload="auto" className="h-full w-full object-cover"
                  onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} />
              </div>
              <p className="text-xs text-gray-400">Visuals and synthesized voiceover audio generated using Super Intelligence (SI) tools.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={duration || 100} step={0.1} value={t} onChange={handleSeek} className="flex-1 accent-ios-blue cursor-pointer" aria-label="Video progress" />
                <div className="whitespace-nowrap text-xs text-gray-400">{fmt(t)} / {fmt(duration)}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={toggle} className={btn}>{playing ? <Pause size={14} /> : <Play size={14} />}{playing ? 'Pause' : 'Play'}</button>
              <button onClick={toggleMute} className={btn}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}{muted ? 'Unmute' : 'Mute'}</button>
              <button onClick={replay} className={btn}><RotateCcw size={14} /> Replay</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CHAPTERS.map((c, i) => (
                <button key={c.label} onClick={() => seek(c.start)} className={`rounded-full px-3 py-1 text-[11px] transition ${i === chapter ? 'bg-ios-blue/50 ring-1 ring-white/40' : 'glass text-gray-300 hover:bg-white/10'}`}>{c.label}</button>
              ))}
            </div>
          </div>
        )}
        <ul className="grid min-w-0 flex-1 gap-3">
          {PILLARS.map(({ icon: I, title, text }) => (
            <li key={title} className="glass flex gap-3 rounded-2xl p-4">
              <I size={20} className="mt-0.5 shrink-0 text-ios-blue" />
              <div><div className="text-sm font-semibold">{title}</div><div className="text-xs text-gray-400">{text}</div></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
