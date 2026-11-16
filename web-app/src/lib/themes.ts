export type ThemeId = 'deep-space-green' | 'cosmic-navy' | 'mars-horizon' | 'biosphere-teal'

export interface ThemePalette {
  name: string
  description: string
  id: ThemeId
  icon: string
  colors: {
    background: string
    sidebar: string
    surface: string
    elevatedSurface: string
    border: string
    accent: string
    accentSoft: string
    primaryText: string
    secondaryText: string
    mutedText: string
  }
}

export const THEMES: ThemePalette[] = [
  {
    name: 'Deep Space Green',
    description: 'Primary theme for LifeBeyondEarth',
    id: 'deep-space-green',
    icon: 'sprout',
    colors: {
      background: '#060D0B',
      sidebar: '#080F0D',
      surface: '#0B1714',
      elevatedSurface: '#10211B',
      border: '#132A24',
      accent: '#10B981',
      accentSoft: '#123D30',
      primaryText: '#F1F5F9',
      secondaryText: '#CBD5D1',
      mutedText: '#94A3A0',
    }
  },
  {
    name: 'Cosmic Navy',
    description: 'Deep space exploration theme',
    id: 'cosmic-navy',
    icon: 'orbit',
    colors: {
      background: '#070B14',
      sidebar: '#080F1C',
      surface: '#101B2C',
      elevatedSurface: '#172944',
      border: '#253A55',
      accent: '#38BDF8',
      accentSoft: '#12334A',
      primaryText: '#F1F5F9',
      secondaryText: '#CBD5E1',
      mutedText: '#94A3B8',
    }
  },
  {
    name: 'Mars Horizon',
    description: 'Rustic Martian landscape theme',
    id: 'mars-horizon',
    icon: 'flame',
    colors: {
      background: '#120B09',
      sidebar: '#190E0A',
      surface: '#24140F',
      elevatedSurface: '#382017',
      border: '#503024',
      accent: '#F97316',
      accentSoft: '#482313',
      primaryText: '#FFF7ED',
      secondaryText: '#E7D5C8',
      mutedText: '#B8A092',
    }
  },
  {
    name: 'Biosphere Teal',
    description: 'Thriving life systems theme',
    id: 'biosphere-teal',
    icon: 'droplets',
    colors: {
      background: '#061113',
      sidebar: '#08191B',
      surface: '#0D2023',
      elevatedSurface: '#153236',
      border: '#23464A',
      accent: '#2DD4BF',
      accentSoft: '#123D3A',
      primaryText: '#F0FDFA',
      secondaryText: '#CCFBF1',
      mutedText: '#99BDB7',
    }
  },
]

export type AppearanceMode = 'dark' | 'system'
export type FontFamily = 'system' | 'inter' | 'hyperlegible'
export type FontSize = 'small' | 'medium' | 'large'
export type Density = 'compact' | 'comfortable' | 'spacious'
export type BorderRadius = 'sharp' | 'standard' | 'rounded'

export interface UserPreferences {
  theme: ThemeId
  appearanceMode: AppearanceMode
  fontFamily: FontFamily
  fontSize: FontSize
  density: Density
  borderRadius: BorderRadius
  largerText: boolean
  highContrast: boolean
  reducedMotion: boolean
  visibleKeyboardFocus: boolean
  colorIndependentIndicators: boolean
  defaultLandingPage: string
  sidebarCollapsed: boolean
  selectedMissionExpanded: boolean
  rememberLastPage: boolean
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'deep-space-green',
  appearanceMode: 'dark',
  fontFamily: 'system',
  fontSize: 'medium',
  density: 'comfortable',
  borderRadius: 'standard',
  largerText: false,
  highContrast: false,
  reducedMotion: false,
  visibleKeyboardFocus: false,
  colorIndependentIndicators: false,
  defaultLandingPage: '/',
  sidebarCollapsed: false,
  selectedMissionExpanded: false,
  rememberLastPage: false,
}

export function applyTheme(preferences: UserPreferences) {
  const theme = THEMES.find(t => t.id === preferences.theme)
  if (!theme) return

  const root = document.documentElement
  const colors = theme.colors

  // Set CSS variables that match what index.css actually uses
  root.style.setProperty('--color-theme-background', colors.background)
  root.style.setProperty('--color-theme-sidebar', colors.sidebar)
  root.style.setProperty('--color-theme-card', colors.surface)
  root.style.setProperty('--color-theme-elevated', colors.elevatedSurface)
  root.style.setProperty('--color-theme-border', colors.border)
  root.style.setProperty('--color-theme-accent', colors.accent)
  root.style.setProperty('--color-theme-text', colors.primaryText)
  root.style.setProperty('--color-theme-text-secondary', colors.secondaryText)
  root.style.setProperty('--color-theme-text-muted', colors.mutedText)

  // Set font family with proper fallbacks
  let fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
  if (preferences.fontFamily === 'inter') {
    fontStack = '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
  } else if (preferences.fontFamily === 'hyperlegible') {
    fontStack = '"Atkinson Hyperlegible", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
  }
  root.style.setProperty('--font-sans', fontStack)

  // Font size scaling: scales all text via base font-size
  const sizeMap = { small: '0.875', medium: '1', large: '1.125' }
  root.style.setProperty('--font-size-scale', sizeMap[preferences.fontSize])

  // Density/Spacing scaling: scales spacing utilities
  const densityMap = { compact: '0.75', comfortable: '1', spacious: '1.25' }
  root.style.setProperty('--spacing-scale', densityMap[preferences.density])

  // Border radius scaling: applies to rounded corners
  const radiusMap = { sharp: '0px', standard: '8px', rounded: '16px' }
  root.style.setProperty('--border-radius-scale', radiusMap[preferences.borderRadius])

  // Accessibility toggles via body classes
  root.classList.toggle('high-contrast', preferences.highContrast)
  root.classList.toggle('reduced-motion', preferences.reducedMotion)
  root.classList.toggle('visible-focus', preferences.visibleKeyboardFocus)
  root.classList.toggle('color-independent-indicators', preferences.colorIndependentIndicators)
  root.classList.toggle('larger-text', preferences.largerText)
}

export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem('lbe-user-preferences-v1')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.appearanceMode === 'light') {
        parsed.appearanceMode = 'dark'
      }
      if (parsed.theme === 'lunar-light') {
        parsed.theme = 'deep-space-green'
      }
      return { ...DEFAULT_PREFERENCES, ...parsed }
    }
  } catch { }
  return DEFAULT_PREFERENCES
}

export function savePreferences(prefs: UserPreferences) {
  localStorage.setItem('lbe-user-preferences-v1', JSON.stringify(prefs))
  applyTheme(prefs)
}
