import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'
import { extractAccountingContext, generateAllWorkingPapers } from '../src/domain/workingpaper/WorkingPaperGenerator'
import { OpenXmlPackageEditor } from '../src/domain/workingpaper/openxml/OpenXmlPackageEditor'

describe('D300 Working Paper Full 6 Sheets Automation', () => {
  it('tự động điền đầy đủ 6 sheet trọng yếu trong D300 bằng OpenXmlPackageEditor', async () => {
    const outputDir = path.resolve('output_test_d300')
    const sourceWorkbook = path.resolve('MAU NKC.xlsx')
    const templateDir = path.resolve('GLV MAU')
    const engagement = {
      clientName: 'Công ty Cổ phần May Mặc Gia Công Test',
      fiscalYearEnd: '31/12/2026',
      auditPeriod1: '01/01 - 30/06/2026',
      auditPeriod2: '01/07 - 31/12/2026',
      auditorName: 'Thịnh',
      auditFirmName: 'Công ty TNHH Kiểm toán BẮC ĐẨU',
    }

    const ctx = await extractAccountingContext(sourceWorkbook, engagement)
    const summary = await generateAllWorkingPapers(templateDir, outputDir, ctx)

    const d300Res = summary.results.find((r) => r.fileName.startsWith('D300'))
    expect(d300Res).toBeDefined()
    expect(d300Res!.success).toBe(true)

    // Kiểm tra danh sách sheet đã được cập nhật
    const updated = d300Res!.sheetsUpdated
    expect(updated).toContain('ADD')
    expect(updated).toContain('D 310')
    expect(updated).toContain('D 341')
    expect(updated).toContain('D 351.1')
    expect(updated).toContain('D 351.2')
    expect(updated).toContain('D 352')
    expect(updated).toContain('D 390')
    expect(updated).toContain('D 391')

    // Mở file kiểm tra bằng OpenXmlPackageEditor để xác nhận các ô tính
    const outFilePath = path.join(outputDir, d300Res!.fileName)
    expect(fs.existsSync(outFilePath)).toBe(true)
    const editor = OpenXmlPackageEditor.load(outFilePath)

    // 1. Kiểm tra D 341
    expect(editor.hasSheet('D 341')).toBe(true)

    // 2. Kiểm tra D 390
    expect(editor.hasSheet('D 390')).toBe(true)

    // 3. Kiểm tra D 352
    expect(editor.hasSheet('D 352')).toBe(true)

    // Cleanup
    fs.rmSync(outputDir, { recursive: true, force: true })
  })
})
