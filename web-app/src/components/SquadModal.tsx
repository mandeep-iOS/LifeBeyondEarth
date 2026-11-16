import { useEffect, useState } from 'react'
import { Brain, Droplets, Radar, Shield, Sprout, X, Zap, type LucideIcon } from 'lucide-react'
import { api, type SquadMember } from '../api'
import { SQUAD } from '../api/biodomeDemo'

const ICONS: Record<string, LucideIcon> = { brain: Brain, radar: Radar, sprout: Sprout, droplets: Droplets, shield: Shield, zap: Zap }
export const SQUAD_TONE: Record<string, string> = { 'B.I.O.M.E.': 'text-ios-purple', 'F.L.O.R.A.': 'text-ios-blue', 'S.P.R.O.U.T.': 'text-ios-green', 'H.Y.D.R.O.': 'text-cyan-300', 'A.E.G.I.S.': 'text-ios-orange', 'L.U.M.E.N.': 'text-yellow-300' }

export default function SquadModal({ onClose }: { onClose: () => void }) {
  const [squad, setSquad] = useState<SquadMember[]>(SQUAD)
  useEffect(() => { api.biodome.squad().then(setSquad).catch(() => undefined) }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Meet the Squad" className="glass max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Meet the Squad</h2>
            <p className="text-sm text-gray-400">Six named robots run every bio-dome, led by B.I.O.M.E., our Head Super Intelligence (SI).</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="glass rounded-full p-2 hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {squad.map((m) => {
            const I = ICONS[m.icon] ?? Brain
            return (
              <div key={m.id} className="space-y-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-3"><I size={26} className={SQUAD_TONE[m.id]} /><div><div className="font-semibold">{m.id} <span className="text-xs font-normal text-gray-400">· {m.role}</span></div><div className="text-[11px] text-gray-500">{m.name}</div></div></div>
                <p className="text-sm text-gray-300">{m.bio}</p>
                <div className="rounded-lg bg-ios-green/10 p-2 text-xs text-gray-200"><b className="text-ios-green">Milestone:</b> “{m.milestone}”</div>
                <div className="rounded-lg bg-ios-red/10 p-2 text-xs text-gray-200"><b className="text-ios-red">Hazard:</b> “{m.hazard}”</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
