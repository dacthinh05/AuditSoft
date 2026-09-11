import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractAccountingContext, generateAllWorkingPapers, generateOutputFileName } from '../src/domain/workingpaper/WorkingPaperGenerator'
import type { EngagementInfo, WorkingPaperFillContext } from '../src/domain/workingpaper/types'

describe('Working Paper Auto-Fill Generator', () => {
  it('extracts accounting context from MAU NKC.xlsx and generates all 15 working papers', async () => {
    const outputDir = path.resolve(`output_test_glv_${Date.now()}_${process.pid}`)
    const sourceWorkbook = path.resolve('MAU NKC.xlsx')
    const templateDir = path.resolve('GLV MAU')
    const engagement: EngagementInfo = {
      clientName: 'Công ty Cổ phần May Mặc Gia Công Test',
      fiscalYearEnd: '31/12/2026',
      auditPeriod1: '01/01 - 30/06/2026',
      auditPeriod2: '01/07 - 31/12/2026',
      auditorName: 'Nguyễn Đắc Thịnh',
      auditFirmName: 'Công ty TNHH Kiểm toán BẮC ĐẨU',
    }

    // 1. Extract context
    const ctx = await extractAccountingContext(sourceWorkbook, engagement)
    expect(ctx.cdfsAccounts.size).toBeGreaterThan(50)
    expect(ctx.nkcTransactions.length).toBeGreaterThan(1000)

    const templateFiles = fs.existsSync(templateDir)
      ? fs.readdirSync(templateDir).filter((f) => f.endsWith('.xlsx') && !f.startsWith('~$'))
      : []
    if (templateFiles.length === 0) {
      console.warn('Bỏ qua kiểm thử generateAllWorkingPapers vì thư mục GLV MAU trống trên máy trạm này.')
      return
    }

    // 2. Generate all 12 working papers
    const summary = await generateAllWorkingPapers(templateDir, outputDir, ctx)
    for (const r of summary.results) {
      if (!r.success) {
        console.error('FAILED FILE:', r.fileName, 'ERROR:', r.error)
      }
    }
    expect(summary.totalFilesProcessed).toBe(15)
    expect(summary.successfulFiles).toBe(15)
    expect(summary.failedFiles).toBe(0)

    // Check files exist on disk
    for (const res of summary.results) {
      expect(res.success).toBe(true)
      const outFilePath = path.join(outputDir, res.fileName)
      expect(fs.existsSync(outFilePath)).toBe(true)
      expect(fs.statSync(outFilePath).size).toBeGreaterThan(1000)
    }

    // Clean up test output safely
    if (fs.existsSync(outputDir)) {
      try {
        fs.rmSync(outputDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
      } catch {
        // Ignore Windows lock on test teardown
      }
    }
  })

  describe('Quy chuẩn đặt tên file 15 Giấy làm việc (D1/D2 & Tên công ty lưu file)', () => {
    it('ghép tên file chuẩn xác khi chọn Đợt 1 (D1)', () => {
      const ctx: WorkingPaperFillContext = {
        engagement: {
          clientName: 'Công ty Cổ phần May Mặc Gia Công Test',
          companyShortName: 'LONG RICH',
          auditRound: 'D1',
          fiscalYearEnd: '31/12/2026',
          auditorName: 'Nguyễn Đắc Thịnh',
        },
        cdfsAccounts: new Map(),
        nkcTransactions: [],
      }

      expect(generateOutputFileName('D100', 'D100 - Tien.xlsx', ctx)).toBe(
        'D100 - Tien - LONG RICH D1 2026 - Thịnh.xlsx',
      )
      expect(generateOutputFileName('D500', 'D500 - HTK.xlsx', ctx)).toBe(
        'D500 - HTK - LONG RICH D1 2026 - Thịnh.xlsx',
      )
      expect(generateOutputFileName('A - B - H', 'A - B - H.xlsx', ctx)).toBe(
        'A - B - H - Master - LONG RICH D1 2026 - Thịnh.xlsx',
      )
      expect(generateOutputFileName('Leadsheet', 'Leadsheet.xlsx', ctx)).toBe(
        'Leadsheet - LONG RICH D1 2026 - Thịnh.xlsx',
      )
    })

    it('ghép tên file chuẩn xác khi chọn Đợt 2 (D2)', () => {
      const ctx: WorkingPaperFillContext = {
        engagement: {
          clientName: 'Công ty Cổ phần May Mặc Gia Công Test',
          companyShortName: 'LONG RICH',
          auditRound: 'D2',
          fiscalYearEnd: '31/12/2025',
          auditorName: 'Đắc Thịnh',
        },
        cdfsAccounts: new Map(),
        nkcTransactions: [],
      }

      expect(generateOutputFileName('D100', 'D100 - Tien.xlsx', ctx)).toBe(
        'D100 - Tien - LONG RICH D2 2025 - Thịnh.xlsx',
      )
      expect(generateOutputFileName('G100', 'G100 - Doanh thu.xlsx', ctx)).toBe(
        'G100 - Doanh thu - LONG RICH D2 2025 - Thịnh.xlsx',
      )
    })

    it('fallback về clientName khi không nhập companyShortName', () => {
      const ctx: WorkingPaperFillContext = {
        engagement: {
          clientName: 'Công ty May Mặc Test',
          fiscalYearEnd: '31/12/2026',
          auditorName: 'Thịnh',
        },
        cdfsAccounts: new Map(),
        nkcTransactions: [],
      }

      expect(generateOutputFileName('D100', 'D100 - Tien.xlsx', ctx)).toBe(
        'D100 - Tien - Công ty May Mặc Test 2026 - Thịnh.xlsx',
      )
    })
  })
})
