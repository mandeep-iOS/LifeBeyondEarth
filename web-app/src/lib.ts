// Planet/plant names carry a leading emoji ("🔴 Mars"). Split for display.
export function splitName(name: string): { emoji: string; label: string } {
  const m = name.match(/^(\S+)\s+(.*)$/u)
  return m && !/^[A-Za-z0-9]/.test(m[1]) ? { emoji: m[1], label: m[2] } : { emoji: '🪐', label: name }
}

export type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'

export function scoreTone(score: number): Tone {
  return score >= 80 ? 'green' : score >= 50 ? 'orange' : 'red'
}
export const toneHex: Record<Tone, string> = {
  blue: '#0a84ff', green: '#30d158', orange: '#ff9f0a', red: '#ff453a', purple: '#bf5af2', gray: '#8e8e93',
}

export function difficultyFor(planetName: string): { level: string; explanation: string } {
  const n = planetName.toLowerCase()
  if (n.includes('earth')) return { level: 'Easy', explanation: 'Earth baseline: damage and robot energy costs are halved.' }
  if (n.includes('mars')) return { level: 'Hard', explanation: 'Mars: 1.8× plant damage, 0.8× robot energy cost, 1.2× emergency support.' }
  if (n.includes('moon')) return { level: 'Extreme', explanation: 'Moon: 2× plant damage, no atmosphere.' }
  return { level: 'Normal', explanation: 'Standard difficulty modifiers.' }
}

export function fmtDate(iso: string): string {
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z')
  return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

const stripSymbols = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, '').trim()
// Splits raw robot log text into memory insight lines and countermeasure lines.
export function parseRobotAction(raw: string): { memory: string[]; actions: string[] } {
  const memory: string[] = [], actions: string[] = []
  let cur: string[] | null = null, idx = -1
  for (const line of raw.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (/^[^\p{L}\p{N}]/u.test(line)) {
      cur = /^(🧠|📊)/u.test(line) ? memory : actions
      cur.push(stripSymbols(line)); idx = cur.length - 1
    } else if (cur) cur[idx] = `${cur[idx]} ${line}`
    else { cur = actions; actions.push(line); idx = 0 }
  }
  const clean = (a: string[]) => [...new Set(a.map((x) => x.replace(/^Memory:\s*/i, '').trim()).filter(Boolean))]
  return { memory: clean(memory), actions: clean(actions) }
}
