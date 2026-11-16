import { Check, X } from 'lucide-react'
import { useApp } from '../state/AppState'
import { Card } from './ui'

interface ChecklistStep {
  key: string
  label: string
  description: string
  completed: boolean
}

export default function MissionChecklist() {
  const { checklistProgress, checklistVisibility, setChecklistVisibility } = useApp()
  
  const steps: ChecklistStep[] = [
    {
      key: 'destinationSelected',
      label: 'Pick a planet',
      description: 'Choose a destination with suitable climate and atmosphere.',
      completed: checklistProgress.destinationSelected,
    },
    {
      key: 'cropsSelected',
      label: 'Select a crop',
      description: 'Pick a bio-regeneration crop that can thrive there.',
      completed: checklistProgress.cropsSelected,
    },
    {
      key: 'prepCompleted',
      label: 'Review prediction',
      description: 'Check the Mission Memory survival prediction before launch.',
      completed: checklistProgress.prepCompleted,
    },
    {
      key: 'simulationRun',
      label: 'Run simulation',
      description: 'Watch the robot caretaker for 30+ days.',
      completed: checklistProgress.simulationRun,
    },
    {
      key: 'resultsViewed',
      label: 'View results',
      description: 'See the full mission report and final outcome.',
      completed: checklistProgress.resultsViewed,
    },
  ]

  if (checklistVisibility.dismissed) {
    return (
      <div className="text-center py-4 text-sm text-gray-400">
        <button
          onClick={() => setChecklistVisibility({ ...checklistVisibility, dismissed: false })}
          className="hover:text-gray-300 underline"
        >
          Show mission checklist
        </button>
      </div>
    )
  }

  const completedCount = steps.filter(s => s.completed).length
  const allComplete = completedCount === steps.length

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">✓</div>
          <div>
            <h3 className="font-semibold">Mission Checklist</h3>
            <p className="text-xs text-gray-400">{completedCount} of {steps.length} steps complete</p>
          </div>
        </div>
        <button
          onClick={() => setChecklistVisibility({ ...checklistVisibility, dismissed: true })}
          className="text-gray-400 hover:text-gray-300 transition"
          aria-label="Dismiss checklist"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div
            key={step.key}
            className={`flex items-start gap-3 p-3 rounded-lg transition ${
              step.completed
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-white/5 border border-white/10'
            }`}
          >
            <div className={`mt-0.5 flex-shrink-0 ${step.completed ? 'text-green-400' : 'text-gray-500'}`}>
              {step.completed ? (
                <Check size={16} />
              ) : (
                <div className="w-4 h-4 rounded-full border border-current opacity-50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-sm ${step.completed ? 'text-green-300' : 'text-gray-300'}`}>
                {idx + 1}. {step.label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {allComplete && (
        <div className="p-3 rounded-lg bg-ios-blue/10 border border-ios-blue/30">
          <p className="text-sm font-medium text-ios-blue">🎉 Mission complete! View your final results.</p>
        </div>
      )}
    </Card>
  )
}
