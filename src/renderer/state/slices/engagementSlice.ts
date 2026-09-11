import type { StateCreator } from 'zustand'

export interface EngagementProfile {
  clientName: string
  fiscalYearEnd: string
  auditPeriod1: string
  auditPeriod2: string
  auditorName: string
  auditFirmName: string
  outputDir: string
}

export interface EngagementState {
  engagement: EngagementProfile
  isEngagementModalOpen: boolean
}

export interface EngagementActions {
  setEngagement(info: Partial<EngagementProfile>): void
  setEngagementModalOpen(open: boolean): void
}

export type EngagementSlice = EngagementState & EngagementActions

export const createEngagementSlice: StateCreator<EngagementSlice, [], [], EngagementSlice> = (
  set,
) => ({
  engagement: {
    clientName: 'Công ty Cổ phần May Mặc Gia Công Test',
    fiscalYearEnd: '31/12/2026',
    auditPeriod1: '01/01 - 30/06/2026',
    auditPeriod2: '01/07 - 31/12/2026',
    auditorName: 'Đắc Thịnh',
    auditFirmName: 'Công ty TNHH Kiểm toán BẮC ĐẨU',
    outputDir: '',
  },
  isEngagementModalOpen: false,
  setEngagement: (info) =>
    set((state) => ({
      engagement: {
        ...state.engagement,
        ...info,
      },
    })),
  setEngagementModalOpen: (isEngagementModalOpen) => set({ isEngagementModalOpen }),
})
