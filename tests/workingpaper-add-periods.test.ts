import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
import ExcelJS from 'exceljs'
import { OpenXmlPackageEditor } from '../src/domain/workingpaper/openxml/OpenXmlPackageEditor'
import { fillAddSheet } from '../src/domain/workingpaper/helpers'

describe('Working Paper ADD Sheet — 2 Đợt Kiểm Toán (Interim & Final)', () => {
  const templatePath = path.resolve('GLV MAU/D500 - HTK - Mau 2024 - Thinh.xlsx')

  it('OpenXmlPackageEditor ghi đúng Đợt 1 và Đợt 2 tùy chỉnh vào Sheet ADD', () => {
    if (!fs.existsSync(templatePath)) return

    const editor = OpenXmlPackageEditor.load(templatePath)
    expect(editor.hasSheet('ADD')).toBe(true)

    editor.fillAddSheet({
      clientName: 'Công ty Cổ phần Sumei Test',
      fiscalYearEnd: '31/12/2025',
      auditPeriod1: '01/01 - 30/09/2025',
      auditPeriod2: '01/10 - 31/12/2025',
      auditorName: 'Đắc Thịnh',
      auditFirmName: 'Công ty TNHH Kiểm toán BẮC ĐẨU',
    })

    const tempOut = path.resolve('temp_test_add_periods.xlsx')
    editor.save(tempOut)

    try {
      const editorReloaded = OpenXmlPackageEditor.load(tempOut)
      const addPath = editorReloaded.resolveSheetPath('ADD')!
      expect(addPath).toBeDefined()
      const zip = new AdmZip(tempOut)
      const addXml = zip.readAsText(addPath)
      expect(addXml).toContain('Đợt 1:             01/01 - 30/09/2025')
      expect(addXml).toContain('Đợt 2:             01/10 - 31/12/2025')
      expect(addXml).toContain('Khách hàng: Công ty Cổ phần Sumei Test')
    } finally {
      if (fs.existsSync(tempOut)) fs.rmSync(tempOut, { force: true })
    }
  })

  it('OpenXmlPackageEditor tự động fallback Đợt 1 và Đợt 2 theo niên độ khi không truyền', () => {
    if (!fs.existsSync(templatePath)) return

    const editor = OpenXmlPackageEditor.load(templatePath)
    editor.fillAddSheet({
      clientName: 'Công ty ABC',
      fiscalYearEnd: '31/12/2025',
      auditorName: 'KTV A',
      auditFirmName: 'Audit Firm B',
    })

    const tempOut = path.resolve('temp_test_add_fallback.xlsx')
    editor.save(tempOut)

    try {
      const editorReloaded = OpenXmlPackageEditor.load(tempOut)
      const addPath = editorReloaded.resolveSheetPath('ADD')!
      expect(addPath).toBeDefined()
      const zip = new AdmZip(tempOut)
      const addXml = zip.readAsText(addPath)
      expect(addXml).toContain('Đợt 1:             01/01 - 30/06/2025')
    } finally {
      if (fs.existsSync(tempOut)) fs.rmSync(tempOut, { force: true })
    }
  })

  it('helpers.fillAddSheet (ExcelJS) ghi đúng Đợt 1 và Đợt 2 tùy chỉnh vào các cell A3, A4', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('ADD')
    ws.getCell('A1').value = 'Khách hàng'
    ws.getCell('A2').value = 'Niên độ'
    ws.getCell('A3').value = 'Đợt 1:             01/01 - 30/06/2026'
    ws.getCell('A4').value = 'Đợt 2:             01/07 - 31/12/2026'

    fillAddSheet(ws, {
      clientName: 'Doanh Nghiệp May Mặc',
      fiscalYearEnd: '31/12/2025',
      auditPeriod1: '01/01 - 30/06/2025',
      auditPeriod2: '01/07 - 31/12/2025',
      auditorName: 'Đắc Thịnh',
    })

    expect(ws.getCell('A3').value).toBe('Đợt 1:             01/01 - 30/06/2025')
    expect(ws.getCell('A4').value).toBe('Đợt 2:             01/07 - 31/12/2025')
    expect(ws.getCell('A1').value).toBe('Khách hàng: Doanh Nghiệp May Mặc')
  })
})
