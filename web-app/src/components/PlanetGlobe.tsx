import type { CSSProperties } from 'react'
import { splitName } from '../lib'

// Surface maps are NASA planetary imagery (Solar System Scope 2K maps derived
// from NASA data; Pluto from New Horizons), cached under public/textures.
const TEXTURES: [string, string, string][] = [
  ['mercury', 'mercury', '#b5b0a8'], ['venus', 'venus', '#f0b45a'], ['earth', 'earth', '#4aa3ff'],
  ['mars', 'mars', '#ff7a45'], ['jupiter', 'jupiter', '#e0a878'], ['saturn', 'saturn', '#e8d49a'],
  ['uranus', 'uranus', '#7fe3ee'], ['neptune', 'neptune', '#4a7cff'], ['pluto', 'pluto', '#d8c4b0'],
  ['moon', 'moon', '#cfcfd4'],
]

function textureFor(name: string) {
  const n = splitName(name).label.toLowerCase()
  const hit = TEXTURES.find(([k]) => n.includes(k))
  if (hit) return { url: `${import.meta.env.BASE_URL}textures/${hit[1]}.jpg`, glow: hit[2], hue: 0 }
  // Exoplanets: tint a gas-giant surface by a stable hash of the name.
  let h = 0
  for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360
  return { url: `${import.meta.env.BASE_URL}textures/neptune.jpg`, glow: `hsl(${h} 80% 60%)`, hue: h }
}

/** Continuously rotating globe with real surface imagery, atmospheric rim glow
 *  and day/night terminator shading. */
export default function PlanetGlobe({ name, size = 64, speed = 1, className = '' }: {
  name: string; size?: number; speed?: number; className?: string
}) {
  const { url, glow, hue } = textureFor(name)
  const isSaturn = name.toLowerCase().includes('saturn')
  const style = {
    '--size': `${size}px`, '--glow': glow,
    '--spin': `${Math.max(8, 70 / speed)}s`,
    width: size, height: size,
  } as CSSProperties
  return (
    <div className={`globe-wrap ${className}`} style={style} role="img" aria-label={`${name} (rotating)`}>
      {isSaturn && <div className="globe-ring" />}
      <div className="globe" style={{ backgroundImage: `url(${url})`, filter: hue ? `hue-rotate(${hue}deg)` : undefined }} />
      <div className="globe-shade" />
    </div>
  )
}
