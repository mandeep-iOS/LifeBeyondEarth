import { Cpu, Database, Settings2 } from 'lucide-react'
import { Modal } from './InfoModal'

const PILLARS = [
  { icon: Database, tone: 'text-ios-blue', title: 'Real NASA Data', line: 'Live science feeds drive every simulation.',
    chips: ['POWER · solar & climate', 'Exoplanet Archive · worlds', 'OSDR · space biology', 'DONKI · space weather'] },
  { icon: Settings2, tone: 'text-ios-orange', title: 'Outpost Engineering Trade-Offs', line: 'Split limited power between heat, light, water and robots.',
    chips: ['Power budget', 'Life support', 'Emergencies'] },
  { icon: Cpu, tone: 'text-ios-purple', title: 'Autonomous Bio-Dome SI', line: 'Robot agents predict, decide and learn from past missions.',
    chips: ['Predict survival', 'Act autonomously', 'Remember outcomes'] },
]

export default function BriefingModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal wide title="Mission Briefing" onClose={onClose}>
      <p className="-mt-3 text-sm text-gray-400">How it works: pick a world, pick a crop, keep the outpost alive.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {PILLARS.map(({ icon: I, tone, title, line, chips }, i) => (
          <div key={title} className="card-lift rounded-2xl bg-white/5 p-4 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <I size={26} className={tone} />
            <div className="mt-2 font-semibold">{title}</div>
            <p className="mt-1 text-xs text-gray-400">{line}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((c) => <span key={c} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-300">{c}</span>)}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
