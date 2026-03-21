import { Routes, Route, Navigate } from 'react-router-dom'
import { useSettingsStore } from './store/slices/settingsSlice'
import AppShell from './components/layout/AppShell'
import OutlierResearch from './components/sections/OutlierResearch'
import ChannelAnalysis from './components/sections/ChannelAnalysis'
import TopicValidation from './components/sections/TopicValidation'
import PatternAnalysis from './components/sections/PatternAnalysis'
import APIKeys from './components/sections/APIKeys'
import ThemeChanger from './components/sections/ThemeChanger'

export default function App() {
  const { theme } = useSettingsStore()

  return (
    <div className={theme} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/outlier" replace />} />
          <Route path="/outlier" element={<OutlierResearch />} />
          <Route path="/channel" element={<ChannelAnalysis />} />
          <Route path="/validation" element={<TopicValidation />} />
          <Route path="/pattern" element={<PatternAnalysis />} />
          <Route path="/apikeys" element={<APIKeys />} />
          <Route path="/theme" element={<ThemeChanger />} />
        </Routes>
      </AppShell>
    </div>
  )
}
