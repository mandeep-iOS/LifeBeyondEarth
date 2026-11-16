import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useApp } from '../state/AppState'
import { Badge, Card, Empty, Meter, PageHeader, Spinner, Stat } from '../components/ui'
import PlanetGlobe from '../components/PlanetGlobe'
import { plantNasaUrl, plantNote, slug, suitability } from '../info'
import { scoreTone, splitName } from '../lib'

export default function PlantDetailPage() {
  const { id = '' } = useParams()
  const { plants, planets, loading } = useApp()
  if (loading) return <Spinner />
  const pl = plants.find((x) => slug(splitName(x.name).label) === id)
  if (!pl) return <Empty icon={<ArrowLeft size={36} />} title="Crop not found" hint="It may no longer be in the catalog." action={<Link to="/plants" className="text-ios-blue">Back to Plants</Link>} />
  const { emoji, label } = splitName(pl.name)
  return (
    <div className="space-y-6">
      <Link to="/plants" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"><ArrowLeft size={14} /> Back to Plants</Link>
      <PageHeader title={`${emoji} ${label}`} subtitle={plantNote(pl)}
        actions={<a href={plantNasaUrl(pl.name)} target="_blank" rel="noreferrer" className="glass inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-ios-blue hover:bg-white/10">Check Official NASA Info <ExternalLink size={14} /></a>} />
      <Card tone="green" className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Cold tolerance" value={`${pl.cold_tolerance}°C`} tone="blue" />
          <Stat label="Water need" value={`${pl.water_need}%`} tone="blue" />
          <Stat label="Radiation tolerance" value={`${pl.radiation_tolerance}/100`} tone="purple" />
        </div>
        <Meter value={pl.water_need} tone={pl.water_need > 70 ? 'red' : pl.water_need > 40 ? 'orange' : 'green'} label="Water need" />
        <Meter value={pl.radiation_tolerance} tone={pl.radiation_tolerance > 40 ? 'green' : pl.radiation_tolerance > 20 ? 'orange' : 'red'} label="Radiation tolerance" />
      </Card>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Simulation suitability by planet</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {planets.map((p) => {
            const s = suitability(p, pl)
            return (
              <Card key={p.name} tone={scoreTone(s.score)} className="space-y-2">
                <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 font-semibold"><PlanetGlobe name={p.name} size={28} />{splitName(p.name).label}</span><Badge tone={scoreTone(s.score)}>{s.score}%</Badge></div>
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
