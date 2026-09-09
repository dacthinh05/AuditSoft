import { describe, expect, it } from 'vitest'
import { coerceCellToString, cleanText, normalizeForKey } from './clean'

describe('coerceCellToString', () => {
  it('richText object', () => {
    expect(coerceCellToString({ richText: [{ text: 'Thanh ' }, { text: 'toán' }] })).toBe('Thanh toán')
  })
  it('formula result', () => {
    expect(coerceCellToString({ result: 1234.5 })).toBe('1234.5')
  })
  it('number giữ nguyên dạng text', () => {
    expect(coerceCellToString(6428)).toBe('6428')
  })
})

describe('cleanText (thay CLEAN của Power Query)', () => {
  it('loại control char, chuẩn hóa xuống dòng và khoảng trắng', () => {
    expect(cleanText('  Nợ\tLãi\u0007\n\nChuyển  khoản \r\n')).toBe('Nợ Lãi Chuyển khoản')
  })
})

describe('normalizeForKey', () => {
  it('bỏ dấu tiếng Việt + uppercase', () => {
    expect(normalizeForKey('Nộp Bảo Hiểm Người Nước Ngoài')).toBe('NOP BAO HIEM NGUOI NUOC NGOAI')
  })
})
