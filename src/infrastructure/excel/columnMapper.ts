import { normalizeForKey } from '../../domain/clean'
import type { ColumnMapping } from '../../domain/types'

export type MappingRole = keyof ColumnMapping

export const FIELD_SYNONYMS: Record<MappingRole, readonly string[]> = {
  date: ['NGAY', 'NGAY CT', 'NGAY CHUNG TU', 'NGAY GHISO', 'NGAY HACH TOAN', 'NGAY GHI SO'],
  voucher: ['SO CHUNG TU', 'SO CT', 'CHUNG TU', 'SOCT'],
  description: ['DIEN GIAI', 'NOI DUNG', 'LY DO'],
  debit: ['TK NO', 'TAI KHOAN NO', 'NO'],
  credit: ['TK CO', 'TAI KHOAN CO', 'CO'],
  amount: ['SO TIEN', 'SO PHAT SINH', 'SO TIEN PHAT SINH', 'GIA TRI', 'THANH TIEN'],
  partnerCode: ['MA KH', 'MA DOI TUONG', 'MA KHACH HANG', 'DOI TUONG', 'CUSTOMER CODE', 'VENDOR CODE'],
  partnerName: ['TEN KH', 'TEN KHACH HANG', 'TEN DOI TUONG', 'CUSTOMER NAME'],
  exchangeRate: ['TY GIA', 'EXCHANGE RATE'],
  foreignAmount: ['USD', 'US', 'NGOAI TE', 'NGUYEN TE', 'FOREIGN AMOUNT', 'SO TIEN USD'],
}

const ROLE_PRIORITY: readonly MappingRole[] = ['date', 'voucher', 'description', 'debit', 'credit', 'amount', 'partnerCode', 'partnerName', 'exchangeRate', 'foreignAmount']

function scoreCell(label: string, synonyms: readonly string[]): number {
  const n = normalizeForKey(label)
  if (n === '') return 0
  for (const syn of synonyms) {
    if (n === syn) return 2
  }
  for (const syn of synonyms) {
    if (syn.length >= 4 && n.startsWith(syn)) return 1
  }
  return 0
}

export interface HeaderDetection {
  headerRowIndex: number
  mapping: ColumnMapping
  confidence: number
}

/** Dò hàng tiêu đề + mapping cột tự động từ ma trận dữ liệu thô. */
export function detectHeaderAndMapping(matrix: readonly (readonly unknown[])[]): HeaderDetection {
  let best: HeaderDetection = { headerRowIndex: -1, mapping: emptyMapping(), confidence: 0 }

  const limit = Math.min(matrix.length, 10)
  for (let r = 0; r < limit; r++) {
    const row = matrix[r] ?? []
    const chosen = new Map<MappingRole, { col: number; score: number }>()
    const usedCols = new Set<number>()

    for (const role of ROLE_PRIORITY) {
      let bestCol = -1
      let bestScore = 0
      for (let c = 0; c < row.length; c++) {
        if (usedCols.has(c)) continue
        const s = scoreCell(String(row[c] ?? ''), FIELD_SYNONYMS[role] ?? [])
        if (s > bestScore) {
          bestScore = s
          bestCol = c
        }
      }
      if (bestCol >= 0 && bestScore > 0) {
        chosen.set(role, { col: bestCol, score: bestScore })
        usedCols.add(bestCol)
      }
    }

    const totalScore = [...chosen.values()].reduce((acc, v) => acc + v.score, 0)
    const matchedRoles = chosen.size
    // cần ít nhất 3 vai trò khớp để coi là hàng tiêu đề đáng tin
    if (matchedRoles >= 3 && totalScore > best.confidence * 6) {
      best = {
        headerRowIndex: r,
        mapping: {
          date: chosen.get('date')?.col ?? null,
          voucher: chosen.get('voucher')?.col ?? null,
          description: chosen.get('description')?.col ?? null,
          debit: chosen.get('debit')?.col ?? null,
          credit: chosen.get('credit')?.col ?? null,
          amount: chosen.get('amount')?.col ?? null,
          partnerCode: chosen.get('partnerCode')?.col ?? null,
          partnerName: chosen.get('partnerName')?.col ?? null,
          exchangeRate: chosen.get('exchangeRate')?.col ?? null,
          foreignAmount: chosen.get('foreignAmount')?.col ?? null,
        },
        confidence: matchedRoles / 6,
      }
    }
  }
  return best
}

export function emptyMapping(): ColumnMapping {
  return { date: null, voucher: null, description: null, debit: null, credit: null, amount: null, partnerCode: null, partnerName: null, exchangeRate: null, foreignAmount: null }
}

export function isMappingComplete(m: ColumnMapping): boolean {
  return m.date != null && m.voucher != null && m.description != null && m.debit != null && m.credit != null && m.amount != null
}
