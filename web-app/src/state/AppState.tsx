import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { api, checkHealth, getStatus, subscribeStatus, getMissionKey, setMissionKeyStorage, type BackendStatus, type Planet, type Plant, type Prediction, type SimulateOut } from '../api'
import { loadPreferences, savePreferences, applyTheme, type UserPreferences } from '../lib/themes'

export interface RunSummary { sim: SimulateOut; days: number; saved: boolean }

export type SimulationState = 'idle' | 'running' | 'paused' | 'completed' | 'stopped'

export interface CurrentRun {
  sim: SimulateOut
  days: number
  idx: number
  playing: boolean
  mission?: string
}

export interface MissionChecklistProgress {
  destinationSelected: boolean
  cropsSelected: boolean
  prepCompleted: boolean
  simulationRun: boolean
  resultsViewed: boolean
}

export interface MissionChecklistVisibility {
  dismissed: boolean
  firstTimeUser: boolean
}

interface Ctx {
  status: BackendStatus
  planets: Planet[]
  plants: Plant[]
  loading: boolean
  planet: Planet | null
  plant: Plant | null
  selectPlanet: (p: Planet) => void
  selectPlant: (p: Plant) => void
  prediction: Prediction | null
  setPrediction: (p: Prediction | null) => void
  run: RunSummary | null
  setRun: (r: RunSummary | null) => void
  reload: () => void
  simulationState: SimulationState
  setSimulationState: (s: SimulationState) => void
  currentRun: CurrentRun | null
  setCurrentRun: (r: CurrentRun | null) => void
  checklistProgress: MissionChecklistProgress
  setChecklistProgress: (p: MissionChecklistProgress | ((prev: MissionChecklistProgress) => MissionChecklistProgress)) => void
  checklistVisibility: MissionChecklistVisibility
  setChecklistVisibility: (v: MissionChecklistVisibility) => void
  preferences: UserPreferences
  setPreferences: (p: UserPreferences | ((prev: UserPreferences) => UserPreferences)) => void
  missionKey: string
  setMissionKey: (key: string) => void
}
const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const status = useSyncExternalStore(subscribeStatus, getStatus)
  const [planets, setPlanets] = useState<Planet[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [planet, setPlanet] = useState<Planet | null>(null)
  const [plant, setPlant] = useState<Plant | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [run, setRun] = useState<RunSummary | null>(null)
  const [simulationState, setSimulationState] = useState<SimulationState>('idle')
  const [currentRun, setCurrentRun] = useState<CurrentRun | null>(null)
  const [missionKey, setMissionKeyState] = useState<string>(getMissionKey())
  
  const [checklistProgress, setChecklistProgress] = useState<MissionChecklistProgress>(() => {
    try {
      const key = getMissionKey()
      const stored = localStorage.getItem(`lbe-checklist-progress-v1-${key}`)
      if (stored) return JSON.parse(stored)
    } catch { }
    return { destinationSelected: false, cropsSelected: false, prepCompleted: false, simulationRun: false, resultsViewed: false }
  })
  const [checklistVisibility, setChecklistVisibility] = useState<MissionChecklistVisibility>(() => {
    try {
      const key = getMissionKey()
      const stored = localStorage.getItem(`lbe-checklist-visibility-v1-${key}`)
      if (stored) return JSON.parse(stored)
    } catch { }
    return { dismissed: false, firstTimeUser: true }
  })
  const [preferences, setPreferencesState] = useState<UserPreferences>(() => {
    const prefs = loadPreferences()
    applyTheme(prefs)
    savePreferences(prefs)
    return prefs
  })

  useEffect(() => {
    const key = getMissionKey()
    localStorage.setItem(`lbe-checklist-progress-v1-${key}`, JSON.stringify(checklistProgress))
  }, [checklistProgress])

  useEffect(() => {
    const key = getMissionKey()
    localStorage.setItem(`lbe-checklist-visibility-v1-${key}`, JSON.stringify(checklistVisibility))
  }, [checklistVisibility])

  const setPreferences = useCallback((p: UserPreferences | ((prev: UserPreferences) => UserPreferences)) => {
    setPreferencesState(prev => {
      const next = typeof p === 'function' ? p(prev) : p
      savePreferences(next)
      return next
    })
  }, [])

  const setMissionKey = useCallback((newKey: string) => {
    setMissionKeyStorage(newKey)
    setMissionKeyState(newKey)
    // Load checklist data for new mission key
    try {
      const stored = localStorage.getItem(`lbe-checklist-progress-v1-${newKey}`)
      if (stored) {
        setChecklistProgress(JSON.parse(stored))
      } else {
        setChecklistProgress({ destinationSelected: false, cropsSelected: false, prepCompleted: false, simulationRun: false, resultsViewed: false })
      }
    } catch {
      setChecklistProgress({ destinationSelected: false, cropsSelected: false, prepCompleted: false, simulationRun: false, resultsViewed: false })
    }
    try {
      const stored = localStorage.getItem(`lbe-checklist-visibility-v1-${newKey}`)
      if (stored) {
        setChecklistVisibility(JSON.parse(stored))
      } else {
        setChecklistVisibility({ dismissed: false, firstTimeUser: true })
      }
    } catch {
      setChecklistVisibility({ dismissed: false, firstTimeUser: true })
    }
  }, [])

  const reload = useCallback(() => {
    setLoading(true)
    checkHealth()
      .then(() => Promise.all([api.planets(), api.plants()]))
      .then(([pl, pt]) => {
        setPlanets(pl); setPlants(pt)
        setPlanet((c) => pl.find((x) => x.name === c?.name) ?? pl.find((x) => x.name.includes('Mars')) ?? pl[0] ?? null)
        setPlant((c) => pt.find((x) => x.name === c?.name) ?? pt[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
    const t = setInterval(() => { checkHealth() }, 15000)
    return () => clearInterval(t)
  }, [reload])

  const value = useMemo<Ctx>(() => ({
    status, planets, plants, loading, planet, plant,
    selectPlanet: (p) => { setPlanet(p); setPrediction(null) },
    selectPlant: (p) => { setPlant(p); setPrediction(null) },
    prediction, setPrediction, run, setRun, reload,
    simulationState, setSimulationState, currentRun, setCurrentRun,
    checklistProgress, setChecklistProgress, checklistVisibility, setChecklistVisibility,
    preferences, setPreferences,
    missionKey, setMissionKey,
  }), [status, planets, plants, loading, planet, plant, prediction, run, reload, simulationState, currentRun, checklistProgress, checklistVisibility, preferences, setPreferences, missionKey, setMissionKey])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp(): Ctx {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}
