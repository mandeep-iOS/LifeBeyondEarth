import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BookOpen, Brain, CheckCircle2, Wrench, Download, ExternalLink, Printer, Save } from 'lucide-react'
import { api } from '../api'
import { useAsync } from '../hooks'
import { useApp } from '../state/AppState'
import { Badge, Button, Card, Empty, PageHeader, ScoreRing, SourceBadge, Spinner, Stat, StatusPill, statusFor } from '../components/ui'
import { difficultyFor, parseRobotAction, scoreTone, splitName } from '../lib'
import { Rocket } from 'lucide-react'
import MlPanel from '../components/MlPanel'

export default function ResultPage() {
  const { run, setRun, status, prediction, setChecklistProgress } = useApp()
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Mark results viewed on mount
  useEffect(() => {
    if (run) {
      setChecklistProgress(prev => ({ ...prev, resultsViewed: true }))
    }
  }, [run, setChecklistProgress])

  const plantLabel = run ? splitName(run.sim.plant).label : ''
  const osdr = useAsync(() => api.nasa.osdr(`${plantLabel} spaceflight`.trim(), 5), [plantLabel])

  if (!run) return <Empty icon={<Rocket size={36} />} title="No mission results yet" hint="Run a simulation to generate a mission report."
    action={<Link to="/simulation"><Button>Go to Simulation</Button></Link>} />

  const { sim } = run
  const f = sim.final
  const score = f.survival_percentage
  const survived = sim.timeline.filter((d) => d.new_health > 0).length
  const tone = scoreTone(score)
  const outcome = f.new_health <= 0 ? 'Mission Failed' : score >= 80 ? 'Mission Success' : score >= 50 ? 'Partial Success' : 'Critical Outcome'
  const diff = difficultyFor(sim.planet)
  const energyLeft = f.new_robot_energy
  const threats = Array.from(new Set(sim.timeline.flatMap((d) => d.reason.split(', ')).filter((r) => r !== 'Environment stable')))

  const parsed = parseRobotAction(f.robot_action)
  const hits = new Map<string, number>()
  sim.timeline.forEach((d) => d.reason.split(', ').filter((r) => r !== 'Environment stable').forEach((r) => hits.set(r, (hits.get(r) ?? 0) + 1)))
  const bottleneck = [...hits.entries()].sort((a, b) => b[1] - a[1])[0]

  const save = async () => {
    setSaving(true); setErr(null)
    try {
      await api.saveHistory({
        planet_name: sim.planet, plant_name: sim.plant, days_survived: survived, survival_score: score,
        survival_probability: f.survival_probability, robot_action: f.robot_action, reason: f.reason, status: f.status,
        difficulty_level: diff.level, difficulty_explanation: diff.explanation, energy_left: energyLeft, threats,
      })
      await api.saveMemory({
        planet_name: sim.planet, plant_name: sim.plant, survival_score: score, days_survived: survived,
        mission_result: outcome, lesson_learned: score >= 70 ? `${plantLabel} thrives here; repeat this pairing.` : score < 30 ? `${plantLabel} failed here; avoid this pairing.` : `${plantLabel} survived with difficulty.`,
      })
      setRun({ ...run, saved: true })
    } catch (e) { setErr(String((e as Error).message)) } finally { setSaving(false) }
  }

  const exportJson = () => {
    const report = {
      generated_at: new Date().toISOString(), planet: sim.planet, plant: sim.plant, outcome, difficulty: diff,
      days_simulated: sim.days_simulated, days_survived: survived, final: f, threats, timeline: sim.timeline,
      nasa_osdr_citations: osdr.data?.studies ?? [], osdr_source: osdr.data?.source,
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url; a.download = `mission-report-${plantLabel}-${splitName(sim.planet).label}.json`.replace(/\s+/g, '-')
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mission Report" subtitle={`${sim.plant} on ${sim.planet}`}
        actions={<div className="print:hidden flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={exportJson}><Download size={16} /> Export JSON</Button>
          <Button variant="ghost" onClick={() => window.print()}><Printer size={16} /> Print Summary</Button>
          {run.saved ? <Badge tone="green"><CheckCircle2 size={14} /> Saved to History</Badge>
            : <Button onClick={save} disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Save to History'}</Button>}
        </div>} />
      {err && <Card tone="red" className="text-sm">Could not save: {err}</Card>}
      {run.saved && status === 'demo' && <p className="text-xs text-ios-orange">Backend offline — saved locally in this browser (demo mode).</p>}

      <div className="grid gap-4 lg:grid-cols-3 print:grid-cols-1">
        <Card tone={tone} className="flex flex-col items-center gap-3 print:break-inside-avoid">
          <ScoreRing value={score} tone={tone} size={170} label="final survival" />
          <Badge tone={tone}>{outcome}</Badge>
          <StatusPill level={statusFor(score)} />
          <div className="text-center text-sm text-gray-300">{f.status}</div>
        </Card>
        <Card className="space-y-3 lg:col-span-2 print:col-span-1 print:break-inside-avoid">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 print:grid-cols-2">
            <Stat label="Days simulated" value={sim.days_simulated} />
            <Stat label="Days survived" value={survived} tone="green" />
            <Stat label="Robot energy left" value={`${energyLeft}%`} tone={energyLeft > 30 ? 'blue' : 'red'} />
            <Stat label="Difficulty" value={diff.level} tone="purple" />
          </div>
          <div className="rounded-xl bg-white/5 p-3 text-sm print:break-inside-avoid print:bg-white print:border print:border-gray-300"><div className="mb-1 font-semibold">Key threats encountered</div>
            {threats.length ? <div className="flex flex-wrap gap-2">{threats.map((t) => <Badge key={t} tone="orange">{t}</Badge>)}</div> : <span className="text-gray-400 print:text-black">None — environment stable.</span>}
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold">SI Telemetry Summary</div>
            <div className="grid gap-3 md:grid-cols-3 print:grid-cols-1">
              <div className="rounded-xl bg-ios-purple/10 p-3 ring-1 ring-ios-purple/30 print:break-inside-avoid print:bg-white print:border print:border-gray-300">
                <div className="mb-2 flex items-center justify-between flex-wrap gap-1"><span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ios-purple print:text-black"><Brain size={14} /> SI Memory Insight</span><Badge tone="purple">{parsed.memory.length ? 'Recalled' : 'No history'}</Badge></div>
                {parsed.memory.length ? <ul className="space-y-1 text-sm text-gray-200 print:text-black">{parsed.memory.map((m) => <li key={m}>{m}</li>)}</ul> : <p className="text-sm text-gray-400 print:text-black">No prior missions informed this decision.</p>}
              </div>
              <div className="rounded-xl bg-ios-orange/10 p-3 ring-1 ring-ios-orange/30 print:break-inside-avoid print:bg-white print:border print:border-gray-300">
                <div className="mb-2 flex items-center justify-between flex-wrap gap-1"><span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ios-orange print:text-black"><AlertTriangle size={14} /> Primary Survival Bottleneck</span>{bottleneck && <Badge tone="orange">{bottleneck[1]} day{bottleneck[1] === 1 ? '' : 's'}</Badge>}</div>
                <p className="text-sm text-gray-200 print:text-black">{bottleneck ? bottleneck[0].replace(/^[^\p{L}\p{N}]+/u, '') : 'None — environment stayed stable.'}</p>
              </div>
              <div className="rounded-xl bg-ios-green/10 p-3 ring-1 ring-ios-green/30 print:break-inside-avoid print:bg-white print:border print:border-gray-300">
                <div className="mb-2 flex items-center justify-between flex-wrap gap-1"><span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ios-green print:text-black"><Wrench size={14} /> Autonomous Countermeasures Taken</span><Badge tone="green">{parsed.actions.length}</Badge></div>
                <ul className="space-y-1 text-sm text-gray-200 print:text-black">{parsed.actions.map((a) => <li key={a}>• {a}</li>)}</ul>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 print:text-black">{diff.explanation}</p>
        </Card>
      </div>

      <MlPanel planet={sim.planet} plant={sim.plant} />

      {prediction && (
        <Card tone="blue" className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-ios-blue" />
            <span className="font-semibold">ML Prediction Accuracy</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-xs text-gray-400">Predicted</span>
              <div className="text-2xl font-bold text-ios-blue">{prediction.survival_prediction}%</div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Actual</span>
              <div className="text-2xl font-bold text-green-400">{Math.round(score)}%</div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Error</span>
              <div className="text-2xl font-bold text-orange-400">±{Math.abs(prediction.survival_prediction - Math.round(score))}%</div>
            </div>
          </div>
        </Card>
      )}

      <section className="space-y-3 break-inside-avoid print:page-break-inside-avoid">
        <div className="flex flex-wrap items-center justify-between gap-2 print:flex-nowrap">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><BookOpen size={20} className="text-ios-green" /> NASA OSDR biological stress citations</h2>
          {osdr.loading ? <Badge tone="gray">…</Badge> : <SourceBadge source={osdr.data?.source} />}
        </div>
        {osdr.loading ? <Spinner /> : (
          <div className="grid gap-3 md:grid-cols-2 print:break-inside-avoid">
            {osdr.data?.studies.map((s) => (
              <Card key={s.accession ?? s.url} tone="green" className="print:break-inside-avoid">
                <div className="flex items-center justify-between"><Badge tone="green">{s.accession}</Badge><span className="text-xs italic text-gray-400">{s.organism}</span></div>
                <p className="mt-2 text-sm">{s.title}</p>
                <a href={s.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-ios-blue hover:underline">View study <ExternalLink size={12} /></a>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
