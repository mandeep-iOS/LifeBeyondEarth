import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Rocket, Satellite, Telescope, Dna, Camera, Sun, Zap, Sprout, Plus, ChevronRight } from 'lucide-react'
import { api } from '../api'
import { useAsync } from '../hooks'
import { useApp } from '../state/AppState'
import { Badge, Button, Card, SourceBadge, Spinner } from '../components/ui'
import { splitName } from '../lib'
import PlanetGlobe from '../components/PlanetGlobe'
import MissionCards from '../components/MissionCards'
// import MissionChecklist from '../components/MissionChecklist'
import DeepSpaceBackdrop from '../components/DeepSpaceBackdrop'

export default function HomePage() {
  const { planets, plants, planet, plant } = useApp()
  const nav = useNavigate()
  const [launchExpanded, setLaunchExpanded] = useState(false)
  const power = useAsync(() => api.nasa.power(), [])
  const exo = useAsync(() => api.nasa.exoplanets(5), [])
  const osdr = useAsync(() => api.nasa.osdr('plant spaceflight', 4), [])
  const mars = useAsync(() => api.nasa.marsPhotos(), [])
  const weather = useAsync(() => api.nasa.spaceWeather(), [])
  const feeds = [
    { icon: Sun, name: 'NASA POWER', d: power, desc: power.data?.summary?.avg_temp_c != null ? `Atacama avg ${power.data.summary.avg_temp_c}°C · ${power.data.summary.avg_solar_kwh_m2_day} kWh/m²/day` : 'Earth analog climate sites' },
    { icon: Telescope, name: 'Exoplanet Archive', d: exo, desc: exo.data ? `${exo.data.count} habitable-zone candidates` : '' },
    { icon: Dna, name: 'GeneLab OSDR', d: osdr, desc: osdr.data ? `${osdr.data.count} plant-in-space studies` : '' },
    { icon: Zap, name: 'DONKI Space Weather', d: weather, desc: weather.data ? `${weather.data.count} alerts · threat ${weather.data.threat_level}` : '' },
    { icon: Camera, name: 'Mars Rover Photos', d: mars, desc: mars.data ? `${mars.data.count} photo(s) from ${mars.data.photos[0]?.rover ?? 'Curiosity'}` : '' },
  ]
  return (
    <div className="space-y-8">
      <section className="glass relative overflow-hidden rounded-3xl p-8 sm:p-12">
        <DeepSpaceBackdrop />
        <div className="pointer-events-none absolute -right-10 -top-10 hidden select-none sm:block" style={{ width: 320, height: 320 }}>
          <div className="hero-orbit" style={{ inset: -30 }} />
          <div className="hero-orbit" style={{ inset: -60, animationDuration: '70s', animationDirection: 'reverse' }} />
          <div className="absolute inset-6 rounded-full" style={{ boxShadow: '0 0 60px 8px rgb(255 130 80 / .35), inset 0 0 30px rgb(255 190 150 / .35)' }} />
          <div className="animate-float absolute inset-0 flex items-center justify-center"><PlanetGlobe name={planet?.name ?? 'Mars'} size={260} speed={4.4} /></div>
        </div>
        <Badge tone="purple" className="relative mb-4"><Satellite size={12} /> Mission Control</Badge>
        <h1 className="relative max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl text-glow">Can life survive beyond Earth?</h1>
        <p className="relative mt-3 max-w-xl text-gray-300">Pair a planet with a plant, let the SI predict survival, then watch the robot caretaker fight to keep your biosphere alive — day by day.</p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setLaunchExpanded(!launchExpanded)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ios-blue text-white font-medium hover:bg-ios-blue/90 transition"
          >
            <Rocket size={16} /> Launch Mission <ChevronRight size={16} className={`transition ${launchExpanded ? 'rotate-90' : ''}`} />
          </button>
          {!launchExpanded && (
            <>
              <Link to="/biodome"><Button variant="ghost">Bio-Dome Lab</Button></Link>
              <Link to="/planets"><Button variant="ghost">Explore Planets</Button></Link>
            </>
          )}
        </div>

        {launchExpanded && (
          <div className="relative mt-4 space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-gray-300 mb-3">Choose your mission path:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => nav('/planets')}
                className="p-4 rounded-lg bg-white/5 border border-ios-blue/50 hover:bg-ios-blue/10 transition text-left"
              >
                <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                  <Telescope size={16} className="text-ios-blue" />
                  Explore & Setup
                </div>
                <div className="text-xs text-gray-400">Browse planets and crops, review predictions.</div>
              </button>
              <button
                onClick={() => {
                  if (!planet || !plant) {
                    alert('Please select a planet and crop first on the Explore page.')
                  } else {
                    nav('/simulation')
                  }
                }}
                className="p-4 rounded-lg bg-white/5 border border-ios-green/50 hover:bg-ios-green/10 transition text-left"
              >
                <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                  <Rocket size={16} className="text-ios-green" />
                  Direct Launch
                </div>
                <div className="text-xs text-gray-400">Skip prep, jump straight to simulation.</div>
              </button>
            </div>
            <button
              onClick={() => setLaunchExpanded(false)}
              className="w-full text-sm text-gray-400 hover:text-gray-300 py-2"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-ios-blue/40 bg-gradient-to-br from-ios-blue/20 to-ios-blue/5 p-4 min-h-32"><div className="space-y-2 h-full flex flex-col"><div className="text-xs font-semibold text-ios-blue uppercase tracking-wide">Planets</div><div className="flex-1 flex items-center"><div className="text-4xl font-bold text-white">{planets.length}</div></div><div className="text-xs text-gray-400">candidates explored</div></div></Card>
        <Card tone="green" className="rounded-2xl border border-ios-green/40 bg-gradient-to-br from-ios-green/20 to-ios-green/5 p-4 min-h-32"><div className="space-y-2 h-full flex flex-col"><div className="text-xs font-semibold text-ios-green uppercase tracking-wide">Plants</div><div className="flex-1 flex items-center"><div className="text-4xl font-bold text-white">{plants.length}</div></div><div className="text-xs text-gray-400">crops tested</div></div></Card>
        <Card tone="purple" className="rounded-2xl border border-ios-purple/40 bg-gradient-to-br from-ios-purple/20 to-ios-purple/5 p-4 min-h-32"><div className="space-y-2 h-full flex flex-col"><div className="text-xs font-semibold text-ios-purple uppercase tracking-wide">Current Pairing</div><div className="flex-1 flex items-center gap-3">{planet ? <PlanetGlobe name={planet.name} size={40} /> : <div className="w-10 h-10 rounded-full bg-white/10" />}{plant ? <Sprout size={24} className="text-ios-green" /> : <Plus size={16} className="text-gray-500" />}</div><div className="text-xs font-medium text-gray-300">{planet && plant ? `${splitName(planet.name).label} · ${splitName(plant.name).label}` : 'Select pairing'}</div></div></Card>
      </section>

      {/* Mission Checklist hidden permanently
      {!checklistVisibility.dismissed && (
        <section className="mt-8">
          <MissionChecklist />
        </section>
      )}
      */}

      <section>
        <h2 className="mb-1 text-xl font-semibold">Junior Astronaut Mission Trainer</h2>
        <p className="mb-3 text-sm text-gray-400">Balance radiation shielding, heating, water recycling and grow lights on a limited power budget. Pick a rank and launch.</p>
        <MissionCards selectedPlanet={planet} onLaunch={(id) => nav(`/simulation?mission=${id}&start=1`)} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Live NASA data status</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {feeds.map(({ icon: I, name, d, desc }) => (
            <Card key={name} className="flex flex-col">
              <div className="flex items-center justify-between mb-2"><I className="text-ios-blue flex-shrink-0" size={20} />{d.loading ? <Badge tone="gray" className="text-xs">…</Badge> : <SourceBadge source={d.data?.source} />}</div>
              <div className="font-semibold text-sm mb-2">{name}</div>
              {d.loading ? <Spinner label="" /> : <div className="text-xs text-gray-400 line-clamp-3">{desc}</div>}
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
