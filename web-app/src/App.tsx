import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from './state/AppState'
import Navbar from './components/Navbar'
import HomePage from './pages/Home'
import PlanetsPage from './pages/Planets'
import PlantsPage from './pages/Plants'
import MissionPrepPage from './pages/MissionPrep'
import SimulationPage from './pages/Simulation'
import ResultPage from './pages/Result'
import DashboardPage from './pages/Dashboard'
import HistoryPage from './pages/History'
import MemoryPage from './pages/Memory'
import AboutPage from './pages/About'
import SettingsPage from './pages/Settings'
import PlanetDetailPage from './pages/PlanetDetail'
import PlantDetailPage from './pages/PlantDetail'
import BioDomePage from './pages/BioDome'
import PowerGridPage from './pages/PowerGrid'
import HabitatEngineeringPage from './pages/HabitatEngineering'
import MorePage from './pages/More'

function Pages() {
  const { pathname } = useLocation()
  return (
    <main key={pathname} className="mx-auto max-w-7xl px-4 py-8 animate-fade-up">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/planets" element={<PlanetsPage />} />
        <Route path="/planets/:id" element={<PlanetDetailPage />} />
        <Route path="/plants" element={<PlantsPage />} />
        <Route path="/plants/:id" element={<PlantDetailPage />} />
        <Route path="/prep" element={<MissionPrepPage />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/biodome" element={<BioDomePage />} />
        <Route path="/memory" element={<MemoryPage />} />
        <Route path="/power-grid" element={<PowerGridPage />} />
        <Route path="/habitat-engineering" element={<HabitatEngineeringPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </main>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Navbar />
        <div className="app-main"><Pages /></div>
        <footer className="border-t border-white/10 bg-black/40 px-4 py-3 text-center text-xs text-gray-500">
          Built for the NASA Space Apps Challenge using public NASA open data. Not an official NASA product.
        </footer>
      </HashRouter>
    </AppProvider>
  )
}
