import type { SheetType } from '../../shared/types/analytics'
import { normalizeText } from '../../shared/utils/text'
import { GL_FIELDS, IS_FIELDS, IS_SEMANTIC_LABELS, TB_FIELDS, matchHeaderRow, type AliasMatchResult } from './aliases'

export interface HeaderScanResult {
  headerRow: number
  best: AliasMatchResult
}

/** Quét 1..maxRow tìm dòng header tốt nhất theo dictionary (score = core trước, rồi matched). */
export function detectHeaderRow(matrix: unknown[][], fields: typeof GL_FIELDS | typeof TB_FIELDS | typeof IS_FIELDS, maxRow = 50): HeaderScanResult {
  let bestRow = -1
  let best: AliasMatchResult | null = null
  const scanLimit = Math.min(maxRow, matrix.length)
  for (let r = 0; r < scanLimit; r++) {
    const row = matrix[r] ?? []
    const nonEmpty = row.filter((c) => c != null && String(c).trim() !== '').length
    if (nonEmpty < 2) continue
    const res = matchHeaderRow(row, fields)
    if (!best || scoreOf(res, fields) > scoreOf(best, fields)) {
      best = res
      bestRow = r
    }
  }
  return { headerRow: bestRow, best: best ?? emptyMatch(fields) }
}

function scoreOf(res: AliasMatchResult, fields: FieldAliasList): number {
  void fields
  return res.coreMatched * 10 + res.matchedCount + res.confidence
}

type FieldAliasList = typeof GL_FIELDS

function emptyMatch(fields: { semantic: string }[]): AliasMatchResult {
  const mapping: Record<string, number | null> = {}
  const duplicateColumns: Record<string, number[]> = {}
  for (const f of fields) {
    mapping[f.semantic] = null
    duplicateColumns[f.semantic] = []
  }
  return { mapping, duplicateColumns, matchedCount: 0, coreMatched: 0, coreRequired: fields.filter((f) => 'core' in f && f.core).length, evidence: [], confidence: 0 }
}

export interface SheetScore {
  gl: HeaderScanResult
  tb: HeaderScanResult
  is: HeaderScanResult
}

export function classifySheet(matrix: unknown[][]): {
  type: SheetType
  confidence: number
  evidence: string[]
  headerRow: number
  scores: SheetScore
} {
  // Bỏ qua dòng SUBTOTAL/tổng ở đầu: nếu dòng 0 chỉ có số & ít chữ → vẫn quét bình thường,
  // detector tự chọn dòng khớp alias tốt nhất.
  const gl = detectHeaderRow(matrix, GL_FIELDS)
  const tb = detectHeaderRow(matrix, TB_FIELDS)
  const is = detectHeaderRow(matrix, IS_FIELDS)

  const candidates: Array<{ type: SheetType; conf: number; ev: string[]; row: number }> = []

  // GL: cần đủ TK NỢ + TK CÓ + SỐ TIỀN
  if (gl.best.mapping.debitAccount != null && gl.best.mapping.creditAccount != null && gl.best.mapping.amount != null) {
    candidates.push({
      type: 'GENERAL_LEDGER',
      conf: Math.max(0.6, Math.min(1, 0.6 + gl.best.matchedCount * 0.06)),
      ev: gl.best.evidence.map((e) => `GL:${e.header}→${e.semantic}`),
      row: gl.headerRow,
    })
  }
  // TB: cần account + ≥2 cột số dư/phát sinh
  const tbNumeric = ['openingDebit', 'openingCredit', 'movementDebit', 'movementCredit', 'closingDebit', 'closingCredit']
    .filter((k) => tb.best.mapping[k] != null).length
  if (tb.best.mapping.account != null && tbNumeric >= 2) {
    candidates.push({
      type: 'TRIAL_BALANCE',
      conf: Math.max(0.6, Math.min(1, 0.5 + tbNumeric * 0.08)),
      ev: tb.best.evidence.map((e) => `TB:${e.header}→${e.semantic}`),
      row: tb.headerRow,
    })
  }
  // IS: maSo+chiTieu và chiTieu khớp nhãn chuẩn KQKD
  const labelHits = countIsLabels(matrix, is)
  if (is.best.mapping.maSo != null && is.best.mapping.chiTieu != null && labelHits >= 3) {
    candidates.push({
      type: 'INCOME_STATEMENT',
      conf: Math.max(0.6, Math.min(1, 0.4 + labelHits * 0.05)),
      ev: [...is.best.evidence.map((e) => `IS:${e.header}→${e.semantic}`), `IS-labels:${labelHits}`],
      row: is.headerRow,
    })
  }

  candidates.sort((a, b) => b.conf - a.conf)
  const top = candidates[0]
  if (!top) return { type: 'UNKNOWN', confidence: 0, evidence: [], headerRow: -1, scores: { gl, tb, is } }
  return { type: top.type, confidence: top.conf, evidence: top.ev, headerRow: top.row, scores: { gl, tb, is } }
}

const NORMALIZED_IS_LABELS = IS_SEMANTIC_LABELS.map((l) => l)

function countIsLabels(matrix: unknown[][], isScan: HeaderScanResult): number {
  const chiTieuCol = isScan.best?.mapping.chiTieu
  if (chiTieuCol == null) return 0
  const hits = new Set<string>()
  const limit = Math.min(matrix.length, 80)
  for (let r = 0; r < limit; r++) {
    const cell = matrix[r]?.[chiTieuCol]
    if (cell == null) continue
    const t = normalizeText(cell)
    for (const label of NORMALIZED_IS_LABELS) {
      if (t.includes(label)) {
        hits.add(label)
        break
      }
    }
  }
  return hits.size
}
