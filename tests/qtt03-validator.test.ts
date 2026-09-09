import { describe, it, expect } from 'vitest'
import fs from 'fs'
import { EtaxXmlParser } from '../src/domain/etax/EtaxXmlParser'
import { Qtt03Validator } from '../src/domain/etax/Qtt03Validator'

describe('Qtt03Validator Phase 3: Financial Integrity Gate', () => {
  const realOldPath = 'D:/Desktop/thư mục/3700426920000-03_TNDN_TT80-Y2025-L00 (cũ).xml'
  const realNewPath = 'D:/Desktop/thư mục/gemini-code-1788835615512 (mới).xml'

  it('xác thực bảo toàn số liệu 100% trên cặp file thực tế của người dùng', () => {
    if (!fs.existsSync(realOldPath) || !fs.existsSync(realNewPath)) return

    const oldXml = fs.readFileSync(realOldPath, 'utf8')
    const newXml = fs.readFileSync(realNewPath, 'utf8')

    const oldDoc = EtaxXmlParser.parseQtt03(oldXml)
    const newDoc = EtaxXmlParser.parseQtt03(newXml)

    const summary = Qtt03Validator.validate(oldDoc, newDoc)

    // 1. Kiểm tra toàn bộ điều kiện vượt qua
    expect(summary.isAllPassed).toBe(true)

    // 2. Chênh lệch tài chính ròng = 0 VNĐ
    expect(summary.netVariance).toBe(0)

    // 3. Khớp các chỉ tiêu cốt lõi
    expect(summary.newLntt).toBe(31615542690)
    expect(summary.newTaxPayable).toBe(6415180887)

    // 4. Các điều kiện bất biến (Invariants)
    const zeroVarInv = summary.invariants.find((inv) => inv.name.includes('Zero Variance'))
    expect(zeroVarInv?.passed).toBe(true)

    const mstInv = summary.invariants.find((inv) => inv.name.includes('Mã số thuế'))
    expect(mstInv?.passed).toBe(true)

    // 5. Kiểm tra danh sách phụ lục được đối chiếu: có đủ 4 phụ lục
    expect(summary.appendixList.length).toBe(4)
    const appendixTags = summary.appendixList.map((a) => a.tag)
    expect(appendixTags).toContain('PLuc_03_1A_TNDN')
    expect(appendixTags).toContain('PL_GDLK2-01')
    expect(appendixTags).toContain('PL_GDLK2-02')
    expect(appendixTags).toContain('PL_GDLK2-03')
  })

  it('phát hiện ngay lập tức khi cố tình làm sai lệch số liệu', () => {
    if (!fs.existsSync(realOldPath) || !fs.existsSync(realNewPath)) return

    const oldXml = fs.readFileSync(realOldPath, 'utf8')
    const newXml = fs.readFileSync(realNewPath, 'utf8')

    const oldDoc = EtaxXmlParser.parseQtt03(oldXml)
    const tamperedNewDoc = EtaxXmlParser.parseQtt03(newXml)

    // Cố tình làm lệch 1 đồng ở chỉ tiêu ctA1
    tamperedNewDoc.mainForm.ctA1 = oldDoc.mainForm.ctA1 + 1

    const summary = Qtt03Validator.validate(oldDoc, tamperedNewDoc)

    expect(summary.isAllPassed).toBe(false)
    expect(summary.netVariance).toBe(1)

    const a1Diff = summary.mainFormDiffs.find((d) => d.code === 'ctA1')
    expect(a1Diff?.status).toBe('MISMATCH')
    expect(a1Diff?.variance).toBe(1)
  })
})
