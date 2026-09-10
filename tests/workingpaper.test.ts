import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractAccountingContext, generateAllWorkingPapers } from '../src/domain/workingpaper/WorkingPaperGenerator'
import type { EngagementInfo } from '../src/domain/workingpaper/types'

describe('Working Paper Auto-Fill Generator', () => {
  it('extracts accounting context from MAU NKC.xlsx and generates all 12 working papers', async () => {
    const sourceWorkbook = path.resolve('MAU NKC.xlsx')
    const templateDir = path.resolve('GLV MAU')
    const outputDir = path.resolve('output_test_glv')

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
    expect(summary.totalFilesProcessed).toBe(12)
    expect(summary.successfulFiles).toBe(12)
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
})
