import { describe, it, expect } from 'vitest'
import { detectHeaderAndMapping } from '../src/infrastructure/excel/columnMapper'
import { standardizeSource } from '../src/domain/pipeline/standardize'
import { fromNormalizedEntry } from '../src/domain/engine/IAuditDataEngine'
import type { ColumnMapping, NormalizedEntry } from '../src/domain/types'
import { makeMoney } from '../src/domain/money'

describe('NKC 10 Cột: Mã KH, Tên KH, Tỷ Giá, Ngoại Tệ', () => {
  it('detectHeaderAndMapping nhận diện chính xác 6 cột bắt buộc và 4 cột mở rộng', () => {
    const sampleHeader = [
      'STT',
      'NGÀY',
      'SỐ CT',
      'NỘI DUNG',
      'TK NỢ',
      'TK CÓ',
      'SỐ TIỀN',
      'TỶ GIÁ',
      'US',
      'MÃ KH',
      'TÊN KH',
    ]
    const matrix = [sampleHeader, ['1', '01/01/2025', 'CT01', 'Bán hàng', '131', '511', '25000000', '25000', '1000', 'KH01', 'Công ty ABC']]

    const detected = detectHeaderAndMapping(matrix)
    expect(detected.headerRowIndex).toBe(0)
    expect(detected.mapping.date).toBe(1)
    expect(detected.mapping.voucher).toBe(2)
    expect(detected.mapping.description).toBe(3)
    expect(detected.mapping.debit).toBe(4)
    expect(detected.mapping.credit).toBe(5)
    expect(detected.mapping.amount).toBe(6)
    expect(detected.mapping.exchangeRate).toBe(7)
    expect(detected.mapping.foreignAmount).toBe(8)
    expect(detected.mapping.partnerCode).toBe(9)
    expect(detected.mapping.partnerName).toBe(10)
  })

  it('standardizeSource trích xuất đầy đủ 4 cột mở rộng khi có dữ liệu', () => {
    const rows = [
      ['Ngày', 'Số CT', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền', 'Tỷ giá', 'USD', 'Mã KH', 'Tên KH'],
      ['01/01/2025', 'CT01', 'Bán hàng xuất khẩu', '131', '511', '25.000.000', '25000', '1000', 'CUST_A', 'Công ty Alpha'],
      ['02/01/2025', 'CT02', 'Cước điện thoại', '642', '111', '500.000', '0', '-', '', ''],
    ]

    const mapping: ColumnMapping = {
      date: 0,
      voucher: 1,
      description: 2,
      debit: 3,
      credit: 4,
      amount: 5,
      exchangeRate: 6,
      foreignAmount: 7,
      partnerCode: 8,
      partnerName: 9,
    }

    const res = standardizeSource({ rows, firstDataRowIndex: 1, mapping })
    expect(res.entries.length).toBe(2)

    // Dòng 1: Đủ thông tin ngoại tệ và khách hàng
    const e1 = res.entries[0]!
    expect(e1.partnerCode).toBe('CUST_A')
    expect(e1.partnerName).toBe('Công ty Alpha')
    expect(e1.exchangeRate?.raw).toBe(25000n)
    expect(e1.foreignAmount?.raw).toBe(1000n)

    // Dòng 2: Ngoại tệ = 0 hoặc '-' -> parseMoney ra 0n hoặc null, đối tượng trống -> null
    const e2 = res.entries[1]!
    expect(e2.partnerCode).toBeNull()
    expect(e2.partnerName).toBeNull()
    expect(e2.foreignAmount).toBeNull()
  })

  it('tương thích ngược 100% với file 6 cột cũ (không có cột mở rộng)', () => {
    const rows = [
      ['Ngày', 'Số CT', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền'],
      ['01/01/2025', 'CT01', 'Bán hàng', '111', '511', '1.000.000'],
    ]

    const mapping: ColumnMapping = {
      date: 0,
      voucher: 1,
      description: 2,
      debit: 3,
      credit: 4,
      amount: 5,
      exchangeRate: null,
      foreignAmount: null,
      partnerCode: null,
      partnerName: null,
    }

    const res = standardizeSource({ rows, firstDataRowIndex: 1, mapping })
    expect(res.entries.length).toBe(1)
    const e = res.entries[0]!
    expect(e.partnerCode).toBeNull()
    expect(e.partnerName).toBeNull()
    expect(e.exchangeRate).toBeNull()
    expect(e.foreignAmount).toBeNull()
    expect(e.errors).toEqual([])
  })

  it('fromNormalizedEntry chuyển đổi đúng partnerCode và partnerName sang JournalEntryRecord', () => {
    const entry: NormalizedEntry = {
      rowIndex: 1,
      displayDate: '01/01/2025',
      dateISO: '2025-01-01',
      rawDateText: '01/01/2025',
      voucher: 'CT01',
      description: 'THU TIEN BAN HANG',
      debit: '111',
      credit: '131',
      amount: makeMoney(100_000_000n, 0),
      partnerCode: 'KH_HOANGHA',
      partnerName: 'Công ty Hoàng Hà',
      exchangeRate: null,
      foreignAmount: null,
      errors: [],
    }

    const rec = fromNormalizedEntry(entry, 1)
    expect(rec.partnerCode).toBe('KH_HOANGHA')
    expect(rec.partnerName).toBe('Công ty Hoàng Hà')
    expect(rec.amount).toBe(100_000_000n)
  })
})
