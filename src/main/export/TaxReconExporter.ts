import ExcelJS from 'exceljs'
import type { TaxCrossReconciliationResult } from '../../domain/analytics/TaxCrossReconciler'

const MONEY_FMT = '#,##0'
const HEADER_FILL = 'FF0F766E'
const HEADER_FONT = 'FFFFFFFF'

/** bigint → number an toàn cho Excel (kẹp trong giới hạn số học). */
function big(v: bigint | undefined): number {
  if (v === undefined) return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function styleHeader(ws: ExcelJS.Worksheet): void {
  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: HEADER_FONT }, size: 11 }
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  header.height = 30
}

function moneyCells(row: ExcelJS.Row, keys: string[]): void {
  for (const k of keys) {
    const cell = row.getCell(k)
    cell.numFmt = MONEY_FMT
    cell.alignment = { vertical: 'middle', horizontal: 'right' }
  }
}

/** Dựng workbook đối chiếu thuế — port mẫu TaxRecord (working paper + TNCN). */
export function buildTaxReconWorkbook(res: TaxCrossReconciliationResult): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'AuditSoft NKC — Tax Analytics'
  wb.created = new Date()

  // Sheet 1: GTGT đối chiếu + dòng luân chuyển [22]/[43]
  const ws1 = wb.addWorksheet('01_GTGT_DoiChieu', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  ws1.columns = [
    { header: 'Kỳ khai', key: 'period', width: 15 },
    { header: 'VAT đầu vào [25]', key: 'taxIn25', width: 18 },
    { header: 'VAT đầu ra [35]', key: 'taxOut35', width: 18 },
    { header: 'Đ/c Giảm [37]', key: 'adjDec37', width: 16 },
    { header: 'Đ/c Tăng [38]', key: 'adjInc38', width: 16 },
    { header: 'Xin hoàn [42]', key: 'ref42', width: 16 },
    { header: 'Phải nộp [40]', key: 'pay40', width: 16 },
    { header: 'Số dư khấu trừ [43]', key: 'bal43', width: 20 },
    { header: 'PS Nợ 133*', key: 'glIn133', width: 18 },
    { header: 'CL Đầu vào ([25] - Nợ 133)', key: 'diffIn', width: 22 },
    { header: 'PS Có 33311', key: 'glOut33311', width: 18 },
    { header: 'CL Đầu ra ([35] - Có 33311)', key: 'diffOut', width: 22 },
    { header: 'Đã nộp thuế (Nợ 33311)', key: 'glPaid', width: 20 },
    { header: 'Doanh thu thuế [34]', key: 'taxRev', width: 20 },
    { header: 'Doanh thu NKC Có 511', key: 'glRev', width: 20 },
    { header: 'Lệch doanh thu', key: 'diffRev', width: 18 },
    { header: 'Ghi chú kiểm toán', key: 'note', width: 45 },
  ]
  for (const r of res.vatRows) {
    const row = ws1.addRow({
      period: r.periodLabel,
      taxIn25: big(r.taxInputVat25),
      taxOut35: big(r.taxOutputVat35),
      adjDec37: big(r.adjustDecrease37),
      adjInc38: big(r.adjustIncrease38),
      ref42: big(r.refund42),
      pay40: big(r.taxPayable40),
      bal43: big(r.closingBalance43),
      glIn133: big(r.glInputVat133),
      diffIn: big(r.inputVatDiff),
      glOut33311: big(r.glOutputVat33311),
      diffOut: big(r.outputVatDiff),
      glPaid: big(r.glPaidVat33311),
      taxRev: big(r.taxRevenue),
      glRev: big(r.glRevenue),
      diffRev: big(r.revenueDiff),
      note: r.auditNote,
    })
    moneyCells(row, ['taxIn25', 'taxOut35', 'adjDec37', 'adjInc38', 'ref42', 'pay40', 'bal43', 'glIn133', 'diffIn', 'glOut33311', 'diffOut', 'glPaid', 'taxRev', 'glRev', 'diffRev'])
    row.height = 22
  }
  const t1 = ws1.addRow({
    period: 'TỔNG CỘNG CẢ NĂM',
    taxIn25: big(res.vatSummary.totalTaxInputVat),
    taxOut35: big(res.vatSummary.totalTaxOutputVat),
    adjDec37: big(res.vatSummary.totalAdjustDecrease37),
    adjInc38: big(res.vatSummary.totalAdjustIncrease38),
    ref42: big(res.vatSummary.totalRefund42),
    pay40: big(res.vatSummary.totalTaxPayable40),
    bal43: res.vatRows.length > 0 ? big(res.vatRows[res.vatRows.length - 1]!.closingBalance43) : 0,
    glIn133: big(res.vatSummary.totalGlInputVat),
    diffIn: big(res.vatSummary.totalInputVatDiff),
    glOut33311: big(res.vatSummary.totalGlOutputVat),
    diffOut: big(res.vatSummary.totalOutputVatDiff),
    glPaid: big(res.vatSummary.totalGlPaidVat33311),
    taxRev: big(res.vatSummary.totalTaxRevenue),
    glRev: big(res.vatSummary.totalGlRevenue),
    diffRev: big(res.vatSummary.totalRevenueDiff),
    note: res.vatSummary.hasDiscrepancy ? 'Có chênh lệch giữa Tờ khai và Sổ kế toán' : 'Khớp hoàn toàn',
  })
  t1.font = { bold: true, size: 11 }
  t1.height = 24
  moneyCells(t1, ['taxIn25', 'taxOut35', 'adjDec37', 'adjInc38', 'ref42', 'pay40', 'bal43', 'glIn133', 'diffIn', 'glOut33311', 'diffOut', 'glPaid', 'taxRev', 'glRev', 'diffRev'])
  styleHeader(ws1)
  ws1.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws1.columns.length } }

  // Sheet 2: TNCN đối chiếu lương Có 334 và thuế khấu trừ Có 3335
  const ws2 = wb.addWorksheet('02_TNCN_Luong334', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  ws2.columns = [
    { header: 'Kỳ khai', key: 'period', width: 14 },
    { header: 'Số LĐ [16]', key: 'emp', width: 12 },
    { header: 'Tổng TNCT [21]', key: 'income', width: 20 },
    { header: 'Quỹ lương sổ NKC (Có 334)', key: 'payroll', width: 24 },
    { header: 'Chênh lệch lương', key: 'diffPay', width: 20 },
    { header: 'Thuế đã khấu trừ [29]', key: 'withheld', width: 20 },
    { header: 'Thuế khấu trừ sổ (Có 3335)', key: 'glWithheld', width: 24 },
    { header: 'Chênh lệch thuế TNCN', key: 'diffTax', width: 20 },
    { header: 'Ghi chú kiểm toán', key: 'note', width: 50 },
  ]
  for (const r of res.pitRows) {
    const row = ws2.addRow({
      period: r.periodLabel,
      emp: big(r.employeeCount),
      income: big(r.taxableIncome),
      payroll: big(r.glPayrollExpense),
      diffPay: big(r.payrollDiff),
      withheld: big(r.withheldTax),
      glWithheld: big(r.glPitWithheld),
      diffTax: big(r.pitWithheldDiff),
      note: r.auditNote,
    })
    moneyCells(row, ['income', 'payroll', 'diffPay', 'withheld', 'glWithheld', 'diffTax'])
    row.height = 22
  }
  const t2 = ws2.addRow({
    period: 'TỔNG CỘNG CẢ NĂM',
    emp: '',
    income: big(res.pitSummary.totalTaxableIncome),
    payroll: big(res.pitSummary.totalGlPayroll),
    diffPay: big(res.pitSummary.totalPayrollDiff),
    withheld: big(res.pitSummary.totalWithheldTax),
    glWithheld: big(res.pitSummary.totalGlPitWithheld),
    diffTax: big(res.pitSummary.totalPitWithheldDiff),
    note: res.pitSummary.hasDiscrepancy ? 'Có chênh lệch đối chiếu' : 'Khớp đúng hoàn toàn',
  })
  t2.font = { bold: true, size: 11 }
  t2.height = 24
  moneyCells(t2, ['income', 'payroll', 'diffPay', 'withheld', 'glWithheld', 'diffTax'])
  styleHeader(ws2)
  ws2.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws2.columns.length } }

  return wb
}
