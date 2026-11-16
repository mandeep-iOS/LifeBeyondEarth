import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Pause, Play, RotateCcw, XCircle } from 'lucide-react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DEFAULT_ALLOCATION, INITIAL_STATE, gradeMission, saveResult, solarOutput, stepDay, type Allocation, type DayTelemetry, type Mission, type OutpostState } from '../api/trainer'
import { scoreTone } from '../lib'
import type { DayResult, SimulateOut } from '../api'
import { Badge, Button, Card, chartTooltip, Meter } from './ui'
import { LifeSupportHUD, PowerControls } from './TrainerPanels'

const round1 = (v: number) => Math.round(v * 10) / 10

export default function MissionTrainer({ mission, onExit, autoStart, onReport }: { mission: Mission; onExit?: () => void; autoStart?: boolean; onReport?: (sim: SimulateOut) => void }) {
  const [alloc, setAlloc] = useState<Allocation>(DEFAULT_ALLOCATION)
  const [tl, setTl] = useState<DayTelemetry[]>([])
  const [playing, setPlaying] = useState(false)
  const stateRef = useRef<OutpostState>(INITIAL_STATE)
  const allocRef = useRef(alloc)
  allocRef.current = alloc
  const day = tl.length
  const done = day >= mission.days
  const grade = done ? gradeMission(mission, stateRef.current, tl[tl.length - 1]) : null

  const reset = () => { stateRef.current = INITIAL_STATE; setTl([]); setPlaying(false) }
  // Switching missions restarts the run.
  useEffect(() => { reset(); if (autoStart) setPlaying(true) }, [mission.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing || done) return
    const t = setTimeout(() => {
      const r = stepDay(mission, stateRef.current, allocRef.current, day + 1)
      stateRef.current = r.state
      setTl((x) => [...x, r.tel])
    }, 450)
    return () => clearTimeout(t)
  }, [playing, day, done, mission])

  useEffect(() => {
    if (!grade) return
    saveResult(mission.id, grade.passed)
    setPlaying(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const cur = tl[tl.length - 1]

  const report = () => {
    if (!grade || !onReport) return
    const timeline: DayResult[] = tl.map((t, i) => ({
      day: t.day, health_change: round1(t.health - (tl[i - 1]?.health ?? 100)), new_health: Math.round(t.health), reason: t.event ?? 'Environment stable',
      robot_action: `Outpost systems: ${t.demand_kw} kW demand vs ${t.solar_kw} kW solar`, robot_energy_change: round1(t.battery - (tl[i - 1]?.battery ?? 100)),
      new_robot_energy: Math.round(t.battery), survival_probability: t.health / 100, survival_percentage: Math.round(t.health),
      status: t.health > 0 ? 'Alive' : 'Dead', robot_status: t.brownout ? 'Brownout' : 'Nominal', robot_mode: 'Outpost Commander', robot_priority: t.brownout ? 'Critical' : 'Normal',
    }))
    const last = timeline[timeline.length - 1]
    const score = grade.passed ? last.survival_percentage : Math.min(last.survival_percentage, 49)
    const final: DayResult = { ...last, survival_percentage: score, survival_probability: score / 100,
      status: grade.passed ? `${mission.title} passed` : `${mission.title} failed`,
      reason: grade.results.map((r) => `${r.label}: ${r.passed ? 'met' : 'missed'}`).join(', ') }
    onReport({ planet: mission.planet, plant: '🌱 Training crop', days_simulated: mission.days, final, timeline })
  }
  const upcoming = Math.min(day + 1, mission.days)

  return (
    <div className="space-y-4">
      <Card tone="purple" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><div className="text-xs uppercase tracking-wide text-gray-400">{mission.rank} mission</div>
            <div className="text-xl font-bold">{mission.emoji} {mission.title}</div></div>
          <div className="flex flex-wrap items-center gap-2">
            {grade && <Badge tone={grade.passed ? 'green' : 'red'}>{grade.passed ? '✅ MISSION PASSED' : '❌ MISSION FAILED'}</Badge>}
            {cur?.event && <Badge tone="red">{cur.event}</Badge>}
            <Badge tone="blue">Day {day} / {mission.days}</Badge>
          </div>
        </div>
        <p className="text-sm text-gray-300">{mission.briefing}</p>
        <div className="flex flex-wrap gap-2">
          {(grade?.results ?? mission.objectives.map((o) => ({ ...o, passed: null as boolean | null, actual: null as number | null }))).map((o) => (
            <Badge key={o.label} tone={o.passed === null ? 'gray' : o.passed ? 'green' : 'red'}>
              {o.passed === null ? '🎯' : o.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {o.label}{o.actual !== null ? ` (${o.actual})` : ''}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {!done && <Button onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? 'Pause' : day === 0 ? 'Start mission' : 'Resume'}</Button>}
          <Button variant="ghost" onClick={() => { reset(); setPlaying(true) }}><RotateCcw size={16} />{done ? 'Try again' : 'Restart'}</Button>
          {done && grade && onReport && <Button onClick={report}>View Report &amp; Save to History</Button>}
          {onExit && <Button variant="ghost" onClick={onExit}>Back to free play</Button>}
        </div>
      </Card>

      <PowerControls alloc={alloc} onChange={setAlloc} supplyKw={solarOutput(mission, upcoming)} />
      <LifeSupportHUD tel={cur} />

      {cur && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="space-y-3">
            <Meter value={cur.health} tone={scoreTone(cur.health)} label="🌱 Plant health" />
            <Meter value={cur.battery} tone={cur.battery > 30 ? 'blue' : 'red'} label="🔋 Battery" />
            <Meter value={cur.water} tone={cur.water > 40 ? 'blue' : 'orange'} label={`💧 Water reserve (${cur.water_recovery_pct}% recycled)`} />
            <div className="text-xs text-gray-400">☢️ Radiation damage today: {cur.radiation_damage}% {cur.brownout && '· ⚠️ BROWNOUT'}</div>
          </Card>
          <Card className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={200}><LineChart data={tl}>
              <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} /><XAxis dataKey="day" stroke="#9ca3af" fontSize={12} /><YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
              <Tooltip {...chartTooltip} /><Legend />
              <Line dataKey="health" name="Health" stroke="#30d158" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line dataKey="battery" name="Battery" stroke="#0a84ff" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line dataKey="water" name="Water" stroke="#64d2ff" dot={false} strokeWidth={2} isAnimationActive={false} />
            </LineChart></ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  )
}
