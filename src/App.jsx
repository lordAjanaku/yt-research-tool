import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { AppShell } from './components/layout/AppShell'
import { OutlierResearch } from './components/sections/OutlierResearch'
import { ChannelAnalysis } from './components/sections/ChannelAnalysis'
import { TopicValidation } from './components/sections/TopicValidation'
import { PatternAnalysis } from './components/sections/PatternAnalysis'
import { APIKeys } from './components/sections/APIKeys'
import { ThemeChanger } from './components/sections/ThemeChanger'

export default function App() {
  const { theme } = useStore()

  useEffect(() => {
    const root = document.documentElement
    root.className = theme
  }, [theme])

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/outlier" replace />} />
        <Route path="/outlier" element={<OutlierResearch />} />
        <Route path="/channel" element={<ChannelAnalysis />} />
        <Route path="/validation" element={<TopicValidation />} />
        <Route path="/pattern" element={<PatternAnalysis />} />
        <Route path="/api-keys" element={<APIKeys />} />
        <Route path="/theme" element={<ThemeChanger />} />
      </Routes>
    </AppShell>
  )
}
