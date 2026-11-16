import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react'
import { api } from '../api'
import { useApp } from '../state/AppState'
import { Badge, Card, Meter, ScoreRing, Spinner, StatusPill, statusFor } from '../components/ui'
import { scoreTone, splitName, type Tone } from '../lib'
import PlanetGlobe from '../components/PlanetGlobe'
import MlPanel from '../components/MlPanel'

const factorTone: Record<string, Tone> = { ok: 'green', threat: 'red', boost: 'blue' }

/** Normalize backend response text: replace "Robot Memory"/"SI" with "Mission Memory" */
const normalizeText = (text: string): string => {
  return text
    .replace(/Why SI selected/g, 'Why Mission Memory selected')
    .replace(/SI improved decision/g, 'Mission Memory improved decision')
    .replace(/SI used environmental/g, 'Mission Memory used environmental')
    .replace(/Robot Memory/g, 'Mission Memory')
}

export default function MissionPrepPage() {
  const { planet, plant, prediction, setPrediction, setChecklistProgress } = useApp()
  const [busy, setBusy] = useState(false)
  const [useMemory, setUseMemory] = useState(true)

  useEffect(() => {
    if (!planet || !plant) return
    let live = true
    setBusy(true)
    api.predict(planet.name, plant.name, useMemory).then((p) => {
      if (live) {
        setPrediction(p)
        setChecklistProgress(prev => ({ ...prev, prepCompleted: true }))
      }
    }).finally(() => live && setBusy(false))
    return () => { live = false }
  }, [planet, plant, useMemory, setPrediction, setChecklistProgress])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/plants"><button className="glass rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10"><ArrowLeft size={16} /> Back</button></Link>
      </div>
      
      {/* Top action section */}
      <Link to="/simulation" aria-disabled={!planet || !plant} className={`next-step group flex items-center justify-between gap-4 rounded-2xl p-5 ${!planet || !plant ? 'pointer-events-none opacity-40' : ''}`}>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ios-blue">Next Step · 05 Simulation</div>
          <div className="mt-0.5 text-lg font-bold">Launch the mission</div>
          <div className="text-sm text-gray-400">Watch your outpost survive day by day.</div>
        </div>
        <span className="flex items-center gap-2 rounded-xl bg-ios-blue px-4 py-2 text-sm font-semibold glow-blue transition group-hover:translate-x-1">Next Step <ArrowRight size={16} /></span>
      </Link>
      
      <div className="space-y-3">
        <h2 className="text-3xl font-bold">Mission Prep</h2>
        <p className="text-sm text-gray-400">Pair a world and a crop — Mission Memory predicts survival.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card tone="blue" className="rounded-2xl bg-gradient-to-br from-ios-blue/20 to-ios-blue/5 border border-ios-blue/40"><div className="mb-3 flex items-center gap-3 text-sm font-semibold text-ios-blue">{planet && <PlanetGlobe name={planet.name} size={72} speed={1.5} />}<span>Selected Planet</span></div>
          {planet ? (
            <div className="space-y-3">
              <div className="text-lg font-bold">{splitName(planet.name).label}</div>
              <div className="text-xs text-gray-400">{planet.temperature}°C · {planet.water_available ? 'water' : 'dry'}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Select a planet to continue</div>
          )}
        </Card>
        <Card tone="green" className="rounded-2xl bg-gradient-to-br from-ios-green/20 to-ios-green/5 border border-ios-green/40"><div className="mb-2 text-sm font-semibold text-ios-green">Selected Plant</div>
          {plant ? (
            <div className="space-y-3">
              <div className="text-lg font-bold flex items-center gap-2"><span className="text-4xl">{splitName(plant.name).emoji}</span>{splitName(plant.name).label}</div>
              <div className="text-xs text-gray-400">{plant.cold_tolerance}°C tolerance · {plant.water_need}% water</div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Select a plant to continue</div>
          )}
        </Card>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" checked={useMemory} onChange={(e) => setUseMemory(e.target.checked)} className="accent-ios-purple" />
        <Brain size={14} className="text-ios-purple" /> {useMemory ? 'Mission Memory Selection for prediction' : 'Use Mission Memory in prediction'}
      </label>

      {busy && <Spinner label="Analyzing mission…" />}
      {prediction && (
        <>
          <div className={`grid gap-4 lg:grid-cols-3 ${busy ? 'opacity-60' : ''} transition-opacity`}>
            <Card tone={scoreTone(prediction.survival_prediction)} className={`flex flex-col items-center gap-4 transition-all ${!useMemory ? 'opacity-45 grayscale pointer-events-none' : 'border border-white/60 ring-1 ring-white/40 shadow-[0_0_24px_rgba(255,255,255,0.12)]'}`}>
              <div className="flex items-center gap-1 text-sm font-semibold text-gray-300"><Sparkles size={14} /> Mission Memory Survival Prediction</div>
              <ScoreRing value={useMemory ? prediction.survival_prediction : 0} tone={scoreTone(useMemory ? prediction.survival_prediction : 0)} label="survival" />
              <StatusPill level={statusFor(useMemory ? prediction.survival_prediction : 0)} />
              <div className="flex flex-wrap justify-center gap-2"><Badge tone={scoreTone(useMemory ? prediction.survival_prediction : 0)}>{useMemory ? prediction.risk_level : '🔘 Disabled'}</Badge><Badge tone="purple">{prediction.main_threat}</Badge></div>
              <div className="w-full"><Meter value={useMemory ? prediction.confidence : 0} tone="blue" label="Mission Memory confidence" /></div>
            </Card>

            <Card className="space-y-3 lg:col-span-2">
              <div className="font-semibold">Per-factor breakdown <span className="text-xs font-normal text-gray-400">(score starts at 100)</span></div>
              {prediction.factors?.map((f) => {
                const isMissionMemory = f.name === 'Mission Memory' || normalizeText(f.name) === 'Mission Memory'
                // Hide Mission Memory row when unchecked
                if (isMissionMemory && !useMemory) return null
                return (
                <div key={f.name} className="rounded-xl bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{normalizeText(f.name)}</div>
                    <Badge tone={factorTone[f.status] ?? 'gray'}>{f.impact > 0 ? `+${f.impact}` : f.impact} pts</Badge>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">Planet: {f.planet_value} · Plant limit: {f.plant_limit}</div>
                  <div className="mt-2"><Meter value={Math.abs(f.impact) * (Math.abs(f.impact) <= 30 ? 3.3 : 1)} tone={factorTone[f.status] ?? 'gray'} /></div>
                </div>
              )})}
              {prediction.explanation && useMemory && (
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="mb-2 text-sm font-semibold text-ios-purple">{normalizeText(prediction.explanation.title)}</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {prediction.explanation.points.map((pt, i) => <pre key={i} className="whitespace-pre-wrap font-sans text-xs text-gray-300">{normalizeText(pt).replace(/\n(?=[A-Za-z0-9-])/g, ' ').replace(/:\s/g, ': ')}</pre>)}
                  </div>
                </div>
              )}
              {planet && plant && <div className="text-xs text-gray-500">{splitName(plant.name).label} on {splitName(planet.name).label}</div>}
            </Card>
          </div>
          {useMemory && <MlPanel planet={planet?.name} plant={plant?.name} />}
        </>
      )}
    </div>
  )
}
