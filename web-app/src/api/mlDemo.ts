import type { MlInsights, MlPrediction, Planet, Plant } from './types'

const FEATURES = [
  'Planet temperature', 'Atmospheric pressure', 'Radiation level', 'Water available', 'Plant cold tolerance',
  'Plant water need', 'Plant radiation tolerance', 'Temperature margin', 'Radiation margin',
]

const featurize = (p: Planet, c: Plant) => [
  p.temperature, Math.log10(1 + Math.max(p.pressure, 0)), p.radiation, p.water_available ? 1 : 0,
  c.cold_tolerance, c.water_need, c.radiation_tolerance, p.temperature - c.cold_tolerance, c.radiation_tolerance - p.radiation,
]

export function physicsScore(p: Planet, c: Plant): number {
  let s = 100
  if (p.temperature < c.cold_tolerance) s -= 25
  if (p.radiation > c.radiation_tolerance) s -= 30
  if (!p.water_available) s -= Math.floor(c.water_need / 2)
  return Math.max(0, Math.min(100, s))
}

function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
}

/** Solves (A) x = b with Gauss-Jordan elimination. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((r, i) => [...r, b[i]])
  for (let i = 0; i < n; i++) {
    let piv = i
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[piv][i])) piv = r
    ;[M[i], M[piv]] = [M[piv], M[i]]
    for (let r = 0; r < n; r++) {
      if (r === i) continue
      const f = M[r][i] / M[i][i]
      for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]
    }
  }
  return M.map((r, i) => r[n] / r[i])
}

interface Model { mean: number[]; std: number[]; w: number[]; insights: MlInsights }
let cached: Model | null = null

const predictRaw = (m: { mean: number[]; std: number[]; w: number[] }, x: number[]) =>
  m.w[0] + x.reduce((a, v, i) => a + m.w[i + 1] * ((v - m.mean[i]) / m.std[i]), 0)

function train(): Model {
  const rand = rng(42)
  const X: number[][] = [], y: number[] = []
  for (let i = 0; i < 1500; i++) {
    const p: Planet = { name: 's', temperature: Math.round(-230 + rand() * 290), pressure: 10 ** (-3 + rand() * 6), radiation: Math.round(rand() * 100), water_available: rand() > 0.5 }
    const c: Plant = { name: 's', cold_tolerance: Math.round(-35 + rand() * 45), water_need: Math.round(10 + rand() * 89), radiation_tolerance: Math.round(5 + rand() * 55) }
    X.push(featurize(p, c)); y.push(physicsScore(p, c))
  }
  const d = FEATURES.length
  const mean = FEATURES.map((_, j) => X.reduce((a, r) => a + r[j], 0) / X.length)
  const std = FEATURES.map((_, j) => Math.sqrt(X.reduce((a, r) => a + (r[j] - mean[j]) ** 2, 0) / X.length) || 1)
  const split = Math.floor(X.length * 0.8)
  const Z = X.map((r) => [1, ...r.map((v, j) => (v - mean[j]) / std[j])])
  const A = Array.from({ length: d + 1 }, (_, i) => Array.from({ length: d + 1 }, (_, j) => (i === j && i > 0 ? 1 : 0)))
  const b = new Array(d + 1).fill(0)
  for (let k = 0; k < split; k++) for (let i = 0; i <= d; i++) { b[i] += Z[k][i] * y[k]; for (let j = 0; j <= d; j++) A[i][j] += Z[k][i] * Z[k][j] }
  const w = solve(A, b)
  const base = { mean, std, w }
  const test = X.slice(split), ty = y.slice(split)
  const clip = (v: number) => Math.max(0, Math.min(100, v))
  const mae = (rows: number[][]) => rows.reduce((a, r, i) => a + Math.abs(clip(predictRaw(base, r)) - ty[i]), 0) / rows.length
  const ym = ty.reduce((a, v) => a + v, 0) / ty.length
  const sst = ty.reduce((a, v) => a + (v - ym) ** 2, 0)
  const sse = test.reduce((a, r, i) => a + (clip(predictRaw(base, r)) - ty[i]) ** 2, 0)
  const baseMae = mae(test)
  const raw = FEATURES.map((_, j) => {
    const shuffled = test.map((r) => [...r])
    const col = shuffled.map((r) => r[j]).reverse()
    shuffled.forEach((r, i) => { r[j] = col[(i + 7) % col.length] })
    return Math.max(0, mae(shuffled) - baseMae)
  })
  const total = raw.reduce((a, v) => a + v, 0) || 1
  const importances = FEATURES.map((feature, j) => ({ feature, importance: +(raw[j] / total).toFixed(4) })).sort((a, b) => b.importance - a.importance)
  return { ...base, insights: { model_name: 'Ridge (in-browser demo)', r2: +(1 - sse / sst).toFixed(4), mae: +baseMae.toFixed(2), samples: X.length, history_samples: 0, importances } }
}

const model = () => (cached ??= train())

export const demoMlInsights = (): MlInsights => model().insights

export function demoMlPredict(planet: Planet, plant: Plant): MlPrediction {
  const m = model()
  const { samples: _s, history_samples: _h, ...rest } = m.insights
  void _s; void _h
  return { ...rest, planet: planet.name, plant: plant.name, predicted_score: Math.round(Math.max(0, Math.min(100, predictRaw(m, featurize(planet, plant))))) }
}
