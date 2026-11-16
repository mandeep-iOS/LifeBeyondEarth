export interface Planet { name: string; temperature: number; pressure: number; radiation: number; water_available: boolean }
export interface Plant { name: string; cold_tolerance: number; water_need: number; radiation_tolerance: number }
export interface Factor { name: string; planet_value: string; plant_limit: string; impact: number; status: 'ok' | 'threat' | 'boost' }
export interface Explanation { title: string; points: string[] }
export interface Prediction {
  survival_prediction: number; risk_level: string; main_threat: string; confidence: number
  reason?: string | null; explanation?: Explanation | null; factors?: Factor[] | null
}
export interface DayResult {
  day: number; health_change: number; new_health: number; reason: string; robot_action: string
  robot_energy_change: number; new_robot_energy: number; survival_probability: number
  survival_percentage: number; status: string; robot_status: string; robot_mode: string; robot_priority: string
}
export interface SimulateOut { planet: string; plant: string; days_simulated: number; final: DayResult; timeline: DayResult[] }
export interface RobotDecision { action: string; priority: string; mode: string; mode_title: string }

export interface MemoryRecord {
  planet_name: string; plant_name: string; survival_score: number
  days_survived: number; mission_result: string; lesson_learned: string
}
export interface MemoryItem extends MemoryRecord { id: number; created_at: string }
export interface HistoryRecord {
  planet_name: string; plant_name: string; days_survived: number; survival_score: number
  survival_probability: number; robot_action: string; reason: string; status: string
  difficulty_level: string; difficulty_explanation: string
  energy_left?: number; threats?: string[]
}
export interface HistoryItem extends HistoryRecord { id: number; created_at: string }

export type NasaSource = 'live' | 'cache' | 'fallback' | 'demo'
export interface Sourced { source: NasaSource; note?: string }
export interface PowerSummary { avg_temp_c: number | null; avg_solar_kwh_m2_day: number | null; avg_precip_mm_day: number | null }
export interface AnalogSite { name: string; lat: number; lon: number; analog_for: string; avg_temp_c: number; solar_kwh_m2_day: number; precip_mm_day: number }
export interface PowerData extends Sourced {
  latitude: number; longitude: number; start?: string; end?: string
  summary?: PowerSummary; analog_sites?: AnalogSite[]; nearest_seed?: AnalogSite
}
export interface Exoplanet { name: string; host: string; equilibrium_temp_k: number; radius_earth: number; orbit_au: number | null; discovery_year: number }
export interface ExoplanetData extends Sourced { count: number; planets: Exoplanet[] }
export interface OsdrStudy { accession: string | null; title: string | null; organism: string | null; url: string }
export interface OsdrData extends Sourced { count: number; studies: OsdrStudy[] }
export interface MarsPhoto { id: number; sol: number; rover: string; camera: string; earth_date: string; img_src: string }
export interface MarsData extends Sourced { count: number; photos: MarsPhoto[] }

export interface SimulateRequest { planet: string; plant: string; health?: number; robot_energy?: number; days?: number; use_memory?: boolean }

export interface SpaceAlert { id: string | null; type: string; class: string | null; begin_time: string | null; peak_time: string | null; source_region: string; link: string | null }
export interface SpaceWeatherData extends Sourced { count: number; threat_level: string; radiation_multiplier: number; summary: string; alerts: SpaceAlert[] }

export interface BiodomeStep { index: number; phase: 'scouting' | 'construction' | 'cultivation'; agent: string; role: string; action: string; progress: number }
export interface BiodomeTelemetry { index: number; to: string; phase: string; level: string; message: string }
export interface BiodomeDay { day: number; inside_health: number; outside_health: number; inside_status: string; outside_status: string; outside_reason: string }
export interface BiodomeRun {
  directive: string; planet: string; crop: string; site: string
  agents: { id: string; role: string; task: string }[]
  site_survey: { site: string; reliability: number; note: string; selected: boolean }[]
  steps: BiodomeStep[]; timeline: BiodomeDay[]
  final: { inside_health: number; outside_health: number; verdict: string }
  telemetry: BiodomeTelemetry[]
}
export type Crisis = 'solar_flare' | 'dust_storm' | 'dome_breach'
export interface EmergencyOut {
  crisis: Crisis; label: string; severity: string; threat_level: string; space_weather_source: string; assessment: string; actions: string[]
  before: { inside_health: number; outside_health: number }; after: { inside_health: number; outside_health: number }
  telemetry: { to: string; level: string; message: string }
}

export interface SquadMember { id: string; name: string; role: string; icon: string; bio: string; milestone: string; hazard: string }
export interface FailoverOut {
  triggered: boolean; status: 'nominal' | 'failover' | 'restored'; battery_pct: number; threshold: number
  active_control: { from: string; to: string }; acting_supervisor: string | null; transfer_log: string[]
  alert: { level: string; title: string; message: string; signal_lag_min: number; approval: string; override: boolean } | null
  synced_to_nasa: boolean; dialogue: { agent: string; message: string }[]
  snapshot_badge?: string | null; biome_assignment?: string | null; handover_record?: string
}

export interface MlImportance { feature: string; importance: number }
export interface MlInsights {
  model_name: string; r2: number; mae: number; samples: number; history_samples: number; importances: MlImportance[]
}
export interface MlPrediction extends Omit<MlInsights, 'samples' | 'history_samples'> {
  planet: string; plant: string; predicted_score: number
}
