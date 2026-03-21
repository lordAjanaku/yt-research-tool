import { create } from 'zustand'

export const useChannelStore = create((set) => ({
  channelUrl: '',
  monthsBack: 12,
  minLength: 7,
  results: [],
  channelName: '',
  channelMedian: 0,
  loading: false,
  error: null,
  setChannelUrl: (url) => set({ channelUrl: url }),
  setMonthsBack: (m) => set({ monthsBack: m }),
  setMinLength: (l) => set({ minLength: l }),
  setResults: (results) => set({ results }),
  setChannelName: (name) => set({ channelName: name }),
  setChannelMedian: (median) => set({ channelMedian: median }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ results: [], channelName: '', channelMedian: 0, error: null }),
}))
