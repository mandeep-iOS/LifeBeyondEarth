import { Rocket } from 'lucide-react'
import { useApp } from '../state/AppState'
import { splitName } from '../lib'

export default function SelectedMissionCard() {
  const { planet, plant, simulationState } = useApp()

  if (!planet) {
    return null
  }

  const getMissionState = () => {
    if (!planet || !plant) return 'Setup Incomplete'
    if (simulationState === 'running') return 'Mission Running'
    if (simulationState === 'paused') return 'Mission Paused'
    if (simulationState === 'completed') return 'Mission Completed'
    return 'Ready to Begin'
  }

  const missionState = getMissionState()
  const planetLabel = splitName(planet.name).label
  const plantLabel = plant ? splitName(plant.name).label : 'No crop selected'

  const statusColor = missionState === 'Mission Completed' ? 'text-ios-green' :
                      missionState === 'Mission Running' ? 'text-ios-orange' :
                      missionState === 'Mission Paused' ? 'text-ios-yellow' :
                      'text-ios-blue'

  return (
    <div className="px-4 py-2 flex items-center gap-3 text-sm border-b border-white/10">
      <Rocket size={16} className="text-ios-blue flex-shrink-0" />
      <span className="text-gray-400 font-medium">Selected Mission</span>
      <span className="text-gray-500">·</span>
      <span className="text-white font-semibold">{planetLabel}</span>
      <span className="text-gray-500">·</span>
      <span className="text-white">{plantLabel}</span>
      <span className="text-gray-500">·</span>
      <span className={`font-medium ${statusColor}`}>Status: {missionState}</span>
    </div>
  )
}
