import { create } from 'zustand'
import {
  createReconcileSlice,
  type ReconcileSlice,
  type TabKey,
  emptySide,
} from './slices/reconcileSlice'
import {
  createNavigationSlice,
  type NavigationSlice,
  type ViewKey,
} from './slices/navigationSlice'
import {
  createProfilerSlice,
  type ProfilerSlice,
  type ProfilerTier,
} from './slices/profilerSlice'
import {
  createLicenseSlice,
  type LicenseSlice,
} from './slices/licenseSlice'
import {
  createUpdateSlice,
  type UpdateSlice,
} from './slices/updateSlice'
import {
  createEngineSlice,
  type EngineSlice,
  type EngineStats,
} from './slices/engineSlice'
import type { ReconcileRunRequest } from '../../shared/ipc'

export type { TabKey, ViewKey, ProfilerTier, EngineStats }

export type AppStore = ReconcileSlice &
  NavigationSlice &
  ProfilerSlice &
  LicenseSlice &
  UpdateSlice &
  EngineSlice & {
    resetAll(): void
  }

export const useApp = create<AppStore>((...a) => ({
  ...createReconcileSlice(...a),
  ...createNavigationSlice(...a),
  ...createProfilerSlice(...a),
  ...createLicenseSlice(...a),
  ...createUpdateSlice(...a),
  ...createEngineSlice(...a),
  resetAll: () => {
    const [set] = a
    set({
      before: emptySide(),
      after: emptySide(),
      running: false,
      progress: null,
      error: null,
      result: null,
      tab: 'overview',
      view: 'hub',
      workingPaperSourcePath: null,
      excludeKetChuyen: false,
      ignoreDescription: false,
      accountLevel: 'exact',
      detailQuery: '',
      profilerMonth: null,
      profilerTier: null,
    })
  },
}))

export async function runReconcileNow(): Promise<void> {
  const s = useApp.getState()
  const b = s.before
  const a = s.after
  if (!b.cfg || !a.cfg) return

  s.setRunning(true)
  s.setProgress(null)
  s.setError(null)

  const req: ReconcileRunRequest = {
    before: b.cfg,
    after: a.cfg,
    excludeKetChuyen: s.excludeKetChuyen,
    ignoreDescription: s.ignoreDescription,
    accountLevel: s.accountLevel,
    beforeRows: b.pasted?.rows,
    afterRows: a.pasted?.rows,
  }

  try {
    const result = await window.auditsoft.runReconcile(req)
    s.setResult(result)
    s.setView('results')
    s.setTab('overview')
  } catch (err) {
    s.setError(err instanceof Error ? err.message : String(err))
  } finally {
    s.setRunning(false)
    s.setProgress(null)
  }
}
