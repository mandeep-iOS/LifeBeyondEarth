import { Gauge, Sun, Wheat, Wind, Zap } from 'lucide-react'
import { CREW_O2_KG_DAY, SYSTEMS, SYSTEM_META, powerDemand, type Allocation, type DayTelemetry, type SystemKey } from '../api/trainer'
import type { Tone } from '../lib'
import { Badge, Card, Meter } from './ui'

export function PowerControls({ alloc, onChange, supplyKw, disabled }: { alloc: Allocation; onChange: (a: Allocation) => void; supplyKw: number; disabled?: boolean }) {
  const demand = powerDemand(alloc)
  const net = supplyKw - demand
  return (
    <Card tone={net >= 0 ? 'blue' : 'orange'} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold"><Zap size={16} className="text-ios-yellow" /> Power allocation</div>
        <div className="flex gap-2">
          <Badge tone="blue">Supply {supplyKw.toFixed(1)} kW</Badge>
          <Badge tone="purple">Demand {demand.toFixed(1)} kW</Badge>
          <Badge tone={net >= 0 ? 'green' : 'red'}>{net >= 0 ? `+${net.toFixed(1)} kW charging` : `${net.toFixed(1)} kW draining battery`}</Badge>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SYSTEMS.map((k: SystemKey) => (
          <label key={k} className="block text-sm text-gray-300">
            <div className="flex justify-between"><span>{SYSTEM_META[k].emoji} {SYSTEM_META[k].label}</span><b>{alloc[k]}%</b></div>
            <input type="range" min={0} max={100} step={5} value={alloc[k]} disabled={disabled} aria-label={SYSTEM_META[k].label}
              onChange={(e) => onChange({ ...alloc, [k]: +e.target.value })} className="mt-1 block w-full accent-ios-blue" />
            <span className="text-xs text-gray-500">{SYSTEM_META[k].hint}</span>
          </label>
        ))}
      </div>
    </Card>
  )
}

function Gauge4({ icon, label, value, unit, pct, tone }: { icon: React.ReactNode; label: string; value: string; unit: string; pct: number; tone: Tone }) {
  return (
    <Card tone={tone} className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">{icon}{label}</div>
      <div className="text-2xl font-bold">{value}<span className="ml-1 text-sm font-normal text-gray-400">{unit}</span></div>
      <Meter value={pct} tone={tone} />
    </Card>
  )
}

export function LifeSupportHUD({ tel }: { tel: DayTelemetry | undefined }) {
  const t = tel
  const o2 = t?.o2_kg_day ?? 0, kcal = t?.kcal ?? 0, kpa = t?.pressure_kpa ?? 0, kw = t?.solar_kw ?? 0
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-semibold"><span>Astronaut life-support telemetry</span>
        {t && <Badge tone={o2 >= CREW_O2_KG_DAY ? 'green' : 'orange'}>{o2 >= CREW_O2_KG_DAY ? 'Crew of 4 fully supported' : 'Crew O₂ supplement needed'}</Badge>}</div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Gauge4 icon={<Wind size={14} />} label="O₂ production" value={o2.toFixed(2)} unit="kg/day" pct={(o2 / CREW_O2_KG_DAY) * 100} tone={o2 >= CREW_O2_KG_DAY ? 'green' : o2 >= CREW_O2_KG_DAY * 0.6 ? 'orange' : 'red'} />
        <Gauge4 icon={<Wheat size={14} />} label="Edible crop yield" value={kcal.toLocaleString()} unit="kcal" pct={(kcal / 3000) * 100} tone={kcal >= 1800 ? 'green' : kcal >= 900 ? 'orange' : 'red'} />
        <Gauge4 icon={<Gauge size={14} />} label="Dome pressure" value={kpa.toFixed(1)} unit="kPa" pct={((kpa - 60) / 41.3) * 100} tone={kpa >= 95 ? 'green' : kpa >= 85 ? 'orange' : 'red'} />
        <Gauge4 icon={<Sun size={14} />} label="Solar power" value={kw.toFixed(1)} unit="kW" pct={(kw / 8) * 100} tone={t?.dust ? 'orange' : 'blue'} />
      </div>
    </div>
  )
}
