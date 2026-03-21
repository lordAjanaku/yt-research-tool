import { create } from 'zustand'  

export const usePatternStore = create((set) => ({
  uploadedData: null,
  loading: false,
  error: null,
  result: null,
  setUploadedData: (data) => set({ uploadedData: data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),
  reset: () => set({ uploadedData: null, loading: false, error: null, result: null }),
}))
