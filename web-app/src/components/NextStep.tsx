import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function NextStep({ to, step, title, hint, disabled }: { to: string; step: string; title: string; hint: string; disabled?: boolean }) {
  return (
    <Link to={to} aria-disabled={disabled} className={`next-step group flex items-center justify-between gap-4 rounded-2xl p-5 ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ios-blue">Next Step · {step}</div>
        <div className="mt-0.5 text-lg font-bold">{title}</div>
        <div className="text-sm text-gray-400">{hint}</div>
      </div>
      <span className="flex items-center gap-2 rounded-xl bg-ios-blue px-4 py-2 text-sm font-semibold glow-blue transition group-hover:translate-x-1">Next Step <ArrowRight size={16} /></span>
    </Link>
  )
}
