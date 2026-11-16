import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Droplets, Radiation, Snowflake } from 'lucide-react'
import { useApp } from '../state/AppState'
import { Card, Meter, Spinner } from '../components/ui'
import { splitName } from '../lib'
import { InfoButton, CompactInfo } from '../components/InfoModal'
import { slug, plantCategory } from '../info'
import type { Plant } from '../api'

export default function PlantsPage() {
  const { plants, plant, selectPlant, loading, simulationState, setSimulationState, setCurrentRun, setChecklistProgress } = useApp()
  const [info, setInfo] = useState<Plant | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)

  const handlePlantSelect = (p: Plant) => {
    if (simulationState === 'running') {
      alert('Simulation in progress — Pause or Stop current run before changing parameters.')
      return
    }
    if (simulationState === 'paused') {
      setSelectedPlant(p)
      setConfirmDialogOpen(true)
      return
    }
    selectPlant(p)
    setChecklistProgress(c => ({ ...c, cropsSelected: true }))
  }

  const handleConfirmDialog = (confirm: boolean) => {
    setConfirmDialogOpen(false)
    if (confirm && selectedPlant) {
      selectPlant(selectedPlant)
      setSimulationState('idle')
      setCurrentRun(null)
      setChecklistProgress(c => ({ ...c, cropsSelected: true }))
    }
    setSelectedPlant(null)
  }

  if (loading) return <Spinner />
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link to="/planets"><button className="glass rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10"><ArrowLeft size={16} /> Back</button></Link>
      </div>

      {simulationState === 'running' && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-200">
          <strong>Simulation in progress</strong> — Pause or Stop current run before changing parameters.
        </div>
      )}

      {plant && (
        <Card tone="green" className="space-y-4 rounded-2xl bg-gradient-to-br from-ios-green/20 to-ios-green/5 border border-ios-green/40">
          <div className="space-y-2 pb-4 border-b border-ios-green/30">
            <h2 className="text-2xl font-bold">Bio-regeneration Crops</h2>
            <p className="text-sm text-gray-400">Pick a crop — check its cold, water and radiation limits.</p>
            <p className="text-xs font-semibold text-ios-purple">Mission Prep</p>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-6xl">{splitName(plant.name).emoji}</div>
              <div>
                <h2 className="text-2xl font-bold">{splitName(plant.name).label}</h2>
                <div className="text-xs font-medium text-green-500 mt-1">{plantCategory(plant.name).category}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><div className="text-xs text-gray-400">Cold tolerance</div><div className="mt-1 font-semibold">{plant.cold_tolerance}°C</div></div>
            <div><div className="text-xs text-gray-400">Water need</div><div className="mt-1 font-semibold">{plant.water_need}%</div></div>
            <div><div className="text-xs text-gray-400">Radiation tol.</div><div className="mt-1 font-semibold">{plant.radiation_tolerance}/100</div></div>
          </div>
          <div className="pt-2 border-t border-ios-green/30">
            <div className="text-xs font-semibold text-green-500 mb-3">Next Step</div>
            <Link to="/prep" className="block w-full"><button className="w-full rounded-lg bg-ios-green hover:bg-ios-green/90 text-white font-medium py-2 px-4 flex items-center justify-between gap-2"><span>Prepare Mission</span> <ArrowRight size={16} /></button></Link>
          </div>
        </Card>
      )}

      <div className="space-y-8">
        {/* Category 1: Outside-Dome / Boundary-Trial Eligible */}
        <section className="space-y-3">
          <div>
            <h2 className="mb-1 text-lg font-semibold">Category 1: Outside-Dome / Boundary-Trial Eligible</h2>
            <p className="text-sm text-gray-400">Candidates for controlled environmental-boundary experiments after appropriate shielding, pressure, temperature, and exposure controls are established. Experimental research consideration only; not proven survival.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plants.filter(p => ['🌵 Cactus', '🌿 Moss', '🌱 Grass'].includes(p.name)).map((p) => {
              const { emoji, label } = splitName(p.name)
              const { category } = plantCategory(p.name)
              return (
                <Card key={p.name} tone="blue" active={plant?.name === p.name} onClick={() => handlePlantSelect(p)} className={`space-y-3 ${simulationState === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="flex items-start justify-between"><div className="text-5xl">{emoji}</div><InfoButton onOpen={() => setInfo(p)} /></div>
                  <div className="text-xl font-bold">{label}</div>
                  <div className="text-xs font-medium text-ios-blue mb-1">{category}</div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2"><Snowflake size={14} className="text-ios-blue" /> Survives down to <b>{p.cold_tolerance}°C</b></div>
                    <div><div className="mb-1 flex items-center gap-2"><Droplets size={14} className="text-ios-blue" /> Water need</div><Meter value={p.water_need} tone={p.water_need > 70 ? 'red' : p.water_need > 40 ? 'orange' : 'green'} /></div>
                    <div><div className="mb-1 flex items-center gap-2"><Radiation size={14} className="text-ios-purple" /> Radiation tolerance</div><Meter value={p.radiation_tolerance} tone={p.radiation_tolerance > 40 ? 'green' : p.radiation_tolerance > 20 ? 'orange' : 'red'} /></div>
                  </div>
                  {plant?.name === p.name && <div className="text-xs font-semibold text-ios-green">✓ Selected</div>}
                </Card>
              )
            })}
          </div>
        </section>

        {/* Category 2: Pressurized Bio-Dome / Indoor Farmhouse Required */}
        <section className="space-y-3">
          <div>
            <h2 className="mb-1 text-lg font-semibold">Category 2: Pressurized Bio-Dome / Indoor Farmhouse Required</h2>
            <p className="text-sm text-gray-400">Require controlled cultivation conditions within a protected growing environment. Researched indoors.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {plants.filter(p => !['🌵 Cactus', '🌿 Moss', '🌱 Grass'].includes(p.name)).map((p) => {
              const { emoji, label } = splitName(p.name)
              const { category } = plantCategory(p.name)
              return (
                <Card key={p.name} tone="green" active={plant?.name === p.name} onClick={() => handlePlantSelect(p)} className={`space-y-3 ${simulationState === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="flex items-start justify-between"><div className="text-5xl">{emoji}</div><InfoButton onOpen={() => setInfo(p)} /></div>
                  <div className="text-xl font-bold">{label}</div>
                  <div className="text-xs font-medium text-ios-green mb-1">{category}</div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2"><Snowflake size={14} className="text-ios-blue" /> Survives down to <b>{p.cold_tolerance}°C</b></div>
                    <div><div className="mb-1 flex items-center gap-2"><Droplets size={14} className="text-ios-blue" /> Water need</div><Meter value={p.water_need} tone={p.water_need > 70 ? 'red' : p.water_need > 40 ? 'orange' : 'green'} /></div>
                    <div><div className="mb-1 flex items-center gap-2"><Radiation size={14} className="text-ios-purple" /> Radiation tolerance</div><Meter value={p.radiation_tolerance} tone={p.radiation_tolerance > 40 ? 'green' : p.radiation_tolerance > 20 ? 'orange' : 'red'} /></div>
                  </div>
                  {plant?.name === p.name && <div className="text-xs font-semibold text-ios-green">✓ Selected</div>}
                </Card>
              )
            })}
          </div>
        </section>
      </div>

      {confirmDialogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-gray-900 border border-white/10 p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-3">Stop current run?</h3>
            <p className="text-sm text-gray-300 mb-6">Changing parameters will stop the current run. Do you want to continue?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => handleConfirmDialog(false)} className="glass rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/10">
                Cancel
              </button>
              <button onClick={() => handleConfirmDialog(true)} className="rounded-lg bg-ios-blue px-4 py-2 text-sm font-medium text-white hover:bg-ios-blue/90">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {info && <CompactInfo title={`${splitName(info.name).emoji} ${splitName(info.name).label}`} to={`/plants/${slug(splitName(info.name).label)}`} onClose={() => setInfo(null)} />}
    </div>
  )
}
