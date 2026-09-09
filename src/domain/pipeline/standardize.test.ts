import { describe, expect, it } from 'vitest'
import { standardizeSource } from './standardize'
import type { ColumnMapping } from '../types'

const MAPPING: ColumnMapping = { date: 0, voucher: 1, description: 2, debit: 3, credit: 4, amount: 5 }

function rows(): unknown[][] {
  return [
    ['Ngày', 'Số CT', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền'], // header — bị cắt qua firstDataRowIndex
    [new Date(Date.UTC(2025, 0, 7)), 'pht01 ', ' nộp bảo hiểm ', '3383', '111', '1.234.567,89'],
    [null, null, null, null, null, null], // dòng trống hoàn toàn
    ['31/02/2025', 'CT02', 'Ngày sai', '111', '112', 500],
    ['', '', '', '111', '', 0], // Số tiền = 0 → BoRong loại
    ['08/01/2025', 'CT04', 'TK dạng text giữ số 0 đầu', '0001NK', '112', '2,500.75'],
    ['09/01/2025', 'CT05', 'Số tiền lỗi', '111', '112', 'abc'], // lỗi tiền → BoRong loại (ReplaceErrorValues→null)
  ]
}

describe('standardizeSource — tái hiện pqNKC_*_ChuanHoa', () => {
  const result = standardizeSource({ rows: rows(), firstDataRowIndex: 1, mapping: MAPPING })

  it('BoRong: loại dòng trống và dòng Số tiền null/0/lỗi', () => {
    expect(result.stats.dataRows).toBe(3) // pht01, CT02, CT04
    expect(result.stats.blankRows).toBe(1)
    expect(result.stats.zeroOrBadAmountRows).toBe(2) // Số tiền = 0 và 'abc'
    expect(result.entries.length).toBe(3)
  })

  it('UPPER(TRIM) SốCT + Diễn giải — GIỮ dấu tiếng Việt', () => {
    const e = result.entries[0]
    expect(e?.voucher).toBe('PHT01')
    expect(e?.description).toBe('NỘP BẢO HIỂM')
  })

  it('TK Nợ/Có chỉ TRIM — giữ text, không mất số 0 đầu, giữ hậu tố', () => {
    const e = result.entries.find((x) => x.voucher === 'CT04')
    expect(e?.debit).toBe('0001NK')
  })

  it('fnNgayAnToan: Date object / dd/MM/yyyy; ngày lỗi → LoiNgay giữ text gốc', () => {
    expect(result.entries[0]?.dateISO).toBe('2025-01-07')
    expect(result.entries[0]?.displayDate).toBe('07/01/2025')
    const bad = result.entries.find((x) => x.voucher === 'CT02')
    expect(bad?.errors).toContain('LOI_NGAY')
    expect(bad?.rawDateText).toBe('31/02/2025')
    expect(bad?.dateISO).toBeNull()
  })

  it('Number.Round về nguyên: 2.500,75 → 2501', () => {
    const e = result.entries.find((x) => x.voucher === 'CT04')
    expect(e?.amount?.raw).toBe(2501n)
    expect(e?.amount?.scale).toBe(0)
  })

  it('số tiền định dạng Việt Nam', () => {
    expect(result.entries[0]?.amount?.raw).toBe(1234568n)
  })
})
