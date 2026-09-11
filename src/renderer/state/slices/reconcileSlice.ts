import type { StateCreator } from 'zustand'
import type {
  ColumnMapping,
  ProgressMessage,
  ReconcileResult,
  SourceConfig,
  SourceKind,
} from '../../../domain/types'
import type { WorkbookMeta, WorkbookSheetMeta, WorkingPaperGenerationResult } from '../../../shared/ipc'
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
  workingPaperGenResult: WorkingPaperGenerationResult | null
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
  setWorkingPaperGenResult(result: WorkingPaperGenerationResult | null): void
  toggleExcludeKetChuyen(): void
  toggleIgnoreDescription(): void
  setAccountLevel(lvl: 'exact' | 'level1'): void
  setDetailQuery(q: string): void
  resetReconcile(): void
}

export type ReconcileSlice = ReconcileState & ReconcileActions
/**
 * Tự động chọn sheet Nhật ký chung tối ưu nhất:
 * 1. Tên bắt đầu bằng NKC (ví dụ: NKC, NKC_TrcDC, NKCSAUDC, NKC2025...)
 * 2. Tên chứa NHATKYCHUNG, SO_NKC, GL
 * 3. Sheet có độ tin cậy nhận diện 6 cột TT200 cao nhất (confidence >= 70) và có nhiều dòng
 * 4. Sheet có nhiều dòng dữ liệu nhất (loại bỏ các sheet bìa/hướng dẫn 1-5 dòng)
 * 5. Fallback về sheet đầu tiên
 */
export function pickBestNkcSheet(sheets: WorkbookSheetMeta[]): WorkbookSheetMeta | undefined {
  if (!sheets || sheets.length === 0) return undefined
  if (sheets.length === 1) return sheets[0]

  const clean = (s: string) => s.toLowerCase().replace(/[\s_\-.]/g, '')

  // 1. Tên bắt đầu bằng NKC (NKC, NKC_TrcDC, NKCSAUDC, NKC2025...)
  const nkcPrefix = sheets.find((s) => clean(s.name).startsWith('nkc') && s.totalRows > 0)
  if (nkcPrefix) return nkcPrefix

  // 2. Tên chứa NHATKYCHUNG, SO_NKC, GL
  const nhatKyChung = sheets.find((s) => {
    const n = clean(s.name)
    return (n.includes('nhatkychung') || n.includes('sonkc') || n === 'gl') && s.totalRows > 0
  })
  if (nhatKyChung) return nhatKyChung

  // 3. Sheet có confidence cao nhất (>= 70) và có dữ liệu
  const validSheets = sheets.filter((s) => s.totalRows > 1)
  const highConfidence = [...validSheets]
    .filter((s) => s.confidence >= 70)
    .sort((a, b) => b.confidence - a.confidence || b.totalRows - a.totalRows)
  if (highConfidence.length > 0 && highConfidence[0]) return highConfidence[0]

  // 4. Sheet có nhiều dòng dữ liệu nhất (bỏ qua sheet bìa/hướng dẫn 1-5 dòng)
  const largest = [...validSheets].sort((a, b) => b.totalRows - a.totalRows)[0]
  if (largest && largest.totalRows > 5) return largest

  return sheets[0]
}

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
  workingPaperGenResult: null,
  excludeKetChuyen: false,
  ignoreDescription: false,
  accountLevel: 'exact',
  detailQuery: '',

  setMeta: (kind, meta) =>
    set(() => {
      const best = pickBestNkcSheet(meta.sheets) || meta.sheets[0]
      const cfg: SourceConfig | null = best
        ? {
            kind,
            filePath: meta.filePath,
            sheetName: best.name,
            headerRow: best.suggestedHeaderRow,
            mapping: {
              date: best.suggestedMapping.date ?? null,
              voucher: best.suggestedMapping.voucher ?? null,
              description: best.suggestedMapping.description ?? null,
              debit: best.suggestedMapping.debit ?? null,
              credit: best.suggestedMapping.credit ?? null,
              amount: best.suggestedMapping.amount ?? null,
              partnerCode: best.suggestedMapping.partnerCode ?? null,
              partnerName: best.suggestedMapping.partnerName ?? null,
              exchangeRate: best.suggestedMapping.exchangeRate ?? null,
              foreignAmount: best.suggestedMapping.foreignAmount ?? null,
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
  setWorkingPaperGenResult: (workingPaperGenResult) => set({ workingPaperGenResult }),
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
      workingPaperGenResult: null,
      excludeKetChuyen: false,
      ignoreDescription: false,
      accountLevel: 'exact',
      detailQuery: '',
    }),
})
