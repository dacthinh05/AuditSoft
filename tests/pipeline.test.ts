import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ExcelJS from 'exceljs'

import { runFullAnalysis } from '../src/main/AnalysisPipeline'
import { buildAuditWorkbook } from '../src/main/export/AuditReportExporter'
import { tmpDir } from './helpers/workbookFixtures'

async function buildMergedWorkbook(dir: string): Promise<string> {
  const f = path.join(dir, 'merged.xlsx')
  const wb = new ExcelJS.Workbook()

  const gl = wb.addWorksheet('NKC')
  gl.getRow(2).values = ['NGÀY', 'SỐ CT', 'NỘI DUNG', 'TK NỢ', 'TK CÓ', 'SỐ TIỀN']
  const glData: Array<[string, string, string, string, string, number]> = [
    // 12 tháng doanh thu đều 100tr/tháng + T12 spike 500tr → December concentration
    ...Array.from({ length: 11 }, (_, m) =>
      [`2025-${String(m + 1).padStart(2, '0')}-15`, `DT${m}`, 'Bán hàng', '13111', '51111', 100_000_000] as [string, string, string, string, string, number],
    ),
    ['2025-12-28', 'DT11', 'Bán hàng T12', '13111', '51111', 500_000_000],
    ['2025-12-29', 'GV1', 'Giá vốn', '63210', '15210', 300_000_000],
    ['2025-03-05', 'PC1', 'Chi phí QLDN', '64270', '11110', 80_000_000],
    ['2025-06-06', 'PC2', 'Vật liệu', '15220', '33110', 250_000_000], // pair hiếm? 152>331 phổ biến — dùng cho accounts/pairs
  ]
  let r = 3
  for (const line of glData) {
    gl.getRow(r).values = line
    r++
  }

  const tb = wb.addWorksheet('CDFS')
  tb.getRow(1).values = ['MATK', 'TENTK', 'SDNDK', 'SDCDK', 'PS No', 'PS Co']
  const tbRows: Array<[string, string, number, number, number, number]> = [
    ['13111', 'Phải thu KH', 0, 0, 1_600_000_000, 0],
    ['51111', 'Doanh thu', 0, 0, 0, 1_600_000_000],
    ['63210', 'Giá vốn', 0, 0, 300_000_000, 0],
    ['64270', 'CP QLDN', 0, 0, 80_000_000, 0],
    ['11110', 'Tiền mặt', 0, 0, 0, 80_000_000],
    ['15210', 'NVL', 0, 0, 0, 300_000_000],
    ['15220', 'NVL2', 0, 0, 250_000_000, 0],
    ['33110', 'Phải trả NCC', 0, 0, 0, 250_000_000],
  ]
  let tr = 2
  for (const row of tbRows) {
    tb.getRow(tr).values = row
    tr++
  }

  const is = wb.addWorksheet('KQKD')
  is.getRow(1).values = ['MS', 'CHỈ TIÊU', 'Năm nay', 'Năm trước']
  const isRows: Array<[string, string, number | null, number | null]> = [
    ['01', 'Doanh thu bán hàng và cung cấp dịch vụ', 1_600_000_000, 1_200_000_000],
    ['10', 'Doanh thu thuần', 1_600_000_000, 1_200_000_000],
    ['11', 'Giá vốn hàng bán', 300_000_000, 200_000_000],
    ['20', 'Lợi nhuận gộp', 1_300_000_000, 1_000_000_000],
    ['25', 'Chi phí quản lý doanh nghiệp', 80_000_000, 60_000_000],
  ]
  let ir = 2
  for (const row of isRows) {
    is.getRow(ir).values = row
    ir++
  }

  await wb.xlsx.writeFile(f)
  return f
}

describe('AnalysisPipeline end-to-end (Phase A–F)', () => {
  it('chạy đủ import→reconcile→kqkd→risk trên workbook tổng hợp', async () => {
    const dir = tmpDir()
    const f = await buildMergedWorkbook(dir)
    // PM mặc định 750tr > spike T12 500tr → truyền materiality nhỏ để gate §46 của rule DEC mở
    const res = await runFullAnalysis({ filePath: f, overall: 600_000_000, performance: 400_000_000, clearlyTrivial: 30_000_000, fiscalYear: 2025 })

    expect(res.selected.GENERAL_LEDGER).toBe('NKC')
    expect(res.selected.TRIAL_BALANCE).toBe('CDFS')
    expect(res.selected.INCOME_STATEMENT).toBe('KQKD')
    expect(res.journalsTotal).toBe(15)
    expect(res.quality?.reliable).toBe(true)

    // Recon khớp hoàn toàn
    expect(res.reconStatus).toBe('PASS')
    expect(res.balanced).toBe(true)

    // KQKD có năm trước; DT tăng ~33.3%
    expect(res.kqkd?.hasPriorYear).toBe(true)
    const rev = res.kqkd?.lines.find((l) => l.maSo === '10')
    expect(rev?.pctChange).not.toBeNull()
    expect(rev!.pctChange!).toBeCloseTo(400 / 1200, 6)

    // Risk: T12 500tr ≥ PM 400tr (truyền vào request) và ≥ 2× TB tháng thường (100tr)
    const dec = res.findings.find((x) => x.ruleId === 'DECEMBER_REVENUE_CONCENTRATION')
    expect(dec).toBeDefined()
    expect(dec!.evidence.journalEntryIds?.length).toBe(1)

    // Exporter tạo đủ 8 sheet
    const wb = buildAuditWorkbook(res)
    const names = wb.worksheets.map((w) => w.name).sort()
    expect(names).toEqual([
      '01_Risk_Summary',
      '02_KQKD_Analysis',
      '03_Account_Analysis',
      '04_Monthly_Trend',
      '05_JE_Risks',
      '06_NKC_CDSPS_Recon',
      '07_Risk_Detail',
      '08_Selected_Journals',
      '09_ChiPhi_BienDong',
    ])

    // ghi đọc lại được
    const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'exp-')), 'rep.xlsx')
    await wb.xlsx.writeFile(out)
    const rb = new ExcelJS.Workbook()
    await rb.xlsx.readFile(out)
    expect(rb.getWorksheet('01_Risk_Summary')!.rowCount).toBeGreaterThan(1)
  }, 60_000)

  it('materiality truyền từ request vào engine', async () => {
    const dir = tmpDir()
    const f = await buildMergedWorkbook(dir)
    // CTT cực lớn → không còn finding LOW noise
    const strict = await runFullAnalysis({ filePath: f, overall: 10_000_000_000, performance: 7_500_000_000, clearlyTrivial: 5_000_000_000, fiscalYear: 2025 })
    const relaxed = await runFullAnalysis({ filePath: f, fiscalYear: 2025 })
    expect(strict.findings.length).toBeLessThanOrEqual(relaxed.findings.length)
  }, 60_000)
})
