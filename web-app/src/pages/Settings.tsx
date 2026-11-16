import { useState } from 'react'
import { Palette, Layout, ShieldCheck, Info, RotateCcw, Zap, Database, ChevronDown } from 'lucide-react'
import { useApp } from '../state/AppState'
import { THEMES, DEFAULT_PREFERENCES, type AppearanceMode, type FontFamily, type FontSize, type Density, type BorderRadius } from '../lib/themes'
import LivePreview from '../components/LivePreview'
import * as LucideIcons from 'lucide-react'

type SettingsSection = 'appearance' | 'interface' | 'accessibility' | 'ai' | 'data' | 'reset' | 'info'

const SECTIONS: Array<{ id: SettingsSection; label: string; icon: React.ComponentType<{ size: number }> }> = [
  { id: 'appearance', label: 'Appearance & Themes', icon: Palette },
  { id: 'interface', label: 'Interface Preferences', icon: Layout },
  { id: 'accessibility', label: 'Accessibility', icon: ShieldCheck },
  { id: 'ai', label: 'AI & Mission Intelligence', icon: Zap },
  { id: 'data', label: 'Data & Storage', icon: Database },
  { id: 'reset', label: 'Reset to Defaults', icon: RotateCcw },
  { id: 'info', label: 'Application Information', icon: Info },
]

const ICON_MAP: Record<string, React.ComponentType<{ size: number }>> = {
  sprout: LucideIcons.Sprout,
  orbit: LucideIcons.Orbit,
  flame: LucideIcons.Flame,
  droplets: LucideIcons.Droplets,
}

export default function SettingsPage() {
  const { preferences, setPreferences, status } = useApp()
  const [expandedSection, setExpandedSection] = useState<SettingsSection | null>('appearance')
  const [resetConfirming, setResetConfirming] = useState(false)

  const updatePref = <K extends keyof typeof preferences>(key: K, value: typeof preferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES)
    setResetConfirming(false)
  }

  const toggleSection = (sectionId: SettingsSection) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="mt-2 text-gray-400">Customize your application experience</p>
      </div>

      {/* Two-column layout: Sections on left, Live Preview on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-96">
        {/* Left: Collapsible Sections (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-2">
          {SECTIONS.map(section => {
            const Icon = section.icon
            const isExpanded = expandedSection === section.id

            return (
              <div key={section.id} className="border border-white/10 rounded-lg overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition ${
                    isExpanded
                      ? 'bg-white/10 text-white border-b border-white/10'
                      : 'bg-white/5 text-gray-300 hover:bg-white/8'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span className="font-medium text-sm">{section.label}</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Section Content */}
                {isExpanded && (
                  <div className="px-4 py-6 space-y-6 bg-black/20">
                    {section.id === 'appearance' && (
                      <>
                        {/* Theme Selection */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-200 mb-3">Application Theme</label>
                            <p className="text-xs text-gray-400 mb-4">Choose a color palette for your interface</p>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {THEMES.map(theme => {
                              const IconComponent = ICON_MAP[theme.icon] || LucideIcons.Circle
                              const isSelected = preferences.theme === theme.id
                              return (
                                <button
                                  key={theme.id}
                                  onClick={() => updatePref('theme', theme.id)}
                                  className={`relative rounded-xl overflow-hidden transition-all duration-200 cursor-pointer group ${
                                    isSelected 
                                      ? 'border-2 border-white/50 shadow-xl ring-2 ring-white/20' 
                                      : 'border border-white/10 hover:border-white/20 hover:shadow-lg'
                                  }`}
                                >
                                  <div className="p-4 space-y-3" style={{ background: theme.colors.background }}>
                                    {/* Header with icon and title */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-3 flex-1">
                                        <div 
                                          className="p-2 rounded-lg" 
                                          style={{ 
                                            background: theme.colors.accentSoft,
                                            color: theme.colors.accent 
                                          }}
                                        >
                                          <IconComponent size={16} />
                                        </div>
                                        <div className="text-left flex-1">
                                          <h4 className="text-sm font-bold" style={{ color: theme.colors.primaryText }}>
                                            {theme.name}
                                          </h4>
                                          <p className="text-xs" style={{ color: theme.colors.mutedText }}>
                                            {theme.description}
                                          </p>
                                        </div>
                                      </div>
                                      {/* Selected indicator */}
                                      {isSelected && (
                                        <div 
                                          className="ml-2 flex-shrink-0"
                                          style={{ color: theme.colors.accent }}
                                        >
                                          <LucideIcons.Check size={16} className="font-bold" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Color palette swatches */}
                                    <div className="pt-2 space-y-2">
                                      <div className="flex gap-1.5 h-6">
                                        <div 
                                          className="flex-1 rounded-md border border-white/10 transition group-hover:scale-105" 
                                          style={{ background: theme.colors.surface }}
                                          title="Surface"
                                        />
                                        <div 
                                          className="flex-1 rounded-md border border-white/10 transition group-hover:scale-105" 
                                          style={{ background: theme.colors.accent }}
                                          title="Accent"
                                        />
                                        <div 
                                          className="flex-1 rounded-md border border-white/10 transition group-hover:scale-105" 
                                          style={{ background: theme.colors.elevatedSurface }}
                                          title="Elevated"
                                        />
                                      </div>
                                      <p className="text-xs" style={{ color: theme.colors.mutedText }}>
                                        Primary palette
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Appearance Mode */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">Appearance Mode</label>
                          <select
                            value={preferences.appearanceMode}
                            onChange={(e) => updatePref('appearanceMode', e.target.value as AppearanceMode)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/8 transition cursor-pointer"
                          >
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                          </select>
                        </div>

                        {/* Font Family */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">Font Family</label>
                          <select
                            value={preferences.fontFamily}
                            onChange={(e) => updatePref('fontFamily', e.target.value as FontFamily)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/8 transition cursor-pointer"
                          >
                            <option value="system">System</option>
                            <option value="inter">Inter</option>
                            <option value="hyperlegible">Atkinson Hyperlegible</option>
                          </select>
                        </div>

                        {/* Font Size */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">Font Size</label>
                          <select
                            value={preferences.fontSize}
                            onChange={(e) => updatePref('fontSize', e.target.value as FontSize)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/8 transition cursor-pointer"
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </div>
                      </>
                    )}

                    {section.id === 'interface' && (
                      <>
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">Interface Density</label>
                          <select
                            value={preferences.density}
                            onChange={(e) => updatePref('density', e.target.value as Density)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/8 transition cursor-pointer"
                          >
                            <option value="compact">Compact</option>
                            <option value="comfortable">Comfortable</option>
                            <option value="spacious">Spacious</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">Border Radius</label>
                          <select
                            value={preferences.borderRadius}
                            onChange={(e) => updatePref('borderRadius', e.target.value as BorderRadius)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/8 transition cursor-pointer"
                          >
                            <option value="sharp">Sharp</option>
                            <option value="standard">Standard</option>
                            <option value="rounded">Rounded</option>
                          </select>
                        </div>
                      </>
                    )}

                    {section.id === 'accessibility' && (
                      <>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.largerText}
                              onChange={(e) => updatePref('largerText', e.target.checked)}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-300">Larger Text</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.highContrast}
                              onChange={(e) => updatePref('highContrast', e.target.checked)}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-300">High Contrast</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.reducedMotion}
                              onChange={(e) => updatePref('reducedMotion', e.target.checked)}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-300">Reduced Motion</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.visibleKeyboardFocus}
                              onChange={(e) => updatePref('visibleKeyboardFocus', e.target.checked)}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-300">Visible Keyboard Focus</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.colorIndependentIndicators}
                              onChange={(e) => updatePref('colorIndependentIndicators', e.target.checked)}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-300">Colour-Independent Indicators</span>
                          </label>
                        </div>
                      </>
                    )}

                    {section.id === 'ai' && (
                      <div className="text-gray-400 text-sm">
                        <p>AI and Mission Intelligence settings will be configured here.</p>
                      </div>
                    )}

                    {section.id === 'data' && (
                      <div className="text-gray-400 text-sm">
                        <p>Data storage and persistence settings will be managed here.</p>
                      </div>
                    )}

                    {section.id === 'reset' && (
                      <>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-300">
                            Reset all preferences to their default values. This action cannot be undone.
                          </p>
                          {!resetConfirming ? (
                            <button
                              onClick={() => setResetConfirming(true)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 text-gray-300 hover:bg-white/8 transition"
                            >
                              <RotateCcw size={16} />
                              <span>Reset to Defaults</span>
                            </button>
                          ) : (
                            <div className="space-y-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                              <p className="text-sm text-red-300">Are you sure? This will restore all settings to defaults.</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleReset}
                                  className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition text-sm font-medium"
                                >
                                  Confirm Reset
                                </button>
                                <button
                                  onClick={() => setResetConfirming(false)}
                                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/8 transition text-sm font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {section.id === 'info' && (
                      <div className="space-y-2 text-sm">
                        <p><strong>Application:</strong> Life Beyond Earth</p>
                        <p><strong>Version:</strong> 0.1.0</p>
                        <p><strong>Backend:</strong> {status === 'live' ? 'Connected' : 'Demo Mode'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: Live Preview (1/3 width on desktop, full width on mobile) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 border border-white/10 rounded-lg p-4 bg-white/5 h-auto max-h-96 lg:max-h-full">
            <LivePreview />
          </div>
        </div>
      </div>
    </div>
  )
}

