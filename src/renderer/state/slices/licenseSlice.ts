import type { StateCreator } from 'zustand'
import { getTrialExportStatus, type TrialExportStatus } from '../../../shared/license'

export interface LicenseState {
  licenseModalOpen: boolean
  trialStatus: TrialExportStatus
}

export interface LicenseActions {
  setLicenseModalOpen(licenseModalOpen: boolean): void
  refreshTrialStatus(): void
}

export type LicenseSlice = LicenseState & LicenseActions

export const createLicenseSlice: StateCreator<LicenseSlice, [], [], LicenseSlice> = (set) => ({
  licenseModalOpen: false,
  trialStatus: getTrialExportStatus(),
  setLicenseModalOpen: (licenseModalOpen) => set({ licenseModalOpen }),
  refreshTrialStatus: () => set({ trialStatus: getTrialExportStatus() }),
})
