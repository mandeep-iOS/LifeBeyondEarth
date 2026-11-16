import { useState } from 'react'
import { Zap, Droplet, Battery, AlertTriangle, Cloud } from 'lucide-react'
import { Card, Badge, Stat, Button } from '../components/ui'

type PlanetType = 'Earth' | 'Moon' | 'Mars'

interface SolarData {
  irradiance: number
  unit: string
  condition: string
}

const IRRADIANCE_BASELINE: Record<PlanetType, SolarData> = {
  Earth: { irradiance: 1000, unit: 'W/m²', condition: 'Standard (Sol 1 AU)' },
  Moon: { irradiance: 1361, unit: 'W/m²', condition: 'Lunar day (no atmosphere)' },
  Mars: { irradiance: 590, unit: 'W/m²', condition: 'Clear Martian day' },
}

interface TankState {
  level: number
  status: 'full' | 'half' | 'finish' | 'critical'
}

export default function PowerGridPage() {
  const [planet, setPlanet] = useState<PlanetType>('Earth')
  const [solarData, setSolarData] = useState<SolarData>(IRRADIANCE_BASELINE[planet])
  const [tankLevel, setTankLevel] = useState<number>(100)
  const [tankStatus, setTankStatus] = useState<TankState>({
    level: 100,
    status: 'full',
  })

  const handlePlanetChange = (newPlanet: PlanetType) => {
    setPlanet(newPlanet)
    setSolarData(IRRADIANCE_BASELINE[newPlanet])
  }

  const simulateTankDrain = () => {
    const newLevel = Math.max(tankLevel - 15, 0)
    setTankLevel(newLevel)

    if (newLevel >= 75) {
      setTankStatus({ level: newLevel, status: 'full' })
    } else if (newLevel >= 50) {
      setTankStatus({ level: newLevel, status: 'half' })
    } else if (newLevel >= 15) {
      setTankStatus({ level: newLevel, status: 'finish' })
    } else {
      setTankStatus({ level: newLevel, status: 'critical' })
    }
  }

  const refillTank = () => {
    setTankLevel(100)
    setTankStatus({ level: 100, status: 'full' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Power & ECLSS Grid</h1>
        <p className="text-gray-400">Autonomous energy, water, and thermal management for habitat survival</p>
      </div>

      {/* Planet Selector */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Cloud size={20} className="text-ios-blue" />
          <h2 className="text-lg font-semibold">Planetary Environment</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['Earth', 'Moon', 'Mars'] as PlanetType[]).map((p) => (
            <Button
              key={p}
              variant={planet === p ? 'primary' : 'ghost'}
              onClick={() => handlePlanetChange(p)}
              className="text-sm"
            >
              {p}
            </Button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Stat label="Planetary irradiance" value={`${solarData.irradiance} ${solarData.unit}`} tone="blue" />
          <Stat label="Condition" value={solarData.condition} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Smart Robot Solar-Suit Charging */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-ios-orange" />
            <h3 className="text-lg font-semibold">Smart Robot Solar-Suit Charging</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Surplus Grid Export</span>
                <Badge tone="green">65%</Badge>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ios-green transition-all duration-500"
                  style={{ width: `${65}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">L.U.M.E.N. draining excess solar capacity to grid</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Auto-Charge Active</span>
                <Badge tone="blue">25%</Badge>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ios-blue transition-all duration-500"
                  style={{ width: `${25}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Robot charging mode active</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">A.C.E. Dock Handover</span>
                <Badge tone="orange">10%</Badge>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ios-orange transition-all duration-500"
                  style={{ width: `${10}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Critical energy handover to dock</p>
            </div>
          </div>

          <p className="text-xs text-gray-400">Planetary irradiance drives autonomous charging priority allocation</p>
        </Card>

        {/* Automated Water Tank & Thermal Sensors */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Droplet size={20} className="text-ios-green" />
            <h3 className="text-lg font-semibold">Water Tank & Thermal Control</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Water Level</span>
                <Badge
                  tone={
                    tankStatus.status === 'full'
                      ? 'green'
                      : tankStatus.status === 'half'
                        ? 'blue'
                        : tankStatus.status === 'finish'
                          ? 'orange'
                          : 'red'
                  }
                >
                  {tankStatus.level}%
                </Badge>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ios-green transition-all duration-500"
                  style={{ width: `${tankStatus.level}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Tank Status:{' '}
                {tankStatus.status === 'full'
                  ? 'Full (100%)'
                  : tankStatus.status === 'half'
                    ? 'Half (50%)'
                    : tankStatus.status === 'finish'
                      ? 'Finish / Critical (<15%)'
                      : 'Critical - Auto-Refill Active'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={simulateTankDrain} className="flex-1 text-sm glass text-gray-300 hover:bg-white/10">
                Simulate Drain
              </Button>
              {tankLevel < 100 && (
                <Button onClick={refillTank} className="flex-1 text-sm glass text-gray-300 hover:bg-white/10">
                  H.Y.D.R.O. Auto-Refill
                </Button>
              )}
            </div>

              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Interior Temperature</span>
                <Badge tone="blue">21°C</Badge>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ios-blue transition-all duration-500"
                  style={{ width: `${((21 - 0) / 50) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Auto-Thermal maintaining 18–24°C optimal range</p>
          </div>
        </Card>
      </div>

      {/* Robot-Deployed Solar Micro-Grid & Emergency Reserve */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Battery size={20} className="text-ios-purple" />
          <h3 className="text-lg font-semibold">L.U.M.E.N. Solar Grid & Emergency Reserve</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 rounded-lg bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-ios-orange" />
              <span className="text-sm font-semibold">EDS Sweep Status</span>
            </div>
            <Badge tone="blue">Active</Badge>
            <p className="text-xs text-gray-400">Electrodynamic Dust Shield running continuous panel maintenance</p>
          </div>

            <div className="space-y-2 rounded-lg bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <Battery size={16} className="text-ios-green" />
                <span className="text-sm font-semibold">Emergency Reserve</span>
              </div>
              <Badge tone="green">
                62%
              </Badge>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ios-green transition-all duration-500"
                  style={{ width: `${62}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">Reserve OK</p>
            </div>

          <div className="space-y-2 rounded-lg bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-ios-orange" />
              <span className="text-sm font-semibold">Blackout Simulation</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Lunar night mode</span>
                <Badge tone="orange">Idle</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Dust storm mode</span>
                <Badge tone="orange">Idle</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">kWh Distribution</div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-ios-blue/10 px-3 py-2 text-sm ring-1 ring-ios-blue/30">
              <span>Grow Lights</span>
              <span className="font-semibold">28%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-ios-green/10 px-3 py-2 text-sm ring-1 ring-ios-green/30">
              <span>Life Support (O₂, CO₂)</span>
              <span className="font-semibold">34%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-ios-orange/10 px-3 py-2 text-sm ring-1 ring-ios-orange/30">
              <span>Robot Charging</span>
              <span className="font-semibold">22%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-ios-purple/10 px-3 py-2 text-sm ring-1 ring-ios-purple/30">
              <span>Thermal & Reserves</span>
              <span className="font-semibold">16%</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          L.U.M.E.N. electrodynamic dust shield maintains solar panel efficiency while charging Emergency Reserve Bank
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Battery Health" value="78%" tone="blue" />
        <Stat label="Thermal Status" value="Nominal" tone="green" />
        <Stat label="Water Reserve" value="76 L" tone="green" />
        <Stat label="SI Decision Cycles" value="847" tone="purple" />
      </div>
    </div>
  )
}
