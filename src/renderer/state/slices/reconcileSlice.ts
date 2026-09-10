import type { StateCreator } from 'zustand'
import type {
  ColumnMapping,
  ProgressMessage,
  ReconcileResult,
  SourceConfig,
  SourceKind,
} from '../../../domain/types'
import type { WorkbookMeta } from '../../../shared/ipc'

export type TabKey = 'overview' | 'detail' | 'groups' | 'bctc' | 'inventory' | 'errors'

export interface PastedSource {
  rows: unknown[][]
}

export interface ReconcileSide {
  meta: WorkbookMeta | null
  cfg: SourceConfig | null
  pasted: PastedSource | null
}

export interface ReconcileState {
  before: ReconcileSide
  after: ReconcileSide
  running: boolean
  progress: ProgressMessage | null
  error: string | null
  result: ReconcileResult | null
  tab: TabKey
  workingPaperSourcePath: string | null
  excludeKetChuyen: boolean
  ignoreDescription: boolean
  accountLevel: 'exact' | 'level1'
  detailQuery: string
}

export interface ReconcileActions {
  setMeta(kind: SourceKind, meta: WorkbookMeta): void
  setCfg(kind: SourceKind, cfg: SourceConfig): void
  setPasted(kind: SourceKind, rows: unknown[][] | null): void
  setMappingPatch(kind: SourceKind, patch: Partial<ColumnMapping>): void
  setRunning(running: boolean): void
  setProgress(progress: ProgressMessage | null): void
  setError(error: string | null): void
  setResult(result: ReconcileResult | null): void
  setTab(tab: TabKey): void
  setWorkingPaperSourcePath(path: string | null): void
  toggleExcludeKetChuyen(): void
  toggleIgnoreDescription(): void
  setAccountLevel(lvl: 'exact' | 'level1'): void
  setDetailQuery(q: string): void
  resetReconcile(): void
}

export type ReconcileSlice = ReconcileState & ReconcileActions

export const emptySide = (): ReconcileSide => ({ meta: null, cfg: null, pasted: null })

export const createReconcileSlice: StateCreator<ReconcileSlice, [], [], ReconcileSlice> = (
  set
) => ({
  before: emptySide(),
  after: emptySide(),
  running: false,
  progress: null,
  error: null,
  result: null,
  tab: 'overview',
  workingPaperSourcePath: null,
  excludeKetChuyen: false,
  ignoreDescription: false,
  accountLevel: 'exact',
  detailQuery: '',

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
  setResult(result) {
    set({ result })
  },
  setTab: (tab) => set({ tab }),
  setWorkingPaperSourcePath: (workingPaperSourcePath) => set({ workingPaperSourcePath }),
  toggleExcludeKetChuyen: () => set((s) => ({ excludeKetChuyen: !s.excludeKetChuyen })),
  toggleIgnoreDescription: () => set((s) => ({ ignoreDescription: !s.ignoreDescription })),
  setAccountLevel: (accountLevel) => set({ accountLevel }),
  setDetailQuery: (detailQuery) => set({ detailQuery }),

  resetReconcile: () =>
    set({
      before: emptySide(),
      after: emptySide(),
      running: false,
      progress: null,
      error: null,
      result: null,
      tab: 'overview',
      workingPaperSourcePath: null,
      excludeKetChuyen: false,
      ignoreDescription: false,
      accountLevel: 'exact',
      detailQuery: '',
    }),
})
