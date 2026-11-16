import { useEffect, useState } from 'react'
import { Rocket, Lock, AlertTriangle } from 'lucide-react'
import { MISSIONS, loadResults } from '../api/trainer'
import { Badge, Button, Card } from './ui'
import type { Planet } from '../api'

interface MissionCardsProps {
  onLaunch: (id: string) => void
  activeId?: string
  selectedPlanet?: Planet | null
}

export default function MissionCards({ onLaunch, activeId, selectedPlanet }: MissionCardsProps) {
  const [results, setResults] = useState(loadResults)
  useEffect(() => {
    const h = () => setResults(loadResults())
    window.addEventListener('lbe-trainer-results', h)
    return () => window.removeEventListener('lbe-trainer-results', h)
  }, [])
  const tones = { Cadet: 'green', Specialist: 'orange', Commander: 'red' } as const
  
  const filteredMissions = selectedPlanet 
    ? MISSIONS.filter(m => m.planet === selectedPlanet.name)
    : MISSIONS
  
  const unavailableMissions = selectedPlanet 
    ? MISSIONS.filter(m => m.planet !== selectedPlanet.name)
    : []

  // Check if selected planet is uninhabitable
  const uninhabitablePlanets = ['☄️ Mercury', '🟠 Venus', '🟤 Jupiter', '🪐 Saturn', '🔵 Uranus', '🔷 Neptune']
  const isUninhabitable = selectedPlanet && uninhabitablePlanets.includes(selectedPlanet.name)
  const isGasGiant = selectedPlanet && ['🟤 Jupiter', '🪐 Saturn', '🔵 Uranus', '🔷 Neptune'].includes(selectedPlanet.name)

  return (
    <div className="space-y-4">
      {selectedPlanet && (
        <div className="text-sm text-gray-400">
          Showing missions for <strong>{selectedPlanet.name}</strong>. {filteredMissions.length} of {MISSIONS.length} available.
        </div>
      )}
      
      {isUninhabitable && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-200">
          <div className="flex gap-2 items-start">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>{isGasGiant ? 'Gas Giant — Uninhabitable' : 'Uninhabitable World'}</strong>
              <p className="text-xs mt-1 text-red-200/80">
                {isGasGiant 
                  ? 'This world has no solid surface. Missions are probe-based, hardware-stress, and atmospheric modeling research only. Not a survival destination.'
                  : 'This world is not habitable for human survival. Missions are probe, environmental modeling, hardware-stress, and failure research only.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid gap-3 md:grid-cols-3">
        {filteredMissions.length > 0 ? (
          filteredMissions.map((m) => (
            <Card key={m.id} tone={tones[m.rank as keyof typeof tones]} active={m.id === activeId} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Badge tone={tones[m.rank as keyof typeof tones]}>{m.rank}</Badge>
                {results[m.id] === 'pass' ? <Badge tone="green">✅ Passed</Badge> : results[m.id] === 'fail' ? <Badge tone="red">❌ Failed</Badge> : <Badge tone="gray">Not attempted</Badge>}
              </div>
              <div className="text-lg font-semibold">{m.emoji} {m.title}</div>
              <p className="text-xs text-gray-400">{m.briefing}</p>
              <ul className="space-y-0.5 text-xs text-gray-300">{m.objectives.map((o) => <li key={o.label}>🎯 {o.label}</li>)}</ul>
              <Button disabled={activeId !== undefined && activeId !== m.id} className="mt-auto" onClick={() => onLaunch(m.id)}><Rocket size={16} /> Launch mission</Button>
            </Card>
          ))
        ) : (
          <div className="col-span-full rounded-lg bg-orange-500/10 border border-orange-500/30 p-4 text-sm text-orange-200">
            <strong>No compatible missions available</strong> — This is an extreme world with no survival missions in the catalog. Use the unavailable missions section below for probe and research-only simulations.
          </div>
        )}
      </div>

      {selectedPlanet && unavailableMissions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400">Missions for other planets:</h3>
          <div className="grid gap-3 md:grid-cols-3 opacity-60">
            {unavailableMissions.map((m) => (
              <Card key={m.id} className="flex flex-col gap-2 cursor-not-allowed">
                <div className="flex items-center justify-between">
                  <Badge tone="gray">{m.rank}</Badge>
                  <Lock size={14} className="text-gray-500" />
                </div>
                <div className="text-lg font-semibold">{m.emoji} {m.title}</div>
                <p className="text-xs text-gray-500">{m.briefing}</p>
                <div className="text-xs text-gray-500 mt-auto">Available for: {m.planet}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
