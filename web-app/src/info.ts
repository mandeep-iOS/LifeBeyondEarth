import type { Exoplanet, Planet, Plant } from './api'
import { splitName } from './lib'

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const kToC = (k: number) => Math.round(k - 273.15)
export const exoToPlanet = (e: Exoplanet): Planet => {
  const temperature = kToC(e.equilibrium_temp_k)
  return { name: `🔭 ${e.name}`, temperature, pressure: e.radius_earth < 1.6 ? 101.3 : 1000, radiation: 50, water_available: temperature >= 0 && temperature <= 100 }
}

const SCIENCE: Record<string, string> = {
  mercury: 'https://science.nasa.gov/mercury/', venus: 'https://science.nasa.gov/venus/', earth: 'https://science.nasa.gov/earth/',
  mars: 'https://science.nasa.gov/mars/', jupiter: 'https://science.nasa.gov/jupiter/', saturn: 'https://science.nasa.gov/saturn/',
  uranus: 'https://science.nasa.gov/uranus/', neptune: 'https://science.nasa.gov/neptune/', pluto: 'https://science.nasa.gov/dwarf-planets/pluto/',
  moon: 'https://science.nasa.gov/moon/',
}
const NOTES: Record<string, string> = {
  mercury: 'NASA MESSENGER data: no atmosphere, extreme day/night swings and heavy solar radiation.',
  venus: 'NASA Magellan/Pioneer data: crushing CO₂ atmosphere and surface heat above 460 °C.',
  earth: 'Baseline habitat: liquid water, magnetosphere shielding and a breathable atmosphere.',
  mars: 'NASA rover data: thin CO₂ air, perchlorate soil, frozen water ice and high surface radiation.',
  jupiter: 'NASA Juno data: gas giant with intense radiation belts and no solid surface.',
  saturn: 'NASA Cassini data: gas giant, extremely cold cloud tops, no surface to grow on.',
  uranus: 'NASA Voyager 2 data: ice giant with the coldest recorded planetary atmosphere.',
  neptune: 'NASA Voyager 2 data: ice giant with supersonic winds and deep cold.',
  pluto: 'NASA New Horizons data: frozen nitrogen surface and near-vacuum atmosphere.',
  moon: 'NASA LRO/Apollo data: no atmosphere, ~14-day nights and unshielded radiation; water ice at the poles.',
}

export interface PlanetSpec {
  id: string; label: string; kind: 'Solar System' | 'NASA Exoplanet'; planet: Planet; nasaUrl: string; note: string
  extra: { label: string; value: string }[]; category?: string; researchPurpose?: string
}
export const specFromPlanet = (p: Planet): PlanetSpec => {
  const label = splitName(p.name).label, id = slug(label)
  const nearEarth = ['earth', 'moon', 'mars', 'venus', 'mercury']
  const category = nearEarth.includes(id) ? 'Near-Earth' : 'Extreme Environment'
  const researchPurposes: Record<string, string> = {
    earth: 'Baseline habitat for comparison',
    moon: 'Potential lunar colony site',
    mars: 'Primary human settlement target',
    venus: 'Extreme pressure/temperature research',
    mercury: 'Solar radiation tolerance study',
    jupiter: 'Gas giant atmospheric research',
    saturn: 'Low-gravity environment adaptation',
    uranus: 'Ultra-cold climate survival',
    neptune: 'Extreme cold adaptation research',
    pluto: 'Frozen-world survival study',
  }
  return { id, label, kind: 'Solar System', planet: p, nasaUrl: SCIENCE[id] ?? 'https://science.nasa.gov/solar-system/', 
    extra: [],
    category,
    researchPurpose: researchPurposes[id],
    note: NOTES[id] ?? 'Mission-catalog parameters used by the simulation engine.' }
}
export const specFromExo = (e: Exoplanet): PlanetSpec => ({
  id: `exo-${slug(e.name)}`, label: e.name, kind: 'NASA Exoplanet', planet: exoToPlanet(e),
  nasaUrl: `https://exoplanetarchive.ipac.caltech.edu/overview/${encodeURIComponent(e.name)}`,
  category: 'Exoplanet Research',
  researchPurpose: 'Habitable-zone characterization and biosignature detection',
  note: 'NASA Exoplanet Archive: equilibrium temperature is measured; pressure and radiation are estimated from planet radius.',
  extra: [
    { label: 'Equilibrium temp', value: `${e.equilibrium_temp_k} K` }, { label: 'Radius', value: `${e.radius_earth} R⊕` },
    { label: 'Orbit', value: e.orbit_au != null ? `${e.orbit_au} AU` : '—' }, { label: 'Host star', value: e.host },
    { label: 'Discovered', value: String(e.discovery_year) },
  ],
})

export interface Check { name: string; ok: boolean; detail: string }
export function suitability(p: Planet, pl: Plant): { score: number; checks: Check[] } {
  const checks: Check[] = [
    { name: 'Temperature', ok: p.temperature >= pl.cold_tolerance && p.temperature <= 45, detail: `${p.temperature}°C vs limit ${pl.cold_tolerance}°C…45°C` },
    { name: 'Radiation', ok: p.radiation <= pl.radiation_tolerance, detail: `${p.radiation}/100 vs tolerance ${pl.radiation_tolerance}` },
    { name: 'Water', ok: p.water_available || pl.water_need < 40, detail: `${p.water_available ? 'available' : 'none'} · crop needs ${pl.water_need}%` },
    { name: 'Pressure', ok: p.pressure >= 1 && p.pressure <= 300, detail: `${p.pressure} kPa` },
  ]
  return { score: Math.round((checks.filter((c) => c.ok).length / checks.length) * 100), checks }
}

// Every study ID below was checked against the OSDR API (title + HTTP 200). Fallback is the OSDR search.
const OSDR_STUDY = (n: number) => `https://osdr.nasa.gov/bio/repo/data/studies/OSD-${n}`
const OSDR_ARABIDOPSIS = 'https://osdr.nasa.gov/bio/repo/search?q=Arabidopsis&data_source=cgene,alsda&data_type=study'
const PLANT_NASA_URLS: Record<string, string> = {
  'red romaine lettuce': OSDR_STUDY(385), // Red Romaine lettuce grown on ISS Veggie
  'space cabbage': OSDR_STUDY(412), // VEG-03D multi-species leafy greens incl. Chinese cabbage
  'mizuna mustard': OSDR_STUDY(59), // Mizuna in long-term spaceflight
  'dwarf tomato': OSDR_STUDY(766), // Tomato crop grown in Veggie on the ISS
}
export const plantNasaUrl = (name: string) => PLANT_NASA_URLS[splitName(name).label.toLowerCase()] ?? OSDR_ARABIDOPSIS
export const plantNote = (pl: Plant) =>
  `NASA GeneLab OSDR holds spaceflight and radiation-stress studies for crops like ${splitName(pl.name).label}. Limits here are simulation values: survives to ${pl.cold_tolerance}°C, needs ${pl.water_need}% water, tolerates ${pl.radiation_tolerance}/100 radiation.`

export function plantCategory(plantName: string): { category: string; researchPurpose: string } {
  const label = splitName(plantName).label.toLowerCase()
  const outsideDomeEligible = ['cactus', 'moss', 'grass']
  const biodomeCultivation = ['red romaine', 'space cabbage', 'mizuna', 'dwarf tomato', 'tree']
  
  if (outsideDomeEligible.some(p => label.includes(p))) {
    return { category: 'Outside-Dome / Boundary-Trial Eligible', researchPurpose: 'Experimental boundary conditions under controlled environmental setup. Not proven for unprotected growth.' }
  }
  if (biodomeCultivation.some(p => label.includes(p))) {
    return { category: 'Pressurized Bio-Dome / Indoor Farmhouse Required', researchPurpose: 'Requires pressurized growing environment. Researched indoors.' }
  }
  return { category: 'Pressurized Bio-Dome / Indoor Farmhouse Required', researchPurpose: 'Requires pressurized growing environment. Researched indoors.' }
}
