import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      navExpanded: true,
      youtubeApiKey: '',
      aiProvider: 'openrouter',
      aiApiKey: '',
      outlierThreshold: 4,
      channelBaseline: 15,
      setTheme: (theme) => set({ theme }),
      setNavExpanded: (expanded) => set({ navExpanded: expanded }),
      setYoutubeApiKey: (key) => set({ youtubeApiKey: key }),
      setAiProvider: (provider) => set({ aiProvider: provider }),
      setAiApiKey: (key) => set({ aiApiKey: key }),
      setOutlierThreshold: (threshold) => set({ outlierThreshold: threshold }),
      setChannelBaseline: (baseline) => set({ channelBaseline: baseline }),
    }),
    { name: 'yt-settings' }
  )
)
