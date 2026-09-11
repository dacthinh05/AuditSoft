import type { StateCreator } from 'zustand'

const STORAGE_KEY_API_KEY = 'auditsoft_gemini_api_key'
const STORAGE_KEY_MODEL = 'auditsoft_gemini_model'

function readStorage(key: string, fallback = ''): string {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key) ?? fallback
    }
  } catch {
    // ignore
  }
  return fallback
}

function writeStorage(key: string, val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (val) {
        localStorage.setItem(key, val)
      } else {
        localStorage.removeItem(key)
      }
    }
  } catch {
    // ignore
  }
}

export interface AiState {
  apiKey: string
  selectedModel: string
  isAiConfigModalOpen: boolean
  isAnalyzing: boolean
  cachedReview: string | null
}

export interface AiActions {
  setApiKey(apiKey: string): void
  setSelectedModel(model: string): void
  setAiConfigModalOpen(open: boolean): void
  setIsAnalyzing(isAnalyzing: boolean): void
  setCachedReview(review: string | null): void
  clearApiKey(): void
}

export type AiSlice = AiState & AiActions

export const createAiSlice: StateCreator<AiSlice, [], [], AiSlice> = (set) => ({
  apiKey: readStorage(STORAGE_KEY_API_KEY, ''),
  selectedModel: readStorage(STORAGE_KEY_MODEL, 'gemini-2.5-flash'),
  isAiConfigModalOpen: false,
  isAnalyzing: false,
  cachedReview: null,

  setApiKey: (apiKey: string) => {
    const clean = apiKey.trim()
    writeStorage(STORAGE_KEY_API_KEY, clean)
    set({ apiKey: clean })
  },

  setSelectedModel: (model: string) => {
    const clean = model.trim() || 'gemini-2.5-flash'
    writeStorage(STORAGE_KEY_MODEL, clean)
    set({ selectedModel: clean })
  },

  setAiConfigModalOpen: (isAiConfigModalOpen: boolean) => set({ isAiConfigModalOpen }),
  setIsAnalyzing: (isAnalyzing: boolean) => set({ isAnalyzing }),
  setCachedReview: (cachedReview: string | null) => set({ cachedReview }),

  clearApiKey: () => {
    writeStorage(STORAGE_KEY_API_KEY, '')
    set({ apiKey: '', cachedReview: null })
  },
})
