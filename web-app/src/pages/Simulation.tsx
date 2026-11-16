import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Bot, ChevronDown, Pause, Play, RotateCcw, Rocket, Zap, ArrowLeft } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, type RobotDecision, type SimulateOut } from '../api'
import { useApp } from '../state/AppState'
import { Badge, Button, Card, chartTooltip, Meter, PageHeader, Spinner } from '../components/ui'
import { scoreTone, splitName } from '../lib'
import PlanetGlobe from '../components/PlanetGlobe'
import NextStep from '../components/NextStep'
import MissionCards from '../components/MissionCards'
import MissionTrainer from '../components/MissionTrainer'
import { DEFAULT_ALLOCATION, FREEPLAY, INITIAL_STATE, MISSIONS, solarOutput, stepDay, type Allocation, type DayTelemetry, type OutpostState } from '../api/trainer'
import { LifeSupportHUD, PowerControls } from '../components/TrainerPanels'

export default function SimulationPage() {
  const { planet, plant, setRun, simulationState, setSimulationState, currentRun, setCurrentRun, setChecklistProgress } = useApp()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const mission = MISSIONS.find((m) => m.id === params.get('mission'))
  const [logOpen, setLogOpen] = useState(false)
  const [days, setDays] = useState(30)
  const [sim, setSim] = useState<SimulateOut | null>(null)
  const [decision, setDecision] = useState<RobotDecision | null>(null)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [speed, setSpeed] = useState(400)
  const logRef = useRef<HTMLDivElement>(null)
  const [alloc, setAlloc] = useState<Allocation>(DEFAULT_ALLOCATION)
  const allocRef = useRef(alloc)
  allocRef.current = alloc
  const outpost = useRef<OutpostState>(INITIAL_STATE)
  const [tel, setTel] = useState<DayTelemetry | undefined>()
  const freeplay = { ...FREEPLAY, days }

  // Restore paused run on mount
  useEffect(() => {
    if (currentRun && simulationState === 'paused') {
      setSim(currentRun.sim)
      setIdx(currentRun.idx)
      setPlaying(false)
    }
  }, [currentRun, simulationState])

  const start = async () => {
    if (!planet || !plant) return
    setLoading(true); setSim(null); setIdx(0); setDecision(null); outpost.current = INITIAL_STATE; setTel(undefined)
    try {
      const s = await api.simulate({ planet: planet.name, plant: plant.name, days })
      setSim(s); setIdx(1); setPlaying(true)
      setRun({ sim: s, days, saved: false })
      setSimulationState('running')
      setCurrentRun({ sim: s, days, idx: 1, playing: true, mission: params.get('mission') ?? undefined })
      setChecklistProgress(p => ({ ...p, simulationRun: true }))
    } finally { setLoading(false) }
  }

  const handlePause = () => {
    setPlaying(false)
    setSimulationState('paused')
    if (sim) setCurrentRun({ sim, days, idx, playing: false, mission: params.get('mission') ?? undefined })
  }

  const handleResume = () => {
    setPlaying(true)
    setSimulationState('running')
  }

  const handleStop = () => {
    setSim(null)
    setIdx(0)
    setPlaying(false)
    setSimulationState('idle')
    setCurrentRun(null)
  }

  useEffect(() => {
    if (!playing || !sim) return
    if (idx >= sim.timeline.length) { setPlaying(false); return }
    const t = setTimeout(() => setIdx((i) => i + 1), speed)
    return () => clearTimeout(t)
  }, [playing, idx, sim, speed])

  const visible = sim ? sim.timeline.slice(0, idx) : []
  const cur = visible[visible.length - 1]
  const done = !!sim && idx >= sim.timeline.length

  useEffect(() => {
    if (simulationState === 'running' && sim) {
      setCurrentRun({ sim, days, idx, playing, mission: params.get('mission') ?? undefined })
    }
    if (done && !playing && simulationState === 'running') {
      setSimulationState('completed')
    }
  }, [idx, playing, sim, days, simulationState, done, mission])

  useEffect(() => {
    if (!planet || !cur) return
    if (cur.day % 5 === 1 || done) api.robotDecide(planet.name, cur.new_health, cur.new_robot_energy).then(setDecision)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.day])

  useEffect(() => {
    if (!cur) return
    const r = stepDay(freeplay, outpost.current, allocRef.current, cur.day)
    outpost.current = r.state
    setTel(r.tel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.day])

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }) }, [idx])

  if (!planet || !plant) return <Spinner />
  const data = visible.map((d) => ({ day: d.day, health: d.new_health, energy: d.new_robot_energy, change: d.health_change }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/prep"><button className="glass rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10"><ArrowLeft size={16} /> Back</button></Link>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">🧑‍🚀 Training missions</h2>
        <MissionCards selectedPlanet={planet} activeId={mission?.id} onLaunch={(id) => setParams({ mission: id, start: '1' })} />
        {mission && <MissionTrainer mission={mission} autoStart={params.get('start') === '1'} onExit={() => setParams({})}
          onReport={(s) => { setRun({ sim: s, days: s.days_simulated, saved: false }); nav('/result') }} />}
      </section>

      {!mission && <>

      <PageHeader title="Live Simulation" subtitle={`${splitName(plant.name).label} on ${splitName(planet.name).label} — press Start to begin`}
        actions={<div className="flex items-center gap-4"><PlanetGlobe name={planet.name} size={84} speed={1.5} />{done && <Button onClick={() => nav('/result')}><Rocket size={16} /> View Result</Button>}</div>} />

      <Card className="flex flex-wrap items-end gap-4">
        <label className="text-sm text-gray-300">Mission length: <b>{days} days</b>
          <input type="range" min={5} max={120} value={days} onChange={(e) => setDays(+e.target.value)} disabled={playing || loading} className="mt-1 block w-48 accent-ios-blue" /></label>
        <label className="text-sm text-gray-300">Speed
          <select value={speed} onChange={(e) => setSpeed(+e.target.value)} className="glass mt-1 block rounded-lg bg-black/40 px-2 py-1.5 text-sm">
            <option value={800}>Slow</option><option value={400}>Normal</option><option value={120}>Fast</option><option value={30}>Turbo</option>
          </select></label>
        <Button onClick={() => { handleStop(); start() }} disabled={loading || playing}>{sim ? <RotateCcw size={16} /> : <Play size={16} />}{loading ? 'Launching…' : sim ? 'Restart' : 'Start Simulation'}</Button>
        {sim && !done && <Button variant="ghost" onClick={() => playing ? handlePause() : handleResume()}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? 'Pause' : 'Resume'}</Button>}
        {sim && !done && <Button variant="ghost" onClick={() => { setIdx(sim.timeline.length); setPlaying(false) }}>Skip to end</Button>}
      </Card>

      {!sim && !loading && <Card className="py-10 text-center text-gray-400">Press <b>Start Simulation</b> to run the mission day by day.</Card>}
      {loading && <Spinner label="Contacting mission control…" />}

      <PowerControls alloc={alloc} onChange={setAlloc} supplyKw={solarOutput(FREEPLAY, (cur?.day ?? 0) + 1)} />
      <LifeSupportHUD tel={tel} />

      {cur && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card tone={scoreTone(cur.new_health)}><div className="text-xs text-gray-400">Day</div><div className="text-3xl font-bold">{cur.day}<span className="text-base text-gray-400"> / {sim!.timeline.length}</span></div><div className="mt-2"><Badge tone="purple">{cur.robot_mode}</Badge></div></Card>
            <Card tone={scoreTone(cur.new_health)} className="md:col-span-2 space-y-3">
              <Meter value={cur.new_health} tone={scoreTone(cur.new_health)} label="🌱 Plant health" />
              <Meter value={cur.new_robot_energy} tone={cur.new_robot_energy > 30 ? 'blue' : 'red'} label="🔋 Robot energy" />
              <div className="text-xs text-gray-400">{cur.status} · {cur.robot_status}</div>
            </Card>
            <Card tone="purple"><div className="text-xs text-gray-400">Today</div><div className="mt-1 text-sm">{cur.reason}</div><div className="mt-2 text-lg font-semibold">{cur.health_change >= 0 ? '+' : ''}{cur.health_change}% health</div><div className="text-xs text-gray-400">{cur.robot_energy_change}% energy</div></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card><div className="mb-2 font-semibold">Plant health</div>
              <ResponsiveContainer width="100%" height={220}><AreaChart data={data}>
                <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#30d158" stopOpacity={0.6} /><stop offset="100%" stopColor="#30d158" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} /><XAxis dataKey="day" stroke="#9ca3af" fontSize={12} /><YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                <Tooltip {...chartTooltip} /><Area type="monotone" dataKey="health" stroke="#30d158" fill="url(#hg)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart></ResponsiveContainer></Card>
            <Card><div className="mb-2 font-semibold">Resources</div>
              <ResponsiveContainer width="100%" height={220}><LineChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} /><XAxis dataKey="day" stroke="#9ca3af" fontSize={12} /><YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                <Tooltip {...chartTooltip} /><Legend />
                <Line type="monotone" dataKey="health" name="Health" stroke="#30d158" dot={false} strokeWidth={2} isAnimationActive={false} />
                <Line type="monotone" dataKey="energy" name="Robot energy" stroke="#0a84ff" dot={false} strokeWidth={2} isAnimationActive={false} />
              </LineChart></ResponsiveContainer></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card tone="purple" className="space-y-2">
              <div className="flex items-center gap-2 font-semibold"><Bot size={18} className="text-ios-purple" /> Robot decision</div>
              {decision ? (<>
                <div className="flex gap-2"><Badge tone="purple">{decision.mode_title}</Badge><Badge tone={decision.priority === 'Critical' ? 'red' : decision.priority === 'High' ? 'orange' : 'green'}>{decision.priority}</Badge></div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300">{decision.action}</pre>
              </>) : <div className="text-sm text-gray-400">Awaiting first decision…</div>}
            </Card>
            <Card className="lg:col-span-2">
              <button onClick={() => setLogOpen(!logOpen)} className="flex w-full items-center gap-2 font-semibold"><Zap size={16} className="text-ios-yellow" /> Mission log <span className="text-xs font-normal text-gray-400">({visible.length} days)</span><ChevronDown size={16} className={`ml-auto transition ${logOpen ? 'rotate-180' : ''}`} /></button>
              <div ref={logRef} className={`mt-2 max-h-72 ${logOpen ? '' : 'hidden'} space-y-2 overflow-y-auto pr-1`}>
                {visible.map((d) => (
                  <div key={d.day} className="rounded-lg bg-white/5 p-2.5 text-xs">
                    <div className="flex items-center justify-between"><b>Day {d.day}</b><span className="text-gray-400">{d.robot_mode} · {d.robot_priority} · ❤ {d.new_health}% · 🔋 {d.new_robot_energy}%</span></div>
                    <div className="mt-1 text-gray-400">{d.reason}</div>
                    <pre className="mt-1 whitespace-pre-wrap font-sans text-gray-300">{d.robot_action}</pre>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
      </>}
      {!mission && <NextStep to="/result" step="06 Result" title={done ? "Mission Report" : "View mission result"} hint={done ? 'Your run is complete — see the full report.' : 'Finish or skip to the end to unlock your report.'} />}
    </div>
  )
}
