import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getQualifies } from '../utils/qualify'

const STORAGE_KEY = 'yt-research-tool-v1'

export const useStore = create(
  persist(
    (set, get) => ({
      // ─ SETTINGS
      theme: 'theme-amber',
      navExpanded: true,
      activeSection: 'outlier',
      ytApiKey: '',
      aiProvider: 'openrouter',
      aiApiKey: '',
      outlierThreshold: 4,
      channelBaseline: 15,

      setTheme: (theme) => set({ theme }),
      setNavExpanded: (v) => set({ navExpanded: v }),
      setActiveSection: (s) => set({ activeSection: s }),
      setYtApiKey: (k) => set({ ytApiKey: k }),
      setAiProvider: (p) => set({ aiProvider: p }),
      setAiApiKey: (k) => set({ aiApiKey: k }),
      setOutlierThreshold: (t) => set({ outlierThreshold: t }),
      setChannelBaseline: (b) => set({ channelBaseline: b }),

      // ─ OUTLIER ENTRIES
      entries: [],

      addEntry: (entry) => set((s) => ({
        entries: [...s.entries, {
          ...entry,
          id: Date.now() + Math.random(),
          qualifies: getQualifies({ ...entry, threshold: s.outlierThreshold }),
        }]
      })),

      updateEntry: (id, patch) => set((s) => ({
        entries: s.entries.map(e =>
          e.id === id
            ? { ...e, ...patch, qualifies: getQualifies({ ...e, ...patch, threshold: s.outlierThreshold }) }
            : e
        )
      })),

      deleteEntry: (id) => set((s) => ({ entries: s.entries.filter(e => e.id !== id) })),

      deleteEntries: (ids) => set((s) => ({ entries: s.entries.filter(e => !ids.has(e.id)) })),

      importEntries: (arr) => set({ entries: arr }),

      removeDuplicates: () => set((s) => {
        const seen = new Set()
        return {
          entries: s.entries.filter(e => {
            const key = e.title + '|' + e.channel
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
        }
      }),

      // ─ TOPIC VALIDATION
      validation: {
        activePhase: 1,
        phases: { v1: {}, v2: {}, v3: {}, v4: {}, v5: {} },
        score: null,
        decision: null,
      },

      setValidationPhase: (phase) => set((s) => ({
        validation: { ...s.validation, activePhase: phase }
      })),

      setValidationData: (phase, data) => set((s) => ({
        validation: {
          ...s.validation,
          phases: { ...s.validation.phases, [phase]: data }
        }
      })),

      setValidationResult: (score, decision) => set((s) => ({
        validation: { ...s.validation, score, decision }
      })),

      // ─ PATTERN ANALYSIS
      patternResult: null,
      patternLoading: false,
      patternError: null,

      setPatternResult: (r) => set({ patternResult: r }),
      setPatternLoading: (v) => set({ patternLoading: v }),
      setPatternError: (e) => set({ patternError: e }),

      // ─ CHANNEL ANALYSIS
      channelVideos: [],
      channelInfo: null,
      channelLoading: false,
      channelError: null,

      setChannelVideos: (videos) => set({ channelVideos: videos }),
      setChannelInfo: (info) => set({ channelInfo: info }),
      setChannelLoading: (v) => set({ channelLoading: v }),
      setChannelError: (e) => set({ channelError: e }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        theme: s.theme,
        navExpanded: s.navExpanded,
        ytApiKey: s.ytApiKey,
        aiProvider: s.aiProvider,
        aiApiKey: s.aiApiKey,
        outlierThreshold: s.outlierThreshold,
        channelBaseline: s.channelBaseline,
        entries: s.entries,
        validation: s.validation,
      }),
    }
  )
)
