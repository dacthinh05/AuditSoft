import { describe, expect, it } from 'vitest'
import { moneyFromJSON } from '../money'
import type { DiffRow } from '../types'
import { buildInventorySummary } from './inventory'

function row(debit: string, credit: string, diff: string): DiffRow {
  return {
    stt: 1,
    kind: 'AMOUNT_CHANGED',
    key: 'k',
    dateISO: null,
    dateDisplay: '',
    loiNgay: false,
    loiNgayText: '',
    voucher: 'V',
    description: 'D',
    debit,
    credit,
    amountAfter: '0|0',
    amountBefore: '0|0',
    difference: diff,
    note: '',
    priority: '',
  }
}

describe('buildInventorySummary — Tổng hợp điều chỉnh tồn kho', () => {
  it('Ghi Nợ / Ghi Có / Net theo 3 số đầu; Gross = Σ|chênh lệch|', () => {
    const rows = [
      row('1521', '3311', '0|100'), // 152: ghiNo +100
      row('1121', '1551', '0|-60'), // 155: ghiCo −60 → net +60
      row('1564', '9111', '0|40'),
      row('9999', '9998', '0|5'), // không thuộc tồn kho
    ]
    const out = buildInventorySummary(rows)
    const g152 = out.find((r) => r.group === '152')
    expect(moneyFromJSON(g152?.net ?? '0|0').raw).toBe(100n)
    const g155 = out.find((r) => r.group === '155')
    expect(moneyFromJSON(g155?.ghiCo ?? '0|0').raw).toBe(-60n)
    expect(moneyFromJSON(g155?.net ?? '0|0').raw).toBe(60n)
    const total = out[out.length - 1]
    expect(total?.isTotal).toBe(true)
    expect(total?.group).toBe('TỔNG TỒN KHO')
    // Gross tổng = Σ|chênh lệch| mọi dòng chạm nhóm: 100 + 60 + 40 = 200
    expect(moneyFromJSON(total?.gross ?? '0|0').raw).toBe(200n)
  })

  it('158 KHÔNG thuộc nhóm HTK theo phân loại phần hành nhưng CÓ trong bảng tồn kho', () => {
    const rows = [row('1581', '3311', '0|10')]
    const out = buildInventorySummary(rows)
    const g = out.find((r) => r.group === '158')
    expect(g).toBeDefined()
    expect(moneyFromJSON(g?.net ?? '0|0').raw).toBe(10n)
  })
})
