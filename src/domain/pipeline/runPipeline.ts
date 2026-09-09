import { applyMainFilter, computeMainSummary, type MainReportOptions } from './mainReport'
import { buildInventorySummary } from './inventory'
import { buildEntryTypeGroups } from './groupByEntryType'
import { reconcileSources, type ReconcileMatchOptions } from './reconcile'
import type { DiffRow } from '../types'
import { analyzeDiffRows, buildBctc } from '../bctc/aggregate'
import { ROW_ERROR_LABELS } from '../types'
import { moneyToJSON, sumMoney } from '../money'
import type {
  ErrorLine,
  ExportEntryRow,
  NormalizedEntry,
  ReconcileResult,
  SourceConfig,
  SourceStatsFull,
  StandardizeResult,
} from '../types'

export interface CorePipelineInput {
  before: SourceConfig
  after: SourceConfig
  beforeStandardized: StandardizeResult
  afterStandardized: StandardizeResult
  options: MainReportOptions & ReconcileMatchOptions
}

export interface CorePipelineOutput {
  diffRows: ReconcileResult['diffRows']
  matchedEqualCount: number
  summary: ReconcileResult['summary']
  inventory: ReconcileResult['inventory']
  groups: ReconcileResult['groups']
  entryTypeSummary: ReconcileResult['entryTypeSummary']
  bctc: ReconcileResult['bctc']
  errors: ErrorLine[]
  beforeStats: SourceStatsFull
  afterStats: SourceStatsFull
  beforeEntries: ExportEntryRow[]
  afterEntries: ExportEntryRow[]
}

function toExportRows(entries: readonly NormalizedEntry[]): ExportEntryRow[] {
  return entries.map((e) => ({
    rowIndex: e.rowIndex,
    displayDate: e.displayDate,
    dateISO: e.dateISO,
    voucher: e.voucher,
    description: e.description,
    debit: e.debit,
    credit: e.credit,
    amountJSON: moneyToJSON(e.amount ?? sumMoney([])),
  }))
}

function collectErrors(kind: 'BEFORE' | 'AFTER', std: StandardizeResult): ErrorLine[] {
  const errorLines: ErrorLine[] = std.entries
    .filter((e) => e.errors.length > 0)
    .map((e) => ({
      source: kind,
      rowIndex: e.rowIndex,
      displayDate: e.displayDate,
      voucher: e.voucher,
      description: e.description,
      debit: e.debit,
      credit: e.credit,
      amountDisplay: moneyToJSON(e.amount ?? sumMoney([])),
      errors: e.errors.map((code) => ROW_ERROR_LABELS[code]),
    }))
  const droppedLines: ErrorLine[] = std.dropped.map((d) => ({
    source: kind,
    rowIndex: d.rowIndex,
    displayDate: '',
    voucher: '',
    description: '',
    debit: '',
    credit: '',
    amountDisplay: '',
    errors: [d.reason],
  }))
  return [...errorLines, ...droppedLines]
}

/** Pipeline thuần thay toàn bộ 3 truy vấn Power Query — dùng chung cho worker và test. */
export function runCorePipeline(input: CorePipelineInput): CorePipelineOutput {
  const { before, after, beforeStandardized, afterStandardized, options } = input

  const { rows: diffRows, matchedEqualCount } = reconcileSources(
    beforeStandardized.entries,
    afterStandardized.entries,
    options,
  )

  const filteredRows = applyMainFilter(diffRows, options)

  const beforeStats: SourceStatsFull = {
    kind: 'BEFORE',
    filePath: before.filePath,
    sheetName: before.sheetName,
    headerRow: before.headerRow,
    dataRows: beforeStandardized.stats.dataRows,
    blankRows: beforeStandardized.stats.blankRows,
    zeroOrBadAmountRows: beforeStandardized.stats.zeroOrBadAmountRows,
    errorRows: beforeStandardized.stats.errorRows,
    totalAmount: moneyToJSON(sumTotal(beforeStandardized.entries)),
  }
  const afterStats: SourceStatsFull = {
    kind: 'AFTER',
    filePath: after.filePath,
    sheetName: after.sheetName,
    headerRow: after.headerRow,
    dataRows: afterStandardized.stats.dataRows,
    blankRows: afterStandardized.stats.blankRows,
    zeroOrBadAmountRows: afterStandardized.stats.zeroOrBadAmountRows,
    errorRows: afterStandardized.stats.errorRows,
    totalAmount: moneyToJSON(sumTotal(afterStandardized.entries)),
  }

  const errors = [
    ...collectErrors('BEFORE', beforeStandardized),
    ...collectErrors('AFTER', afterStandardized),
  ]

  const summary = computeMainSummary({
    beforeStats,
    afterStats,
    allDiffRows: diffRows,
    filteredRows,
  })

  const inventory = buildInventorySummary(filteredRows)
  const { groups, summary: entryTypeSummary } = buildEntryTypeGroups(filteredRows)

  // ẢNH HƯỞNG BCTC: lấy các bút toán ĐÃ TỔNG HỢP THEO LOẠI (nhóm LEFT4|LEFT4),
  // không dùng chi tiết — mỗi nhóm = 1 bút toán điều chỉnh tổng hợp, soPS = Chênh lệch nhóm
  const groupAsRows: DiffRow[] = groups.map((g) => ({
    stt: g.stt,
    kind: 'AMOUNT_CHANGED' as const,
    key: g.key,
    dateISO: null,
    dateDisplay: '',
    loiNgay: false,
    loiNgayText: '',
    voucher: g.repVoucher,
    description: g.repDescription,
    debit: g.debitGrouped,
    credit: g.creditGrouped,
    amountAfter: g.sumAfter,
    amountBefore: g.sumBefore,
    difference: g.sumDifference,
    note: g.note,
    priority: '',
  }))
  const bctc = buildBctc(analyzeDiffRows(groupAsRows))

  return {
    diffRows,
    matchedEqualCount,
    summary,
    inventory,
    groups,
    entryTypeSummary,
    bctc,
    errors,
    beforeStats,
    afterStats,
    beforeEntries: toExportRows(beforeStandardized.entries),
    afterEntries: toExportRows(afterStandardized.entries),
  }
}

function sumTotal(entries: readonly NormalizedEntry[]) {
  return sumMoney(entries.map((e) => e.amount ?? sumMoney([])))
}
