// Offline port of backend/app/engines/biodome.py for the Demo Fallback mode.
import type { FailoverOut, SquadMember, BiodomeDay, BiodomeRun, BiodomeStep, BiodomeTelemetry, Crisis, EmergencyOut, Planet } from './types'
import { DEMO_PLANETS, DEMO_PLANTS, find, runDay } from './demo'

export const SCOUT = 'Recon-01'
export const BUILDERS = ['Mason-02', 'Assembler-03']
export const MANAGER = 'Commander-Prime SI'

export const PRESETS = [
  'Build a Red Romaine Lettuce bio-dome on Mars Jezero Crater and run outside surface exposure trials',
  'Establish a Space Cabbage bio-dome on the Moon at Shackleton Crater and compare it with outdoor controls',
  'Grow Dwarf Tomato inside a pressurized dome on Mars Utopia Planitia with outside surface exposure trials',
  'Deploy a Mizuna Mustard bio-dome on Mars Gale Crater and test control plants outside',
]

type Site = [string, number, string]
const SITES: Record<string, Site[]> = {
  mars: [['Jezero Crater', 92, 'ancient river delta, flat regolith, subsurface ice nearby'], ['Gale Crater', 88, 'layered sediment, stable bedrock'], ['Utopia Planitia', 84, 'buried water ice, wide flat plains'], ['Valles Marineris Rim', 41, 'steep slopes and rockfall risk']],
  moon: [['Shackleton Crater', 90, 'permanently shadowed ice, near-constant sunlit rim'], ['Mare Tranquillitatis', 85, 'flat basaltic plain'], ['Tycho Ridge', 45, 'boulder fields and steep terrain']],
}
const GENERIC: Site[] = [['Equatorial Plain', 80, 'lowest relief terrain surveyed'], ['Polar Basin', 70, 'cold-trapped volatiles'], ['Highland Ridge', 40, 'unstable slopes']]

const CRISES: Record<Crisis, { label: string; out: number; inn: number; actions: string[] }> = {
  solar_flare: { label: 'Solar flare / energetic particle storm', out: 28, inn: 6, actions: ['Retract outside control-plant canopy and deploy radiation tarp', 'Route water ballast to the dome shield layer', 'Shelter builder swarm inside the airlock', 'Switch grow lights to low-power photoperiod'] },
  dust_storm: { label: 'Global dust storm', out: 20, inn: 8, actions: ['Seal dome airlocks and filters', 'Shift power to battery reserve and cut grow lights to 40%', 'Park Recon-01 in a lee-side shelter', 'Dispatch Mason-02 to clear panels after the storm'] },
  dome_breach: { label: 'Dome pressure breach', out: 5, inn: 35, actions: ['Isolate the breached segment with emergency bulkheads', 'Dispatch Assembler-03 to patch the shell with sealant', 'Re-pressurize from reserve tanks and verify seal', 'Move seedlings to the sealed central module'] },
}
const THREAT: Record<string, number> = { quiet: 0.6, low: 0.8, moderate: 1, high: 1.3, severe: 1.6 }

const plain = (n: string) => n.replace(/[^A-Za-z0-9 -]/g, '').trim().toLowerCase()

export const INVALID_DIRECTIVE_MESSAGE = 'Commander-Prime SI could not understand this directive. Please specify a valid planet (e.g. Mars, Moon) and crop (e.g. Red Romaine Lettuce), or choose one of the NASA presets.'
const NAMED_DESTINATIONS = ['moon', 'lunar', 'titan', 'europa', 'ganymede', 'callisto', 'enceladus', 'ceres', 'triton', 'kepler', 'trappist', 'proxima']
const CROP_WORDS = ['lettuce', 'romaine', 'cabbage', 'tomato', 'mizuna', 'mustard', 'cactus', 'moss', 'grass', 'tree']

/** Mirrors backend validate_directive: needs a recognized destination AND crop (or an exact preset). */
export function validateDirective(directive: string): string | null {
  const text = directive.toLowerCase().trim()
  if (PRESETS.includes(directive.trim())) return null
  const words = new Set(text.match(/[a-z0-9-]+/g) ?? [])
  const places = [...DEMO_PLANETS.map((p) => plain(p.name)).filter((n) => n !== 'earth'), ...Object.values(SITES).flat().map((s) => s[0].toLowerCase())]
  const hasWorld = places.some((n) => text.includes(n)) || NAMED_DESTINATIONS.some((w) => words.has(w))
  const hasCrop = DEMO_PLANTS.some((c) => text.includes(plain(c.name))) || CROP_WORDS.some((w) => words.has(w))
  return hasWorld && hasCrop ? null : INVALID_DIRECTIVE_MESSAGE
}

export function demoBiodomeExecute(directive: string, days = 10): BiodomeRun {
  const text = directive.toLowerCase()
  const world = DEMO_PLANETS.find((p) => text.includes(plain(p.name))) ?? DEMO_PLANETS[3]
  let plant = DEMO_PLANTS.find((c) => text.includes(plain(c.name)))
  if (!plant) {
    const kw = ['cabbage', 'tomato', 'mizuna', 'mustard'].find((k) => text.includes(k)) ?? 'lettuce'
    plant = find(DEMO_PLANTS, kw === 'mustard' ? 'mizuna' : kw) ?? DEMO_PLANTS[4]
  }
  const sites = SITES[plain(world.name)] ?? GENERIC
  const ranked = [...sites].sort((a, b) => b[1] - a[1])
  const req = sites.find((s) => text.includes(s[0].toLowerCase()))
  const chosen = req && req[1] >= 60 ? req : ranked[0]

  const steps: BiodomeStep[] = [], telemetry: BiodomeTelemetry[] = []
  const step = (phase: BiodomeStep['phase'], agent: string, role: string, action: string, progress: number) => steps.push({ index: steps.length, phase, agent, role, action, progress })
  const report = (phase: string, message: string, level = 'info') => telemetry.push({ index: telemetry.length, to: 'NASA Mission Control', phase, level, message })

  step('scouting', SCOUT, 'Scout Bot', `Surveying ${ranked.length} candidate sites on ${world.name}`, 50)
  step('scouting', SCOUT, 'Scout Bot', `Selected ${chosen[0]} (reliability ${chosen[1]}%): ${chosen[2]}`, 100)
  report('scouting', `Landing site ${chosen[0]} confirmed at ${chosen[1]}% terrain reliability.`)
  const stages: [number, string][] = [[25, 'Anchoring foundation ring'], [50, 'Erecting pressure shell'], [75, 'Sealing and inflating dome'], [100, 'Installing grow racks, water loop and radiation shield']]
  for (const [pct, label] of stages) {
    step('construction', BUILDERS[0], 'Builder Swarm', label, pct)
    step('construction', BUILDERS[1], 'Builder Swarm', `Assembler support: ${label[0].toLowerCase()}${label.slice(1)}`, pct)
  }
  report('construction', 'Pressurized dome shell complete: 70 kPa, 22 °C, 85% radiation shielding.')

  const dome: Planet = { name: `Dome on ${world.name}`, temperature: 22, pressure: 70, radiation: Math.trunc(world.radiation * 0.15), water_available: true }
  const timeline: BiodomeDay[] = []
  let inside = 100, outside = 100, ei = 100, eo = 100
  for (let day = 1; day <= days; day++) {
    const a = runDay(day, dome, plant, inside, ei, false), b = runDay(day, world, plant, outside, eo, false)
    inside = a.new_health; outside = b.new_health
    ei = Math.min(100, a.new_robot_energy + 4); eo = Math.min(100, b.new_robot_energy + 4)
    timeline.push({ day, inside_health: inside, outside_health: outside, inside_status: a.status, outside_status: b.status, outside_reason: b.reason })
  }
  step('cultivation', MANAGER, 'Manager SI', `Planting ${plant.name} inside the dome`, 10)
  step('cultivation', MANAGER, 'Manager SI', `Planting control ${plant.name} outside on the surface`, 30)
  step('cultivation', MANAGER, 'Manager SI', `Monitoring ${days} sols of growth: inside ${inside}% vs outside ${outside}%`, 100)
  report('cultivation', `Sol ${days}: inside-dome health ${inside}%, outside control ${outside}%.`)
  const gap = inside - outside
  const verdict = gap > 0
    ? `The dome protected ${plant.name} by ${gap} health points versus open-surface exposure on ${world.name}.`
    : `${plant.name} tolerated ${world.name} surface conditions; the dome gave no measurable advantage.`
  report('complete', verdict, 'success')
  return {
    directive, planet: world.name, crop: plant.name, site: chosen[0],
    agents: [
      { id: SCOUT, role: 'Scout Bot', task: 'Terrain reconnaissance' },
      { id: BUILDERS[0], role: 'Builder Swarm', task: 'Dome shell construction' },
      { id: BUILDERS[1], role: 'Builder Swarm', task: 'Systems assembly' },
      { id: MANAGER, role: 'Manager SI', task: 'Cultivation & emergency command' },
    ],
    site_survey: ranked.map(([site, reliability, note]) => ({ site, reliability, note, selected: site === chosen[0] })),
    steps, timeline, final: { inside_health: inside, outside_health: outside, verdict }, telemetry,
  }
}

export function demoEmergency(planet: string, crop: string, crisis: Crisis, insideHealth: number, outsideHealth: number, threat = 'severe', source = 'demo'): EmergencyOut {
  const spec = CRISES[crisis]
  const mult = crisis === 'solar_flare' ? THREAT[threat] ?? 1 : 1
  const inDmg = Math.trunc(spec.inn * mult), outDmg = Math.trunc(spec.out * mult)
  const after = { inside_health: Math.max(0, insideHealth - Math.trunc(inDmg / 2)), outside_health: Math.max(0, outsideHealth - outDmg) }
  const severity = crisis === 'dome_breach' || mult >= 1.3 ? 'critical' : mult >= 1 ? 'major' : 'minor'
  const basis = crisis === 'solar_flare' ? `NASA DONKI threat level: ${threat}, source: ${source}` : 'onboard sensors'
  return {
    crisis, label: spec.label, severity, threat_level: threat, space_weather_source: source,
    assessment: `${MANAGER} assessed '${spec.label}' on ${planet} (${severity}; ${basis}). Unmitigated interior damage ${inDmg}%; outside control plants lose ${outDmg}%.`,
    actions: spec.actions, before: { inside_health: insideHealth, outside_health: outsideHealth }, after,
    telemetry: { to: 'NASA Mission Control', level: 'urgent', message: `URGENT: ${spec.label} at ${planet} bio-dome (${crop}). ${MANAGER} executed ${spec.actions.length} survival actions. Inside ${after.inside_health}%, outside ${after.outside_health}%.` },
  }
}

export const SQUAD: SquadMember[] = [
  { id: 'B.I.O.M.E.', name: 'Biosphere Intelligence & Operations Management Engine', role: 'Head SI', icon: 'brain', bio: 'Head Super Intelligence. Plans the mission, validates directives and commands every robot in the squad.', milestone: 'Directive validated. Mission plan locked; all units, report to your stations.', hazard: 'Hazard detected. Re-prioritising power and tasking the squad to protect the crop.' },
  { id: 'F.L.O.R.A.', name: 'Field Landscape Observation & Reconnaissance Agent', role: 'Field Supervisor', icon: 'radar', bio: 'Field Supervisor. Surveys terrain, supervises construction and steps up as Acting Mission Director on failover.', milestone: 'Landing site confirmed. Terrain is stable and the ice survey is promising.', hazard: 'Surface conditions degrading. Pulling every unit back inside the safe perimeter.' },
  { id: 'S.P.R.O.U.T.', name: 'Seedling Planting, Rooting & Outdoor Upkeep Tender', role: 'Planter', icon: 'sprout', bio: 'Plants seeds, thins seedlings and tends the control crop on the surface.', milestone: 'First seeds are in the regolith. Germination watch has begun.', hazard: 'Control crop is under stress. Covering seedlings and moving them to the central module.' },
  { id: 'H.Y.D.R.O.', name: 'Hydration, Yield & Drainage Regulation Operator', role: 'Water & Nutrients', icon: 'droplets', bio: 'Runs the water loop, nutrient dosing and humidity control.', milestone: 'Water loop primed and nutrient mix balanced at target.', hazard: 'Water pressure drifting. Isolating the loop and switching to reserve tanks.' },
  { id: 'A.E.G.I.S.', name: 'Atmospheric & Environmental Guard Integrity System', role: 'Safety & Shielding', icon: 'shield', bio: 'Guards dome pressure, radiation shielding and airlocks. Acting Supervisor during an A.C.E. failover.', milestone: 'Dome sealed at 70 kPa with radiation shield online.', hazard: 'Breach or radiation spike. Sealing bulkheads and sheltering all units.' },
  { id: 'L.U.M.E.N.', name: 'Light, Utility & Mission Energy Navigator', role: 'Power & Lighting', icon: 'zap', bio: 'Manages solar output, batteries and grow-light photoperiods.', milestone: 'Solar array tracking the sun; grow lights on schedule.', hazard: 'Power budget critical. Cutting non-essential loads and dimming grow lights.' },
]

export const ACE_THRESHOLD = 15
const ACTING_DIRECTOR = 'F.L.O.R.A.', ACTING_SUPERVISOR = 'A.E.G.I.S.'

/** Mirrors backend biodome.failover (A.C.E. Protocol). */
export function demoFailover(batteryPct: number, planet: string, crop: string, insideHealth: number, outsideHealth: number, recharge = false, lag = 14): FailoverOut {
  if (recharge) {
    return {
      triggered: false, status: 'restored', battery_pct: 100, threshold: ACE_THRESHOLD, active_control: { from: ACTING_DIRECTOR, to: 'B.I.O.M.E.' }, acting_supervisor: null,
      transfer_log: ['Battery restored to 100%. B.I.O.M.E. rebooted and passed integrity self-test.', `Active Control returned: ${ACTING_DIRECTOR} → B.I.O.M.E.`, 'Black-box records (decisions, telemetry, overrides) compiled for audit.', 'B.I.O.M.E. assigned to Advanced Predictive Research & Orbital Optimization.', `All offline/failover logs synced to NASA Mission Control for ${planet} bio-dome (${crop}).`],
      alert: null, snapshot_badge: null, biome_assignment: 'Advanced Predictive Research & Orbital Optimization', synced_to_nasa: true, dialogue: [{ agent: 'B.I.O.M.E.', message: 'Power restored. Resuming command; black-box log synced to NASA.' }],
    }
  }
  if (batteryPct >= ACE_THRESHOLD) {
    return { triggered: false, status: 'nominal', battery_pct: batteryPct, threshold: ACE_THRESHOLD, active_control: { from: 'B.I.O.M.E.', to: 'B.I.O.M.E.' }, acting_supervisor: null, transfer_log: [], alert: null, snapshot_badge: null, biome_assignment: null, synced_to_nasa: false, dialogue: [] }
  }
  return {
    triggered: true, status: 'failover', battery_pct: batteryPct, threshold: ACE_THRESHOLD, active_control: { from: 'B.I.O.M.E.', to: `${ACTING_DIRECTOR} Acting Mission Director` }, acting_supervisor: ACTING_SUPERVISOR,
    transfer_log: [
      `Snapshot sealed: battery ${batteryPct}%, crop health inside ${insideHealth}% / outside ${outsideHealth}%.`,
      'Encrypting telemetry snapshot (AES-256-GCM) for continuity transfer.',
      `Transferring snapshot B.I.O.M.E. → ${ACTING_DIRECTOR}: checksum verified.`,
      `${ACTING_DIRECTOR} acknowledged; ${ACTING_SUPERVISOR} assumed Acting Supervisor.`,
    ],
    alert: {
      level: 'urgent', title: 'NASA Ground Control Approval vs. Earth Signal Lag: SI Autonomous Override', signal_lag_min: lag, approval: 'pending', override: true,
      message: `Battery ${batteryPct}% (<${ACE_THRESHOLD}%). NASA Ground Control approval would take about ${Math.round(lag * 2)} min round trip, longer than the remaining power window. ${ACTING_DIRECTOR} (Acting Mission Director) executes an SI Autonomous Override: non-essential loads shed, life support and grow lights preserved. Ground Control notified.`,
    },
    snapshot_badge: 'Encrypted Telemetry Snapshot Cloned (0ms Downtime / Zero Conflict)', biome_assignment: null,
    handover_record: `A.C.E. handover logged to NASA: B.I.O.M.E. (battery ${batteryPct}%) -> ${ACTING_DIRECTOR} (Acting Manager); ${ACTING_SUPERVISOR} promoted to Acting Supervisor; ${planet} bio-dome (${crop}).`,
    synced_to_nasa: false,
    dialogue: [{ agent: 'L.U.M.E.N.', message: SQUAD[5].hazard }, { agent: 'F.L.O.R.A.', message: 'A.C.E. engaged. I have the conn as Acting Mission Director.' }, { agent: 'A.E.G.I.S.', message: 'Acting Supervisor confirmed. Dome integrity holding.' }],
  }
}
