import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { api } from '../api'
import { useAsync } from '../hooks'
import { useApp } from '../state/AppState'
import { Badge, Card, Empty, Meter, PageHeader, Spinner, Stat } from '../components/ui'
import PlanetGlobe from '../components/PlanetGlobe'
import { specFromExo, specFromPlanet, suitability } from '../info'
import { scoreTone, splitName } from '../lib'

export default function PlanetDetailPage() {
  const { id = '' } = useParams()
  const { planets, plants, loading } = useApp()
  const isExo = id.startsWith('exo-')
  const exo = useAsync(() => (isExo ? api.nasa.exoplanets(50) : Promise.resolve(null)), [id])
  if (loading || exo.loading) return <Spinner />
  const spec = isExo
    ? (() => { const e = exo.data?.planets.find((x) => specFromExo(x).id === id); return e ? specFromExo(e) : null })()
    : (() => { const p = planets.find((x) => specFromPlanet(x).id === id); return p ? specFromPlanet(p) : null })()
  if (!spec) return <Empty icon={<ArrowLeft size={36} />} title="Planet not found" hint="It may no longer be in the catalog." action={<Link to="/planets" className="text-ios-blue">Back to Planets</Link>} />
  const p = spec.planet
  return (
    <div className="space-y-6">
      <Link to="/planets" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"><ArrowLeft size={14} /> Back to Planets</Link>
      <PageHeader title={spec.label} subtitle={spec.note}
        actions={<a href={spec.nasaUrl} target="_blank" rel="noreferrer" className="glass inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-ios-blue hover:bg-white/10">Check Official NASA Info <ExternalLink size={14} /></a>} />
      <Card className="flex flex-wrap items-center gap-6">
        <PlanetGlobe name={p.name} size={140} speed={1.5} />
        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Temperature" value={`${p.temperature}°C`} tone="orange" />
          <Stat label="Pressure" value={`${p.pressure} kPa`} tone="blue" />
          <Stat label="Radiation" value={`${p.radiation}/100`} tone="purple" />
          <Stat label="Water" value={p.water_available ? 'Available' : 'None'} tone={p.water_available ? 'green' : 'red'} />
          {spec.extra.map((x) => <Stat key={x.label} label={x.label} value={x.value} tone="gray" />)}
        </div>
      </Card>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Simulation suitability by crop</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {plants.map((pl) => {
            const s = suitability(p, pl)
            return (
              <Card key={pl.name} tone={scoreTone(s.score)} className="space-y-2">
                <div className="flex items-center justify-between"><b>{splitName(pl.name).emoji} {splitName(pl.name).label}</b><Badge tone={scoreTone(s.score)}>{s.score}% suitable</Badge></div>
                <Meter value={s.score} tone={scoreTone(s.score)} />
                <ul className="space-y-0.5 text-xs text-gray-300">
                  {s.checks.map((c) => <li key={c.name}><span className={c.ok ? 'text-ios-green' : 'text-ios-red'}>{c.ok ? '✓' : '✗'}</span> {c.name}: <span className="text-gray-400">{c.detail}</span></li>)}
                </ul>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
