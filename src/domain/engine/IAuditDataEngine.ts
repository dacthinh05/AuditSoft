import type { JournalEntry } from '../../shared/types/analytics'
import type { NormalizedEntry } from '../types'

export interface JournalEntryRecord {
  id: string
  entryDate: string | null        // YYYY-MM-DD
  docNo: string                   // Số chứng từ (Voucher / RefNo)
  docDate: string | null          // Ngày chứng từ
  description: string             // Diễn giải
  debitAccount: string            // TK Nợ (e.g. '6351', '1121')
  creditAccount: string           // TK Có (e.g. '1111', '331')
  amount: bigint                  // Số tiền nguyên tệ (VNĐ)
  partnerCode: string             // Mã đối tượng / Mã KH / Mã NCC
  partnerName: string             // Tên đối tượng
  sourceRow: number               // Số dòng gốc
}

export interface EngineStats {
  engineType: 'duckdb' | 'sqlite' | 'in_memory_js'
  isAccelerated: boolean
  totalRows: number
  totalAmount: bigint
  loadTimeMs: number
}

export interface IAuditDataEngine {
  readonly engineType: 'duckdb' | 'sqlite' | 'in_memory_js'
  readonly isAccelerated: boolean

  initialize(): Promise<void>
  destroy(): Promise<void>

  bulkInsert(
    records: JournalEntryRecord[],
    onProgress?: (inserted: number, total: number) => void
  ): Promise<number>

  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>

  getRowCount(): Promise<number>
  getTotalAmount(): Promise<bigint>
  getStats(): Promise<EngineStats>
  clear(): Promise<void>
}

/** Chuyển đổi từ JournalEntry (AnalysisPipeline) sang JournalEntryRecord */
export function fromJournalEntry(e: JournalEntry, fallbackIndex = 0): JournalEntryRecord {
  return {
    id: e.id || `je_${fallbackIndex}`,
    entryDate: e.postingDate ?? null,
    docNo: e.documentNumber ?? '',
    docDate: e.postingDate ?? null,
    description: e.description ?? '',
    debitAccount: e.debitAccount ?? '',
    creditAccount: e.creditAccount ?? '',
    amount: typeof e.amount?.raw === 'bigint' ? e.amount.raw : BigInt(e.amount?.raw ?? 0),
    partnerCode: e.objectCode ?? '',
    partnerName: e.customerName ?? '',
    sourceRow: e.source?.rowNumber ?? fallbackIndex,
  }
}

/** Chuyển đổi từ NormalizedEntry (Reconciliation) sang JournalEntryRecord */
export function fromNormalizedEntry(e: NormalizedEntry, fallbackIndex = 0): JournalEntryRecord {
  return {
    id: `ne_${e.rowIndex || fallbackIndex}`,
    entryDate: e.dateISO ?? null,
    docNo: e.voucher ?? '',
    docDate: e.dateISO ?? null,
    description: e.description ?? '',
    debitAccount: e.debit ?? '',
    creditAccount: e.credit ?? '',
    amount: typeof e.amount?.raw === 'bigint' ? e.amount.raw : BigInt(e.amount?.raw ?? 0),
    partnerCode: e.partnerCode ?? '',
    partnerName: e.partnerName ?? '',
    sourceRow: e.rowIndex || fallbackIndex,
  }
}
