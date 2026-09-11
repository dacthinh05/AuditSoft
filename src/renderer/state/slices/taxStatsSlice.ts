import type { StateCreator } from 'zustand'
import type { JournalRowDTO } from '../../../shared/types/analytics'
import type { IngestedTaxDeclarations } from '../../../shared/types/taxAnalytics'

export interface GlSnapshot {
  filePath: string
  sheetName?: string
  journals: JournalRowDTO[]
}

export interface TaxStatsState {
  glSnapshot: GlSnapshot | null
  taxData: IngestedTaxDeclarations | null
}

export interface TaxStatsActions {
  setGlSnapshot(snapshot: GlSnapshot): void
  setTaxData(data: IngestedTaxDeclarations | null): void
  clearTaxData(): void
}

export type TaxStatsSlice = TaxStatsState & TaxStatsActions

export const createTaxStatsSlice: StateCreator<TaxStatsSlice, [], [], TaxStatsSlice> = (set) => ({
  glSnapshot: null,
  taxData: null,
  setGlSnapshot: (glSnapshot) => set({ glSnapshot }),
  setTaxData: (taxData) => set({ taxData }),
  clearTaxData: () => set({ taxData: null }),
})
