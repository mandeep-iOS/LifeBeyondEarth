import { Link } from 'react-router-dom'
import { Bot, Zap, Wrench, Brain, ArrowRight } from 'lucide-react'
import { Button, Card, PageHeader } from '../components/ui'

export default function MorePage() {
  const specialists = [
    {
      to: '/biodome',
      icon: Bot,
      title: 'Bio-Dome Laboratory',
      desc: 'Monitor plant growth conditions and experiment with controlled environmental settings.',
      emoji: '🧬',
    },
    {
      to: '/power-grid',
      icon: Zap,
      title: 'Power & ECLSS Systems',
      desc: 'Manage energy distribution and environmental control lifecycle systems.',
      emoji: '⚡',
    },
    {
      to: '/habitat-engineering',
      icon: Wrench,
      title: 'Habitat Engineering',
      desc: 'Design and analyze off-world habitat structures and resource management.',
      emoji: '🏗️',
    },
    {
      to: '/memory',
      icon: Brain,
      title: 'Mission Memory',
      desc: 'Review mission outcomes and learned adaptation patterns.',
      emoji: '🤖',
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Advanced Tools — Version 1.0" subtitle="Explore the specialist systems that support LifeBeyondEarth's mission-survival concept." />

      <Card className="bg-blue-900/10 border-blue-500/20">
        <p className="text-gray-300">
          These tools provide additional ways to examine biological systems, habitat engineering, power and life-support operations, and robotic mission memory. Select a tool to explore its capabilities and understand how it contributes to mission planning and system analysis.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {specialists.map(({ to, icon: Icon, title, desc, emoji }) => (
          <Link key={to} to={to}>
            <Card className="h-full cursor-pointer transition hover:bg-white/10">
              <div className="mb-3 flex items-start justify-between">
                <div className="text-4xl">{emoji}</div>
                <Icon size={20} className="text-ios-blue" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-gray-400 mb-4">{desc}</p>
              <div className="flex items-center gap-2 text-ios-blue text-sm font-medium">
                <span>Access tool</span>
                <ArrowRight size={14} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="rounded-xl bg-gradient-to-r from-ios-blue/10 to-ios-purple/10 border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-2">🚀 Mission Control Hub</h3>
        <p className="text-sm text-gray-300 mb-4">
          Return to the main mission workflow to explore planetary environments, select biological systems, run simulations, and review mission results.
        </p>
        <Link to="/"><Button variant="ghost">← Back to Mission Control</Button></Link>
      </div>
    </div>
  )
}
