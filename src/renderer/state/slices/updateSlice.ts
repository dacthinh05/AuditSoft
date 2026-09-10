import type { StateCreator } from 'zustand'
import type { AppUpdateInfo } from '../../../shared/types/update'

export interface UpdateState {
  updateInfo: AppUpdateInfo | null
  isCheckingUpdate: boolean
  updateModalOpen: boolean
  updateNoticeDismissed: boolean
}

export interface UpdateActions {
  setUpdateInfo(info: AppUpdateInfo | null): void
  setIsCheckingUpdate(c: boolean): void
  setUpdateModalOpen(open: boolean): void
  setUpdateNoticeDismissed(dismissed: boolean): void
  checkAppUpdate(): Promise<AppUpdateInfo | null>
}

export type UpdateSlice = UpdateState & UpdateActions

export const createUpdateSlice: StateCreator<UpdateSlice, [], [], UpdateSlice> = (set) => ({
  updateInfo: null,
  isCheckingUpdate: false,
  updateModalOpen: false,
  updateNoticeDismissed: false,
  setUpdateInfo: (updateInfo) => set({ updateInfo }),
  setIsCheckingUpdate: (isCheckingUpdate) => set({ isCheckingUpdate }),
  setUpdateModalOpen: (updateModalOpen) => set({ updateModalOpen }),
  setUpdateNoticeDismissed: (updateNoticeDismissed) => set({ updateNoticeDismissed }),
  checkAppUpdate: async () => {
    if (!window.auditsoft?.checkUpdate) return null
    set({ isCheckingUpdate: true })
    try {
      const info = await window.auditsoft.checkUpdate()
      set({ updateInfo: info })
      return info
    } catch (err) {
      console.warn('Check update error:', err)
      return null
    } finally {
      set({ isCheckingUpdate: false })
    }
  },
})
