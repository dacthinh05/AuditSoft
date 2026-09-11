import { describe, expect, it } from 'vitest'
import { detectHeaderAndMapping } from '../src/infrastructure/excel/columnMapper'

describe('detectHeaderAndMapping với 10 cột NKC thực tế của người dùng', () => {
  // Chuỗi người dùng đưa ra: "NGÀY SỐ CT NỘI DUNG TK NỢ TK có SỐ TIỀN TỶ GIÁ USD MÃ KH TÊN KH"
  const USER_HEADER = [
    'NGÀY',
    'SỐ CT',
    'NỘI DUNG',
    'TK NỢ',
    'TK có',
    'SỐ TIỀN',
    'TỶ GIÁ',
    'USD',
    'MÃ KH',
    'TÊN KH',
  ]

  it('khớp chính xác 10/10 vai trò trên hàng tiêu đề chuẩn của người dùng', () => {
    const matrix = [
      USER_HEADER,
      ['24/02/2026', 'CT001', 'Thu tiền khách hàng', '11225', '131', '9044537160', '25000', '361781.48', 'KH001', 'LEO TRADE'],
    ]
    const detected = detectHeaderAndMapping(matrix)

    expect(detected.headerRowIndex).toBe(0)
    expect(detected.mapping.date).toBe(0)
    expect(detected.mapping.voucher).toBe(1)
    expect(detected.mapping.description).toBe(2)
    expect(detected.mapping.debit).toBe(3)
    expect(detected.mapping.credit).toBe(4)
    expect(detected.mapping.amount).toBe(5)
    expect(detected.mapping.exchangeRate).toBe(6)
    expect(detected.mapping.foreignAmount).toBe(7)
    expect(detected.mapping.partnerCode).toBe(8)
    expect(detected.mapping.partnerName).toBe(9)
  })

  it('vẫn khớp đúng 10/10 cột khi thứ tự cột bị đảo lộn', () => {
    // Hoán đổi vị trí: Số CT trước, rồi Ngày, rồi Mã KH, Diễn giải...
    const scrambledHeader = [
      'SỐ CT',
      'NGÀY',
      'MÃ KH',
      'TÊN KH',
      'NỘI DUNG',
      'TK NỢ',
      'TK có',
      'TỶ GIÁ',
      'USD',
      'SỐ TIỀN',
    ]
    const matrix = [scrambledHeader]
    const detected = detectHeaderAndMapping(matrix)

    expect(detected.headerRowIndex).toBe(0)
    expect(detected.mapping.voucher).toBe(0)
    expect(detected.mapping.date).toBe(1)
    expect(detected.mapping.partnerCode).toBe(2)
    expect(detected.mapping.partnerName).toBe(3)
    expect(detected.mapping.description).toBe(4)
    expect(detected.mapping.debit).toBe(5)
    expect(detected.mapping.credit).toBe(6)
    expect(detected.mapping.exchangeRate).toBe(7)
    expect(detected.mapping.foreignAmount).toBe(8)
    expect(detected.mapping.amount).toBe(9)
  })

  it('tìm đúng dòng tiêu đề khi có 2 dòng tiêu đề công ty/tiêu đề bảng ở trên', () => {
    const matrix = [
      ['CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ ABC'],
      ['SỔ NHẬT KÝ CHUNG - NĂM 2026'],
      USER_HEADER,
      ['24/02/2026', 'CT001', 'Thu tiền', '112', '131', '1000000', null, null, null, null],
    ]
    const detected = detectHeaderAndMapping(matrix)

    expect(detected.headerRowIndex).toBe(2)
    expect(detected.mapping.date).toBe(0)
    expect(detected.mapping.voucher).toBe(1)
    expect(detected.mapping.description).toBe(2)
    expect(detected.mapping.debit).toBe(3)
    expect(detected.mapping.credit).toBe(4)
    expect(detected.mapping.amount).toBe(5)
  })

  it('cột lạ không nhận diện được sẽ trả về null (không tự ý gán về cột 0)', () => {
    const unknownHeader = ['NGÀY', 'SỐ CT', 'CỘT LẠ 1', 'TK NỢ', 'TK CÓ', 'SỐ TIỀN']
    const matrix = [unknownHeader]
    const detected = detectHeaderAndMapping(matrix)

    expect(detected.mapping.description).toBeNull()
    expect(detected.mapping.partnerCode).toBeNull()
    expect(detected.mapping.exchangeRate).toBeNull()
  })
})
