import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Hammer, Radar, BrainCircuit, Radio, Siren, Play, Sprout, Zap, Users, BatteryLow, BatteryCharging, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { api, type BiodomeRun, type Crisis, type EmergencyOut, type FailoverOut, type SpaceWeatherData } from '../api'
import { PRESETS } from '../api/biodomeDemo'
import { Badge, Button, Card, Meter, SourceBadge, Spinner } from '../components/ui'
import PlanetGlobe from '../components/PlanetGlobe'
import { scoreTone, splitName } from '../lib'
import { DEFAULT_ALLOCATION, FREEPLAY, runSchedule, solarOutput, type Allocation } from '../api/trainer'
import SquadModal, { SQUAD_TONE } from '../components/SquadModal'
import { SQUAD } from '../api/biodomeDemo'
import { LifeSupportHUD, PowerControls } from '../components/TrainerPanels'

const DEFAULT_DIRECTIVE = PRESETS[0]
const CRISES: { id: Crisis; label: string }[] = [
  { id: 'solar_flare', label: 'Solar flare (NASA DONKI)' },
  { id: 'dust_storm', label: 'Global dust storm' },
  { id: 'dome_breach', label: 'Dome breach' },
]

interface Alert { key: string; level: string; to: string; message: string }

function Dome({ progress, health, crop }: { progress: number; health: number; crop: string }) {
  const emoji = splitName(crop).emoji
  const hue = health >= 60 ? '#30d158' : health >= 30 ? '#ff9f0a' : '#ff453a'
  return (
    <svg viewBox="0 0 200 130" className="mx-auto w-full max-w-xs">
      <defs>
        <clipPath id="domeClip"><path d="M20 110 A80 80 0 0 1 180 110 Z" /></clipPath>
        <linearGradient id="shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7fd1ff" stopOpacity=".55" /><stop offset="100%" stopColor="#0a84ff" stopOpacity=".15" /></linearGradient>
      </defs>
      <rect x="0" y="108" width="200" height="22" fill="#7a3b22" />
      <g clipPath="url(#domeClip)">
        <rect x="0" y={110 - 80 * (progress / 100)} width="200" height="90" fill="url(#shell)" style={{ transition: 'y .6s ease' }} />
      </g>
      <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="#9bdcff" strokeWidth="2.5" strokeDasharray="260" strokeDashoffset={260 * (1 - progress / 100)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
      {progress >= 100 && <text x="100" y="104" textAnchor="middle" fontSize="26" style={{ filter: `drop-shadow(0 0 6px ${hue})` }} className="animate-pulse">{emoji}{emoji}{emoji}</text>}
      {progress < 100 && progress > 0 && <text x="100" y="60" textAnchor="middle" fontSize="20" className="animate-bounce">🏗️</text>}
    </svg>
  )
}

export default function BioDomePage() {
  const [directive, setDirective] = useState(DEFAULT_DIRECTIVE)
  const [run, setRun] = useState<BiodomeRun | null>(null)
  const [busy, setBusy] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [dayIdx, setDayIdx] = useState(0)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [crisis, setCrisis] = useState<Crisis>('solar_flare')
  const [emerg, setEmerg] = useState<EmergencyOut | null>(null)
  const [emergBusy, setEmergBusy] = useState(false)
  const [weather, setWeather] = useState<SpaceWeatherData | null>(null)
  const [health, setHealth] = useState<{ inside: number; outside: number } | null>(null)
  const [directiveError, setDirectiveError] = useState<string | null>(null)
  const [showSquad, setShowSquad] = useState(false)
  const [ace, setAce] = useState<FailoverOut | null>(null)
  const [aceBusy, setAceBusy] = useState(false)
  const [battery, setBattery] = useState(100)
  const [urgent, setUrgent] = useState(false)
  const [approved, setApproved] = useState(false)
  const [showClip, setShowClip] = useState(false)
  const clipRef = useRef<HTMLVideoElement>(null)
  const playClip = () => {
    setShowClip(true)
    setTimeout(() => {
      const v = clipRef.current
      if (!v) return
      v.currentTime = 0; v.muted = false
      v.play().catch(() => { v.muted = true; v.play().catch(() => {}) })
    }, 50)
  }
  const seen = useRef(0)
  const [alloc, setAlloc] = useState<Allocation>(DEFAULT_ALLOCATION)

  useEffect(() => { api.nasa.spaceWeather().then(setWeather) }, [])

  const steps = run?.steps ?? []
  const done = !!run && stepIdx >= steps.length && dayIdx >= (run.timeline.length)
  const visible = steps.slice(0, stepIdx)

  // Reveal one agent step at a time.
  useEffect(() => {
    if (!run || stepIdx >= steps.length) return
    const t = setTimeout(() => setStepIdx((i) => i + 1), 650)
    return () => clearTimeout(t)
  }, [run, stepIdx, steps.length])

  // Cultivation timeline plays once the Manager SI starts planting.
  const cultivating = visible.some((s) => s.phase === 'cultivation')
  useEffect(() => {
    if (!run || !cultivating || dayIdx >= run.timeline.length) return
    const t = setTimeout(() => setDayIdx((i) => i + 1), 450)
    return () => clearTimeout(t)
  }, [run, cultivating, dayIdx])

  // Stream NASA telemetry as each phase completes.
  useEffect(() => {
    if (!run) return
    const phaseDone = (p: string) => steps.every((s, i) => s.phase !== p || i < stepIdx) && steps.some((s) => s.phase === p)
    const ready = run.telemetry.filter((t) => t.phase === 'complete' ? done : t.phase === 'cultivation' ? phaseDone('cultivation') && dayIdx >= run.timeline.length : phaseDone(t.phase))
    if (ready.length > seen.current) {
      const fresh = ready.slice(seen.current).map((t) => ({ key: `t${t.index}`, level: t.level, to: t.to, message: t.message }))
      seen.current = ready.length
      setAlerts((a) => [...a, ...fresh])
    }
  }, [run, stepIdx, dayIdx, done, steps])

  const day = run && dayIdx > 0 ? run.timeline[Math.min(dayIdx, run.timeline.length) - 1] : null
  // Engineering trade-offs: power allocation re-simulates the outpost and modulates crop health.
  const outpost = useMemo(() => run ? runSchedule({ ...FREEPLAY, days: run.timeline.length }, alloc).timeline : [], [run, alloc])
  const tel = dayIdx > 0 ? outpost[Math.min(dayIdx, outpost.length) - 1] : undefined
  const baseInside = day?.inside_health ?? 100
  const inside = health?.inside ?? (tel ? Math.round((baseInside + tel.health) / 2) : baseInside)
  const outside = health?.outside ?? day?.outside_health ?? 100
  const phaseProgress = (p: string) => Math.max(0, ...visible.filter((s) => s.phase === p).map((s) => s.progress))
  const construction = phaseProgress('construction')
  const lastAction = (agent: string) => [...visible].reverse().find((s) => s.agent === agent)?.action

  async function execute() {
    setBusy(true); setRun(null); setEmerg(null); setAlerts([]); setAce(null); setBattery(100); setUrgent(false); setApproved(false); setHealth(null); seen.current = 0; setStepIdx(0); setDayIdx(0); setDirectiveError(null)
    try { setRun(await api.biodome.execute(directive)) } catch (e) { setDirectiveError(e instanceof Error ? e.message : 'Directive rejected.') } finally { setBusy(false) }
  }

  async function trigger() {
    if (!run) return
    setEmergBusy(true)
    try {
      const e = await api.biodome.emergency(run.planet, run.crop, crisis, inside, outside)
      setEmerg(e); setUrgent(true)
      setHealth({ inside: e.after.inside_health, outside: e.after.outside_health })
      setAlerts((a) => [...a, { key: `e${Date.now()}`, level: 'urgent', to: e.telemetry.to, message: e.telemetry.message }])
    } finally { setEmergBusy(false) }
  }

  async function aceCall(recharge: boolean) {
    if (!run) return
    setAceBusy(true)
    try {
      const level = recharge ? 100 : 12
      const f = await api.biodome.failover(level, run.planet, run.crop, inside, outside, recharge)
      setAce(f); setBattery(f.battery_pct); if (f.status === 'failover') { setUrgent(true); playClip() } else setShowClip(false)
      setAlerts((a) => [...a, f.alert
        ? { key: `a${Date.now()}`, level: 'urgent', to: 'NASA Mission Control', message: f.handover_record ?? f.alert.title }
        : { key: `a${Date.now()}`, level: 'info', to: 'NASA Mission Control', message: f.synced_to_nasa ? 'All offline/failover logs synced to NASA after recharge; B.I.O.M.E. assigned to Advanced Predictive Research & Orbital Optimization.' : 'Power nominal.' }])
    } finally { setAceBusy(false) }
  }

  // Named squad dialogue unlocked by mission phase and hazards.
  const squadComms = useMemo(() => {
    const m = (id: string) => SQUAD.find((x) => x.id === id)!
    const lines: { id: string; msg: string; hazard?: boolean }[] = []
    if (visible.length) lines.push({ id: 'B.I.O.M.E.', msg: m('B.I.O.M.E.').milestone })
    if (visible.some((s) => s.phase === 'scouting' && s.progress >= 100)) lines.push({ id: 'F.L.O.R.A.', msg: m('F.L.O.R.A.').milestone })
    if (construction >= 100) lines.push({ id: 'A.E.G.I.S.', msg: m('A.E.G.I.S.').milestone })
    if (cultivating) { lines.push({ id: 'H.Y.D.R.O.', msg: m('H.Y.D.R.O.').milestone }); lines.push({ id: 'S.P.R.O.U.T.', msg: m('S.P.R.O.U.T.').milestone }); lines.push({ id: 'L.U.M.E.N.', msg: m('L.U.M.E.N.').milestone }) }
    if (emerg) {
      const who = emerg.crisis === 'dome_breach' ? 'A.E.G.I.S.' : emerg.crisis === 'dust_storm' ? 'L.U.M.E.N.' : 'F.L.O.R.A.'
      lines.push({ id: 'B.I.O.M.E.', msg: m('B.I.O.M.E.').hazard, hazard: true }, { id: who, msg: m(who).hazard, hazard: true })
    }
    return lines
  }, [visible, construction, cultivating, emerg])

  const agentCards = useMemo(() => [
    { id: 'Recon-01', role: 'Scout Bot', icon: Radar, tone: 'text-ios-blue', phase: 'scouting' },
    { id: 'Mason-02', role: 'Builder Swarm', icon: Hammer, tone: 'text-ios-orange', phase: 'construction' },
    { id: 'Assembler-03', role: 'Builder Swarm', icon: Hammer, tone: 'text-ios-orange', phase: 'construction' },
    { id: 'Commander-Prime SI', role: 'Manager SI', icon: BrainCircuit, tone: 'text-ios-purple', phase: 'cultivation' },
  ], [])

  const failedOver = ace?.status === 'failover'
  const chain = [
    { id: 'Ground Control', sub: 'Mission Control', holds: false, active: false },
    { id: 'B.I.O.M.E. (Head SI)', sub: failedOver ? 'Low power · offline' : ace?.status === 'restored' ? 'Research & Orbital Optimization' : 'Head SI', holds: !failedOver, active: false },
    { id: 'F.L.O.R.A. (Supervisor)', sub: failedOver ? 'Acting Manager' : 'Supervisor', holds: failedOver, active: false },
    { id: 'Construction Core Team', sub: failedOver && ace?.acting_supervisor ? `Supervised by ${ace.acting_supervisor} (Acting)` : 'Builds dome first', holds: false, active: !!run && construction < 100 },
    { id: 'Botanical Squad', sub: 'S.P.R.O.U.T., H.Y.D.R.O., A.E.G.I.S., L.U.M.E.N.', holds: false, active: construction >= 100 },
  ]

  return (
    <div className="space-y-6">
      <div className="glass flex flex-wrap items-stretch gap-1 rounded-2xl p-2" aria-label="Chain of command">
        {chain.map((n, i) => (
          <div key={n.id} className="flex min-w-[9rem] flex-1 items-center gap-1">
            <div className={`flex-1 rounded-xl px-3 py-2 text-center ${n.holds ? 'bg-ios-purple/40 ring-2 ring-ios-purple' : n.active ? 'bg-ios-green/25 ring-1 ring-ios-green' : 'bg-white/5'}`}>
              <div className="text-xs font-semibold">{n.id}</div>
              <div className="text-[10px] text-gray-400">{n.holds ? '★ Holds command' : n.active ? 'Active now' : n.sub}</div>
              {(n.holds || n.active) && <div className="text-[10px] text-gray-400">{n.holds ? n.sub : n.id.startsWith('Botanical') ? 'Dome sealed 100% · planting' : n.sub}</div>}
            </div>
            {i < chain.length - 1 && <span className="text-gray-500">→</span>}
          </div>
        ))}
      </div>

      {failedOver && (
        <Card tone="orange" className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-ios-orange flex-shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Failover Confirmed</span>
            <span className="ml-2 text-sm text-gray-400">F.L.O.R.A. autonomous control active · Battery {battery}%</span>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <PlanetGlobe name={run?.planet ?? 'Mars'} size={88} speed={1.5} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bio-Dome Lab</h1>
          <p className="mt-1 text-sm text-gray-400">Give the autonomous robot crew a directive. Recon scouts, builders raise the dome, and B.I.O.M.E., our Head Super Intelligence (SI), grows NASA Veggie crops.</p>
        </div>
        <Button variant="ghost" onClick={() => setShowSquad(true)} className="ml-auto"><Users size={16} /> Meet the Squad</Button>
      </div>
      {showSquad && <SquadModal onClose={() => setShowSquad(false)} />}

      <Card className="space-y-3">
        <div className="text-sm font-semibold text-ios-blue">Human directive</div>
        <textarea value={directive} onChange={(e) => { setDirective(e.target.value); setDirectiveError(null) }} rows={2}
          className="glass w-full rounded-xl bg-black/30 p-3 text-sm outline-none focus:ring-2 focus:ring-ios-blue" />
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => { setDirective(p); setDirectiveError(null) }} className={`rounded-full px-3 py-1 text-xs transition ${p === directive ? 'bg-ios-blue/40 ring-1 ring-white/40' : 'glass text-gray-300 hover:bg-white/10'}`}>{p.length > 52 ? p.slice(0, 52) + '…' : p}</button>
          ))}
        </div>
        <Button onClick={execute} disabled={busy || directive.trim().length < 3}><Play size={16} />{busy ? 'Dispatching…' : run ? 'Re-run mission' : 'Execute directive'}</Button>
      </Card>

      {directiveError && (
        <Card tone="red" className="space-y-2" >
          <div className="flex items-center gap-2 font-semibold text-ios-red"><Siren size={18} /> B.I.O.M.E. Directive Alert</div>
          <p className="text-sm text-gray-200">{directiveError}</p>
          <div className="flex flex-wrap gap-2">{PRESETS.map((p) => <button key={p} onClick={() => { setDirective(p); setDirectiveError(null) }} className="glass rounded-full px-3 py-1 text-xs text-gray-200 hover:bg-white/10">{p.length > 52 ? p.slice(0, 52) + '…' : p}</button>)}</div>
        </Card>
      )}

      {busy && <Spinner label="Dispatching robot crew…" />}

      {run && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="purple">{splitName(run.crop).emoji} {splitName(run.crop).label}</Badge>
            <Badge tone="blue">{splitName(run.planet).label} · {run.site}</Badge>
            {run.site_survey.map((s) => <Badge key={s.site} tone={s.selected ? 'green' : 'gray'}>{s.site} {s.reliability}%</Badge>)}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {agentCards.map(({ id, role, icon: I, tone, phase }) => {
              const action = lastAction(id)
              const active = !!action && !done && visible[visible.length - 1]?.agent === id
              return (
                <Card key={id} tone={active ? 'purple' : 'blue'} className="space-y-2">
                  <div className="flex items-center gap-2"><I size={18} className={`${tone} ${active ? 'animate-pulse' : ''}`} /><div><div className="text-sm font-semibold">{id}</div><div className="text-xs text-gray-400">{role}</div></div>
                    {active && <span className="ml-auto h-2 w-2 animate-ping rounded-full bg-ios-green" />}</div>
                  <div className="min-h-[2.5rem] text-xs text-gray-300">{action ?? 'Standing by…'}</div>
                  <Meter value={phase === 'construction' ? construction : phaseProgress(phase)} tone={phase === 'cultivation' ? 'purple' : phase === 'construction' ? 'orange' : 'blue'} />
                </Card>
              )
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card tone="green" className="space-y-3">
              <div className="flex items-center justify-between font-semibold"><span className="flex items-center gap-2"><Sprout size={16} className="text-ios-green" /> Inside the dome</span><Badge tone="green">Pressurized · shielded</Badge></div>
              <Dome progress={construction} health={inside} crop={run.crop} />
              <Meter value={inside} tone={scoreTone(inside)} label="Cultivated crop health" />
            </Card>
            <Card tone="orange" className="space-y-3">
              <div className="flex items-center justify-between font-semibold"><span className="flex items-center gap-2"><Zap size={16} className="text-ios-orange" /> Outside control plants</span><Badge tone="orange">Surface exposure</Badge></div>
              <div className="flex h-[138px] items-end justify-center gap-3 rounded-xl bg-gradient-to-b from-transparent to-[#7a3b22]/60 pb-2 text-4xl">
                {[0, 1, 2].map((i) => <span key={i} className={outside < 40 ? 'opacity-40 grayscale' : ''} style={{ transform: `scale(${0.6 + outside / 250})` }}>{cultivating ? splitName(run.crop).emoji : '·'}</span>)}
              </div>
              <Meter value={outside} tone={scoreTone(outside)} label="Control plant health" />
              <div className="text-xs text-gray-400">{day ? `Sol ${day.day}: ${day.outside_reason}` : 'Awaiting planting…'}</div>
            </Card>
          </div>

          <PowerControls alloc={alloc} onChange={setAlloc} supplyKw={solarOutput(FREEPLAY, Math.max(1, dayIdx))} />
          <LifeSupportHUD tel={tel} />

          {done && <Card tone="purple" className="text-sm">{run.final.verdict}</Card>}

          <Card tone={urgent ? 'red' : 'blue'} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={urgent ? 'red' : 'blue'}>{urgent ? 'Urgent SI Override' : 'NASA Human Approval'}</Badge>
              <button onClick={() => setUrgent((u) => !u)} className="glass ml-auto rounded-full px-3 py-1 text-xs text-gray-200 hover:bg-white/10">Switch to {urgent ? 'Normal (Time Available)' : 'Urgent Emergency (Solar Flare / Breach)'}</button>
            </div>
            {urgent
              ? <div className="text-sm text-gray-200">Time-Critical Threat — Super Intelligence (SI) Executing Human-Level Autonomous Command &amp; Transmitting Audit Report to NASA</div>
              : <div className="flex flex-wrap items-center gap-3 text-sm text-gray-200">
                  <span>Awaiting NASA Human Ground Control Approval (14-min Mars signal window)</span>
                  <Button onClick={() => { setApproved(true); setAlerts((a) => [...a, { key: `ap${Date.now()}`, level: 'info', to: 'NASA Mission Control', message: 'Human Ground Control approval granted (Approve as NASA).' }]) }} disabled={approved}>{approved ? 'Approved by NASA ✓' : 'Approve as NASA'}</Button>
                </div>}
          </Card>

          <Card tone="red" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold"><Siren size={18} className="text-ios-red" /> SI Emergency Override</div>
              {weather && <div className="flex items-center gap-2 text-xs text-gray-300">DONKI threat: <Badge tone={weather.threat_level === 'severe' || weather.threat_level === 'high' ? 'red' : 'orange'}>{weather.threat_level}</Badge><SourceBadge source={weather.source} /></div>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CRISES.map((c) => <button key={c.id} onClick={() => setCrisis(c.id)} className={`rounded-xl px-3 py-2 text-sm ${crisis === c.id ? 'bg-ios-red/40 ring-2 ring-white/40' : 'glass text-gray-300 hover:bg-white/10'}`}>{c.label}</button>)}
              <Button onClick={trigger} disabled={!done || emergBusy} className="!bg-ios-red"><Siren size={16} />{emergBusy ? 'B.I.O.M.E. evaluating…' : 'Trigger Planetary Emergency'}</Button>
            </div>
            {!done && <div className="text-xs text-gray-400">Available when the mission completes.</div>}
            {emerg && (
              <div className="space-y-2 rounded-xl bg-black/30 p-3 text-sm">
                <div className="flex items-center gap-2"><Badge tone="red">{emerg.severity}</Badge><b>{emerg.label}</b></div>
                <p className="text-gray-300">{emerg.assessment}</p>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-gray-300">{emerg.actions.map((a) => <li key={a}>{a}</li>)}</ul>
                <div className="text-xs text-gray-400">Inside {emerg.before.inside_health}% → {emerg.after.inside_health}% · Outside {emerg.before.outside_health}% → {emerg.after.outside_health}%</div>
              </div>
            )}
            {weather && weather.alerts.length > 0 && (
              <div className="text-xs text-gray-400">Latest DONKI: {weather.alerts.slice(0, 3).map((a) => `${a.type}${a.class ? ' ' + a.class : ''}`).join(' · ')}</div>
            )}
          </Card>

          <Card tone="orange" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold"><BatteryLow size={18} className="text-ios-orange" /> A.C.E. Protocol <span className="text-xs font-normal text-gray-400">Autonomous Continuity &amp; Escalation</span></div>
              <Badge tone={battery < 15 ? 'red' : 'green'}>Battery {battery}%</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { playClip(); aceCall(false) }} disabled={aceBusy || ace?.status === 'failover'} className="!bg-ios-orange"><BatteryLow size={16} />Simulate Manager Low Power (&lt;15%)</Button>
              <Button onClick={() => aceCall(true)} disabled={aceBusy || ace?.status !== 'failover'}><BatteryCharging size={16} />Recharge Manager (100%)</Button>
            </div>
            {showClip && (
              <div className="space-y-2 rounded-xl bg-black/30 p-3">
                <div className="flex items-center justify-between text-xs"><b className="text-ios-orange">A.C.E. Failover: Manager Robot → Supervisor Robot data-core transfer, then docks to recharge</b></div>
                <div className="space-y-2">
                  <video ref={clipRef} src="/videos/ace-handover.mp4" controls playsInline className="w-full rounded-lg bg-black" />
                  <p className="text-xs text-gray-400">Visuals and synthesized voiceover audio generated using Super Intelligence (SI) tools.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={playClip}>Replay</Button>
                  <Button onClick={() => { clipRef.current?.pause(); setShowClip(false) }} className="!bg-white/10">Hide Clip</Button>
                </div>
              </div>
            )}
            {ace && ace.status !== 'nominal' && (
              <div className="space-y-2 rounded-xl bg-black/30 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge tone="purple">Active Control</Badge><b>{ace.active_control.from}</b><span>→</span><b className={ace.status === 'failover' ? 'text-ios-orange' : 'text-ios-green'}>{ace.active_control.to}</b>
                  {ace.acting_supervisor && <><Badge tone="blue">Acting Supervisor</Badge><b>{ace.acting_supervisor}</b></>}
                </div>
                {ace.snapshot_badge && <Badge tone="green">🔐 {ace.snapshot_badge}</Badge>}
                {ace.biome_assignment && <div className="text-xs"><Badge tone="purple">B.I.O.M.E. assignment</Badge> <b>{ace.biome_assignment}</b></div>}
                <div className="space-y-0.5 font-mono text-[11px] text-gray-300">{ace.transfer_log.map((l, i) => <div key={i}>🔐 {l}</div>)}</div>
                {ace.alert && (
                  <div className="rounded-lg bg-ios-red/20 p-2.5 text-xs ring-1 ring-ios-red/60">
                    <div className="flex items-center gap-1.5 font-semibold text-ios-red"><ShieldAlert size={14} />{ace.alert.title}</div>
                    <div className="mt-1 text-gray-200">{ace.alert.message}</div>
                    <div className="mt-1 text-gray-400">NASA approval: {ace.alert.approval} · one-way lag {ace.alert.signal_lag_min} min · SI override: active</div>
                  </div>
                )}
                {ace.synced_to_nasa && <div className="rounded-lg bg-ios-green/15 p-2 text-xs text-ios-green">✓ All offline/failover logs synced to NASA Mission Control.</div>}
                {ace.dialogue.map((d, i) => <div key={i} className="text-xs"><b className={SQUAD_TONE[d.agent]}>{d.agent}:</b> <span className="text-gray-200">“{d.message}”</span></div>)}
              </div>
            )}
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-2 font-semibold"><Users size={16} className="text-ios-purple" /> Squad comms</div>
            {squadComms.map((l, i) => <div key={i} className={`rounded-lg p-2 text-xs ${l.hazard ? 'bg-ios-red/15' : 'bg-white/5'}`}><b className={SQUAD_TONE[l.id]}>{l.id}:</b> <span className="text-gray-200">“{l.msg}”</span></div>)}
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-2 font-semibold"><Radio size={16} className="text-ios-blue" /> Live telemetry → NASA Mission Control</div>
            {alerts.length === 0 && <div className="text-sm text-gray-400">Waiting for first report…</div>}
            {alerts.map((a) => (
              <div key={a.key} className={`rounded-lg p-2.5 text-xs ${a.level === 'urgent' ? 'bg-ios-red/20 ring-1 ring-ios-red/60' : 'bg-white/5'}`}>
                <b className={a.level === 'urgent' ? 'text-ios-red' : 'text-ios-blue'}>{a.level === 'urgent' ? '🚨 URGENT' : '📡 REPORT'}</b> <span className="text-gray-400">→ {a.to}</span>
                <div className="mt-0.5 text-gray-200">{a.message}</div>
              </div>
            ))}
          </Card>
        </>
      )}
      {!run && !busy && <Card className="flex items-center gap-3 py-8 text-gray-400"><Bot size={20} />Choose a preset or type a directive, then execute.</Card>}
    </div>
  )
}
