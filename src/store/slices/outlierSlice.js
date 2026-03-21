import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useOutlierStore = create(
  persist(
    (set, get) => ({
      entries: [],
      sortCol: 'index',
      sortDir: 'desc',
      filterQual: 'all',
      filterType: 'all',
      addEntry: (entry) => set((s) => ({ entries: [...s.entries, { ...entry, id: Date.now() }] })),
      updateEntry: (id, data) => set((s) => ({ entries: s.entries.map((e) => e.id === id ? { ...e, ...data } : e) })),
      deleteEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      deleteEntries: (ids) => set((s) => ({ entries: s.entries.filter((e) => !ids.includes(e.id)) })),
      importEntries: (entries) => set({ entries }),
      setSortCol: (col) => set({ sortCol: col }),
      setSortDir: (dir) => set({ sortDir: dir }),
      setFilterQual: (f) => set({ filterQual: f }),
      setFilterType: (f) => set({ filterType: f }),
    }),
    { name: 'yt-outlier' }
  )
)
