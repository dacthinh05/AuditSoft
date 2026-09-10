import type ExcelJS from 'exceljs'
import type { WorkingPaperFillContext, SectionFillResult, NkcTransaction } from '../types'
import {
  fillAddSheet,
  findWorksheetFuzzy,
  normalizeWorkbookSharedFormulas,
  setLeadRowValues,
  styleCellAmount,
  styleCellCode,
  styleCellDate,
  styleCellText,
} from '../helpers'

function getTxnMonth(t: NkcTransaction): number {
  if (t.month >= 1 && t.month <= 12) return t.month
  if (t.dateVal instanceof Date && !isNaN(t.dateVal.getTime())) return t.dateVal.getMonth() + 1
  if (typeof t.dateVal === 'string') {
    const isoM = t.dateVal.match(/^(\d{4})[/\-.](\d{1,2})/)
    if (isoM) return Number(isoM[2])
    const vnM = t.dateVal.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
    if (vnM) return Number(vnM[2])
  }
  return 1
}
export function fillPayrollWorkingPaper(
  wb: ExcelJS.Workbook,
  ctx: WorkingPaperFillContext,
): SectionFillResult {
  const fileName = 'E400 - Luong - Mau 2025 - Thinh.xlsx'
  const updatedSheets: string[] = []
  let itemsCount = 0

  normalizeWorkbookSharedFormulas(wb)

  // 1. ADD
  const wsAdd = wb.getWorksheet('ADD')
  if (wsAdd) {
    fillAddSheet(wsAdd, ctx.engagement)
    updatedSheets.push('ADD')
  }

  // 2. E 410 Lead schedule
  const wsE410 = findWorksheetFuzzy(wb, ['E 410', 'E410'])
  if (wsE410) {
    const payMap: Record<string, number> = {
      '3341': 11,
      '3342': 12,
      '335': 15,
      '3382': 17,
      '3383': 18,
      '3384': 19,
      '3386': 20,
    }

    for (const [prefix, rowNum] of Object.entries(payMap)) {
      const acc = ctx.cdfsAccounts.get(prefix)
      setLeadRowValues(wsE410, rowNum, {
        ck: acc?.cock || acc?.nock || 0,
        dk: acc?.sdcdk || acc?.sdndk || 0,
      })
      itemsCount++
    }
    updatedSheets.push(wsE410.name)
  }

  // 3. E 490 Đối chiếu phân tích chi phí lương & đối ứng Nợ/Có TK 3341
  const wsE490 = findWorksheetFuzzy(wb, ['E 490', 'E490'])
  if (wsE490) {
    // Bảng 1: Cơ cấu đối ứng Nợ/Có TK 3341
    let no334_co111 = 0
    let no334_co112 = 0
    let no334_co333 = 0
    let no334_co338 = 0
    let no334_coKhac = 0

    let co334_no622 = 0
    let co334_no641 = 0
    let co334_no642 = 0

    // Bảng 2: Phân tích chi phí lương 12 tháng theo 622, 627, 641, 642
    const m622 = new Array(12).fill(0)
    const m627 = new Array(12).fill(0)
    const m641 = new Array(12).fill(0)
    const m642 = new Array(12).fill(0)

    for (const t of ctx.nkcTransactions) {
      const m = getTxnMonth(t)
      const mIdx = Math.max(0, Math.min(11, m - 1))

      if (t.debit.startsWith('334')) {
        if (t.credit.startsWith('111')) no334_co111 += t.amount
        else if (t.credit.startsWith('112')) no334_co112 += t.amount
        else if (t.credit.startsWith('333')) no334_co333 += t.amount
        else if (t.credit.startsWith('338')) no334_co338 += t.amount
        else no334_coKhac += t.amount
      }
      if (t.credit.startsWith('334')) {
        if (t.debit.startsWith('622')) {
          m622[mIdx] += t.amount
          co334_no622 += t.amount
        } else if (t.debit.startsWith('627')) {
          m627[mIdx] += t.amount
        } else if (t.debit.startsWith('641')) {
          m641[mIdx] += t.amount
          co334_no641 += t.amount
        } else if (t.debit.startsWith('642')) {
          m642[mIdx] += t.amount
          co334_no642 += t.amount
        }
      }
    }

    // Điền Bảng 1:
    // Bên trái (PS Nợ 3341 - cột C 'Số tiền'): Giữ nguyên công thức tỷ lệ cột D và SUM hàng 35
    styleCellAmount(wsE490.getCell('C30'), no334_co111)
    styleCellAmount(wsE490.getCell('C31'), no334_co112)
    styleCellAmount(wsE490.getCell('C32'), no334_co333)
    styleCellAmount(wsE490.getCell('C33'), no334_co338)
    styleCellAmount(wsE490.getCell('C34'), no334_coKhac)

    // Bên phải (PS Có 3341 - cột H 'Số tiền'): Giữ nguyên công thức tỷ lệ cột I và SUM hàng 35
    styleCellAmount(wsE490.getCell('H30'), co334_no622)
    styleCellAmount(wsE490.getCell('H31'), co334_no641)
    styleCellAmount(wsE490.getCell('H32'), co334_no642)
    itemsCount += 8

    // Điền Bảng 2 (Hàng 42-53, tháng 1-12 - Hình 1):
    // Cột B (622), C (627), D (641), E (642)
    // Cột F là công thức =SUM(B42:E42), hàng 54 là công thức =SUM(...), hàng 55 là tỷ lệ -> HẾT SẠCH #DIV/0!
    for (let m = 0; m < 12; m++) {
      const r = 42 + m
      const row = wsE490.getRow(r)
      styleCellAmount(row.getCell(2), m622[m] ?? 0)
      styleCellAmount(row.getCell(3), m627[m] ?? 0)
      styleCellAmount(row.getCell(4), m641[m] ?? 0)
      styleCellAmount(row.getCell(5), m642[m] ?? 0)
      const monthTotal = (m622[m] ?? 0) + (m627[m] ?? 0) + (m641[m] ?? 0) + (m642[m] ?? 0)
      if (monthTotal > 0) {
        styleCellCode(row.getCell(10), 'P')
      }
      itemsCount += 5
    }

    updatedSheets.push(wsE490.name)
  }

  // 4. E 491 Kiểm tra trích & nộp BHXH, BHYT, BHTN (Hình 2)
  const wsE491 = findWorksheetFuzzy(wb, ['E 491', 'E491'])
  if (wsE491) {
    // 4.1 Bảng 1 (Hàng 18-22): Thống kê số phát sinh tài khoản 338
    let psNo338_111 = 0
    let psNo338_112 = 0
    let psCo338_112 = 0
    let psCo338_334 = 0
    let psCo338_622 = 0
    let psCo338_641 = 0
    let psCo338_642 = 0

    // 4.2 Bảng 2 (Hàng 32-43): Trích & Khấu trừ KPCĐ, BHXH-YT-TN 12 tháng
    // Cột B: 338 & CP (Nợ 622, 627, 641, 642, 154 / Có 3383, 3384, 3386 - loại trừ 3382!)
    // Cột C: 338 & 334 (Nợ 334 / Có 3383, 3384, 3386)
    const insExpense12M = new Array(12).fill(0)
    const insDeduct12M = new Array(12).fill(0)

    // 4.3 Bảng 4.1 (Hàng 69-80): Kiểm tra chi nộp BHXH qua ngân hàng (Nợ 338 / Có 112, 111)
    const insPayment12M = new Array(12).fill(0)
    const insPaymentEntries: NkcTransaction[] = []

    for (const t of ctx.nkcTransactions) {
      const m = getTxnMonth(t)
      const mIdx = Math.max(0, Math.min(11, m - 1))

      const isInsDebt = t.debit.startsWith('338')
      const isInsCred = t.credit.startsWith('338')

      // Các tiểu khoản BHXH bắt buộc (loại trừ 3382 kinh phí công đoàn theo đúng yêu cầu)
      const isMandatoryInsCred =
        t.credit.startsWith('3383') ||
        t.credit.startsWith('3384') ||
        t.credit.startsWith('3386') ||
        (t.credit === '338' && /bhxh|bhyt|bhtn|bảo hiểm/i.test(t.desc) && !/công đoàn|kpcd|3382/i.test(t.desc))

      // 1. Trích tính vào chi phí DN (338 & CP): Nợ chi phí / Có 3383, 3384, 3386
      const isExpenseDebit =
        t.debit.startsWith('622') ||
        t.debit.startsWith('627') ||
        t.debit.startsWith('641') ||
        t.debit.startsWith('642') ||
        t.debit.startsWith('154')

      if (isExpenseDebit && isMandatoryInsCred) {
        insExpense12M[mIdx] += t.amount
      }

      // 2. Khấu trừ vào lương NLĐ (338 & 334): Nợ 334 / Có 3383, 3384, 3386
      if (t.debit.startsWith('334') && isMandatoryInsCred) {
        insDeduct12M[mIdx] += t.amount
      }

      // 3. Bảng 1: Đối ứng TK 338
      if (isInsDebt) {
        if (t.credit.startsWith('111')) psNo338_111 += t.amount
        else if (t.credit.startsWith('112')) {
          psNo338_112 += t.amount
          insPayment12M[mIdx] += t.amount
          insPaymentEntries.push(t)
        }
      }
      if (isInsCred) {
        if (t.debit.startsWith('112')) psCo338_112 += t.amount
        else if (t.debit.startsWith('334')) psCo338_334 += t.amount
        else if (t.debit.startsWith('622')) psCo338_622 += t.amount
        else if (t.debit.startsWith('641')) psCo338_641 += t.amount
        else if (t.debit.startsWith('642')) psCo338_642 += t.amount
      }
    }

    // Điền Bảng 1 (Hàng 18-22):
    // Cột C (PS Nợ):
    styleCellAmount(wsE491.getCell('C18'), psNo338_111)
    styleCellAmount(wsE491.getCell('C19'), psNo338_112)
    // Cột G (PS Có):
    styleCellAmount(wsE491.getCell('G18'), psCo338_112)
    styleCellAmount(wsE491.getCell('G19'), psCo338_334)
    styleCellAmount(wsE491.getCell('G20'), psCo338_622)
    styleCellAmount(wsE491.getCell('G21'), psCo338_641)
    styleCellAmount(wsE491.getCell('G22'), psCo338_642)
    itemsCount += 7

    // Điền Bảng 2 (Hàng 32-43, Tháng 1-12 - Hình 2):
    // Cột B: 338 & CP (21.5%)
    // Cột C: 338 & 334 (10.5%)
    // Cột E: Thông báo BHXH / Số nộp
    // Cột D (=B+C), Cột F (=D-E), Cột G (=B/C ~ 2.05) là công thức tự tính -> HẾT SẠCH #DIV/0!
    for (let m = 0; m < 12; m++) {
      const r = 32 + m
      const row = wsE491.getRow(r)
      styleCellAmount(row.getCell(2), insExpense12M[m] ?? 0)
      styleCellAmount(row.getCell(3), insDeduct12M[m] ?? 0)
      if (insPayment12M[m] > 0) {
        styleCellAmount(row.getCell(5), insPayment12M[m])
      }
      itemsCount += 3
    }

    // Điền Bảng 4.1 (Hàng 69-80, Tháng 1-12):
    // Cột C: CỘNG CHI NỘP BH (qua ngân hàng)
    // Cột G: Check 'P'
    for (let m = 0; m < 12; m++) {
      const r = 69 + m
      const row = wsE491.getRow(r)
      styleCellAmount(row.getCell(3), insPayment12M[m] ?? 0)
      if (insPayment12M[m] > 0) {
        styleCellCode(row.getCell(7), 'P')
      }
      itemsCount += 2
    }

    // Điền Bảng 4.3 (Hàng 88+): Chọn mẫu các chứng từ chi nộp bảo hiểm lớn nhất
    const topInsPayments = insPaymentEntries
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    let rSample = 88
    for (const item of topInsPayments) {
      const row = wsE491.getRow(rSample)
      styleCellDate(row.getCell(2), item.dateVal)
      styleCellCode(row.getCell(3), item.docNo)
      styleCellText(row.getCell(4), item.desc)
      styleCellCode(row.getCell(5), item.debit)
      styleCellCode(row.getCell(6), item.credit)
      styleCellAmount(row.getCell(7), item.amount)
      styleCellCode(row.getCell(8), 'P')
      rSample++
      itemsCount += 7
    }

    updatedSheets.push(wsE491.name)
  }

  return {
    fileName,
    success: true,
    sheetsUpdated: updatedSheets,
    itemsFilledCount: itemsCount,
  }
}
