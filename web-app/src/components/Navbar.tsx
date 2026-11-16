import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Cloud, CloudOff, History, Home, Menu, Rocket, X, Wrench, Brain, BookOpen, Settings, Lock } from 'lucide-react'
import { BASE_URL } from '../api'
import { useApp } from '../state/AppState'
import BlackHoleIcon from './BlackHoleIcon'
import MissionKeyModal from './MissionKeyModal'

interface NavGroup {
  items: Array<{ to: string; label: string; icon: React.ComponentType<{ size: number }> }>
  divider?: boolean
}

const NAV_STRUCTURE: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Home', icon: Home },
      { to: '/result', label: 'Mission Report', icon: Rocket },
      { to: '/history', label: 'History', icon: History },
      { to: '/memory', label: 'Mission Memory', icon: Brain },
      { to: '/more', label: 'Advanced Tools', icon: Wrench },
      { to: '/about', label: 'About', icon: BookOpen },
    ]
  },
  {
    divider: true,
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ]
  },
]

export function StatusBadge() {
  const { status } = useApp()
  const cfg = {
    live: { text: 'API Online', cls: 'text-ios-green glass-green', Icon: Cloud, dot: 'bg-ios-green' },
    demo: { text: 'Demo Mode', cls: 'text-ios-orange glass-orange', Icon: CloudOff, dot: 'bg-ios-orange' },
    checking: { text: 'Connecting…', cls: 'text-gray-300', Icon: Cloud, dot: 'bg-gray-400' },
  }[status]
  return (
    <span title={status === 'live' ? `Connected to ${BASE_URL}` : `Backend unreachable at ${BASE_URL} — using built-in demo engine`}
      className={`glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot} ${status === 'live' ? 'animate-pulse' : ''}`} />
      <cfg.Icon size={14} />{cfg.text}
    </span>
  )
}

function MissionKeyPill({ onClick }: { onClick: () => void }) {
  const { missionKey } = useApp()
  return (
    <button
      onClick={onClick}
      title="Click to change mission workspace"
      className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-purple-300 hover:text-purple-200 hover:bg-white/15 transition"
    >
      <Lock size={12} />
      Mission {missionKey}
    </button>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const link = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white border border-white/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`

  return (
    <nav className="space-y-1">
      {NAV_STRUCTURE.map((group, groupIdx) => (
        <div key={groupIdx}>
          {group.divider && groupIdx > 0 && <div className="my-2 border-t border-white/10" />}
          {group.items.map(({ to, label, icon: I }) => (
            <NavLink key={to} to={to} end={to === '/'} className={link} onClick={onNavigate}>
              {({ isActive }) => <>
                <span className="relative flex h-6 w-6 items-center justify-center">
                  {isActive && <span className="orbit-ring" />}<span className={isActive ? 'text-ios-blue' : ''}><I size={16} /></span>
                </span>{label}
              </>}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const { missionKey, setMissionKey } = useApp()

  return (
    <>
      <MissionKeyModal
        isOpen={keyModalOpen}
        currentKey={missionKey}
        onClose={() => setKeyModalOpen(false)}
        onKeyChange={(newKey) => setMissionKey(newKey)}
      />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 bg-black/60 p-4 backdrop-blur-xl lg:flex">
        <NavLink to="/" className="mb-8 flex items-center gap-2 text-lg font-bold">
          <BlackHoleIcon size={30} /><span className="text-glow leading-tight">Life Beyond Earth</span>
        </NavLink>
        <SidebarNav />
        <div className="mt-auto space-y-3">
          <div className="px-3 text-[10px] uppercase tracking-widest text-gray-600">Deep-Space Telemetry</div>
          <div className="flex flex-col gap-2 px-3">
            <StatusBadge />
            <MissionKeyPill onClick={() => setKeyModalOpen(true)} />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur-xl lg:pl-60">
        <div className="flex items-center gap-3 px-4 py-3">
          <button className="glass rounded-lg p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={18} /> : <Menu size={18} />}</button>
          <NavLink to="/" className="text-base font-bold lg:hidden"><span className="text-glow">Life Beyond Earth</span></NavLink>
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <MissionKeyPill onClick={() => setKeyModalOpen(true)} />
          </div>
        </div>
        {open && <div className="border-t border-white/10 p-3 lg:hidden"><SidebarNav onNavigate={() => setOpen(false)} /></div>}
      </header>
    </>
  )
}
