import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  colLetterToIndex,
  indexToColLetter,
  OpenXmlPackageEditor,
  parseCellRef,
} from '../src/domain/workingpaper/openxml/OpenXmlPackageEditor'

describe('OpenXmlPackageEditor — Direct OpenXML Engine', () => {
  it('chuyển đổi chuẩn xác giữa tên cột và chỉ số 1-based', () => {
    expect(colLetterToIndex('A')).toBe(1)
    expect(colLetterToIndex('B')).toBe(2)
    expect(colLetterToIndex('Z')).toBe(26)
    expect(colLetterToIndex('AA')).toBe(27)
    expect(colLetterToIndex('AB')).toBe(28)

    expect(indexToColLetter(1)).toBe('A')
    expect(indexToColLetter(2)).toBe('B')
    expect(indexToColLetter(26)).toBe('Z')
    expect(indexToColLetter(27)).toBe('AA')
    expect(indexToColLetter(28)).toBe('AB')

    expect(parseCellRef('D12')).toEqual({ col: 'D', row: 12, colIdx: 4 })
    expect(parseCellRef('AA105')).toEqual({ col: 'AA', row: 105, colIdx: 27 })
  })

  it('mở template D500, cập nhật sheet ADD & Lead D510 và lưu file thành công', () => {
    const templatePath = path.resolve('GLV MAU/D500 - HTK - Mau 2024 - Thinh.xlsx')
    if (!fs.existsSync(templatePath)) return

    const outPath = path.resolve('temp_test_openxml_d500.xlsx')
    const editor = OpenXmlPackageEditor.load(templatePath)

    expect(editor.hasSheet('ADD')).toBe(true)
    expect(editor.hasSheet('D 510')).toBe(true)
    expect(editor.hasSheet('D510')).toBe(true)

    // 1. Điền ADD
    editor.fillAddSheet({
      clientName: 'Công ty Cổ phần May Mặc Gia Công Test',
      fiscalYearEnd: '31/12/2026',
      auditPeriod1: '01/01 - 30/06/2026',
      auditPeriod2: '01/07 - 31/12/2026',
      auditorName: 'Đắc Thịnh',
      auditFirmName: 'Công ty TNHH Kiểm toán BẮC ĐẨU',
    })

    // 2. Điền Lead schedule D510
    editor.setLeadRowValues('D 510', 12, { ck: 987654321, dk: 123456789 })

    // 3. Lưu file
    editor.save(outPath)
    expect(fs.existsSync(outPath)).toBe(true)
    expect(fs.statSync(outPath).size).toBeGreaterThan(100000)

    // Dọn dẹp
    try {
      fs.rmSync(outPath, { force: true })
    } catch {}
  })
})
