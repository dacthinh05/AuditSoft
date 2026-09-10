import type { StateCreator } from 'zustand'

export interface EngineStats {
  totalRows: number
  totalAmount: bigint
  loadTimeMs: number
}

export interface EngineState {
  dataSourceType: 'excel' | 'database'
  dbModalOpen: boolean
  engineType: 'duckdb' | 'in_memory_js'
  engineStats: EngineStats | null
}

export interface EngineActions {
  setDataSourceType(dataSourceType: 'excel' | 'database'): void
  setDbModalOpen(dbModalOpen: boolean): void
  setEngineType(engineType: 'duckdb' | 'in_memory_js'): void
  setEngineStats(engineStats: EngineStats | null): void
}

export type EngineSlice = EngineState & EngineActions

export const createEngineSlice: StateCreator<EngineSlice, [], [], EngineSlice> = (set) => ({
  dataSourceType: 'excel',
  dbModalOpen: false,
  engineType: 'duckdb',
  engineStats: null,
  setDataSourceType: (dataSourceType) => set({ dataSourceType }),
  setDbModalOpen: (dbModalOpen) => set({ dbModalOpen }),
  setEngineType: (engineType) => set({ engineType }),
  setEngineStats: (engineStats) => set({ engineStats }),
})
