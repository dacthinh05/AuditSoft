import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import path from 'node:path'
import fs from 'node:fs'
import { fillTaxWorkingPaper } from '../src/domain/workingpaper/fillers/E300_TaxFiller'
import type { VatDeclarationSnapshot, TaxPeriodType } from '../src/shared/types/taxAnalytics'
import type { WorkingPaperFillContext, EngagementInfo } from '../src/domain/workingpaper/types'

const ENGAGEMENT: EngagementInfo = {
  clientName: 'Công ty Test Thuế',
  fiscalYearEnd: '31/12/2025',
  auditorName: 'KTV Test',
  auditFirmName: 'Công ty Kiểm toán Test',
}

function mockDecl(month: number, ct37 = 0n, ct38 = 0n, ct40 = 0n, ct42 = 0n): VatDeclarationSnapshot {
  const ind = (code: string, num: bigint) => ({ code, name: code, rawValue: String(num), numericValue: num })
  return {
    taxpayerId: '0101234567',
    taxpayerName: 'CTY TEST',
    formCode: '01/GTGT',
    period: {
      type: 'MONTH' as TaxPeriodType,
      value: `Tháng ${month}/2025`,
      normalizedKey: `2025-M${String(month).padStart(2, '0')}`,
      year: 2025,
      month,
    },
    declarationType: 'ORIGINAL',
    indicators: {
      '37': ind('37', ct37),
      '38': ind('38', ct38),
      '40': ind('40', ct40),
      '42': ind('42', ct42),
    },
  }
}

describe('E300 fillTaxWorkingPaper với tờ khai GTGT ([37]/[38]/[40]/[42])', () => {
  it('điền số tờ khai vào các cột D, E, F, G của sheet E 380', async () => {
    const templatePath = path.resolve('GLV MAU', 'E300 - Thue - Mau 2024 - Thinh.xlsx')
    if (!fs.existsSync(templatePath)) {
      console.warn('Bỏ qua vì thiếu template E300.')
      return
    }

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(templatePath)

    const decls: VatDeclarationSnapshot[] = [
      mockDecl(1, 1_000_000n, 2_000_000n, 5_000_000n, 0n),
      mockDecl(6, 0n, 0n, 0n, 12_000_000n),
      mockDecl(12, 500_000n, 0n, 8_000_000n, 0n),
    ]

    const ctx: WorkingPaperFillContext = {
      engagement: ENGAGEMENT,
      cdfsAccounts: new Map(),
      nkcTransactions: [],
      vatDeclarations: decls,
    }

    const res = fillTaxWorkingPaper(wb, ctx)
    expect(res.success).toBe(true)
    expect(res.sheetsUpdated).toContain('E 380')

    const ws = wb.getWorksheet('E 380')!
    // Tháng 1: dòng 19 (18 + 1)
    // Cột 4=D ([37]), 5=E ([38]), 6=F ([42]), 7=G ([40])
    const r1 = ws.getRow(19)
    expect(Number(r1.getCell(4).value)).toBe(1_000_000)
    expect(Number(r1.getCell(5).value)).toBe(2_000_000)
    expect(Number(r1.getCell(6).value)).toBe(0)
    expect(Number(r1.getCell(7).value)).toBe(5_000_000)

    // Tháng 6: dòng 24
    const r6 = ws.getRow(24)
    expect(Number(r6.getCell(6).value)).toBe(12_000_000)

    // Tháng 12: dòng 30
    const r12 = ws.getRow(30)
    expect(Number(r12.getCell(4).value)).toBe(500_000)
    expect(Number(r12.getCell(7).value)).toBe(8_000_000)
  })

  it('điền số liệu khấu trừ thuế TNCN và nộp thuế vào sheet E 381 chuẩn Mẫu Ảnh 3', async () => {
    const templatePath = path.resolve('GLV MAU', 'E300 - Thue - Mau 2024 - Thinh.xlsx')
    if (!fs.existsSync(templatePath)) return

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(templatePath)

    const ctx: WorkingPaperFillContext = {
      engagement: ENGAGEMENT,
      cdfsAccounts: new Map(),
      nkcTransactions: [
        // Tháng 3: trích thuế TNCN 81.3tr
        {
          rowNum: 1,
          dateStr: '2025-03-31',
          dateVal: null,
          docNo: 'PKT01',
          desc: 'Khấu trừ thuế TNCN tháng 3',
          debit: '334',
          credit: '3335',
          amount: 81_300_000,
          month: 3,
        },
        // Tháng 4: nộp thuế TNCN 81.3tr
        {
          rowNum: 2,
          dateStr: '2025-04-15',
          dateVal: null,
          docNo: 'UNC01',
          desc: 'Nộp thuế TNCN vào NSNN',
          debit: '3335',
          credit: '112',
          amount: 81_300_000,
          month: 4,
        },
      ],
      pitDeclarations: [
        {
          taxpayerId: '0101234567',
          taxpayerName: 'CTY TEST',
          formCode: '05/KK-TNCN',
          period: {
            type: 'QUARTER' as TaxPeriodType,
            value: 'Quý 1/2025',
            normalizedKey: '2025-Q1',
            year: 2025,
            quarter: 1,
          },
          declarationType: 'ORIGINAL',
          isFinalization: false,
          ct16_tongSoNguoiLaoDong: 50n,
          ct21_tongThuNhapChiuThue: 1_000_000_000n,
          ct26_tongThuNhapChiuThueKhauTru: 300_000_000n,
          ct29_tongThueTncnDaKhauTru: 81_300_000n,
          ct28_thueKhauTruCuTru: 81_300_000n,
          ct29_thueKhauTruKhongCuTru: 0n,
        },
      ],
    }

    const res = fillTaxWorkingPaper(wb, ctx)
    expect(res.success).toBe(true)
    expect(res.sheetsUpdated).toContain('E 381')

    const ws = wb.getWorksheet('E 381')!
    // Quý 1 rơi vào tháng 3 -> dòng 23 (20 + 3)
    const r3 = ws.getRow(23)
    expect(Number(r3.getCell(2).value)).toBe(81_300_000) // B: Cư trú
    expect(Number(r3.getCell(3).value)).toBe(0)          // C: Không cư trú
    expect(Number(r3.getCell(5).value)).toBe(81_300_000) // E: Có 3335

    // Tháng 4 -> dòng 24 (20 + 4): Nợ 3335 (Đã nộp) = 81.3tr
    const r4 = ws.getRow(24)
    expect(Number(r4.getCell(7).value)).toBe(81_300_000) // G: Đã nộp
  })
})
