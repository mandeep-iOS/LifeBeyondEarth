// Offline "Demo Fallback": client-side ports of the backend engines + seed catalog,
// so the whole app works with no server. Memory/history live in localStorage.
import type {
  DayResult, Exoplanet, ExoplanetData, Factor, HistoryItem, HistoryRecord, MarsData, MemoryItem,
  MemoryRecord, OsdrData, SpaceWeatherData, Planet, Plant, PowerData, Prediction, RobotDecision, SimulateOut, SimulateRequest,
} from './types'

export const DEMO_PLANETS: Planet[] = [
  { name: '☄️ Mercury', temperature: 167, pressure: 0, radiation: 95, water_available: false },
  { name: '🟠 Venus', temperature: 464, pressure: 9200, radiation: 20, water_available: false },
  { name: '🌍 Earth', temperature: 15, pressure: 101.3, radiation: 10, water_available: true },
  { name: '🔴 Mars', temperature: -63, pressure: 0.6, radiation: 80, water_available: false },
  { name: '🟤 Jupiter', temperature: -145, pressure: 2000, radiation: 100, water_available: false },
  { name: '🪐 Saturn', temperature: -178, pressure: 1400, radiation: 70, water_available: false },
  { name: '🔵 Uranus', temperature: -224, pressure: 1000, radiation: 40, water_available: false },
  { name: '🔷 Neptune', temperature: -214, pressure: 1200, radiation: 45, water_available: false },
  { name: '⚪ Pluto', temperature: -229, pressure: 0.001, radiation: 25, water_available: false },
  { name: '🌙 Moon', temperature: -20, pressure: 0, radiation: 90, water_available: false },
]
// Inline worlds (NASA exoplanets) registered by the UI; sent to the backend as `planet_data`.
const CUSTOM_PLANETS = new Map<string, Planet>()
export const registerPlanet = (p: Planet) => { CUSTOM_PLANETS.set(p.name, p) }
export const customPlanet = (name: string) => CUSTOM_PLANETS.get(name)
const allPlanets = () => [...DEMO_PLANETS, ...CUSTOM_PLANETS.values()]
export const DEMO_PLANTS: Plant[] = [
  { name: '🌵 Cactus', cold_tolerance: -10, water_need: 20, radiation_tolerance: 50 },
  { name: '🌿 Moss', cold_tolerance: -30, water_need: 50, radiation_tolerance: 30 },
  { name: '🌳 Tree', cold_tolerance: 0, water_need: 90, radiation_tolerance: 10 },
  { name: '🌱 Grass', cold_tolerance: -5, water_need: 60, radiation_tolerance: 20 },
  // NASA ISS Veggie & Plant Biology Program crops
  { name: '🥬 Red Romaine Lettuce', cold_tolerance: -2, water_need: 65, radiation_tolerance: 35 },
  { name: '🥗 Space Cabbage', cold_tolerance: -5, water_need: 70, radiation_tolerance: 40 },
  { name: '🍃 Mizuna Mustard', cold_tolerance: -4, water_need: 55, radiation_tolerance: 45 },
  { name: '🍅 Dwarf Tomato', cold_tolerance: 5, water_need: 80, radiation_tolerance: 25 },
]

export const find = <T extends { name: string }>(list: T[], name: string) =>
  list.find((x) => x.name === name || x.name.toLowerCase().includes(name.toLowerCase()))
const idiv = (a: number, b: number) => Math.trunc(a / b)
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// ---- localStorage-backed memory/history
const read = <T,>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}
const write = (key: string, v: unknown) => localStorage.setItem(key, JSON.stringify(v))
export const demoMemory = (): MemoryItem[] => read<MemoryItem>('lbe_demo_memory')
export const demoHistory = (): HistoryItem[] => read<HistoryItem>('lbe_demo_history')
export function demoAddMemory(m: MemoryRecord): MemoryItem {
  const all = demoMemory()
  const item = { ...m, id: (all[0]?.id ?? 0) + 1, created_at: new Date().toISOString() }
  write('lbe_demo_memory', [item, ...all]); return item
}
export function demoAddHistory(h: HistoryRecord): HistoryItem {
  const all = demoHistory()
  const item = { ...h, id: (all[0]?.id ?? 0) + 1, created_at: new Date().toISOString() }
  write('lbe_demo_history', [item, ...all]); return item
}

// ---- prediction
const forPlanet = (mem: MemoryRecord[], p: Planet) => mem.filter((m) => m.planet_name === p.name)
function memAdj(mem: MemoryRecord[], p: Planet, pl: Plant) {
  let d = 0
  for (const m of forPlanet(mem, p)) if (m.plant_name === pl.name) { if (m.survival_score >= 70) d += 15; else if (m.survival_score < 30) d -= 20 }
  return d
}
export function demoPredict(planetName: string, plantName: string, useMemory = true): Prediction {
  const p = find(allPlanets(), planetName) ?? DEMO_PLANETS[3]
  const pl = find(DEMO_PLANTS, plantName) ?? DEMO_PLANTS[0]
  const mem = useMemory ? demoMemory() : []
  const tempBad = p.temperature < pl.cold_tolerance, radBad = p.radiation > pl.radiation_tolerance, waterBad = !p.water_available
  const md = memAdj(mem, p, pl)
  const score = clamp(100 - (tempBad ? 25 : 0) - (radBad ? 30 : 0) - (waterBad ? idiv(pl.water_need, 2) : 0) + md, 0, 100)
  const rel = mem.filter((m) => m.planet_name === p.name && m.plant_name === pl.name)
  const confidence = rel.length
    ? Math.min(95, score + 10 + idiv(idiv(rel.filter((m) => m.survival_score >= 70).length * 100, rel.length), 10))
    : Math.min(80, score)
  const pm = forPlanet(mem, p)
  const factors: Factor[] = [
    { name: 'Temperature', planet_value: String(p.temperature), plant_limit: String(pl.cold_tolerance), impact: tempBad ? -25 : 0, status: tempBad ? 'threat' : 'ok' },
    { name: 'Radiation', planet_value: String(p.radiation), plant_limit: String(pl.radiation_tolerance), impact: radBad ? -30 : 0, status: radBad ? 'threat' : 'ok' },
    { name: 'Water', planet_value: String(p.water_available), plant_limit: String(pl.water_need), impact: waterBad ? -idiv(pl.water_need, 2) : 0, status: waterBad ? 'threat' : 'ok' },
    { name: 'Mission Memory', planet_value: String(pm.length), plant_limit: '-', impact: md, status: md < 0 ? 'threat' : md > 0 ? 'boost' : 'ok' },
  ]
  return {
    survival_prediction: score,
    risk_level: score >= 80 ? '🟢 Low' : score >= 50 ? '🟡 Medium' : '🔴 High',
    main_threat: radBad ? '☢ Radiation' : waterBad ? '💧 Water shortage' : tempBad ? '❄ Extreme temperature' : '🌎 Environment stable',
    confidence,
    reason: [radBad ? '☢ Radiation risk' : '🛡 Radiation tolerance good', p.water_available ? '💧 Water available' : '💧 Low water dependency', ...(pm.length ? [`🧠 Learned from ${pm.length} previous mission(s)`] : [])].join('\n'),
    explanation: {
      title: `Why Mission Memory selected ${pl.name}`,
      points: [
        `☢ Radiation\nPlanet:\n${p.radiation}\nPlant tolerance:\n${pl.radiation_tolerance}`,
        `💧 Water\nRequirement:\n${pl.water_need}\nAvailable:\n${p.water_available}`,
        `❄ Temperature\nPlanet:\n${p.temperature}\nTolerance:\n${pl.cold_tolerance}`,
        pm.length
          ? `🧠 Mission Memory\nPrevious missions analyzed:\n${pm.length}\nSuccessful missions:\n${pm.filter((m) => m.survival_score >= 70).length}\nMission Memory improved decision using history.`
          : '🧠 Mission Memory\nNo previous missions available.\nMission Memory used environmental analysis only.',
      ],
    },
    factors,
  }
}

// ---- robot
const MODE_TITLES: Record<string, string> = {
  monitoring: '🟢 Monitoring Mode', support: '🟡 Support Mode', emergency: '🔴 Emergency Mode',
  power_saving: '🔋 Power Saving Mode', offline: '⚫ Robot Offline',
}
export function demoDecide(planetName: string, health: number, energy: number, useMemory = true): RobotDecision {
  const p = find(allPlanets(), planetName) ?? DEMO_PLANETS[3]
  const mem = useMemory ? forPlanet(demoMemory(), p) : []
  const best = mem.length ? Math.max(...mem.map((m) => m.survival_score)) : 0
  const lesson = mem.length ? `Previous best mission:\n${best}%\nsurvival achieved.` : 'No previous mission data available'
  const mb = `🧠 Memory:\n${lesson}`
  const r = (action: string, priority: string, mode: string): RobotDecision => ({ action, priority, mode, mode_title: MODE_TITLES[mode] })
  if (energy <= 0) return r(`💀 Robot battery depleted.\nMission data preserved.\n${mb}`, 'Critical', 'offline')
  if (energy < 20) return r(`🔋 Reducing non-essential systems\nto preserve energy.\n${mb}`, 'High', 'power_saving')
  if (health < 20) return r(`🚨 Maximum survival protocol activated.\n${mb}`, 'Critical', 'emergency')
  if (mem.some((m) => m.survival_score < 30) && p.radiation > 70)
    return r(`🧠 Previous mission failure detected.\n☢ Increasing radiation protection priority.\n📊 Previous survival:\n${best}%`, 'Critical', 'emergency')
  if (!p.water_available) return r(`💧 Activating water recycling system.\n${mb}`, 'High', 'support')
  if (p.radiation > 70) return r(`🛡 Radiation protection system active.\n${mb}`, 'High', 'support')
  if (p.temperature < -40) return r(`🔥 Increasing thermal protection.\n${mb}`, 'Medium', 'support')
  return r(`🤖 Monitoring ecosystem conditions.\n${mb}`, 'Low', 'monitoring')
}

// ---- simulation
function modifier(p: Planet) {
  const n = p.name.toLowerCase().replace(/🔴|🌙|🌍/g, '').trim()
  if (n === 'earth') return [0.5, 0.5]
  if (n === 'moon') return [2, 1]
  if (n === 'mars') return [1.8, 0.8]
  const ext = Math.min(1, Math.abs(p.temperature - 15) / 250)
  return [1 + ext * 0.5 + p.radiation / 200, 1 + ext * 0.5]
}
const healthStatus = (h: number) => h >= 80 ? '🟢 Excellent survival condition' : h >= 50 ? '🟡 Moderate survival condition' : h >= 1 ? '🟠 Critical condition' : '🔴 Plant extinct'
const robotStatus = (e: number) => e >= 70 ? '🔋 Robot systems optimal' : e >= 30 ? '⚠️ Robot energy decreasing' : e >= 1 ? '🚨 Robot energy critical' : '💀 Robot offline'

export function runDay(day: number, p: Planet, pl: Plant, health0: number, energy0: number, useMemory: boolean): DayResult {
  const [hm, em] = modifier(p)
  let hc = 0, ec = 0, energy = energy0
  const reasons: string[] = [], actions: string[] = []
  const apply = (dmg: number, cost: number, reason: string, action: string) => {
    hc -= Math.trunc(dmg * hm); reasons.push(reason); actions.push(action)
    const c = Math.trunc(cost * em); energy = Math.max(0, energy - c); ec -= c
  }
  if (p.temperature < pl.cold_tolerance) apply(5, 10, '❄️ Temperature too low', '🔥 Robot increasing heat support')
  if (p.temperature > 45) apply(Math.max(5, Math.floor((p.temperature - 45) / 10)), 10, '🔥 Extreme heat', '🧊 Robot activating cooling system')
  if (p.pressure > 300) apply(5 + Math.floor(Math.trunc(p.pressure - 300) / 500), 8, '🗜 Crushing pressure', '🛠 Robot reinforcing habitat')
  if (p.radiation > pl.radiation_tolerance) apply(Math.max(5, idiv(p.radiation - pl.radiation_tolerance, 5)), 12, '☢ Radiation exposure', '🛡 Robot activating radiation shield')
  if (!p.water_available) apply(idiv(pl.water_need, 20), 8, '💧 Water shortage', '💧 Robot managing water supply')
  if (p.pressure < 1) apply(3, 6, '🌫 Extreme low pressure', '⚙️ Robot stabilizing environment')
  let health = clamp(health0 + hc, 0, 100)
  if (health > 0 && health < 50 && energy >= 20) {
    health = Math.min(100, health + 1); hc += 1; energy = Math.max(0, energy - 10); ec -= 10
    actions.push('🤖 Emergency support activated (+1% health, -10% energy)')
  }
  energy = Math.max(0, energy - 2); ec -= 2
  if (energy > 0 && energy <= 10) actions.push('⚠️ Robot power critical')
  if (energy === 0) actions.push('💀 Robot offline')
  const d = demoDecide(p.name, health, energy, useMemory)
  let mode = d.mode_title, action = d.action
  if (energy > 0 && energy <= 10) { mode = '🔴 Emergency Power Mode'; action += '\n⚠️ Robot power critical' }
  if (energy === 0) { mode = '⚫ Robot Offline'; action += '\n💀 Robot energy depleted' }
  action += '\n' + (actions.length ? actions.join('\n') : '🤖 Monitoring environment')
  if (health <= 0) mode = '⚫ Mission Failed'
  return {
    day, health_change: hc, new_health: health, reason: reasons.length ? reasons.join(', ') : 'Environment stable',
    robot_action: action, robot_energy_change: ec, new_robot_energy: energy, survival_probability: health / 100,
    survival_percentage: Math.trunc(health), status: healthStatus(health), robot_status: robotStatus(energy),
    robot_mode: mode, robot_priority: d.priority,
  }
}
export function demoSimulate(req: SimulateRequest): SimulateOut {
  const p = find(allPlanets(), req.planet) ?? DEMO_PLANETS[3]
  const pl = find(DEMO_PLANTS, req.plant) ?? DEMO_PLANTS[0]
  let h = req.health ?? 100, e = req.robot_energy ?? 100
  const timeline: DayResult[] = []
  for (let d = 1; d <= (req.days ?? 1); d++) {
    const r = runDay(d, p, pl, h, e, req.use_memory ?? true)
    timeline.push(r); h = r.new_health; e = r.new_robot_energy
    if (h <= 0) break
  }
  return { planet: p.name, plant: pl.name, days_simulated: timeline.length, final: timeline[timeline.length - 1], timeline }
}

// ---- NASA seeds
export const demoPower = (): PowerData => ({
  source: 'demo', latitude: -24.5, longitude: -69.25,
  analog_sites: [
    { name: 'Atacama Desert, Chile', lat: -24.5, lon: -69.25, analog_for: 'Mars (aridity)', avg_temp_c: 16, solar_kwh_m2_day: 7.5, precip_mm_day: 0 },
    { name: 'Devon Island, Canada', lat: 75.4, lon: -89, analog_for: 'Mars (cold, polar desert)', avg_temp_c: -15, solar_kwh_m2_day: 2.4, precip_mm_day: 0.2 },
    { name: 'McMurdo Dry Valleys, Antarctica', lat: -77.5, lon: 162.5, analog_for: 'Mars (cold, hyper-arid)', avg_temp_c: -20, solar_kwh_m2_day: 3, precip_mm_day: 0 },
    { name: 'Mauna Kea, Hawaii', lat: 19.8, lon: -155.5, analog_for: 'Moon (regolith, low humidity)', avg_temp_c: 3, solar_kwh_m2_day: 6.5, precip_mm_day: 0.3 },
  ],
})
const EXO: Exoplanet[] = [
  { name: 'TRAPPIST-1 e', host: 'TRAPPIST-1', equilibrium_temp_k: 251, radius_earth: 0.92, orbit_au: 0.029, discovery_year: 2017 },
  { name: 'Proxima Centauri b', host: 'Proxima Cen', equilibrium_temp_k: 234, radius_earth: 1.07, orbit_au: 0.0485, discovery_year: 2016 },
  { name: 'Kepler-442 b', host: 'Kepler-442', equilibrium_temp_k: 233, radius_earth: 1.34, orbit_au: 0.409, discovery_year: 2015 },
  { name: 'LHS 1140 b', host: 'LHS 1140', equilibrium_temp_k: 226, radius_earth: 1.73, orbit_au: 0.0875, discovery_year: 2017 },
]
export const demoExoplanets = (): ExoplanetData => ({ source: 'demo', count: EXO.length, planets: EXO })
export const demoOsdr = (): OsdrData => ({
  source: 'demo', count: 4,
  studies: [
    ['OSD-971', 'Genetic alterations of the putrescine metabolic pathway attenuate plant responses to spaceflight', 'Arabidopsis thaliana'],
    ['OSD-615', 'Glycome profiling and immunohistochemistry uncover changes in cell walls of Arabidopsis thaliana roots during spaceflight: APEX 03-1', 'Arabidopsis thaliana'],
    ['OSD-205', 'HSFA2 functions in the physiological adaptation of undifferentiated plant cells to spaceflight microgravity environment', 'Arabidopsis thaliana'],
    ['OSD-772', 'PH-04 Chile Peppers in Space', 'Capsicum annuum'],
  ].map(([a, t, o]) => ({ accession: a, title: t, organism: o, url: `https://osdr.nasa.gov/bio/repo/data/studies/${a}` })),
})
export const demoMars = (): MarsData => ({
  source: 'demo', count: 1,
  photos: [{ id: 102693, sol: 1000, rover: 'Curiosity', camera: 'FHAZ', earth_date: '2015-05-30', img_src: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/01000/opgs/edr/fcam/FLB_486265257EDR_F0481570FHAZ00323M_.JPG' }],
})

export const demoSpaceWeather = (): SpaceWeatherData => ({
  source: 'demo', count: 3, threat_level: 'severe', radiation_multiplier: 2,
  summary: '3 DONKI alert(s); peak threat level: severe',
  alerts: [
    { id: '2024-05-14T17:26:00-FLR-001', type: 'Solar Flare', class: 'X8.7', begin_time: '2024-05-14T16:46Z', peak_time: '2024-05-14T17:26Z', source_region: 'AR3664', link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' },
    { id: '2024-05-11T01:23:00-FLR-001', type: 'Solar Flare', class: 'X5.8', begin_time: '2024-05-11T01:10Z', peak_time: '2024-05-11T01:23Z', source_region: 'AR3664', link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' },
    { id: '2024-05-10T07:31:00-SEP-001', type: 'Solar Energetic Particle', class: 'S3', begin_time: '2024-05-10T07:31Z', peak_time: null, source_region: 'AR3664', link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' },
  ],
})
