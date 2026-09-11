import type { StateCreator } from 'zustand'

export interface EngineStats {
  totalRows: number
  totalAmount: bigint
  loadTimeMs: number
}

export interface EngineState {
  engineType: 'duckdb' | 'in_memory_js'
  engineStats: EngineStats | null
}

export interface EngineActions {
  setEngineType(engineType: 'duckdb' | 'in_memory_js'): void
  setEngineStats(engineStats: EngineStats | null): void
}

export type EngineSlice = EngineState & EngineActions

export const createEngineSlice: StateCreator<EngineSlice, [], [], EngineSlice> = (set) => ({
  engineType: 'duckdb',
  engineStats: null,
  setEngineType: (engineType) => set({ engineType }),
  setEngineStats: (engineStats) => set({ engineStats }),
})
