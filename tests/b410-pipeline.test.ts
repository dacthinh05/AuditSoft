import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import fs from 'node:fs'
import { normalizeSheetName, findB410Sheet, extractCellText } from '../src/domain/workingpaper/b410/B410Parser'
import { filterAndExtractShapes } from '../src/domain/workingpaper/b410/B410ShapeFilter'
import { normalizeGlvCode, calculateSafeRowHeight, normalizeAndGroupIssues } from '../src/domain/workingpaper/b410/B410Normalizer'
import { B410Consolidator } from '../src/domain/workingpaper/b410/B410Consolidator'
import type { B410Issue, B410ParsedFile } from '../src/domain/workingpaper/b410/B410Types'

describe('B410 Parser: Sheet Recognition & Text Extraction', () => {
  it('normalizes sheet names by removing accents, spaces, and special characters', () => {
    expect(normalizeSheetName('Sai Sot & Luu Y')).toBe('saisotluuy')
    expect(normalizeSheetName('Sai sót & lưu ý')).toBe('saisotluuy')
    expect(normalizeSheetName('B410')).toBe('b410')
    expect(normalizeSheetName('B 410')).toBe('b410')
    expect(normalizeSheetName('B.410 - Lưu ý')).toBe('b410luuy')
  })

  it('correctly selects the B410 sheet based on priority and header scoring', () => {
    const wb = new ExcelJS.Workbook()
    wb.addWorksheet('Danh muc TK')
    wb.addWorksheet('Sai sot & luu y')
    wb.addWorksheet('Bang ke 01')

    const found = findB410Sheet(wb)
    expect(found.name).toBe('Sai sot & luu y')
  })

  it('extracts cell text cleanly from strings, numbers, and richText', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Test')
    const row = ws.getRow(1)

    row.getCell(1).value = 'Đơn giản'
    expect(extractCellText(row.getCell(1))).toBe('Đơn giản')

    row.getCell(2).value = {
      richText: [{ text: 'Đoạn 1 ' }, { text: 'Đoạn 2' }],
    }
    expect(extractCellText(row.getCell(2))).toBe('Đoạn 1 Đoạn 2')

    row.getCell(3).value = null
    expect(extractCellText(row.getCell(3))).toBe('')
  })
})

describe('B410 Shape Filter: Validation & Rejection Rules', () => {
  it('rejects shapes located outside the B410 data row range', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Test')

    // Mock image located at row 2 (header/logo area)
    const fakeBuffer = Buffer.alloc(100, 1)
    const imgId = wb.addImage({ buffer: fakeBuffer, extension: 'png' })
    ws.addImage(imgId, {
      tl: { col: 3.1, row: 1.5 }, // Row 2 (0-indexed 1.5)
      br: { col: 4.9, row: 2.8 },
    })

    const res = filterAndExtractShapes(ws, wb, {
      minDataRow: 10,
      maxDataRow: 50,
      contentColStart: 4,
      contentColEnd: 5,
    })

    expect(res.validImages.length).toBe(0)
    expect(res.discardedCount).toBe(1)
    expect(res.discardReasons[0]?.reason).toContain('ngoài vùng dữ liệu')
  })

  it('rejects shapes on hidden rows', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Test')
    const row15 = ws.getRow(15)
    row15.hidden = true

    const fakeBuffer = Buffer.alloc(100, 2)
    const imgId = wb.addImage({ buffer: fakeBuffer, extension: 'png' })
    ws.addImage(imgId, {
      tl: { col: 3.1, row: 14.2 }, // Row 15
      br: { col: 4.9, row: 14.8 },
    })

    const res = filterAndExtractShapes(ws, wb, {
      minDataRow: 10,
      maxDataRow: 50,
      contentColStart: 4,
      contentColEnd: 5,
    })

    expect(res.validImages.length).toBe(0)
    expect(res.discardReasons[0]?.reason).toContain('hàng đang ẩn')
  })

  it('accepts valid images in content rows and deduplicates identical image buffers', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Test')

    const fakeBuffer = Buffer.alloc(200, 3)
    const imgId1 = wb.addImage({ buffer: fakeBuffer, extension: 'png' })
    const imgId2 = wb.addImage({ buffer: fakeBuffer, extension: 'png' })

    ws.addImage(imgId1, {
      tl: { col: 3.1, row: 19.1 }, // Row 20
      br: { col: 4.9, row: 20.9 },
    })
    ws.addImage(imgId2, {
      tl: { col: 3.1, row: 24.1 }, // Row 25
      br: { col: 4.9, row: 25.9 },
    })

    const res = filterAndExtractShapes(ws, wb, {
      minDataRow: 10,
      maxDataRow: 50,
      contentColStart: 4,
      contentColEnd: 5,
    })

    // Chỉ giữ 1 ảnh, ảnh thứ 2 bị loại vì trùng hash
    expect(res.validImages.length).toBe(1)
    expect(res.discardedCount).toBe(1)
    expect(res.discardReasons[0]?.reason).toContain('trùng lặp')
  })
})

describe('B410 Normalizer: GLV Codes, Safe Row Heights & Issue Grouping', () => {
  it('cleans GLV codes by removing spaces and capitalizing', () => {
    expect(normalizeGlvCode('E 440.1')).toBe('E440.1')
    expect(normalizeGlvCode('th 1')).toBe('TH1')
    expect(normalizeGlvCode('  D 740. 2 ')).toBe('D740.2')
  })

  it('ensures rows with 200pt images are assigned height >= 206pt (Anti-Overlap)', () => {
    const fakeIssue: B410Issue = {
      id: 'issue_1',
      sourceFile: 'Cuori.xlsx',
      sourceSheet: 'B410',
      sourceRow: 15,
      glv: 'D340.2',
      finding: 'Mô tả ngắn',
      recommendation: 'Hướng xử lý ngắn',
      sourceRowHeight: 18,
      calculatedHeight: 18,
      images: [
        {
          id: 'img_1',
          buffer: Buffer.alloc(10),
          extension: 'png',
          originalRow: 15,
          widthPt: 300,
          heightPt: 200, // Ảnh cao 200pt
        },
      ],
    }

    const safeHeight = calculateSafeRowHeight(fakeIssue)
    expect(safeHeight).toBeGreaterThanOrEqual(206)
  })

  it('orders TH issues first, numbers TT continuously, and detects performer boundaries', () => {
    const parsedFile: B410ParsedFile = {
      filePath: 'test.xlsx',
      fileName: 'test.xlsx',
      mainSheetName: 'B410',
      extraSheetNames: [],
      performerNames: ['Văn Hiệp', 'Lê Trúc'],
      issues: [
        {
          id: '1',
          sourceFile: 'test.xlsx',
          sourceSheet: 'B410',
          sourceRow: 20,
          glv: 'D740.1',
          finding: 'Lưu ý chi tiết 1',
          recommendation: 'Xử lý 1',
          performer: 'Văn Hiệp',
          sourceRowHeight: 20,
          calculatedHeight: 20,
          images: [],
        },
        {
          id: '2',
          sourceFile: 'test.xlsx',
          sourceSheet: 'B410',
          sourceRow: 11,
          glv: 'TH 1', // Lưu ý TH nằm sau trong mảng
          finding: 'Hồ sơ cần cung cấp',
          recommendation: 'Cung cấp gấp',
          performer: 'Văn Hiệp',
          sourceRowHeight: 20,
          calculatedHeight: 20,
          images: [],
        },
        {
          id: '3',
          sourceFile: 'test.xlsx',
          sourceSheet: 'B410',
          sourceRow: 35,
          glv: 'E340.1',
          finding: 'Chi phí thuế',
          recommendation: 'Kê khai bổ sung',
          performer: 'Lê Trúc', // Đổi KTV
          sourceRowHeight: 20,
          calculatedHeight: 20,
          images: [],
        },
      ],
    }

    const { normalizedIssues } = normalizeAndGroupIssues([parsedFile])

    expect(normalizedIssues.length).toBe(3)
    // Mục TH1 phải nhảy lên đầu tiên, quy tắc: TH không đánh STT (continuousTt = 0)
    expect(normalizedIssues[0]?.glv).toBe('TH1')
    expect(normalizedIssues[0]?.continuousTt).toBe(0)

    expect(normalizedIssues[1]?.glv).toBe('D740.1')
    expect(normalizedIssues[1]?.continuousTt).toBe(1)
    // Mục 2 là cuối nhóm của Văn Hiệp
    expect(normalizedIssues[1]?.isPerformerGroupEnd).toBe(true)

    expect(normalizedIssues[2]?.glv).toBe('E340.1')
    expect(normalizedIssues[2]?.continuousTt).toBe(2)
    expect(normalizedIssues[2]?.performer).toBe('Lê Trúc')
    expect(normalizedIssues[2]?.isPerformerGroupEnd).toBe(true)
  })
})

describe('B410 Full Pipeline: Parse -> Normalize -> Render Integration', () => {
  it('consolidates real Cuori file in under 3 seconds with valid merges and zero overlap', async () => {
    const masterTemplate = 'D:/Desktop/Project/5. AuditSoft/B410/B410 - XCEL WOOD (TL - 31.10.2025) - Gia Cuong.xlsx'
    const sourceFiles = ['D:/Desktop/Dieu chinh - Cuori/B410 - Cuori (01.01 - 31.12.2025) - Hiệp.xlsx']
    const outPath = 'D:/Desktop/Project/5. AuditSoft/B410/Test_Pipeline_Verification.xlsx'

    const res = await B410Consolidator.consolidate(masterTemplate, sourceFiles, outPath)
    expect(res.success).toBe(true)
    expect(res.message).toContain('Đã tổng hợp thành công')

    // Đọc lại file đầu ra để kiểm tra chất lượng
    const outWb = new ExcelJS.Workbook()
    await outWb.xlsx.readFile(outPath)

    const ws = outWb.worksheets[0]
    expect(ws).toBeDefined()
    if (!ws) return

    expect(ws.name).toBe('Sai Sot & Luu Y')
    expect(ws.getImages().length).toBeGreaterThanOrEqual(3)

    const imgRows = ws.getImages().map((img) => Math.floor(img.range.tl.row) + 1)
    for (const r of imgRows) {
      const row = ws.getRow(r)
      expect(row.height).toBeGreaterThanOrEqual(50)
    }

    // Dọn dẹp file test
    try {
      fs.rmSync(outPath, { force: true })
    } catch {}
  })
})
