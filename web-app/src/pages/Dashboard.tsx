import { Link } from 'react-router-dom'
import { Lightbulb, Rocket, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, type HistoryItem } from '../api'
import { useAsync } from '../hooks'
import { useApp } from '../state/AppState'
import { Badge, Button, Card, chartTooltip, PageHeader, Spinner, Stat } from '../components/ui'
import { splitName } from '../lib'
import MlPanel from '../components/MlPanel'

function insights(h: HistoryItem[]): string[] {
  if (!h.length) return []
  const out: string[] = []
  const best = [...h].sort((a, b) => b.survival_score - a.survival_score)[0]
  out.push(`🏆 Best mission: ${best.plant_name} on ${best.planet_name} (${best.survival_score}%).`)
  const by = new Map<string, number[]>()
  h.forEach((x) => by.set(x.planet_name, [...(by.get(x.planet_name) ?? []), x.survival_score]))
  const avg = [...by].map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length] as const).sort((a, b) => a[1] - b[1])
  if (avg.length > 1) out.push(`⚠️ Toughest planet so far: ${avg[0][0]} (avg ${Math.round(avg[0][1])}%).`)
  const fails = h.filter((x) => x.survival_score < 30).length
  if (fails) out.push(`💀 ${fails} mission(s) ended in near-total loss — the robot memory now avoids those pairings.`)
  const recent = h.slice(0, 3), older = h.slice(3, 6)
  if (recent.length && older.length) {
    const d = recent.reduce((a, b) => a + b.survival_score, 0) / recent.length - older.reduce((a, b) => a + b.survival_score, 0) / older.length
    out.push(d >= 0 ? `📈 Recent missions are ${Math.round(d)} pts better than earlier ones.` : `📉 Recent missions are ${Math.round(-d)} pts worse than earlier ones.`)
  }
  return out
}

export default function DashboardPage() {
  const { planets, planet, plant } = useApp()
  const hist = useAsync(() => api.history(), [])
  if (hist.loading) return <Spinner />
  const h = hist.data ?? []
  const chrono = [...h].reverse().map((x, i) => ({ run: i + 1, score: x.survival_score, label: `${splitName(x.planet_name).emoji}${splitName(x.plant_name).emoji}` }))
  const grouped = new Map<string, number[]>()
  h.forEach((x) => grouped.set(x.planet_name, [...(grouped.get(x.planet_name) ?? []), x.survival_score]))
  const perPlanet = [...grouped].map(([name, v]) => ({ name: splitName(name).label, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }))
  const catalog = planets.map((p) => ({ name: splitName(p.name).label, radiation: p.radiation, temperature: Math.max(-100, Math.min(100, p.temperature)) }))
  const avgAll = h.length ? Math.round(h.reduce((a, b) => a + b.survival_score, 0) / h.length) : 0
  const ins = insights(h)

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Analytics across all your missions."
        actions={<Link to="/prep"><Button><Rocket size={16} /> New Mission</Button></Link>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><Stat label="Missions run" value={h.length} /></Card>
        <Card tone="green"><Stat tone="green" label="Avg survival" value={`${avgAll}%`} /></Card>
        <Card tone="purple"><Stat tone="purple" label="Best score" value={h.length ? `${Math.max(...h.map((x) => x.survival_score))}%` : '—'} /></Card>
        <Card tone="orange"><Stat tone="orange" label="Failures (<30%)" value={h.filter((x) => x.survival_score < 30).length} /></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><div className="mb-2 flex items-center gap-2 font-semibold"><TrendingUp size={16} className="text-ios-green" /> Survival trend</div>
          {chrono.length ? (
            <ResponsiveContainer width="100%" height={260}><LineChart data={chrono}>
              <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} /><XAxis dataKey="run" stroke="#9ca3af" fontSize={12} /><YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
              <Tooltip {...chartTooltip} cursor={{ fill: 'rgba(255, 255, 255, 0.06)' }} /><Line type="monotone" dataKey="score" name="Survival %" stroke="#30d158" strokeWidth={2} dot={{ r: 4, fill: '#30d158' }} />
            </LineChart></ResponsiveContainer>
          ) : <div className="py-16 text-center text-sm text-gray-400">No missions saved yet. Finish a simulation and press <b>Save to History</b>.</div>}
        </Card>
        <Card><div className="mb-2 font-semibold">Average survival by planet</div>
          {perPlanet.length ? (
            <ResponsiveContainer width="100%" height={260}><BarChart data={perPlanet}>
              <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={12} /><YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
              <Tooltip {...chartTooltip} cursor={{ fill: 'rgba(255, 255, 255, 0.06)' }} /><Bar dataKey="avg" name="Avg survival %" fill="#0a84ff" radius={[8, 8, 0, 0]} />
            </BarChart></ResponsiveContainer>
          ) : <div className="py-16 text-center text-sm text-gray-400">Planet comparison appears after your first saved mission.</div>}
        </Card>
      </div>

      <Card><div className="mb-2 font-semibold">Planetary comparison — radiation vs. temperature (clamped ±100°C)</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={catalog}>
          <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={11} /><YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip {...chartTooltip} cursor={{ fill: 'rgba(255, 255, 255, 0.06)' }} /><Legend />
          <Bar dataKey="radiation" name="Radiation" fill="#bf5af2" radius={[6, 6, 0, 0]} /><Bar dataKey="temperature" name="Temp °C" fill="#ff9f0a" radius={[6, 6, 0, 0]} />
        </BarChart></ResponsiveContainer></Card>

      <MlPanel planet={planet?.name} plant={plant?.name} />

      <Card tone="purple" className="space-y-2">
        <div className="flex items-center gap-2 font-semibold"><Lightbulb size={16} className="text-ios-yellow" /> Insights</div>
        {ins.length ? ins.map((t) => <div key={t} className="rounded-lg bg-white/5 p-2.5 text-sm">{t}</div>) : <Badge tone="gray">Insights unlock after your first saved mission</Badge>}
      </Card>
    </div>
  )
}
