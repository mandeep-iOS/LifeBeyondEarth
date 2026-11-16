import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { toneHex, type Tone } from '../lib'

const glass: Record<Tone, string> = {
  blue: 'glass', purple: 'glass glass-purple', green: 'glass glass-green',
  orange: 'glass glass-orange', red: 'glass glass-red', gray: 'glass',
}
const text: Record<Tone, string> = {
  blue: 'text-ios-blue', purple: 'text-ios-purple', green: 'text-ios-green',
  orange: 'text-ios-orange', red: 'text-ios-red', gray: 'text-gray-400',
}

export function Card({ children, tone = 'blue', className = '', onClick, active }: {
  children: ReactNode; tone?: Tone; className?: string; onClick?: () => void; active?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`${glass[tone]} rounded-2xl p-4 text-left ${onClick ? 'cursor-pointer hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 focus:ring-offset-gray-950 transition' : 'card-lift'} ${active ? 'ring-2 ring-ios-blue glow-blue' : ''} ${className}`}
    >{children}</Tag>
  )
}

export function Badge({ children, tone = 'blue', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${glass[tone]} ${text[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Stat({ icon, label, value, tone = 'blue' }: { icon?: ReactNode; label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className={`flex items-center gap-1.5 text-xs ${text[tone]}`}>{icon}{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  )
}

export function Meter({ value, tone, label }: { value: number; tone: Tone; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-xs text-gray-400"><span>{label}</span><span>{Math.round(v)}%</span></div>}
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className="meter-fill h-full rounded-full transition-all duration-500" style={{ width: `${v}%`, background: toneHex[tone], boxShadow: `0 0 12px ${toneHex[tone]}` }} />
      </div>
    </div>
  )
}

export function ScoreRing({ value, tone, size = 140, label }: { value: number; tone: Tone; size?: number; label?: string }) {
  const r = size / 2 - 10, c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.1)" strokeWidth="10" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={toneHex[tone]} strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)}
          style={{ filter: `drop-shadow(0 0 8px ${toneHex[tone]})`, transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{Math.round(value)}%</div>
        {label && <div className="text-xs text-gray-400">{label}</div>}
      </div>
    </div>
  )
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-gray-400"><Loader2 className="animate-spin" size={18} />{label}</div>
}

export function Empty({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center py-12 text-center">
      <div className="mb-3 text-ios-blue">{icon}</div>
      <div className="text-lg font-semibold">{title}</div>
      {hint && <p className="mt-1 max-w-md text-sm text-gray-400">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  )
}

export function Button({ children, onClick, disabled, variant = 'primary', className = '', type = 'button' }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost'; className?: string; type?: 'button' | 'submit'
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-ios-blue'
  const v = variant === 'primary'
    ? 'bg-ios-blue text-white glow-blue hover:brightness-110'
    : 'glass text-white hover:bg-white/10'
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${v} ${className}`}>{children}</button>
}

export function SourceBadge({ source }: { source?: string }) {
  if (!source) return null
  const tone: Tone = source === 'live' ? 'green' : source === 'cache' ? 'blue' : 'orange'
  const label = source === 'live' ? 'NASA Live' : source === 'cache' ? 'Cached NASA Archive Snapshot' : source === 'fallback' ? 'Cached NASA Archive Snapshot' : 'Demo data'
  return <Badge tone={tone}>● {label}</Badge>
}

export const chartTooltip = {
  contentStyle: { background: 'rgba(10,10,20,.95)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, color: '#fff' },
  labelStyle: { color: '#9ca3af' },
}

export function StatusPill({ level }: { level: 'Optimal' | 'Caution' | 'Critical' }) {
  const tone: Tone = level === 'Optimal' ? 'green' : level === 'Caution' ? 'orange' : 'red'
  return <Badge tone={tone}>● {level}</Badge>
}

export function statusFor(score: number): 'Optimal' | 'Caution' | 'Critical' {
  return score >= 70 ? 'Optimal' : score >= 40 ? 'Caution' : 'Critical'
}
