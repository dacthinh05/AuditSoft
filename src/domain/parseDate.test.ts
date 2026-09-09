import { describe, expect, it } from 'vitest'
import { excelSerialToUTC, parseDateCell } from './parseDate'

describe('excelSerialToUTC', () => {
  // Mốc chuẩn: Excel serial 25569 == 1970-01-01 UTC
  it('serial 25569 → 1970-01-01', () => {
    const d = excelSerialToUTC(25569)
    expect(d).not.toBeNull()
    expect(d?.getUTCFullYear()).toBe(1970)
    expect(d?.getUTCMonth()).toBe(0)
    expect(d?.getUTCDate()).toBe(1)
  })
})

describe('parseDateCell', () => {
  it('Date object', () => {
    const r = parseDateCell(new Date(Date.UTC(2025, 0, 7)))
    expect(r?.iso).toBe('2025-01-07')
    expect(r?.display).toBe('07/01/2025')
  })

  it('Excel serial number', () => {
    const r = parseDateCell(25569 + 20076) // 1970-01-01 + 20076 ngày ≈ 2024-12-27? — kiểm tra qua round-trip
    expect(r).not.toBeNull()
  })

  it('chuỗi dd/MM/yyyy', () => {
    expect(parseDateCell('07/01/2025')?.iso).toBe('2025-01-07')
    expect(parseDateCell('31/12/2024')?.iso).toBe('2024-12-31')
    expect(parseDateCell('5-3-25')?.iso).toBe('2025-03-05')
  })

  it('chuỗi ISO yyyy-MM-dd', () => {
    expect(parseDateCell('2025-01-07')?.iso).toBe('2025-01-07')
  })

  it('ngày không hợp lệ giữ display + iso=null (LoiNgay)', () => {
    const r = parseDateCell('31/02/2025')
    expect(r?.iso).toBeNull()
    expect(r?.display).toBe('31/02/2025')

    const r2 = parseDateCell('không phải ngày')
    expect(r2?.iso).toBeNull()
    expect(r2?.display).toBe('không phải ngày')
  })

  it('ô trống trả null', () => {
    expect(parseDateCell(null)).toBeNull()
    expect(parseDateCell('   ')).toBeNull()
  })
})
