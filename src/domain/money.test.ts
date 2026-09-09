import { describe, expect, it } from 'vitest'
import {
  absMoney,
  addMoney,
  cmpMoney,
  moneyFromJSON,
  moneyToJSON,
  moneyToNumber,
  moneyToPlainString,
  negate,
  parseMoney,
  roundToIntegerHalfEven,
  subtractMoney,
  sumMoney,
} from './money'

describe('parseMoney', () => {
  it('định dạng Việt Nam 1.234.567,89', () => {
    const m = parseMoney('1.234.567,89')
    expect(m).not.toBeNull()
    expect(moneyToPlainString(m as NonNullable<ReturnType<typeof parseMoney>>)).toBe('1234567.89')
  })

  it('định dạng Anh/Mỹ 1,234,567.89', () => {
    expect(moneyToPlainString(parseMoney('1,234,567.89')!)).toBe('1234567.89')
  })

  it('số nguyên có dấu cách nghìn', () => {
    expect(moneyToPlainString(parseMoney('1 234 567')!)).toBe('1234567')
  })

  it('âm với dấu trừ và ngoặc đơn', () => {
    expect(moneyToPlainString(parseMoney('-500')!)).toBe('-500')
    expect(moneyToPlainString(parseMoney('(1.234,5)')!)).toBe('-1234.5')
  })

  it('number input', () => {
    expect(moneyToPlainString(parseMoney(1234.56)!)).toBe('1234.56')
  })

  it('không âm thầm biến lỗi thành 0', () => {
    expect(parseMoney('abc')).toBeNull()
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('12ab')).toBeNull()
  })
})

describe('roundToIntegerHalfEven — Number.Round của Power Query', () => {
  it('half-to-even: 2.5→2, 3.5→4, 0.5→0, 1.5→2', () => {
    expect(roundToIntegerHalfEven(parseMoney('2.5')!).raw).toBe(2n)
    expect(roundToIntegerHalfEven(parseMoney('3.5')!).raw).toBe(4n)
    expect(roundToIntegerHalfEven(parseMoney('0.5')!).raw).toBe(0n)
    expect(roundToIntegerHalfEven(parseMoney('1.5')!).raw).toBe(2n)
  })

  it('thường: 2500.75→2501; âm: −400.5→−400 (even), −401.2→−401', () => {
    expect(roundToIntegerHalfEven(parseMoney('2500.75')!).raw).toBe(2501n)
    expect(roundToIntegerHalfEven(parseMoney('-400.5')!).raw).toBe(-400n)
    expect(roundToIntegerHalfEven(parseMoney('-401.2')!).raw).toBe(-401n)
  })
})

describe('Money chính xác tuyệt đối', () => {
  it('0.1 + 0.2 = 0.3 (float sẽ sai)', () => {
    const s = sumMoney([parseMoney('0.1')!, parseMoney('0.2')!])
    expect(moneyToPlainString(s)).toBe('0.3')
  })

  it('cộng hàng triệu dòng nhỏ không drift', () => {
    let acc = parseMoney('0')!
    for (let i = 0; i < 10000; i++) {
      acc = addMoney(acc, parseMoney('0.01')!)
    }
    expect(moneyToPlainString(acc)).toBe('100.00')
  })

  it('trừ và so sánh', () => {
    const d = subtractMoney(parseMoney('4.439.264')!, parseMoney('4.445.070')!)
    expect(moneyToPlainString(d)).toBe('-5806')
    expect(cmpMoney(d, parseMoney('-5806')!)).toBe(0)
  })

  it('align scale khác nhau', () => {
    expect(moneyToPlainString(addMoney(parseMoney('1.5')!, parseMoney('2.25')!))).toBe('3.75')
    expect(moneyToPlainString(negate(absMoney(parseMoney('-7')!)))).toBe('-7')
  })

  it('JSON round-trip', () => {
    const m = parseMoney('-12345.6789')!
    expect(moneyFromJSON(moneyToJSON(m)).raw).toBe(m.raw)
    expect(moneyToJSON(moneyFromJSON(moneyToJSON(m)))).toBe(moneyToJSON(m))
  })

  it('moneyToNumber chỉ dùng để hiển thị', () => {
    expect(moneyToNumber(parseMoney('4439264')!)).toBe(4439264)
  })
})
