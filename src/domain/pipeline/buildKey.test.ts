import { describe, expect, it } from 'vitest'
import { buildKey } from './buildKey'
import type { NormalizedEntry } from '../types'

function entry(partial: Partial<NormalizedEntry>): NormalizedEntry {
  return {
    rowIndex: 1,
    displayDate: '',
    dateISO: null,
    rawDateText: '',
    voucher: '',
    description: '',
    debit: '',
    credit: '',
    amount: null,
    errors: [],
    ...partial,
  }
}

describe('buildKey (đúng công thức M)', () => {
  it('ngày hợp lệ → yyyyMMdd ¦ SốCT ¦ DiễnGiải ¦ TKNợ ¦ TKCó', () => {
    const k = buildKey(
      entry({
        dateISO: '2025-01-07',
        voucher: 'PHT',
        // PQ chỉ UPPER(TRIM) — GIỮ nguyên dấu tiếng Việt
        description: 'NỘP BH NGƯỜI NƯỚC NGOÀI T12/2024',
        debit: '3383',
        credit: '111',
      }),
    )
    expect(k).toBe('20250107\u00A6PHT\u00A6NỘP BH NGƯỜI NƯỚC NGOÀI T12/2024\u00A63383\u00A6111')
  })

  it('ngày lỗi → phần ngày = UPPER(text gốc)', () => {
    const k = buildKey(entry({ rawDateText: '31/02/2025', voucher: 'CT1', description: 'X', debit: '111', credit: '112' }))
    expect(k.startsWith('31/02/2025\u00A6CT1')).toBe(true)
  })

  it('tài khoản dạng text không mất số 0 đầu', () => {
    const k = buildKey(entry({ dateISO: '2025-01-07', voucher: 'A', description: 'B', debit: '0001NK', credit: '111' }))
    expect(k.endsWith('\u00A60001NK\u00A6111')).toBe(true)
  })

  it('phân tách là ký tự ¦ (U+00A6)', () => {
    const k = buildKey(entry({ dateISO: '2025-01-07', voucher: 'A', description: 'B', debit: '111', credit: '112' }))
    expect(k.split('\u00A6')).toEqual(['20250107', 'A', 'B', '111', '112'])
  })

  it('ignoreDescription=true → bỏ trường diễn giải khỏi khóa dò', () => {
    const k1 = buildKey(entry({ dateISO: '2025-01-07', voucher: 'PHT', description: 'NỘI DUNG 1', debit: '3383', credit: '111' }), { ignoreDescription: true })
    const k2 = buildKey(entry({ dateISO: '2025-01-07', voucher: 'PHT', description: 'NỘI DUNG 2 (SỬA)', debit: '3383', credit: '111' }), { ignoreDescription: true })
    expect(k1).toBe(k2)
    expect(k1).toBe('20250107\u00A6PHT\u00A63383\u00A6111')
  })

  it('accountLevel=level1 → rút gọn TK về 3 chữ số đầu', () => {
    const k1 = buildKey(entry({ dateISO: '2025-01-07', voucher: 'PHT', description: 'A', debit: '6428', credit: '1121' }), { accountLevel: 'level1' })
    const k2 = buildKey(entry({ dateISO: '2025-01-07', voucher: 'PHT', description: 'A', debit: '642', credit: '112' }), { accountLevel: 'level1' })
    expect(k1).toBe(k2)
    expect(k1).toBe('20250107\u00A6PHT\u00A6A\u00A6642\u00A6112')
  })
})
