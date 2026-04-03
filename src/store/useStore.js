import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getQualifies } from '../utils/qualify'

const STORAGE_KEY = 'yt-research-tool-v1'

// Merge comma-separated search term strings, deduplicated
function mergeSearchTerms(...termStrings) {
  const all = termStrings
    .flatMap(s => (s || '').split(',').map(t => t.trim()).filter(Boolean))
  return [...new Set(all)].join(', ')
}

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
          transcript: entry.transcript || '',
          // Auto-populate searchTerms from search field if not explicitly provided
          searchTerms: entry.searchTerms || entry.search || '',
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

      clearEntries: () => set({ entries: [] }),

      importEntries: (arr) => set({ entries: arr }),

      // Duplicate = same title + same channel (searchTerms are NOT part of duplicate key).
      // When merging: keep first entry's data, combine all unique search terms from all duplicates.
      mergeDuplicates: () => set((s) => {
        const groups = {}
        const order = []
        s.entries.forEach(e => {
          const key = e.title + '|' + e.channel
          if (!groups[key]) {
            groups[key] = []
            order.push(key)
          }
          groups[key].push(e)
        })
        const merged = order.map(key => {
          const group = groups[key]
          if (group.length === 1) return group[0]
          // Merge all search terms, deduplicated
          const combinedTerms = mergeSearchTerms(...group.map(e => e.searchTerms))
          return { ...group[0], searchTerms: combinedTerms }
        })
        return { entries: merged }
      }),

      // Legacy alias — kept for backward compat but now calls mergeDuplicates
      removeDuplicates: () => get().mergeDuplicates(),

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
