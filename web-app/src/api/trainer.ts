// Mission Trainer engine. Mirrors backend/app/engines/trainer.py so the trainer works offline.
export const SYSTEMS = ['shielding', 'heating', 'water', 'led'] as const
export type SystemKey = (typeof SYSTEMS)[number]
export type Allocation = Record<SystemKey, number>

export const DRAW_KW: Record<SystemKey, number> = { shielding: 3, heating: 3, water: 2, led: 4 }
export const CREW_O2_KG_DAY = 3.36
export const DEFAULT_ALLOCATION: Allocation = { shielding: 50, heating: 50, water: 50, led: 50 }

export const SYSTEM_META: Record<SystemKey, { label: string; emoji: string; hint: string }> = {
  shielding: { label: 'Radiation Shielding', emoji: '🛡️', hint: 'Cuts radiation damage to plants' },
  heating: { label: 'Thermal Heating', emoji: '🔥', hint: 'Prevents cold stress' },
  water: { label: 'Water Recycling', emoji: '💧', hint: 'Recovers more water per day' },
  led: { label: 'Veggie LED Grow Lights', emoji: '💡', hint: 'Drives crop growth, O₂ and calories' },
}

export interface Objective { metric: 'health' | 'battery' | 'water' | 'pressure'; op: '>=' | '>'; value: number; label: string }
export interface Mission {
  id: string; rank: string; title: string; emoji: string; planet: string; days: number
  solar_kw: number; radiation: number; cold: number; dust: [number, number]; flare: [number, number]
  briefing: string; objectives: Objective[]
}

export const MISSIONS: Mission[] = [
  { id: 'cadet-lunar', rank: 'Cadet', title: 'Lunar Outpost', emoji: '🌙', planet: '🌙 Moon', days: 14, solar_kw: 8, radiation: 45, cold: 70, dust: [0, 0], flare: [0, 0],
    briefing: 'Keep a lettuce crop alive through the lunar night cycle on a stable power grid.',
    objectives: [{ metric: 'health', op: '>=', value: 60, label: 'Plant health ≥ 60%' }, { metric: 'battery', op: '>=', value: 20, label: 'Battery ≥ 20%' }] },
  { id: 'specialist-mars-dust', rank: 'Specialist', title: 'Mars Dust Storm', emoji: '🔴', planet: '🔴 Mars', days: 20, solar_kw: 7, radiation: 55, cold: 85, dust: [6, 14], flare: [0, 0],
    briefing: 'A global dust storm cuts solar output by 70%. Ration power without losing the crop or the water loop.',
    objectives: [{ metric: 'health', op: '>=', value: 50, label: 'Plant health ≥ 50%' }, { metric: 'battery', op: '>', value: 0, label: 'Battery never depleted' }, { metric: 'water', op: '>=', value: 25, label: 'Water reserve ≥ 25%' }] },
  { id: 'commander-solar-flare', rank: 'Commander', title: 'Solar Flare Crisis', emoji: '☀️', planet: '🔴 Mars', days: 25, solar_kw: 7.5, radiation: 60, cold: 60, dust: [0, 0], flare: [8, 12],
    briefing: 'An X-class flare floods the dome with radiation. Surge shielding, then recover the harvest.',
    objectives: [{ metric: 'health', op: '>=', value: 70, label: 'Plant health ≥ 70%' }, { metric: 'battery', op: '>=', value: 15, label: 'Battery ≥ 15%' }, { metric: 'pressure', op: '>=', value: 85, label: 'Dome pressure ≥ 85 kPa' }] },
]

export const FREEPLAY: Omit<Mission, 'days'> = { id: 'freeplay', rank: 'Free play', title: 'Bio-Dome outpost', emoji: '🧪', planet: '🔴 Mars', solar_kw: 7.5, radiation: 55, cold: 75, dust: [0, 0], flare: [0, 0], briefing: '', objectives: [] }

export interface OutpostState { health: number; battery: number; water: number; biomass: number; minBattery: number }
export interface DayTelemetry {
  day: number; health: number; battery: number; water: number; o2_kg_day: number; kcal: number; pressure_kpa: number
  solar_kw: number; demand_kw: number; radiation_damage: number; water_recovery_pct: number; brownout: boolean
  dust: boolean; flare: boolean; event: string | null
}
export interface ObjectiveResult extends Objective { actual: number; passed: boolean }

export const INITIAL_STATE: OutpostState = { health: 100, battery: 100, water: 100, biomass: 0, minBattery: 100 }

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const inWindow = (day: number, w: [number, number]) => w[1] > 0 && day >= w[0] && day <= w[1]
const round = (v: number, d = 0) => Math.round(v * 10 ** d) / 10 ** d

export const powerDemand = (a: Allocation) => SYSTEMS.reduce((s, k) => s + (DRAW_KW[k] * a[k]) / 100, 0)
export const solarOutput = (m: Pick<Mission, 'solar_kw' | 'dust'>, day: number) => m.solar_kw * (inWindow(day, m.dust) ? 0.3 : 1)

export function stepDay(m: Omit<Mission, 'days'> & { days: number }, st: OutpostState, alloc: Allocation, day: number): { state: OutpostState; tel: DayTelemetry } {
  const a = Object.fromEntries(SYSTEMS.map((k) => [k, clamp(alloc[k])])) as Allocation
  const dust = inWindow(day, m.dust), flare = inWindow(day, m.flare)
  const solar = solarOutput(m, day)
  const demand = powerDemand(a)
  const battery = clamp(st.battery + (solar - demand) * 2)
  const brownout = battery <= 0 && solar < demand
  const eff = Object.fromEntries(SYSTEMS.map((k) => [k, a[k] * (brownout ? 0.3 : 1)])) as Allocation

  const radiation = m.radiation * (flare ? 3 : 1)
  const radDamage = radiation * (1 - (0.92 * eff.shielding) / 100) * 0.07
  const coldDamage = Math.max(0, m.cold - eff.heating * 1.1) * 0.05
  const recovery = 45 + (50 * eff.water) / 100
  const water = clamp(st.water - 6 * (1 - recovery / 100) + (recovery > 80 ? 1 : 0))
  const thirst = Math.max(0, 30 - water) * 0.15
  const growth = 3.2 * (0.15 + (0.85 * eff.led) / 100) * (0.5 + (0.5 * water) / 100)
  const health = clamp(st.health + growth - radDamage - coldDamage - thirst)

  const maturity = Math.min(1, day / Math.max(1, m.days * 0.6))
  const biomass = st.biomass + (health / 100) * (0.2 + (0.8 * eff.led) / 100) * maturity
  const o2 = round(4.2 * (health / 100) * (0.4 + (0.6 * eff.led) / 100), 2)
  const kcal = Math.round(3000 * (health / 100) * (0.3 + (0.7 * eff.led) / 100) * maturity)
  const pressure = Math.min(101.3, round(101.3 - 18 * Math.max(0, 1 - o2 / CREW_O2_KG_DAY) - (flare && eff.shielding < 50 ? 4 : 0), 1))
  return {
    state: { health, battery, water, biomass, minBattery: Math.min(st.minBattery, battery) },
    tel: { day, health: round(health, 1), battery: round(battery, 1), water: round(water, 1), o2_kg_day: o2, kcal, pressure_kpa: pressure, solar_kw: round(solar, 2), demand_kw: round(demand, 2),
      radiation_damage: round(radDamage, 2), water_recovery_pct: Math.round(recovery), brownout, dust, flare, event: flare ? '☀️ Solar flare' : dust ? '🌪️ Dust storm' : null },
  }
}

export function gradeMission(m: Mission, st: OutpostState, last: DayTelemetry): { results: ObjectiveResult[]; passed: boolean } {
  const metrics = { health: last.health, battery: last.battery, water: last.water, pressure: last.pressure_kpa }
  const results = m.objectives.map((o) => {
    const v = o.metric === 'battery' && o.op === '>' ? st.minBattery : metrics[o.metric]
    return { ...o, actual: round(v, 1), passed: o.op === '>' ? v > o.value : v >= o.value }
  })
  return { results, passed: results.every((r) => r.passed) }
}

export function runSchedule(m: Omit<Mission, 'days'> & { days: number }, alloc: Allocation): { timeline: DayTelemetry[]; state: OutpostState } {
  let state = INITIAL_STATE
  const timeline: DayTelemetry[] = []
  for (let d = 1; d <= m.days; d++) { const r = stepDay(m, state, alloc, d); state = r.state; timeline.push(r.tel) }
  return { timeline, state }
}

const KEY = 'lbe.trainer.results'
export type MissionResults = Record<string, 'pass' | 'fail'>
export const loadResults = (): MissionResults => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} } }
export function saveResult(id: string, passed: boolean) {
  const r = loadResults()
  if (r[id] !== 'pass') r[id] = passed ? 'pass' : 'fail'
  try { localStorage.setItem(KEY, JSON.stringify(r)) } catch { /* ignore */ }
  window.dispatchEvent(new Event('lbe-trainer-results'))
}
