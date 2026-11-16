import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GitCompare, History as HistoryIcon, Search } from 'lucide-react'
import { api, type HistoryItem } from '../api'
import { useAsync } from '../hooks'
import { useApp } from '../state/AppState'
import { Badge, Button, Card, Empty, PageHeader, Spinner, Stat } from '../components/ui'
import { Modal } from '../components/InfoModal'
import { fmtDate, parseRobotAction, scoreTone, splitName } from '../lib'

export default function HistoryPage() {
  const { status } = useApp()
  const { data, loading, error, reload } = useAsync(() => api.history(), [])
  const [planet, setPlanet] = useState('all')
  const [plant, setPlant] = useState('all')
  const [outcome, setOutcome] = useState('all')
  const [text, setText] = useState('')
  const [open, setOpen] = useState<HistoryItem | null>(null)
  const [compare, setCompare] = useState(false)
  const [picked, setPicked] = useState<number[]>([])
  const [showCmp, setShowCmp] = useState(false)
  const all = data ?? []
  const toggle = (id: number) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length >= 2 ? [p[1], id] : [...p, id])
  const byId = (id: number) => all.find((h) => h.id === id)
  const runName = (id: number) => { const h = byId(id); return h ? `${splitName(h.plant_name).label} on ${splitName(h.planet_name).label}` : `Run #${id}` }
  const threatsOf = (h: HistoryItem) => h.threats ?? (h.reason && h.reason !== 'Environment stable' ? h.reason.split(', ') : [])
  const planets = useMemo(() => [...new Set(all.map((h) => h.planet_name))], [all])
  const plants = useMemo(() => [...new Set(all.map((h) => h.plant_name))], [all])
  const rows = all.filter((h) =>
    (planet === 'all' || h.planet_name === planet) && (plant === 'all' || h.plant_name === plant) &&
    (outcome === 'all' || (outcome === 'success' ? h.survival_score >= 80 : outcome === 'partial' ? h.survival_score >= 50 && h.survival_score < 80 : h.survival_score < 50)) &&
    (!text || `${h.reason} ${h.robot_action} ${h.status}`.toLowerCase().includes(text.toLowerCase())))

  const sel = 'glass rounded-lg bg-black/40 px-3 py-2 text-sm'
  if (loading) return <Spinner />
  return (
    <div className="space-y-6">
      <PageHeader title="Mission History" subtitle={`${all.length} saved run${all.length === 1 ? '' : 's'}`} actions={<div className="flex gap-2">
        {status === 'demo' && <Badge tone="orange">Demo Mode</Badge>}
        {status === 'live' && <Badge tone="green">✓ Live Backend</Badge>}
        <Button variant={compare ? 'primary' : 'ghost'} onClick={() => { setCompare(!compare); setPicked([]) }}><GitCompare size={16} /> Compare Runs</Button>
        <Button variant="ghost" onClick={reload}>Refresh</Button></div>} />
      {error && <Card tone="red" className="text-sm">{error}</Card>}
      {all.length === 0 ? (
        <Empty icon={<HistoryIcon size={36} />} title="No missions saved yet" hint="Finish a simulation and press Save to History." action={<Link to="/prep"><Button>Start a mission</Button></Link>} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <select className={sel} value={planet} onChange={(e) => setPlanet(e.target.value)}><option value="all">All planets</option>{planets.map((p) => <option key={p}>{p}</option>)}</select>
            <select className={sel} value={plant} onChange={(e) => setPlant(e.target.value)}><option value="all">All plants</option>{plants.map((p) => <option key={p}>{p}</option>)}</select>
            <select className={sel} value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="all">Any outcome</option><option value="success">Success (≥80%)</option><option value="partial">Partial (50–79%)</option><option value="fail">Failed (&lt;50%)</option></select>
            <div className="glass flex items-center gap-2 rounded-lg px-3 py-2"><Search size={14} className="text-gray-400" /><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search notes…" className="bg-transparent text-sm outline-none placeholder:text-gray-500" /></div>
          </div>
          {compare && (
            <div className="glass sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3 text-sm shadow-lg">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${picked[0] != null ? 'bg-blue-500 text-white' : 'border border-blue-500/60 text-blue-300'}`}>Run A</span>
                <span className="text-gray-300">{picked[0] != null ? runName(picked[0]) : 'not selected'}</span>
                <span className="text-gray-500">vs</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${picked[1] != null ? 'bg-emerald-500 text-white' : 'border border-emerald-500/60 text-emerald-300'}`}>Run B</span>
                <span className="text-gray-300">{picked[1] != null ? runName(picked[1]) : 'not selected'}</span>
                <span className="text-xs text-gray-400">({picked.length}/2 selected)</span>
              </div>
              <Button disabled={picked.length !== 2} onClick={() => setShowCmp(true)}>View comparison</Button>
            </div>
          )}
          {rows.length === 0 && <Card className="text-center text-sm text-gray-400">No runs match these filters.</Card>}
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((h) => (
              <Card key={h.id} tone={scoreTone(h.survival_score)} onClick={() => compare ? toggle(h.id) : setOpen(h)}
                className={`relative space-y-2 ${compare && picked[0] === h.id ? '!ring-4 !ring-blue-500' : ''} ${compare && picked[1] === h.id ? '!ring-4 !ring-emerald-500' : ''}`}>
                {compare && picked[0] === h.id && <span className="absolute -right-2 -top-3 z-10 rounded-full bg-blue-500 px-4 py-1.5 text-sm font-extrabold text-white shadow-lg">✓ Run A</span>}
                {compare && picked[1] === h.id && <span className="absolute -right-2 -top-3 z-10 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-extrabold text-white shadow-lg">✓ Run B</span>}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{splitName(h.plant_name).emoji} {splitName(h.plant_name).label} <span className="text-gray-400">on</span> {splitName(h.planet_name).emoji} {splitName(h.planet_name).label}</div>
                  <Badge tone={scoreTone(h.survival_score)}>{h.survival_score}%</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs"><Badge tone="blue">{h.days_survived} days</Badge>{h.difficulty_level && <Badge tone="purple">{h.difficulty_level}</Badge>}<span className="text-gray-400">{fmtDate(h.created_at)}</span></div>
                <div className="text-sm text-gray-300">{h.status}</div>
                {h.reason && <div className="text-xs text-gray-400">{h.reason}</div>}
              </Card>
            ))}
          </div>
        </>
      )}
      {open && (
        <Modal wide onClose={() => setOpen(null)} title={`${splitName(open.plant_name).label} on ${splitName(open.planet_name).label}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat label="Survival score" value={`${open.survival_score}%`} tone={scoreTone(open.survival_score)} />
              <Stat label="Days survived" value={open.days_survived} tone="blue" />
              <Stat label="Energy left" value={open.energy_left != null ? `${open.energy_left}%` : '—'} tone="purple" />
              <Stat label="Difficulty" value={open.difficulty_level || '—'} tone="orange" />
            </div>
            <div className="text-xs text-gray-400">{fmtDate(open.created_at)} · {open.status}</div>
            <div className="rounded-xl bg-white/5 p-3 text-sm"><div className="mb-1 font-semibold">Threats</div>
              {threatsOf(open).length ? <div className="flex flex-wrap gap-2">{threatsOf(open).map((t) => <Badge key={t} tone="orange">{t}</Badge>)}</div> : <span className="text-gray-400">None recorded.</span>}</div>
            <div className="rounded-xl bg-white/5 p-3 text-sm"><div className="mb-1 font-semibold">Robot actions</div>
              <ul className="space-y-1 text-gray-300">{[...parseRobotAction(open.robot_action).memory, ...parseRobotAction(open.robot_action).actions].map((a) => <li key={a}>• {a}</li>)}</ul></div>
            {open.difficulty_explanation && <p className="text-xs text-gray-400">{open.difficulty_explanation}</p>}
          </div>
        </Modal>
      )}
      {showCmp && picked.length === 2 && (() => {
        const [a, b] = picked.map((id) => all.find((h) => h.id === id)).filter(Boolean) as HistoryItem[]
        if (!a || !b) return null
        const name = (h: HistoryItem) => `${splitName(h.plant_name).label} · ${splitName(h.planet_name).label}`
        const better = (x: number | undefined, y: number | undefined, hi = true) => x == null || y == null || x === y ? '' : (hi ? x > y : x < y) ? 'font-bold text-ios-green' : ''
        const rowsCmp: { label: string; va: string; vb: string; ca: string; cb: string }[] = [
          { label: 'Survival score', va: `${a.survival_score}%`, vb: `${b.survival_score}%`, ca: better(a.survival_score, b.survival_score), cb: better(b.survival_score, a.survival_score) },
          { label: 'Days survived', va: String(a.days_survived), vb: String(b.days_survived), ca: better(a.days_survived, b.days_survived), cb: better(b.days_survived, a.days_survived) },
          { label: 'Energy left', va: a.energy_left != null ? `${a.energy_left}%` : '—', vb: b.energy_left != null ? `${b.energy_left}%` : '—', ca: better(a.energy_left, b.energy_left), cb: better(b.energy_left, a.energy_left) },
          { label: 'Threats encountered', va: threatsOf(a).join(', ') || 'None', vb: threatsOf(b).join(', ') || 'None', ca: '', cb: '' },
          { label: 'Difficulty', va: a.difficulty_level || '—', vb: b.difficulty_level || '—', ca: '', cb: '' },
        ]
        return (
          <Modal wide onClose={() => setShowCmp(false)} title="Run comparison">
            <table className="w-full text-left text-sm">
              <thead><tr className="text-gray-400"><th className="p-2" /><th className="p-2">{name(a)}</th><th className="p-2">{name(b)}</th></tr></thead>
              <tbody>{rowsCmp.map((r) => (
                <tr key={r.label} className="border-t border-white/10 align-top"><td className="p-2 text-gray-400">{r.label}</td><td className={`p-2 ${r.ca}`}>{r.va}</td><td className={`p-2 ${r.cb}`}>{r.vb}</td></tr>
              ))}</tbody>
            </table>
          </Modal>
        )
      })()}
    </div>
  )
}
