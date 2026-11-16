import { useApp } from '../state/AppState'
import { THEMES } from '../lib/themes'
import * as LucideIcons from 'lucide-react'

export default function LivePreview() {
  const { preferences } = useApp()

  const theme = THEMES.find(t => t.id === preferences.theme)
  if (!theme) return null

  const sizeMap = { small: '0.875', medium: '1', large: '1.125' }
  const densityMap = { compact: '0.75', comfortable: '1', spacious: '1.25' }
  const radiusMap = { sharp: '0px', standard: '8px', rounded: '16px' }

  let fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
  if (preferences.fontFamily === 'inter') {
    fontStack = '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
  } else if (preferences.fontFamily === 'hyperlegible') {
    fontStack = '"Atkinson Hyperlegible", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
  }

  const scaledFontSize = parseFloat(sizeMap[preferences.fontSize]) * 16
  const scaledSpacing = parseFloat(densityMap[preferences.density])
  const largeText = preferences.largerText

  // Compose body classes preview
  const classNames = [
    preferences.highContrast && 'high-contrast',
    preferences.reducedMotion && 'reduced-motion',
    preferences.visibleKeyboardFocus && 'visible-focus',
    preferences.colorIndependentIndicators && 'color-independent-indicators',
    largeText && 'larger-text',
  ].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="text-center flex-shrink-0">
        <h3 className="text-xs font-bold tracking-wider text-gray-200">LIVE PREVIEW</h3>
        <p className="text-xs text-gray-500 mt-1">Current Settings</p>
      </div>

      <div
        className="flex-1 rounded-lg overflow-hidden border border-white/20 bg-black/30 flex flex-col"
        style={{
          background: theme.colors.background,
          fontFamily: fontStack,
          fontSize: `${scaledFontSize}px`,
          color: theme.colors.primaryText,
          minHeight: '0',
        }}
      >
        <div className="p-4 space-y-4 overflow-y-auto flex flex-col flex-1">
          {/* Mock Navbar */}
          <div
            className="rounded-md p-2 space-y-1 flex-shrink-0"
            style={{
              background: theme.colors.sidebar,
              borderRadius: radiusMap[preferences.borderRadius],
            }}
          >
            <div className="flex items-center gap-2 px-2 py-1.5">
              <LucideIcons.Home size={14} />
              <span className="text-xs font-medium">Home</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white/10 rounded" style={{ borderRadius: radiusMap[preferences.borderRadius] }}>
              <LucideIcons.Settings size={14} />
              <span className="text-xs font-medium">Settings</span>
            </div>
          </div>

          {/* Mock Content Card */}
          <div
            className="rounded-md p-3 space-y-2 flex-shrink-0"
            style={{
              background: theme.colors.surface,
              borderRadius: radiusMap[preferences.borderRadius],
              borderColor: theme.colors.border,
              borderWidth: '1px',
              marginBottom: `${8 * scaledSpacing}px`,
            }}
          >
            <h4 className="text-xs font-bold" style={{ color: theme.colors.primaryText }}>
              Sample Content
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: theme.colors.secondaryText }}>
              {preferences.fontFamily === 'system' ? 'System Font' : preferences.fontFamily === 'inter' ? 'Inter' : 'Hyperlegible'}
            </p>
            <p className="text-xs leading-relaxed capitalize" style={{ color: theme.colors.secondaryText }}>
              Density: {preferences.density}
            </p>
          </div>

          {/* Mock Button */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              className="flex-1 text-xs font-medium py-2 px-2 transition"
              style={{
                background: theme.colors.accent,
                color: theme.colors.background,
                borderRadius: radiusMap[preferences.borderRadius],
              }}
            >
              Action
            </button>
            <button
              className="flex-1 text-xs font-medium py-2 px-2 border transition"
              style={{
                color: theme.colors.accent,
                borderColor: theme.colors.border,
                borderRadius: radiusMap[preferences.borderRadius],
              }}
            >
              Secondary
            </button>
          </div>

          {/* Status Indicator */}
          <div className="flex gap-2 pt-2 flex-shrink-0">
            <div
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{
                background: theme.colors.accent,
              }}
            />
            <span className="text-xs" style={{ color: theme.colors.mutedText }}>
              Active status
            </span>
          </div>

          {/* Settings info */}
          <div className="text-xs space-y-1 mt-auto pt-3 border-t flex-shrink-0" style={{ borderColor: theme.colors.border }}>
            <p style={{ color: theme.colors.mutedText }}>
              <strong>Theme:</strong> {theme.name}
            </p>
            <p style={{ color: theme.colors.mutedText }}>
              <strong>Size:</strong> {preferences.fontSize}
            </p>
            <p style={{ color: theme.colors.mutedText }}>
              <strong>Radius:</strong> {preferences.borderRadius}
            </p>
            {classNames && (
              <p style={{ color: theme.colors.mutedText }}>
                <strong>Features:</strong> {classNames}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
