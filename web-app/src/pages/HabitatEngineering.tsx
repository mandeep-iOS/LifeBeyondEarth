import { useState } from 'react'
import { Bot, Eye, Wind, Radio, Shield } from 'lucide-react'
import { Card, Badge, Button, Stat } from '../components/ui'

type RobotMode = 'humanoid' | 'construction' | 'botanical' | 'solar'

interface RobotConfig {
  mode: RobotMode
  energy: number
  predictedTime: string
  structuralStress: number
  yieldForecast: string
  nasaTelemetry: string
}

const ROBOT_MODES: Record<RobotMode, RobotConfig> = {
  humanoid: {
    mode: 'humanoid',
    energy: 32,
    predictedTime: '2.4 hrs',
    structuralStress: 0,
    yieldForecast: 'N/A',
    nasaTelemetry: 'NASA OSDR: Microgravity upright posture analysis',
  },
  construction: {
    mode: 'construction',
    energy: 48,
    predictedTime: '8.7 hrs',
    structuralStress: 18,
    yieldForecast: 'Dome integrity 94.2%',
    nasaTelemetry: 'NASA POWER: Solar array deployment efficiency',
  },
  botanical: {
    mode: 'botanical',
    energy: 28,
    predictedTime: '4.1 hrs',
    structuralStress: 0,
    yieldForecast: 'Projected 67% yield',
    nasaTelemetry: 'NASA GeneLab: Root morphogenesis in low-G',
  },
  solar: {
    mode: 'solar',
    energy: 52,
    predictedTime: '6.2 hrs',
    structuralStress: 12,
    yieldForecast: '412 kWh stored',
    nasaTelemetry: 'NASA POWER: Mars solar irradiance trends',
  },
}

export default function HabitatEngineeringPage() {
  const [selectedMode, setSelectedMode] = useState<RobotMode>('humanoid')
  const [radiationShield, setRadiationShield] = useState<number>(0)

  const config = ROBOT_MODES[selectedMode]
  const shieldAttenuation = Math.sqrt(radiationShield) * 2.1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Habitat Engineering</h1>
        <p className="text-gray-400">Task-adaptive robot morphing and closed-loop life support</p>
      </div>

      {/* NASA/CSA Credits */}
      <div className="flex flex-wrap gap-2">
        <Badge className="text-xs">
          NASA Open Data
        </Badge>
        <Badge className="text-xs">
          Canadian Space Agency (CSA) Juno
        </Badge>
        <Badge className="text-xs">
          CSA LEADS Lunar Rover
        </Badge>
      </div>

      {/* Robot Morphing Section */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-ios-blue" />
          <h2 className="text-lg font-semibold">Modular Task-Adaptive Robot Morphing</h2>
        </div>

        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {(['humanoid', 'construction', 'botanical', 'solar'] as RobotMode[]).map((mode) => {
            const labels = {
              humanoid: '1. Humanoid\nReconnaissance & Airlock',
              construction: '2. Tracked/Hexapod\n3D-Printing Dome Construction',
              botanical: '3. Multi-Arm\nBotanical & Hydroponic',
              solar: '4. Mobile Solar-Grid\n& Radiation Carrier',
            }
            return (
              <Button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`h-auto whitespace-pre-wrap py-3 text-xs transition ${
                  selectedMode === mode
                    ? 'glass bg-ios-blue/25 text-white glow-blue'
                    : 'glass text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {labels[mode as keyof typeof labels]}
              </Button>
            )
          })}
        </div>

        {/* SI Visual-Spatial Digital-Twin Predictions */}
        <div className="space-y-3">
          <div className="rounded-xl bg-ios-purple/10 p-4 ring-1 ring-ios-purple/30">
            <div className="mb-3 flex items-center gap-2">
              <Eye size={16} className="text-ios-purple" />
              <span className="text-sm font-semibold">SI Visual-Spatial Digital-Twin Predictions</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-gray-400">Predicted Task Timeline</div>
                <div className="mt-1 text-lg font-bold text-white">{config.predictedTime}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400">Energy Draw</div>
                <div className="mt-1 text-lg font-bold text-ios-orange">{config.energy}%</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400">Structural/Yield Forecast</div>
                <div className="mt-1 text-sm text-gray-200">{config.yieldForecast}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400">NASA OSDR Telemetry Driver</div>
                <div className="mt-1 text-xs text-gray-300">{config.nasaTelemetry}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400">Mechanical reconfiguration in progress — 3D visual simulation available on mission briefing video</div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Closed-Loop O₂ / CO₂ / H₂O Sabatier & Crop Balance Visualizer */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Wind size={20} className="text-ios-green" />
            <h3 className="text-lg font-semibold">Closed-Loop Life Support Balance</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">Integrated O₂ Recovery</span>
                  <span className="text-xs text-gray-400">Water Electrolysis: 2H₂O → 2H₂ + O₂</span>
                </div>
                <Badge tone="green">19.5%</Badge>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ios-green transition-all duration-500"
                  style={{ width: `${(19.5 / 21) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Spacecraft nominal: 19.5–21.0%</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">CO₂ Level (Crop Absorption)</span>
                <Badge tone="blue">0.35%</Badge>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ios-blue transition-all duration-500"
                  style={{ width: `${Math.min((0.35 / 0.5) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Nominal CO₂ trace: 0.3–0.4%</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Crew Health Index</span>
                <Badge tone="green">98%</Badge>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ios-green transition-all duration-500"
                  style={{ width: `${98}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Dome Crop Yield</span>
                <Badge tone="green">87%</Badge>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ios-green transition-all duration-500"
                  style={{ width: `${87}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Red Romaine Lettuce yield vs. baseline</p>
            </div>
          </div>

          <div className="rounded-lg bg-white/5 p-3 text-xs text-gray-300">
            <div className="font-semibold">Dynamic Balance</div>
            <div className="mt-1 space-y-1">
            <div><strong>Water Electrolysis:</strong> 2H₂O → 2H₂ + O₂ (produces breathable oxygen)</div>
            <div><strong>Sabatier Reaction:</strong> CO₂ + 4H₂ → CH₄ + 2H₂O (converts CO₂ to methane; byproduct water recycled to electrolysis)</div>
              <div>• Crew respiration: ~0.84 kg O₂/day, ~1 kg CO₂/day</div>
              <div>• Dome photosynthesis: +0.73 kg O₂/day (Red Romaine)</div>
            <div>• Integrated system: Sabatier CO₂ removal → water byproduct → electrolysis for additional O₂</div>
            </div>
          </div>
        </Card>

        {/* Radiation Shielding Calculator */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-ios-orange" />
            <h3 className="text-lg font-semibold">Regolith Radiation Shielding</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Shield Thickness</span>
                <Badge tone="orange">{radiationShield} cm</Badge>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={radiationShield}
                onChange={(e) => setRadiationShield(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-ios-orange"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>0 cm (No shielding)</span>
                <span>100 cm (Maximum)</span>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-lg bg-ios-orange/10 p-3 ring-1 ring-ios-orange/30">
                <div className="mb-2 text-xs font-semibold text-ios-orange">Cosmic-Ray Attenuation</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{Math.min(shieldAttenuation, 99).toFixed(1)}%</span>
                  <span className="text-xs text-gray-400">reduction in primary flux</span>
                </div>
              </div>

              <div className="rounded-lg bg-ios-red/10 p-3 ring-1 ring-ios-red/30">
                <div className="mb-2 text-xs font-semibold text-ios-red">Solar-Flare Particle Attenuation</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{Math.min(shieldAttenuation * 1.3, 99).toFixed(1)}%</span>
                  <span className="text-xs text-gray-400">energetic proton blocking</span>
                </div>
              </div>

              <div className="rounded-lg bg-ios-purple/10 p-3 ring-1 ring-ios-purple/30">
                <div className="mb-2 text-xs font-semibold text-ios-purple">Secondary Radiation (Bremsstrahlung)</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{Math.max(100 - shieldAttenuation, 5).toFixed(1)}%</span>
                  <span className="text-xs text-gray-400">residual X-ray/gamma risk</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Optimal shielding depth depends on mission duration, solar cycle phase, and shielding material density.
            </p>
          </div>
        </Card>
      </div>

      {/* Earth-to-Planet Signal Latency & Autonomy Matrix */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio size={20} className="text-ios-purple" />
          <h3 className="text-lg font-semibold">Signal Latency & Autonomy Matrix</h3>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-ios-blue/10 p-3 ring-1 ring-ios-blue/30">
            <div className="text-xs font-semibold text-ios-blue">Moon</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">1.3</span>
              <span className="text-xs text-gray-400">sec one-way</span>
            </div>
            <div className="mt-2 text-xs text-gray-300">
              Real-time manual control possible; SI acts only in predefined emergency protocols
            </div>
          </div>

          <div className="rounded-lg bg-ios-orange/10 p-3 ring-1 ring-ios-orange/30">
            <div className="text-xs font-semibold text-ios-orange">Mars</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">4–24</span>
              <span className="text-xs text-gray-400">min one-way</span>
            </div>
            <div className="mt-2 text-xs text-gray-300">
              Full SI autonomy required; humans approve macro decisions daily via batch commands
            </div>
          </div>

          <div className="rounded-lg bg-ios-red/10 p-3 ring-1 ring-ios-red/30">
            <div className="text-xs font-semibold text-ios-red">Deep Space (12+ AU)</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{'>'}2 hrs</span>
              <span className="text-xs text-gray-400">one-way</span>
            </div>
            <div className="mt-2 text-xs text-gray-300">
              Absolute SI autonomy; mission success depends entirely on Commander-Prime SI decision quality
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white/5 p-3 text-xs text-gray-300">
          <div className="font-semibold mb-2">SI Autonomy Levels by Latency</div>
          <div className="space-y-1">
            <div>
              <strong>Latency {'<'} 2s (Moon):</strong> SI advisory; human retains real-time control
            </div>
            <div>
              <strong>Latency 2–60s (Mars):</strong> SI tactical autonomy in emergencies; strategic commands from Earth
            </div>
            <div>
              <strong>Latency {'>'} 1 hr (Deep Space):</strong> SI strategic autonomy; survival depends on SI decision quality
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Badges */}
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Robot Modes Deployed" value="4" tone="blue" />
        <Stat label="Life Support Status" value="Nominal" tone="green" />
        <Stat label="Habitat Integrity" value="98.7%" tone="green" />
        <Stat label="SI Autonomy Level" value="Strategic" tone="purple" />
      </div>
    </div>
  )
}
