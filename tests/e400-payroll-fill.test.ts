import path from 'node:path'
import fs from 'node:fs'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { fillPayrollWorkingPaper } from '../src/domain/workingpaper/fillers/E400_PayrollFiller'
import type { WorkingPaperFillContext, NkcTransaction, CdfsAccountRow } from '../src/domain/workingpaper/types'

describe('fillPayrollWorkingPaper — Tự động hoá phân tích lương E 490 & bảo hiểm E 491', () => {
  it('điền đầy đủ 12 tháng chi phí lương E 490 và trích/nộp BHXH E 491 không bị #DIV/0!', async () => {
    const templatePath = path.resolve('GLV MAU/E400 - Luong - Mau 2025 - Thinh.xlsx')
    if (!fs.existsSync(templatePath)) {
      console.warn('Bỏ qua vì không tìm thấy file template E400')
      return
    }

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(templatePath)

    // Tạo mock transactions đại diện 12 tháng
    const txns: NkcTransaction[] = []
    for (let m = 1; m <= 12; m++) {
      const dateStr = `2025-${String(m).padStart(2, '0')}-28`
      // 1. Chi phí lương: Nợ 622, 627, 641, 642 / Có 3341
      txns.push({
        rowNum: m * 10 + 1,
        dateStr,
        dateVal: dateStr,
        docNo: `BL${m}`,
        desc: `Trích lương công nhân T${m}`,
        debit: '622',
        credit: '3341',
        amount: 1_500_000_000,
        month: m,
      })
      txns.push({
        rowNum: m * 10 + 2,
        dateStr,
        dateVal: dateStr,
        docNo: `BL${m}`,
        desc: `Trích lương phân xưởng T${m}`,
        debit: '6271',
        credit: '3341',
        amount: 400_000_000,
        month: m,
      })
      txns.push({
        rowNum: m * 10 + 3,
        dateStr,
        dateVal: dateStr,
        docNo: `BL${m}`,
        desc: `Trích lương bán hàng T${m}`,
        debit: '6411',
        credit: '3341',
        amount: 50_000_000,
        month: m,
      })
      txns.push({
        rowNum: m * 10 + 4,
        dateStr,
        dateVal: dateStr,
        docNo: `BL${m}`,
        desc: `Trích lương quản lý T${m}`,
        debit: '6421',
        credit: '3341',
        amount: 600_000_000,
        month: m,
      })

      // 2. Bảo hiểm tính vào chi phí DN (338 & CP - 21.5%): Nợ 622, 642 / Có 3383, 3384, 3386
      txns.push({
        rowNum: m * 10 + 5,
        dateStr,
        dateVal: dateStr,
        docNo: `PKT_BH${m}`,
        desc: `Trích BHXH chi phí T${m}`,
        debit: '622',
        credit: '3383',
        amount: 320_000_000,
        month: m,
      })
      txns.push({
        rowNum: m * 10 + 6,
        dateStr,
        dateVal: dateStr,
        docNo: `PKT_BH${m}`,
        desc: `Trích BHYT chi phí T${m}`,
        debit: '6421',
        credit: '3384',
        amount: 50_000_000,
        month: m,
      })

      // 3. Khấu trừ bảo hiểm vào lương NLĐ (338 & 334 - 10.5%): Nợ 3341 / Có 3383, 3384
      txns.push({
        rowNum: m * 10 + 7,
        dateStr,
        dateVal: dateStr,
        docNo: `PKT_TRU_BH${m}`,
        desc: `Khấu trừ BHXH vào lương T${m}`,
        debit: '3341',
        credit: '3383',
        amount: 155_000_000,
        month: m,
      })
      txns.push({
        rowNum: m * 10 + 8,
        dateStr,
        dateVal: dateStr,
        docNo: `PKT_TRU_BH${m}`,
        desc: `Khấu trừ BHYT vào lương T${m}`,
        debit: '3341',
        credit: '3384',
        amount: 25_000_000,
        month: m,
      })

      // 4. Chi nộp BHXH qua ngân hàng: Nợ 3383 / Có 1121
      txns.push({
        rowNum: m * 10 + 9,
        dateStr,
        dateVal: dateStr,
        docNo: `UNC_BH${m}`,
        desc: `Nộp tiền BHXH tháng ${m}`,
        debit: '3382',
        credit: '1121TCB',
        amount: 550_000_000,
        month: m,
      })
    }

    const cdfsMap = new Map<string, CdfsAccountRow>()
    const ctx: WorkingPaperFillContext = {
      engagement: {
        clientName: 'Công ty Cổ phần May Mặc Test',
        fiscalYearEnd: '31/12/2025',
        auditorName: 'Nguyễn Đắc Thịnh',
        auditFirmName: 'BẮC ĐẨU',
      },
      cdfsAccounts: cdfsMap,
      nkcTransactions: txns,
    }

    const result = fillPayrollWorkingPaper(wb, ctx)
    expect(result.success).toBe(true)
    expect(result.sheetsUpdated).toContain('E 490')
    expect(result.sheetsUpdated).toContain('E 491')

    // ── Kiểm tra Sheet E 490 ──
    const wsE490 = wb.getWorksheet('E 490')
    expect(wsE490).toBeDefined()
    // Tháng 1 (Hàng 42): 622, 627, 641, 642
    expect(wsE490!.getCell('B42').value).toBe(1_500_000_000)
    expect(wsE490!.getCell('C42').value).toBe(400_000_000)
    expect(wsE490!.getCell('D42').value).toBe(50_000_000)
    expect(wsE490!.getCell('E42').value).toBe(600_000_000)
    // Tháng 12 (Hàng 53)
    expect(wsE490!.getCell('B53').value).toBe(1_500_000_000)

    // Kiểm tra Bảng 1 Nợ/Có 3341 (Hàng 30-34)
    expect(Number(wsE490!.getCell('H30').value)).toBeGreaterThan(0) // Có 3341 đối ứng 622
    expect(Number(wsE490!.getCell('C33').value)).toBeGreaterThan(0) // Nợ 3341 đối ứng 338

    // ── Kiểm tra Sheet E 491 ──
    const wsE491 = wb.getWorksheet('E 491')
    expect(wsE491).toBeDefined()
    // Bảng 2: Tháng 1 (Hàng 32)
    // Cột B: 338 & CP = 320tr + 50tr = 370tr
    expect(wsE491!.getCell('B32').value).toBe(370_000_000)
    // Cột C: 338 & 334 = 155tr + 25tr = 180tr
    expect(wsE491!.getCell('C32').value).toBe(180_000_000)
    // Cột E: Thông báo nộp BHXH được bảo toàn nguyên vẹn công thức template
    expect(wsE491!.getCell('E32').value).toEqual({ formula: 'L32' })
    // Bảng 4.1: Chi nộp BH qua ngân hàng (Hàng 69)
    expect(wsE491!.getCell('C69').value).toBe(550_000_000)
    expect(wsE491!.getCell('G69').value).toBe('P')

    // Bảng 4.3: Chọn mẫu chứng từ nộp bảo hiểm (Hàng 88)
    expect(wsE491!.getCell('B88').value).toBeDefined()
    expect(['3382', '3383']).toContain(wsE491!.getCell('E88').value)
    expect(wsE491!.getCell('F88').value).toBe('1121TCB')
    expect(['✓', 'P']).toContain(wsE491!.getCell('H88').value)
  })
})
