import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { extractAccountingContext } from '../src/domain/workingpaper/WorkingPaperGenerator'
import { fillExpenseWorkingPaper } from '../src/domain/workingpaper/fillers/G200_ExpenseFiller'
import type { EngagementInfo } from '../src/domain/workingpaper/types'

const ENGAGEMENT: EngagementInfo = {
  clientName: 'Công ty Test NKC-only',
  fiscalYearEnd: '31/12/2025',
  auditorName: 'KTV Test',
  auditFirmName: 'Công ty Kiểm toán Test',
}

/** Dựng file nguồn 1 sheet tên lạ, header Việt, không cột tháng, không CDFS. */
async function buildNkcOnlySource(filePath: string): Promise<void> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('TH331')
  ws.getRow(1).values = ['STT', 'Ngày CT', 'Số CT', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền']
  const rows: Array<[number, string, string, string, string, string, number]> = [
    [1, '15/01/2025', 'CT001', 'Chi phí bán hàng T1', '6411', '1111', 10_000_000],
    [2, '20/01/2025', 'CT002', 'Chi phí QLDN T1', '6421', '1111', 20_000_000],
    [3, '25/01/2025', 'HĐ003', 'Doanh thu T1', '1311', '5111', 150_000_000],
    [4, '10/02/2025', 'CT004', 'Chi phí QLDN T2', '6421', '1111', 22_000_000],
    [5, '12/02/2025', 'HĐ005', 'Doanh thu T2', '1311', '5111', 160_000_000],
    [6, '05/03/2025', 'CT006', 'Chi phí bán hàng T3', '6411', '1111', 11_000_000],
    [7, '08/03/2025', 'PX007', 'Xuất kho giá vốn T3', '632', '1561', 90_000_000],
  ]
  rows.forEach((r, i) => {
    ws.getRow(i + 2).values = r
  })
  await wb.xlsx.writeFile(filePath)
}

describe('WorkingPaper NKC-only source (không CDFS, không cột tháng)', () => {
  it('tổng hợp CDFS rollup 3 số và suy tháng từ ngày chứng từ', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nkc-only-'))
    try {
      const src = path.join(tmp, 'NKC_TH331.xlsx')
      await buildNkcOnlySource(src)

      const ctx = await extractAccountingContext(src, ENGAGEMENT)
      expect(ctx.nkcTransactions.length).toBe(7)

      // Tháng suy từ ngày, không dồn hết về tháng 1
      const months = ctx.nkcTransactions.map((t) => t.month).sort()
      expect(months).toEqual([1, 1, 1, 2, 2, 3, 3])

      // CDFS tổng hợp + rollup cha 3 số
      expect(ctx.cdfsAccounts.get('6411')?.psno).toBe(21_000_000)
      expect(ctx.cdfsAccounts.get('641')?.psno).toBe(21_000_000)
      expect(ctx.cdfsAccounts.get('642')?.psno).toBe(42_000_000)
      expect(ctx.cdfsAccounts.get('632')?.psno).toBe(90_000_000)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('điền được G353/G453 trên template thật (bỏ qua tiêu đề section)', async () => {
    const templatePath = path.resolve('GLV MAU', 'G200 - 300 - 400 -  Mau 2025 - Thinh.xlsx')
    if (!fs.existsSync(templatePath)) {
      console.warn('Bỏ qua vì thiếu template G200 trên máy trạm này.')
      return
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nkc-only-'))
    try {
      const src = path.join(tmp, 'NKC_TH331.xlsx')
      await buildNkcOnlySource(src)
      const ctx = await extractAccountingContext(src, ENGAGEMENT)

      const wb = new ExcelJS.Workbook()
      await wb.xlsx.readFile(templatePath)
      const res = fillExpenseWorkingPaper(wb, ctx)

      expect(res.sheetsUpdated).toContain('G353')
      expect(res.sheetsUpdated).toContain('G453')

      // G353: header dòng 35, tháng 1 ở dòng 36, tháng 3 ở dòng 38, cột B = TK 6411
      const g353 = wb.getWorksheet('G353')!
      expect(Number(g353.getRow(36).getCell(2).value)).toBe(10_000_000)
      expect(Number(g353.getRow(37).getCell(2).value)).toBe(0)
      expect(Number(g353.getRow(38).getCell(2).value)).toBe(11_000_000)

      // G453: header dòng 34, tháng 2 ở dòng 36, cột B = TK 6421
      const g453 = wb.getWorksheet('G453')!
      expect(Number(g453.getRow(36).getCell(2).value)).toBe(22_000_000)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
})
