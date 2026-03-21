import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useValidationStore = create(
  persist(
    (set) => ({
      activePhase: 1,
      phases: { v1: {}, v2: {}, v3: {}, v4: {}, v5: {} },
      scores: { v1: 0, v2q: 0, v2r: 0, v3t: 0, v3r: 0, v4: 0, v5c: 0, v5k: 0 },
      decision: null,
      setActivePhase: (phase) => set({ activePhase: phase }),
      updatePhase: (phase, data) => set((s) => ({ phases: { ...s.phases, [phase]: { ...s.phases[phase], ...data } } })),
      updateScore: (key, val) => set((s) => ({ scores: { ...s.scores, [key]: val } })),
      setDecision: (decision) => set({ decision }),
      reset: () => set({ activePhase: 1, phases: { v1: {}, v2: {}, v3: {}, v4: {}, v5: {} }, scores: { v1: 0, v2q: 0, v2r: 0, v3t: 0, v3r: 0, v4: 0, v5c: 0, v5k: 0 }, decision: null }),
    }),
    { name: 'yt-validation' }
  )
)
