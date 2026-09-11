import { describe, it, expect } from 'vitest'
import path from 'path'
import { runFullAnalysis } from '../src/main/AnalysisPipeline'
import { dtoToEntries, dtoToCdfsMap } from '../src/renderer/components/Analytics/analyticsMappers'
import { ExpenseByNatureEngine } from '../src/domain/analytics/ExpenseByNatureEngine'

describe('ExpenseByNatureEngine — Cân Đối Thuyết Minh BCTC (VAS 01 / TT 200)', () => {
  it('chạy trên workbook thực tế MAU NKC.xlsx ra kết quả cân bằng 0 đ', async () => {
    const filePath = path.resolve('MAU NKC.xlsx')
    const res = await runFullAnalysis({ filePath, sheetName: 'NKC' })
    const entries = dtoToEntries(res.journals)
    const cdfsMap = dtoToCdfsMap(res.trialBalance)

    const report = ExpenseByNatureEngine.analyze(entries, cdfsMap as never)
    const recon = report.bctcReconciliation

    expect(recon.isBalanced).toBe(true)
    expect(recon.difference).toBe(0)
  })

  it('tự động cân đối hoàn hảo khi chạy với NKC độc lập (không có CDFS)', async () => {
    const filePath = path.resolve('MAU NKC.xlsx')
    const res = await runFullAnalysis({ filePath, sheetName: 'NKC' })

    const entries = dtoToEntries(res.journals)
    const report = ExpenseByNatureEngine.analyze(entries, new Map())
    const recon = report.bctcReconciliation

    expect(recon.isBalanced).toBe(true)
    expect(Math.abs(recon.difference)).toBeLessThan(1000)
  })
})
