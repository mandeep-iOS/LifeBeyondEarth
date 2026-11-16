import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Brain, TrendingDown, TrendingUp } from 'lucide-react'
import { api } from '../api'
import { useAsync } from '../hooks'
import { Badge, Button, Card, Empty, Meter, PageHeader, Spinner, Stat } from '../components/ui'
import { fmtDate, scoreTone, splitName } from '../lib'

export default function MemoryPage() {
  const { data, loading, error } = useAsync(() => api.memory(), [])
  const mem = useMemo(() => data ?? [], [data])

  // Same weights the prediction engine applies: +15 per ≥70% success, -20 per <30% failure.
  const weights = useMemo(() => {
    const m = new Map<string, { planet: string; plant: string; delta: number; n: number; best: number }>()
    mem.forEach((r) => {
      const k = `${r.planet_name}|${r.plant_name}`
      const e = m.get(k) ?? { planet: r.planet_name, plant: r.plant_name, delta: 0, n: 0, best: 0 }
      e.n++; e.best = Math.max(e.best, r.survival_score)
      if (r.survival_score >= 70) e.delta += 15; else if (r.survival_score < 30) e.delta -= 20
      m.set(k, e)
    })
    return [...m.values()].sort((a, b) => b.delta - a.delta)
  }, [mem])

  if (loading) return <Spinner />
  return (
    <div className="space-y-6">
      <PageHeader title="Mission Memory" subtitle="Learned patterns from past missions that inform survival predictions and robot adaptation." />
      {error && <Card tone="red" className="text-sm">{error}</Card>}
      {mem.length === 0 ? (
        <Empty icon={<Brain size={36} />} title="No mission memories yet" hint="Save a mission result and the system will retain it." action={<Link to="/prep"><Button>Start a mission</Button></Link>} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card tone="purple"><Stat tone="purple" label="Missions Saved" value={mem.length} /></Card>
            <Card tone="green"><Stat tone="green" label="Successes (≥70%)" value={mem.filter((m) => m.survival_score >= 70).length} /></Card>
            <Card tone="red"><Stat tone="red" label="Failures (<30%)" value={mem.filter((m) => m.survival_score < 30).length} /></Card>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Adaptation weights</h2>
            <p className="text-sm text-gray-400">Rule-based adjustments applied to future survival predictions. Successful pairings receive +15 score boost; failed pairings receive -20 penalty.</p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {weights.map((w) => (
                <Card key={w.planet + w.plant} tone={w.delta > 0 ? 'green' : w.delta < 0 ? 'red' : 'blue'} className="space-y-2">
                  <div className="font-semibold">{splitName(w.plant).emoji} {splitName(w.plant).label} → {splitName(w.planet).emoji} {splitName(w.planet).label}</div>
                  <div className="flex items-center gap-2">
                    {w.delta >= 0 ? <TrendingUp size={16} className="text-ios-green" /> : <TrendingDown size={16} className="text-ios-red" />}
                    <Badge tone={w.delta > 0 ? 'green' : w.delta < 0 ? 'red' : 'gray'}>{w.delta > 0 ? '+' : ''}{w.delta} score bias</Badge>
                    <span className="text-xs text-gray-400">{w.n} mission{w.n > 1 ? 's' : ''}</span>
                  </div>
                  <Meter value={w.best} tone={scoreTone(w.best)} label="Best score" />
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Mission records</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {mem.map((m) => (
                <Card key={m.id} tone="purple" className="space-y-1">
                  <div className="flex items-center justify-between"><div className="font-semibold">{m.plant_name} · {m.planet_name}</div><Badge tone={scoreTone(m.survival_score)}>{m.survival_score}%</Badge></div>
                  <div className="text-sm text-gray-200">🧠 {m.lesson_learned || 'No lesson recorded'}</div>
                  <div className="text-xs text-gray-400">{m.mission_result} · {m.days_survived} days · {fmtDate(m.created_at)}</div>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
