import { normalizeForKey } from '../clean'
import { MAIN_EXCLUDE_ACCOUNT_PREFIX, OPTIONAL_KET_CHUYEN_KEYWORD } from '../constants'
import { moneyFromJSON, moneyToJSON, subtractMoney, sumMoney, type Money } from '../money'
import type { DiffRow, MainSummary, SourceStatsFull } from '../types'

export interface MainReportOptions {
  /** Checkbox: loại thêm dòng có diễn giải chứa KẾT CHUYỂN */
  excludeKetChuyen: boolean
}

function is911(row: DiffRow): boolean {
  return row.debit.startsWith(MAIN_EXCLUDE_ACCOUNT_PREFIX) || row.credit.startsWith(MAIN_EXCLUDE_ACCOUNT_PREFIX)
}

function containsKetChuyen(description: string): boolean {
  // Diễn giải đã UPPER theo PQ; kiểm tra cả bản bỏ dấu để chắc chắn
  return description.includes('KẾT CHUYỂN') || normalizeForKey(description).includes(OPTIONAL_KET_CHUYEN_KEYWORD)
}

/** Màn hình KQ Chenh Lech: luôn loại TK Nợ/Có bắt đầu "911"; tùy chọn loại thêm KẾT CHUYỂN. */
export function applyMainFilter(rows: readonly DiffRow[], options: MainReportOptions): DiffRow[] {
  return rows.filter((r) => !is911(r) && !(options.excludeKetChuyen && containsKetChuyen(r.description)))
}

export function countByKind(rows: readonly DiffRow[]): {
  addedCount: number
  removedCount: number
  changedCount: number
} {
  let addedCount = 0
  let removedCount = 0
  let changedCount = 0
  for (const r of rows) {
    if (r.kind === 'ADDED_AFTER') addedCount++
    else if (r.kind === 'REMOVED_AFTER') removedCount++
    else changedCount++
  }
  return { addedCount, removedCount, changedCount }
}

function sumDiff(rows: readonly DiffRow[]): Money {
  return sumMoney(rows.map((r) => moneyFromJSON(r.difference)))
}

export function computeMainSummary(input: {
  beforeStats: Pick<SourceStatsFull, 'dataRows' | 'blankRows' | 'totalAmount' | 'zeroOrBadAmountRows'>
  afterStats: Pick<SourceStatsFull, 'dataRows' | 'blankRows' | 'totalAmount' | 'zeroOrBadAmountRows'>
  allDiffRows: readonly DiffRow[]
  filteredRows: readonly DiffRow[]
}): MainSummary {
  const { beforeStats, afterStats, filteredRows } = input
  const counts = countByKind(filteredRows)
  const totalDifference = subtractMoney(moneyFromJSON(afterStats.totalAmount), moneyFromJSON(beforeStats.totalAmount))

  return {
    totalBefore: beforeStats.totalAmount,
    totalAfter: afterStats.totalAmount,
    totalDifference: moneyToJSON(totalDifference),
    lineCountBefore: beforeStats.dataRows,
    lineCountAfter: afterStats.dataRows,
    diffLineCount: input.allDiffRows.length,
    addedCount: counts.addedCount,
    removedCount: counts.removedCount,
    changedCount: counts.changedCount,
    filteredLineCount: filteredRows.length,
    filteredTotalDifference: moneyToJSON(sumDiff(filteredRows)),
    blankRowsBefore: beforeStats.blankRows,
    blankRowsAfter: afterStats.blankRows,
    zeroOrBadAmountRowsBefore: beforeStats.zeroOrBadAmountRows,
    zeroOrBadAmountRowsAfter: afterStats.zeroOrBadAmountRows,
  }
}
