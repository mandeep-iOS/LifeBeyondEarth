import * as demo from './demo'
import { demoFailover, SQUAD, demoBiodomeExecute, demoEmergency, validateDirective } from './biodomeDemo'
import { demoMlInsights, demoMlPredict } from './mlDemo'
import type {
  FailoverOut, SquadMember, MlInsights, MlPrediction, BiodomeRun, Crisis, EmergencyOut, SpaceWeatherData, ExoplanetData, HistoryItem, HistoryRecord, MarsData, MemoryItem, MemoryRecord, OsdrData, Planet,
  Plant, PowerData, Prediction, RobotDecision, SimulateOut, SimulateRequest,
} from './types'

export const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export function getClientId(): string {
  let id = localStorage.getItem('lbe_client_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('lbe_client_id', id)
  }
  return id
}

export function getMissionKey(): string {
  let key = localStorage.getItem('lbe_mission_key')
  if (!key) {
    key = '1042'
    localStorage.setItem('lbe_mission_key', key)
  }
  return key
}

export function setMissionKeyStorage(key: string): void {
  localStorage.setItem('lbe_mission_key', key)
}

export type BackendStatus = 'checking' | 'live' | 'demo'
let status: BackendStatus = 'checking'
const listeners = new Set<() => void>()
export const getStatus = () => status
export const subscribeStatus = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
function setStatus(s: BackendStatus) {
  if (s !== status) { status = s; listeners.forEach((l) => l()) }
}

async function http<T>(path: string, init?: RequestInit, timeoutMs = 20000, includeMissionKey = true): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const headers: Record<string, string> = {}
    if (init?.body) {
      headers['Content-Type'] = 'application/json'
    }
    if (includeMissionKey) {
      headers['X-Mission-Key'] = getMissionKey()
    }
    const res = await fetch(BASE_URL + path, {
      ...init,
      signal: ctrl.signal,
      headers: { ...headers, ...(init?.headers as Record<string, string>) },
    })
    if (!res.ok) throw new HttpError(res.status, await res.text())
    return (await res.json()) as T
  } finally { clearTimeout(t) }
}
export class HttpError extends Error {
  constructor(public status: number, body: string) { super(`HTTP ${status}: ${body.slice(0, 200)}`) }
}

/** Try the backend; on network failure/5xx switch to demo mode and use the fallback. */
async function withFallback<T>(live: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    const v = await live()
    setStatus('live')
    return v
  } catch (e) {
    if (e instanceof HttpError && e.status < 500) throw e
    setStatus('demo')
    return fallback()
  }
}

export async function checkHealth(): Promise<BackendStatus> {
  try { await http('/health', undefined, 3000, false); setStatus('live') } catch { setStatus('demo') }
  return status
}

const q = (o: Record<string, string | number | boolean | undefined>) =>
  '?' + Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

export const api = {
  planets: () => withFallback(() => http<Planet[]>('/planets', undefined, 20000, false), () => demo.DEMO_PLANETS),
  plants: () => withFallback(() => http<Plant[]>('/plants', undefined, 20000, false), () => demo.DEMO_PLANTS),

  // Prediction never rejects: any failure (network, 4xx, 5xx) uses local math.
  predict: async (planet: string, plant: string, useMemory = true): Promise<Prediction> => {
    try {
      return await http<Prediction>('/predict', post({ planet, plant, client_id: getClientId(), use_memory: useMemory, planet_data: demo.customPlanet(planet) }))
    } catch {
      return demo.demoPredict(planet, plant, useMemory)
    }
  },

  simulate: (req: SimulateRequest) =>
    withFallback(
      () => http<SimulateOut>('/simulate', post({ health: 100, robot_energy: 100, days: 30, use_memory: true, planet_data: demo.customPlanet(req.planet), ...req, client_id: getClientId() })),
      () => demo.demoSimulate(req),
    ),

  robotDecide: (planet: string, health: number, robot_energy: number, useMemory = true) =>
    withFallback(
      () => http<RobotDecision>('/robot/decide', post({ planet, health, robot_energy, client_id: getClientId(), use_memory: useMemory, planet_data: demo.customPlanet(planet) })),
      () => demo.demoDecide(planet, health, robot_energy, useMemory),
    ),

  history: () =>
    withFallback(() => http<HistoryItem[]>('/history' + q({ client_id: getClientId(), limit: 500 })), () => demo.demoHistory()),
  saveHistory: (rec: HistoryRecord) =>
    withFallback(() => http<HistoryItem>('/history', post({ ...rec, client_id: getClientId() })), () => demo.demoAddHistory(rec)),

  memory: () =>
    withFallback(() => http<MemoryItem[]>('/memory' + q({ client_id: getClientId() })), () => demo.demoMemory()),
  saveMemory: (rec: MemoryRecord) =>
    withFallback(() => http<MemoryItem>('/memory', post({ ...rec, client_id: getClientId() })), () => demo.demoAddMemory(rec)),

  biodome: {
    squad: () => withFallback(() => http<{ squad: SquadMember[] }>('/biodome/squad', undefined, 20000, false).then((r) => r.squad), () => SQUAD),
    failover: (battery_pct: number, planet: string, crop: string, inside_health: number, outside_health: number, recharge = false) =>
      withFallback(
        () => http<FailoverOut>('/biodome/failover', post({ battery_pct, planet, crop, inside_health, outside_health, recharge })),
        () => demoFailover(battery_pct, planet, crop, inside_health, outside_health, recharge),
      ),
    execute: (directive: string, days = 10) => {
      const invalid = validateDirective(directive)
      if (invalid) return Promise.reject(new Error(invalid))
      return withFallback(() => http<BiodomeRun>('/biodome/execute', post({ directive, days })), () => demoBiodomeExecute(directive, days))
    },
    emergency: (planet: string, crop: string, crisis: Crisis, inside_health: number, outside_health: number) =>
      withFallback(
        () => http<EmergencyOut>('/biodome/emergency', post({ planet, crop, crisis, inside_health, outside_health }), 45000),
        () => demoEmergency(planet, crop, crisis, inside_health, outside_health),
      ),
  },

  ml: {
    insights: () => withFallback(() => http<MlInsights>('/ml/importance', undefined, 30000), demoMlInsights),
    predict: (planet: string, plant: string) =>
      withFallback(
        () => http<MlPrediction>('/ml/predict', post({ planet, plant, planet_data: demo.customPlanet(planet) }), 30000),
        () => {
          const p = demo.customPlanet(planet) ?? demo.find(demo.DEMO_PLANETS, planet), c = demo.find(demo.DEMO_PLANTS, plant)
          if (!p || !c) throw new Error('Unknown planet or plant')
          return demoMlPredict(p, c)
        },
      ),
  },

  nasa: {
    spaceWeather: () =>
      withFallback(() => http<SpaceWeatherData>('/nasa/space-weather', undefined, 45000, false), demo.demoSpaceWeather),
    power: (lat?: number, lon?: number) =>
      withFallback(() => http<PowerData>('/nasa/power' + q({ lat, lon }), undefined, 45000, false), demo.demoPower),
    exoplanets: (limit = 10) =>
      withFallback(() => http<ExoplanetData>('/nasa/exoplanets' + q({ limit }), undefined, 45000, false), demo.demoExoplanets),
    osdr: (term = 'plant spaceflight', limit = 6) =>
      withFallback(() => http<OsdrData>('/nasa/osdr' + q({ term, limit }), undefined, 45000, false), demo.demoOsdr),
    marsPhotos: (rover = 'curiosity', sol = 1000, limit = 12) =>
      withFallback(() => http<MarsData>('/nasa/mars-photos' + q({ rover, sol, limit }), undefined, 45000, false), demo.demoMars),
  },
}
