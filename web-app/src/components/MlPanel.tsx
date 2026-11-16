import { Brain } from 'lucide-react'
import { api } from '../api'
import { useAsync } from '../hooks'
import { Badge, Card, Meter, Spinner } from './ui'
import { splitName } from '../lib'

/** SI machine-learning model: accuracy (R² / MAE) and feature importances, plus an optional pair prediction. */
export default function MlPanel({ planet, plant }: { planet?: string; plant?: string }) {
  const insights = useAsync(() => api.ml.insights(), [])
  const pair = useAsync(() => (planet && plant ? api.ml.predict(planet, plant) : Promise.resolve(null)), [planet, plant])
  const m = insights.data
  const top = m?.importances.slice(0, 6) ?? []
  const max = Math.max(...top.map((i) => i.importance), 0.0001)
  return (
    <Card tone="purple" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold"><Brain size={18} className="text-ios-purple" /> Mission Memory Feature Importance &amp; Model Accuracy</div>
        {m && <Badge tone="purple">{m.model_name}</Badge>}
      </div>
      {insights.loading || !m ? <Spinner label="Training Mission Memory model…" /> : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
            <div className="rounded-xl bg-white/5 p-3"><div className="text-xs text-gray-400">R² (held-out)</div><div className="text-xl font-bold text-ios-green">{m.r2.toFixed(3)}</div></div>
            <div className="rounded-xl bg-white/5 p-3"><div className="text-xs text-gray-400">MAE</div><div className="text-xl font-bold text-ios-blue">±{m.mae.toFixed(2)} pts</div></div>
            <div className="rounded-xl bg-white/5 p-3"><div className="text-xs text-gray-400">Training samples</div><div className="text-xl font-bold">{m.samples}</div></div>
            <div className="rounded-xl bg-white/5 p-3"><div className="text-xs text-gray-400">ML score {planet && plant ? `· ${splitName(plant).label}` : ''}</div>
              <div className={`text-xl font-bold ${pair.data ? 'text-ios-orange' : 'text-gray-500'}`}>{pair.data ? `${pair.data.predicted_score}%` : pair.loading ? '…' : '—'}</div></div>
          </div>
          <div className="space-y-2">
            {top.map((i) => (
              <div key={i.feature}>
                <div className="mb-0.5 flex justify-between text-xs text-gray-300"><span>{i.feature}</span><span>{(i.importance * 100).toFixed(1)}%</span></div>
                <Meter value={(i.importance / max) * 100} tone="purple" />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Permutation importance on a held-out split. Trained on physics-generated samples{m.history_samples ? ` + ${m.history_samples} real missions from your history` : ''}.</p>
        </>
      )}
    </Card>
  )
}
