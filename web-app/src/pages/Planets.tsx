import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Droplets, Gauge, Radiation, Thermometer, Telescope, Sun, ArrowRight, ArrowLeft } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, type Exoplanet, type Planet } from '../api'
import { demoPower, registerPlanet } from '../api/demo'
import { useAsync } from '../hooks'
import { useApp } from '../state/AppState'
import { Badge, Button, Card, chartTooltip, Meter, PageHeader, SourceBadge, Spinner, Stat } from '../components/ui'
import { splitName } from '../lib'
import PlanetGlobe from '../components/PlanetGlobe'
import { InfoButton, CompactInfo } from '../components/InfoModal'
import { exoToPlanet as toPlanet, kToC, specFromExo, specFromPlanet, type PlanetSpec } from '../info'

const SITES = demoPower().analog_sites!

function TempBar({ label, value, color, min, max }: { label: string; value: number; color: string; min: number; max: number }) {
  const pct = Math.max(2, Math.min(100, ((value - min) / (max - min)) * 100))
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-400"><span>{label}</span><span>{value}°C</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}` }} /></div>
    </div>
  )
}

export default function PlanetsPage() {
  const { planets, planet, selectPlanet, loading, simulationState, setSimulationState, setCurrentRun, setChecklistProgress } = useApp()
  const navigate = useNavigate()
  const [siteIdx, setSiteIdx] = useState(0)
  const [exoSel, setExoSel] = useState<Exoplanet | null>(null)
  const [info, setInfo] = useState<PlanetSpec | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null)
  const site = SITES[siteIdx]
  const power = useAsync(() => api.nasa.power(site.lat, site.lon), [siteIdx])
  const exo = useAsync(() => api.nasa.exoplanets(12), [])

  const analogTemp = power.data?.summary?.avg_temp_c ?? site.avg_temp_c
  const analogSolar = power.data?.summary?.avg_solar_kwh_m2_day ?? site.solar_kwh_m2_day
  const analogPrecip = power.data?.summary?.avg_precip_mm_day ?? site.precip_mm_day
  const active = exoSel ? toPlanet(exoSel) : planet
  const compare = active ? [
    { name: splitName(active.name).label, value: active.temperature, fill: '#bf5af2' },
    { name: 'Earth analog', value: analogTemp, fill: '#30d158' },
  ] : []

  const handlePlanetSelect = (p: Planet) => {
    if (simulationState === 'running') {
      alert('Simulation in progress — Pause or Stop current run before changing parameters.')
      return
    }
    if (simulationState === 'paused') {
      setSelectedPlanet(p)
      setConfirmDialogOpen(true)
      return
    }
    selectPlanet(p)
    setExoSel(null)
    setChecklistProgress(prev => ({ ...prev, destinationSelected: true }))
  }

  const handleConfirmDialog = (confirm: boolean) => {
    setConfirmDialogOpen(false)
    if (confirm && selectedPlanet) {
      selectPlanet(selectedPlanet)
      setExoSel(null)
      setSimulationState('idle')
      setCurrentRun(null)
      setChecklistProgress(p => ({ ...p, destinationSelected: true }))
    }
    setSelectedPlanet(null)
  }

  const launch = (e: Exoplanet) => {
    const p = toPlanet(e)
    registerPlanet(p)
    selectPlanet(p)
    navigate('/prep')
  }
  const exoTemp = exoSel ? kToC(exoSel.equilibrium_temp_k) : 0
  const barMin = Math.min(exoTemp, analogTemp, 0), barMax = Math.max(exoTemp, analogTemp, 40)

  if (loading) return <Spinner />
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link to="/"><button className="glass rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10"><ArrowLeft size={16} /> Back</button></Link>
      </div>
      
      {planet && !exoSel && (
        <Card tone="blue" className="space-y-4 rounded-2xl bg-gradient-to-br from-ios-blue/20 to-ios-blue/5 border border-ios-blue/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><PlanetGlobe name={planet.name} size={96} speed={1.5} /><h2 className="text-2xl font-bold">{splitName(planet.name).label}</h2></div>
            <div />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={<Thermometer size={14} />} label="Temperature" value={`${planet.temperature}°C`} tone="orange" />
            <Stat icon={<Droplets size={14} />} label="Water" value={planet.water_available ? 'Available' : 'None'} tone={planet.water_available ? 'green' : 'red'} />
            <Stat icon={<Gauge size={14} />} label="Pressure" value={`${planet.pressure} kPa`} tone="blue" />
            <Stat icon={<Radiation size={14} />} label="Radiation" value={`${planet.radiation}/100`} tone="purple" />
          </div>
          <Meter value={planet.radiation} tone={planet.radiation > 70 ? 'red' : planet.radiation > 40 ? 'orange' : 'green'} label="Radiation level" />
          <div className="pt-2 border-t border-ios-blue/30">
            <div className="text-xs font-semibold text-ios-blue mb-3">Choose Your Crop or Plant</div>
            <Link to="/plants"><Button className="w-full"><span className="flex-1">Next Step</span> <ArrowRight size={16} /></Button></Link>
          </div>
        </Card>
      )}

      <PageHeader title="Planets" subtitle="Pick a destination — stats come from the mission catalog." />
      {simulationState === 'running' && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-200">
          <strong>Simulation in progress</strong> — Pause or Stop current run before changing parameters.
        </div>
      )}
      <div className="space-y-8">
        {/* Section 1: Survival & Outpost Candidates */}
        <section className="space-y-3">
          <div>
            <h2 className="mb-1 text-lg font-semibold">Section 1: Survival & Outpost Candidates</h2>
            <p className="text-sm text-gray-400">Destinations for comparative survival research, robotics testing, and controlled habitat development.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {planets.filter(p => ['🌍 Earth', '🌙 Moon', '🔴 Mars'].includes(p.name)).map((p) => {
              const { label } = splitName(p.name)
              const spec = specFromPlanet(p)
              return (
                <Card key={p.name} active={planet?.name === p.name} onClick={() => handlePlanetSelect(p)} className={simulationState === 'running' ? 'opacity-50 cursor-not-allowed' : ''}>
                  <div className="flex items-start justify-between"><PlanetGlobe name={p.name} size={56} /><InfoButton onOpen={() => setInfo(spec)} /></div>
                  <div className="mt-2 font-semibold">{label}</div>
                  {spec.category && <div className="text-xs font-medium text-ios-blue mb-1">{spec.category}</div>}
                  <div className="text-xs text-gray-400">{p.temperature}°C · {p.water_available ? 'water' : 'dry'}</div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Section 3: Extreme & Uninhabitable Worlds */}
        <section className="space-y-3">
          <div>
            <h2 className="mb-1 text-lg font-semibold">Section 3: Extreme & Uninhabitable Worlds</h2>
            <p className="text-sm text-gray-400">Probe, environmental modeling, hardware-stress, and prediction research targets. Not habitable survival destinations.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {planets.filter(p => !['🌍 Earth', '🌙 Moon', '🔴 Mars'].includes(p.name)).map((p) => {
              const { label } = splitName(p.name)
              const spec = specFromPlanet(p)
              const isGasGiant = ['🟤 Jupiter', '🪐 Saturn', '🔵 Uranus', '🔷 Neptune'].includes(p.name)
              return (
                <Card key={p.name} active={planet?.name === p.name} onClick={() => handlePlanetSelect(p)} className={simulationState === 'running' ? 'opacity-50 cursor-not-allowed' : ''}>
                  <div className="flex items-start justify-between"><PlanetGlobe name={p.name} size={56} /><InfoButton onOpen={() => setInfo(spec)} /></div>
                  <div className="mt-2 font-semibold">{label}</div>
                  {isGasGiant && <div className="text-xs font-medium text-ios-red mb-1">Uninhabitable</div>}
                  {spec.category && <div className="text-xs font-medium text-ios-orange mb-1">{spec.category}</div>}
                  <div className="text-xs text-gray-400">{p.temperature}°C · {p.water_available ? 'water' : 'dry'}</div>
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

      {exoSel && (
        <Card tone="purple" className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">🔭 {exoSel.name}</h2><div className="flex gap-2"><Button onClick={() => launch(exoSel)}>Launch Mission Prep <ArrowRight size={16} /></Button><Button variant="ghost" onClick={() => setExoSel(null)}>Back to catalog</Button></div></div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={<Thermometer size={14} />} label="Equilibrium temp" value={`${kToC(exoSel.equilibrium_temp_k)}°C (${exoSel.equilibrium_temp_k} K)`} tone="orange" />
            <Stat label="Radius" value={`${exoSel.radius_earth} R⊕`} />
            <Stat label="Orbit" value={exoSel.orbit_au != null ? `${exoSel.orbit_au} AU` : '—'} tone="purple" />
            <Stat label="Host star · discovered" value={`${exoSel.host} · ${exoSel.discovery_year}`} tone="green" />
          </div>
          <div className="space-y-3 rounded-xl bg-white/5 p-3">
            <div className="text-sm font-semibold">Earth analog (NASA POWER · {site.name}) vs {exoSel.name}</div>
            <TempBar label={`Earth analog · ${site.name}`} value={analogTemp} color="#30d158" min={barMin} max={barMax} />
            <TempBar label={exoSel.name} value={exoTemp} color="#bf5af2" min={barMin} max={barMax} />
            <p className="text-xs text-gray-300">{exoSel.name} is <b>{Math.abs(exoTemp - analogTemp)}°C {exoTemp < analogTemp ? 'colder' : 'hotter'}</b> than the Earth analog.</p>
          </div>
          <p className="text-xs text-gray-400">Simulation uses NASA Exoplanet Archive equilibrium temperature; pressure and radiation are estimated from planet radius.</p>
        </Card>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><Telescope size={20} className="text-ios-purple" /> Section 2: Distant Habitable-Zone Exoplanet Research</h2>
          <p className="text-sm text-gray-400">Astronomical research targets. Not currently reachable. Habitable-zone classification indicates potential for liquid water; it does not prove habitability or human survivability.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {exo.loading ? <Badge tone="gray">…</Badge> : <SourceBadge source={exo.data?.source} />}
        </div>
        {exo.loading ? <Spinner /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exo.data?.planets.map((e) => (
              <Card key={e.name} tone="purple" active={exoSel?.name === e.name} onClick={() => setExoSel(e)}>
                <div className="flex items-center justify-between gap-2"><span className="font-semibold">{e.name}</span><InfoButton onOpen={() => setInfo(specFromExo(e))} /></div>
                <div className="text-xs text-gray-400">{e.host} · {kToC(e.equilibrium_temp_k)}°C · {e.radius_earth} R⊕</div>
                <div className="mt-1 text-xs text-ios-purple">Select to simulate →</div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Sun size={20} className="text-ios-yellow" /> NASA POWER · Earth analog comparison</h2>
          {power.loading ? <Badge tone="gray">…</Badge> : <SourceBadge source={power.data?.source} />}
        </div>
        <div className="flex flex-wrap gap-2">
          {SITES.map((s, i) => (
            <button key={s.name} onClick={() => setSiteIdx(i)} className={`rounded-full px-4 py-2 text-xs font-semibold transition border-2 ${i === siteIdx ? 'bg-ios-yellow text-gray-900 border-ios-yellow shadow-lg shadow-ios-yellow/30' : 'bg-white/5 text-gray-300 border-white/15 hover:bg-white/10 hover:border-white/25'}`}>{s.name}</button>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3">
            <div className="text-sm text-gray-400">Analog for: {site.analog_for}</div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Avg temp" value={`${analogTemp}°C`} tone="orange" />
              <Stat label="Solar" value={`${analogSolar} kWh/m²/d`} tone="blue" />
              <Stat label="Precip" value={`${analogPrecip} mm/d`} tone="green" />
            </div>
            {planet && <p className="text-sm text-gray-300">{splitName(planet.name).label} is <b>{Math.abs(planet.temperature - analogTemp).toFixed(0)}°C {planet.temperature < analogTemp ? 'colder' : 'hotter'}</b> than {site.name}.</p>}
          </Card>
          <Card>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={compare}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} /><YAxis stroke="#9ca3af" fontSize={12} unit="°" />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>{compare.map((c) => <Cell key={c.name} fill={c.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </section>
      {info && <CompactInfo title={info.label} to={`/planets/${info.id}`} onClose={() => setInfo(null)} />}
    </div>
  )
}
