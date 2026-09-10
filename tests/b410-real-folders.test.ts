import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import fs from 'node:fs'
import path from 'node:path'
import { B410Consolidator } from '../src/domain/workingpaper/b410/B410Consolidator'

describe('B410 Real Directories Verification', () => {
  it('consolidates [Dieu chinh - Dung Khanh] with Hiep as Master', async () => {
    const folder = 'D:/Desktop/Dieu chinh - Dũng Khanh'
    const masterFile = path.join(folder, 'B410 - Dũng Khanh (01.10 - 31.12.2025) - Hiệp.xlsx')
    const memberFiles = [
      masterFile,
      path.join(folder, 'B410 - Dung Khanh 2025 - D2 - Quynh.xlsx'),
      path.join(folder, 'B410 - Dung Khanh 2025 D2 - Duy Phuc.xlsx'),
      path.join(folder, 'B410 - Dung Khanh 2025D2 - Ngan.xlsx'),
    ].filter((f) => fs.existsSync(f))
    if (!fs.existsSync(masterFile)) return
    const outPath = 'D:/Desktop/Project/5. AuditSoft/B410/Output_DungKhanh_Consolidated.xlsx'
    const res = await B410Consolidator.consolidate(masterFile, memberFiles, outPath)
    if (!res.success) {
      process.stderr.write(`\n=== DUNG KHANH ERROR: ${res.message} ===\n\n`)
    }
    expect(res.success).toBe(true)
    // Kiểm tra file đầu ra
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(outPath)
    const ws = wb.worksheets[0]
    expect(ws).toBeDefined()
    if (!ws) return

    expect(ws.name).toMatch(/Sai Sot & Luu Y|B410/i)
    const headerRow = ws.getCell('B9').text.includes('TT') || ws.getCell('B9').text.includes('STT') ? 9 : 11
    expect(ws.getCell(`B${headerRow}`).text).toMatch(/TT|STT/i)
    expect(ws.getCell(`C${headerRow}`).text).toMatch(/GLV|Giấy LV/i)
    expect(ws.getCell(`D${headerRow}`).text).toMatch(/Thực trạng/i)
    expect(ws.getCell(`F${headerRow}`).text).toMatch(/Hướng xử lý/i)

    // Kiểm tra hàng trống 12.75pt và không bị đè ảnh
    let blankRowCount = 0
    let issueRowCount = 0
    for (let r = 12; r <= Math.min(60, ws.rowCount); r++) {
      const row = ws.getRow(r)
      const c2 = ws.getCell(r, 2).text || ''
      const c3 = ws.getCell(r, 3).text || ''
      const c4 = ws.getCell(r, 4).text || ''

      if (!c2 && !c3 && !c4) {
        blankRowCount++
        expect(row.height).toBe(12.75)
      } else if (c3) {
        issueRowCount++
      }
    }
    expect(blankRowCount).toBeGreaterThan(0)
    expect(issueRowCount).toBeGreaterThan(0)
  }, 60000)

  it('consolidates [Dieu chinh - Cuori] with Hiep as Master', async () => {
    const folder = 'D:/Desktop/Dieu chinh - Cuori'
    const masterFile = path.join(folder, 'B410 - Cuori (01.01 - 31.12.2025) - Hiệp.xlsx')
    const memberFiles = [
      masterFile,
      path.join(folder, 'B410 - Cuori 2025 - Linh.xlsx'),
      path.join(folder, 'B410 - Cuori 2025 - Nghia.xlsx'),
      path.join(folder, 'B410 - Cuori 2025 - Quynh.xlsx'),
      path.join(folder, 'B410_CUORI 2025_Truc Nha.xlsx'),
    ].filter((f) => fs.existsSync(f))
    if (!fs.existsSync(masterFile)) return
    const outPath = 'D:/Desktop/Project/5. AuditSoft/B410/Output_Cuori_Consolidated.xlsx'
    const res = await B410Consolidator.consolidate(masterFile, memberFiles, outPath)

    console.log('Cuori Result:', res)
    expect(res.success).toBe(true)
    expect(fs.existsSync(outPath)).toBe(true)

    // Kiểm tra hình ảnh được bảo toàn và không đè chữ
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(outPath)
    const ws = wb.worksheets[0]
    expect(ws).toBeDefined()
    if (!ws) return

    expect(ws.getImages().length).toBeGreaterThanOrEqual(3)
    const imgRows = ws.getImages().map((img) => Math.floor(img.range.tl.row) + 1)
    for (const r of imgRows) {
      const row = ws.getRow(r)
      expect(row.height).toBeGreaterThanOrEqual(50)
    }

    // Đảm bảo có các sheet phụ
    expect(wb.worksheets.length).toBeGreaterThan(1)
  }, 60000)

  it('consolidates [Dieu chinh] (Pro-Concepts) with Hiep as Master', async () => {
    const folder = 'D:/Desktop/Dieu chinh'
    const masterFile = path.join(folder, 'B410 - Pro-Concepts (01.01 - 30.06.2026) - Hiệp.xlsx')
    const memberFiles = [
      masterFile,
      path.join(folder, 'B410 - Pro Concept 2026D1 - Gia Nghiem.xlsx'),
      path.join(folder, 'B410 - Pro concepts 2026 - D1 - Quynh.xlsx'),
      path.join(folder, 'B410 - Pro-Concepts D1 2026 - Nghia.xlsx'),
      path.join(folder, 'B410 - Proconcepts 2026D1 - Tuấn.xlsx'),
      path.join(folder, 'B410 - ProConcepts D1 2026 - Luong - Thanh Tú.xlsx'),
    ].filter((f) => fs.existsSync(f))
    if (!fs.existsSync(masterFile)) return
    const outPath = 'D:/Desktop/Project/5. AuditSoft/B410/Output_ProConcepts_Consolidated.xlsx'
    const res = await B410Consolidator.consolidate(masterFile, memberFiles, outPath)

    console.log('Pro Concepts Result:', res)
    expect(res.success).toBe(true)
    expect(fs.existsSync(outPath)).toBe(true)

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(outPath)
    const ws = wb.worksheets[0]
    expect(ws).toBeDefined()
    if (!ws) return

    expect(ws.name).toMatch(/Sai Sot & Luu Y|B410/i)
    // Đảm bảo số lượng lưu ý được gộp đầy đủ từ tất cả các KTV
    expect(ws.rowCount).toBeGreaterThan(30)
  }, 60000)
})
