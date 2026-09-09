import { create } from 'zustand'
import type {
  ColumnMapping,
  ProgressMessage,
  ReconcileResult,
  SourceConfig,
  SourceKind,
} from '../../domain/types'
import type { ReconcileRunRequest, WorkbookMeta } from '../../shared/ipc'
import type { AppUpdateInfo } from '../../shared/types/update'
import { getTrialExportStatus, type TrialExportStatus } from '../../shared/license'
export type TabKey = 'overview' | 'detail' | 'groups' | 'bctc' | 'inventory' | 'errors'

interface PastedSource {
  rows: unknown[][]
}

interface AppStore {
  before: { meta: WorkbookMeta | null; cfg: SourceConfig | null; pasted: PastedSource | null }
  after: { meta: WorkbookMeta | null; cfg: SourceConfig | null; pasted: PastedSource | null }
  running: boolean
  progress: ProgressMessage | null
  error: string | null
  result: ReconcileResult | null
  tab: TabKey
  view: 'b410' | 'workingpaper' | 'sampling' | 'setup' | 'results' | 'qtt03'
  excludeKetChuyen: boolean
  ignoreDescription: boolean
  accountLevel: 'exact' | 'level1'
  detailQuery: string
  workingPaperSourcePath: string | null
  licenseModalOpen: boolean
  trialStatus: TrialExportStatus
  updateInfo: AppUpdateInfo | null
  isCheckingUpdate: boolean
  updateModalOpen: boolean
  setMeta(kind: SourceKind, meta: WorkbookMeta): void
  setCfg(kind: SourceKind, cfg: SourceConfig): void
  setPasted(kind: SourceKind, rows: unknown[][] | null): void
  setMappingPatch(kind: SourceKind, patch: Partial<ColumnMapping>): void
  setRunning(r: boolean): void
  setProgress(p: ProgressMessage | null): void
  setError(e: string | null): void
  setResult(r: ReconcileResult | null): void
  setTab(t: TabKey): void
  setView(v: 'b410' | 'workingpaper' | 'sampling' | 'setup' | 'results' | 'qtt03'): void
  setLicenseModalOpen(open: boolean): void
  refreshTrialStatus(): void
  toggleExcludeKetChuyen(): void
  toggleIgnoreDescription(): void
  setAccountLevel(lvl: 'exact' | 'level1'): void
  setDetailQuery(q: string): void
  setWorkingPaperSourcePath(path: string | null): void
  setUpdateInfo(info: AppUpdateInfo | null): void
  setIsCheckingUpdate(c: boolean): void
  setUpdateModalOpen(open: boolean): void
  checkAppUpdate(): Promise<AppUpdateInfo | null>
  resetAll(): void
}

const emptySide = () => ({ meta: null, cfg: null, pasted: null })

export const useApp = create<AppStore>((set) => ({
  before: emptySide(),
  after: emptySide(),
  running: false,
  progress: null,
  error: null,
  result: null,
  tab: 'overview',
  view: 'b410',
  workingPaperSourcePath: null,
  licenseModalOpen: false,
  trialStatus: getTrialExportStatus(),
  updateInfo: null,
  isCheckingUpdate: false,
  updateModalOpen: false,
  excludeKetChuyen: false,
  ignoreDescription: false,
  accountLevel: 'exact',
  detailQuery: '',
  setLicenseModalOpen: (licenseModalOpen) => set({ licenseModalOpen }),
  refreshTrialStatus: () => set({ trialStatus: getTrialExportStatus() }),
  setAccountLevel: (accountLevel) => set({ accountLevel }),
  setDetailQuery: (detailQuery) => set({ detailQuery }),
  setMeta: (kind, meta) =>
    set(() => {
      const first = meta.sheets[0]
      const cfg: SourceConfig | null = first
        ? {
            kind,
            filePath: meta.filePath,
            sheetName: first.name,
            headerRow: first.suggestedHeaderRow,
            mapping: {
              date: first.suggestedMapping.date ?? 0,
              voucher: first.suggestedMapping.voucher ?? 1,
              description: first.suggestedMapping.description ?? 2,
              debit: first.suggestedMapping.debit ?? 3,
              credit: first.suggestedMapping.credit ?? 4,
              amount: first.suggestedMapping.amount ?? 5,
            },
          }
        : null
      return kind === 'BEFORE'
        ? { before: { meta, cfg, pasted: null } }
        : { after: { meta, cfg, pasted: null } }
    }),
  setCfg: (kind, cfg) =>
    set((s) => (kind === 'BEFORE' ? { before: { ...s.before, cfg } } : { after: { ...s.after, cfg } })),
  setPasted: (kind, rows) =>
    set((s) =>
      kind === 'BEFORE'
        ? { before: { ...s.before, pasted: rows ? { rows } : null } }
        : { after: { ...s.after, pasted: rows ? { rows } : null } },
    ),
  setMappingPatch: (kind, patch) =>
    set((s) => {
      const side = kind === 'BEFORE' ? s.before : s.after
      if (!side.cfg) return s
      const updated: SourceConfig = {
        ...side.cfg,
        mapping: { ...side.cfg.mapping, ...patch },
      }
      return kind === 'BEFORE'
        ? { before: { ...s.before, cfg: updated } }
        : { after: { ...s.after, cfg: updated } }
    }),
  setRunning: (running) => set({ running }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),
  setTab: (tab) => set({ tab }),
  setView: (view) => set({ view }),
  setWorkingPaperSourcePath: (workingPaperSourcePath) => set({ workingPaperSourcePath }),
  toggleExcludeKetChuyen: () => set((s) => ({ excludeKetChuyen: !s.excludeKetChuyen })),
  toggleIgnoreDescription: () => set((s) => ({ ignoreDescription: !s.ignoreDescription })),
  setUpdateInfo: (info) => set({ updateInfo: info }),
  setIsCheckingUpdate: (c) => set({ isCheckingUpdate: c }),
  setUpdateModalOpen: (open) => set({ updateModalOpen: open }),
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
  resetAll: () =>
    set({
      before: emptySide(),
      after: emptySide(),
      running: false,
      progress: null,
      error: null,
      result: null,
      tab: 'overview',
      view: 'setup',
      workingPaperSourcePath: null,
      excludeKetChuyen: false,
      ignoreDescription: false,
      accountLevel: 'exact',
      detailQuery: '',
    }),
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
    const unsub = window.auditsoft.onProgress((p) => {
      useApp.getState().setProgress(p)
    })
    const res = await window.auditsoft.runReconcile(req)
    unsub()
    useApp.getState().setResult(res)
    useApp.getState().setView('results')
  } catch (err) {
    useApp.getState().setError(err instanceof Error ? err.message : String(err))
  } finally {
    useApp.getState().setRunning(false)
  }
}
