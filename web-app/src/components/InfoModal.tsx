import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ArrowRight, Info, X } from 'lucide-react'

export function InfoButton({ onOpen }: { onOpen: () => void }) {
  return (
    <span role="button" tabIndex={0} aria-label="Info" title="Quick info"
      onClick={(e) => { e.stopPropagation(); onOpen() }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onOpen() } }}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-gray-300 transition hover:bg-ios-blue/40 hover:text-white">
      <Info size={13} />
    </span>
  )
}

export function Modal({ title, onClose, children, wide }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  // Portal to <body> so no transformed ancestor can offset the fixed overlay from the viewport.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        className={`glass animate-fade-up max-h-[90vh] w-full overflow-y-auto rounded-3xl p-6 glow-blue ${wide ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-2xl font-bold text-glow">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function CompactInfo({ title, to, onClose }: { title: ReactNode; to: string; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        className="glass animate-fade-up rounded-2xl p-4 max-w-xs border border-white/10 shadow-lg">
        <h3 className="text-lg font-semibold mb-3 text-white">{title}</h3>
        <Link to={to} onClick={onClose} className="inline-flex items-center gap-2 rounded-lg bg-ios-blue px-3 py-2 text-sm font-semibold text-white hover:brightness-110">
          View Details <ArrowRight size={14} />
        </Link>
      </div>
    </div>,
    document.body,
  )
}

export function QuickSummary({ title, badge, stats, note, to, onClose }: {
  title: ReactNode; badge?: ReactNode; stats: { label: string; value: string }[]; note: string; to: string; onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}>
      {badge && <div className="mb-3">{badge}</div>}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white/5 p-3"><div className="text-xs text-gray-400">{s.label}</div><div className="mt-0.5 font-semibold">{s.value}</div></div>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-gray-300">{note}</p>
      <Link to={to} onClick={onClose} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ios-blue px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
        View Full Detail <ArrowRight size={15} />
      </Link>
    </Modal>
  )
}
