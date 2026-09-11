import type { JournalEntry } from '../../shared/types/analytics'
import type {
  PitDeclarationSnapshot,
  VatDeclarationSnapshot,
} from '../../shared/types/taxAnalytics'

export interface VatReconRow {
  periodKey: string // "2025-Q1", "2025-M01"...
  periodLabel: string // "Tháng 01/2025" hoặc "Quý 1/2025"
  declarationType: string
  // Khối 1: Kê Khai Thuế GTGT (Từ Tờ Khai 01/GTGT)
  openingBalance22: bigint // [22] VAT đầu kỳ
  taxInputVat25: bigint    // [25] VAT đầu vào
  taxOutputVat35: bigint   // [35] VAT đầu ra
  adjustDecrease37: bigint // [37] Điều chỉnh giảm
  adjustIncrease38: bigint // [38] Điều chỉnh tăng
  refund42: bigint         // [42] Xin hoàn
  taxPayable40: bigint     // [40] Phải nộp
  closingBalance43: bigint // [43] Thuế còn được khấu trừ chuyển kỳ sau

  // Khối 2: Sổ Kế Toán (NKC)
  glInputVat133: bigint    // Phát sinh Nợ 133*
  inputVatDiff: bigint     // [25] - Nợ 133
  glOutputVat33311: bigint // Phát sinh Có 33311
  outputVatDiff: bigint    // [35] - Có 33311
  glPaidVat33311: bigint   // Phát sinh Nợ 33311 (Đã nộp thuế vào NSNN)

  // Đối chiếu Doanh Thu
  taxRevenue: bigint       // [34] Tổng doanh thu hàng hóa dịch vụ bán ra
  glRevenue: bigint        // Phát sinh Có 511 (NKC)
  revenueDiff: bigint      // taxRevenue - glRevenue

  status: 'MATCHED' | 'DISCREPANCY'
  flowStatus: 'MATCHED' | 'DISCREPANCY' | 'FIRST_PERIOD'
  flowNote: string
  auditNote: string
}

export interface PitReconRow {
  periodKey: string
  periodLabel: string
  monthNum?: number
  isOpening?: boolean

  // Khối 1: Tờ khai thuế TNCN
  residentWithheld: bigint    // Thuế TNCN đã khấu trừ - cá nhân cư trú
  nonResidentWithheld: bigint // Thuế TNCN đã khấu trừ - cá nhân không cư trú
  totalTaxWithheld: bigint    // Tổng thuế TNCN đã khấu trừ (1)

  // Khối 2: Sổ sách kế toán
  glWithheld3335: bigint      // Thuế TNCN đã khấu trừ (2) (Ghi Có TK 3335)
  diffWithheld: bigint        // Chênh lệch (1) - (2)

  // Khối 3: Nghĩa vụ & Thanh toán
  glPaid3335: bigint          // Đã nộp (Ghi Nợ TK 3335)
  closingRemainingPayable: bigint // Còn phải nộp cuối kỳ

  // Các trường giữ lại cho tương thích ngược
  employeeCount: bigint       // [16]
  taxableIncome: bigint       // [21]
  withheldTax: bigint         // alias of totalTaxWithheld
  glPayrollExpense: bigint    // Có 334
  payrollDiff: bigint
  glPitWithheld: bigint       // alias of glWithheld3335
  pitWithheldDiff: bigint     // alias of diffWithheld

  status: 'MATCHED' | 'DISCREPANCY'
  auditNote: string
}

export interface TaxCrossReconciliationResult {
  vatRows: VatReconRow[]
  vatSummary: {
    totalTaxRevenue: bigint
    totalGlRevenue: bigint
    totalRevenueDiff: bigint
    totalTaxOutputVat: bigint
    totalGlOutputVat: bigint
    totalOutputVatDiff: bigint
    totalTaxInputVat: bigint
    totalGlInputVat: bigint
    totalInputVatDiff: bigint
    totalTaxPayable40: bigint
    totalRefund42: bigint
    totalAdjustDecrease37: bigint
    totalAdjustIncrease38: bigint
    totalGlPaidVat33311: bigint
    hasDiscrepancy: boolean
  }
  pitRows: PitReconRow[]
  pitSummary: {
    totalResidentWithheld: bigint
    totalNonResidentWithheld: bigint
    totalWithheldTax: bigint
    totalGlPitWithheld: bigint
    totalPitWithheldDiff: bigint
    totalGlPaid3335: bigint
    closingRemainingPayable: bigint
    totalTaxableIncome: bigint
    totalGlPayroll: bigint
    totalPayrollDiff: bigint
    finalizationIncome?: bigint
    finalizationDiff?: bigint
    hasDiscrepancy: boolean
  }
}

export class TaxCrossReconciler {
  public static reconcile(
    entries: JournalEntry[],
    vatDeclarations: VatDeclarationSnapshot[],
    pitDeclarations: PitDeclarationSnapshot[],
  ): TaxCrossReconciliationResult {
    // 1. Phân loại phát sinh NKC đồng thời theo Tháng (1..12) và Quý (1..4)
    // để khớp chính xác bất kể tờ khai nộp theo Tháng hay theo Quý!
    const glRevByMonth = new Map<number, bigint>()
    const glRevByQuarter = new Map<number, bigint>()

    const glInputVatByMonth = new Map<number, bigint>()
    const glInputVatByQuarter = new Map<number, bigint>()

    const glOutputVatByMonth = new Map<number, bigint>()
    const glOutputVatByQuarter = new Map<number, bigint>()

    const glPaidVatByMonth = new Map<number, bigint>()
    const glPaidVatByQuarter = new Map<number, bigint>()

    const glPayrollByMonth = new Map<number, bigint>()
    const glPayrollByQuarter = new Map<number, bigint>()

    const glPitWithheldByMonth = new Map<number, bigint>()
    const glPitWithheldByQuarter = new Map<number, bigint>()

    const glPaidPitByMonth = new Map<number, bigint>()
    const glPaidPitByQuarter = new Map<number, bigint>()

    const addAmt = (map: Map<number, bigint>, key: number, amt: bigint) => {
      map.set(key, (map.get(key) || 0n) + amt)
    }

    for (const e of entries) {
      if (!e.month || e.month < 1 || e.month > 12) continue
      // Bỏ qua các bút toán kết chuyển xác định KQKD 911
      if (e.debitAccount.startsWith('911') || e.creditAccount.startsWith('911')) continue

      const m = e.month
      const q = Math.ceil(m / 3)

      // 1. Doanh thu bán hàng: Ghi CÓ TK 511
      if (e.creditAccount.startsWith('511')) {
        addAmt(glRevByMonth, m, e.amount.raw)
        addAmt(glRevByQuarter, q, e.amount.raw)
      }

      // 2. Thuế GTGT đầu vào được khấu trừ: Ghi NỢ TK 133 (1331, 1332)
      if (e.debitAccount.startsWith('133')) {
        addAmt(glInputVatByMonth, m, e.amount.raw)
        addAmt(glInputVatByQuarter, q, e.amount.raw)
      }

      // 3. Thuế GTGT đầu ra: Ghi CÓ TK 33311 (hoặc Có 3331)
      if (
        e.creditAccount.startsWith('33311') ||
        (e.creditAccount.startsWith('3331') && !e.creditAccount.startsWith('33312'))
      ) {
        addAmt(glOutputVatByMonth, m, e.amount.raw)
        addAmt(glOutputVatByQuarter, q, e.amount.raw)
      }

      // 4. Thuế GTGT đã nộp NSNN: Ghi NỢ TK 33311 (hoặc Nợ 3331)
      if (e.debitAccount.startsWith('33311') || e.debitAccount.startsWith('3331')) {
        addAmt(glPaidVatByMonth, m, e.amount.raw)
        addAmt(glPaidVatByQuarter, q, e.amount.raw)
      }

      // 5. Chi phí tiền lương thực tế trong kỳ: Ghi CÓ TK 334
      // (Bút toán trích lương vào chi phí: Nợ 641, 642, 622, 154 / Có 334)
      if (e.creditAccount.startsWith('334')) {
        addAmt(glPayrollByMonth, m, e.amount.raw)
        addAmt(glPayrollByQuarter, q, e.amount.raw)
      }

      // 6. Thuế TNCN đã khấu trừ: Ghi CÓ TK 3335
      // (Bút toán trừ thuế TNCN vào lương Nợ 334 / Có 3335 hoặc khấu trừ vãng lai)
      if (e.creditAccount.startsWith('3335')) {
        addAmt(glPitWithheldByMonth, m, e.amount.raw)
        addAmt(glPitWithheldByQuarter, q, e.amount.raw)
      }

      // 7. Thuế TNCN đã nộp vào NSNN: Ghi NỢ TK 3335
      // (Bút toán Nợ 3335 / Có 111, 112)
      if (e.debitAccount.startsWith('3335')) {
        addAmt(glPaidPitByMonth, m, e.amount.raw)
        addAmt(glPaidPitByQuarter, q, e.amount.raw)
      }
    }
    // Hàm trợ giúp giải quyết số liệu sổ sách đúng theo Tháng hoặc Quý của tờ khai
    const resolvePeriodGl = (
      mapMonth: Map<number, bigint>,
      mapQuarter: Map<number, bigint>,
      period: { type: string; month?: number; quarter?: number }
    ): bigint => {
      if (period.type === 'MONTH' || (period.month != null && period.month >= 1 && period.month <= 12)) {
        return mapMonth.get(period.month ?? 1) || 0n
      }
      const q = period.quarter || (period.month ? Math.ceil(period.month / 3) : 1)
      return mapQuarter.get(q) || 0n
    }

    // 2. Đối chiếu Tờ khai Thuế GTGT (Mẫu E380)
    const vatByPeriod = new Map<string, VatDeclarationSnapshot>()
    for (const d of vatDeclarations) {
      const key = d.period.normalizedKey
      const existing = vatByPeriod.get(key)
      if (!existing || (d.supplementalNo || 0) > (existing.supplementalNo || 0)) {
        vatByPeriod.set(key, d)
      }
    }

    const vatRows: VatReconRow[] = []
    let totalTaxRevenue = 0n
    let totalGlRevenue = 0n
    let totalTaxOutputVat = 0n
    let totalGlOutputVat = 0n
    let totalTaxInputVat = 0n
    let totalGlInputVat = 0n
    let totalTaxPayable40 = 0n
    let totalRefund42 = 0n
    let totalAdjustDecrease37 = 0n
    let totalAdjustIncrease38 = 0n
    let totalGlPaidVat33311 = 0n

    const sortedVatKeys = Array.from(vatByPeriod.keys()).sort()
    for (const key of sortedVatKeys) {
      const v = vatByPeriod.get(key)!

      const taxRev = v.indicators['34']?.numericValue || 0n
      const glRev = resolvePeriodGl(glRevByMonth, glRevByQuarter, v.period)
      const revDiff = taxRev - glRev

      const taxInVat = v.indicators['25']?.numericValue || 0n
      const glInVat = resolvePeriodGl(glInputVatByMonth, glInputVatByQuarter, v.period)
      const inVatDiff = taxInVat - glInVat

      const taxOutVat = v.indicators['35']?.numericValue || 0n
      const glOutVat = resolvePeriodGl(glOutputVatByMonth, glOutputVatByQuarter, v.period)
      const outVatDiff = taxOutVat - glOutVat

      const glPaid = resolvePeriodGl(glPaidVatByMonth, glPaidVatByQuarter, v.period)

      const adjDec37 = v.indicators['37']?.numericValue || 0n
      const adjInc38 = v.indicators['38']?.numericValue || 0n
      const ref42 = v.indicators['42']?.numericValue || 0n
      const pay40 = v.indicators['40']?.numericValue || 0n
      const open22 = v.indicators['22']?.numericValue || 0n
      const close43 = v.indicators['43']?.numericValue || 0n

      totalTaxRevenue += taxRev
      totalGlRevenue += glRev
      totalTaxInputVat += taxInVat
      totalGlInputVat += glInVat
      totalTaxOutputVat += taxOutVat
      totalGlOutputVat += glOutVat
      totalTaxPayable40 += pay40
      totalRefund42 += ref42
      totalAdjustDecrease37 += adjDec37
      totalAdjustIncrease38 += adjInc38
      totalGlPaidVat33311 += glPaid

      let status: 'MATCHED' | 'DISCREPANCY' = 'MATCHED'
      let auditNote = 'Khớp hoàn toàn giữa Tờ khai thuế và Sổ NKC.'

      if (revDiff !== 0n || outVatDiff !== 0n || inVatDiff !== 0n) {
        status = 'DISCREPANCY'
        const parts: string[] = []
        if (revDiff !== 0n) {
          parts.push(`Lệch DT 511: ${revDiff > 0n ? '+' : ''}${revDiff.toLocaleString('vi-VN')} đ`)
        }
        if (outVatDiff !== 0n) {
          parts.push(`Lệch thuế đầu ra [35] vs Có 33311: ${outVatDiff > 0n ? '+' : ''}${outVatDiff.toLocaleString('vi-VN')} đ`)
        }
        if (inVatDiff !== 0n) {
          parts.push(`Lệch thuế đầu vào [25] vs Nợ 133: ${inVatDiff > 0n ? '+' : ''}${inVatDiff.toLocaleString('vi-VN')} đ`)
        }
        auditNote = parts.join('; ')
      }

      vatRows.push({
        periodKey: key,
        periodLabel: v.period.value,
        declarationType:
          v.declarationType === 'SUPPLEMENTAL'
            ? `Bổ sung lần ${v.supplementalNo}`
            : 'Chính thức',
        openingBalance22: open22,
        taxInputVat25: taxInVat,
        taxOutputVat35: taxOutVat,
        adjustDecrease37: adjDec37,
        adjustIncrease38: adjInc38,
        refund42: ref42,
        taxPayable40: pay40,
        closingBalance43: close43,
        glInputVat133: glInVat,
        inputVatDiff: inVatDiff,
        glOutputVat33311: glOutVat,
        outputVatDiff: outVatDiff,
        glPaidVat33311: glPaid,
        taxRevenue: taxRev,
        glRevenue: glRev,
        revenueDiff: revDiff,
        status,
        flowStatus: 'FIRST_PERIOD',
        flowNote: 'Kỳ đầu tiên trong dữ liệu kiểm toán.',
        auditNote,
      })
    }

    // Kiểm tra tính liên tục của dòng chuyển kỳ: [22] kỳ này phải bằng [43] kỳ trước
    for (let i = 0; i < vatRows.length; i++) {
      const row = vatRows[i]!
      if (i === 0) continue
      const prevCarry = vatRows[i - 1]!.closingBalance43
      if (row.openingBalance22 === prevCarry) {
        row.flowStatus = 'MATCHED'
        row.flowNote = 'Khớp dòng khấu trừ chuyển kỳ.'
      } else {
        row.flowStatus = 'DISCREPANCY'
        const diff = row.openingBalance22 > prevCarry ? row.openingBalance22 - prevCarry : prevCarry - row.openingBalance22
        row.flowNote = `[22] đầu kỳ (${row.openingBalance22.toLocaleString('vi-VN')} đ) lệch ${diff.toLocaleString('vi-VN')} đ so với [43] cuối kỳ trước (${prevCarry.toLocaleString('vi-VN')} đ).`
      }
    }

    // 3. Đối chiếu Tờ khai Thuế TNCN (Chỉ tiêu [21] vs Có 334 và [29] vs Có 3335)
    const pitByPeriod = new Map<string, PitDeclarationSnapshot>()
    let finalizationPit: PitDeclarationSnapshot | undefined

    for (const p of pitDeclarations) {
      if (p.isFinalization) {
        finalizationPit = p
      } else {
        const key = p.period.normalizedKey
        const existing = pitByPeriod.get(key)
        if (!existing || (p.supplementalNo || 0) > (existing.supplementalNo || 0)) {
          pitByPeriod.set(key, p)
        }
      }
    }

    const pitRows: PitReconRow[] = []
    let totalTaxableIncome = 0n
    let totalGlPayroll = 0n
    let totalResidentWithheld = 0n
    let totalNonResidentWithheld = 0n
    let totalWithheldTax = 0n
    let totalGlPitWithheld = 0n
    let totalGlPaid3335 = 0n

    let runningPayable = 0n

    // Dòng Đầu kỳ (Đk) nếu có số dư đầu kỳ hoặc có dữ liệu tờ khai
    if (pitDeclarations.length > 0 || glPitWithheldByMonth.size > 0 || glPaidPitByMonth.size > 0) {
      pitRows.push({
        periodKey: 'OPENING',
        periodLabel: 'Đk',
        isOpening: true,
        residentWithheld: 0n,
        nonResidentWithheld: 0n,
        totalTaxWithheld: 0n,
        glWithheld3335: 0n,
        diffWithheld: 0n,
        glPaid3335: 0n,
        closingRemainingPayable: runningPayable,
        employeeCount: 0n,
        taxableIncome: 0n,
        withheldTax: 0n,
        glPayrollExpense: 0n,
        payrollDiff: 0n,
        glPitWithheld: 0n,
        pitWithheldDiff: 0n,
        status: 'MATCHED',
        auditNote: 'Số dư thuế TNCN đầu kỳ chuyển sang.',
      })
    }

    const sortedPitKeys = Array.from(pitByPeriod.keys()).sort()
    for (const key of sortedPitKeys) {
      const p = pitByPeriod.get(key)!

      const taxable = p.ct21_tongThuNhapChiuThue
      const glPayroll = resolvePeriodGl(glPayrollByMonth, glPayrollByQuarter, p.period)
      const payrollDiff = taxable - glPayroll

      // Thuế TNCN cư trú và không cư trú
      const resident = p.ct28_thueKhauTruCuTru != null ? p.ct28_thueKhauTruCuTru : p.ct29_tongThueTncnDaKhauTru
      const nonResident = p.ct29_thueKhauTruKhongCuTru != null ? p.ct29_thueKhauTruKhongCuTru : 0n
      const totalTax = resident + nonResident

      // Thuế TNCN khấu trừ trên sổ: Có 3335
      const glWithheld = resolvePeriodGl(glPitWithheldByMonth, glPitWithheldByQuarter, p.period)
      const diffWithheld = totalTax - glWithheld

      // Thuế TNCN đã nộp vào NSNN: Nợ 3335
      const glPaid = resolvePeriodGl(glPaidPitByMonth, glPaidPitByQuarter, p.period)

      // Lũy kế còn phải nộp: Dư trước + Khấu trừ Có 3335 - Đã nộp Nợ 3335
      runningPayable = runningPayable + glWithheld - glPaid

      totalTaxableIncome += taxable
      totalGlPayroll += glPayroll
      totalResidentWithheld += resident
      totalNonResidentWithheld += nonResident
      totalWithheldTax += totalTax
      totalGlPitWithheld += glWithheld
      totalGlPaid3335 += glPaid

      let status: 'MATCHED' | 'DISCREPANCY' = 'MATCHED'
      const noteParts: string[] = []

      if (diffWithheld !== 0n) {
        status = 'DISCREPANCY'
        noteParts.push(`Lệch thuế TNCN khấu trừ: Tờ khai ${totalTax.toLocaleString('vi-VN')} đ vs Sổ Có 3335 ${glWithheld.toLocaleString('vi-VN')} đ (CL: ${diffWithheld > 0n ? '+' : ''}${diffWithheld.toLocaleString('vi-VN')} đ).`)
      }

      const auditNote = noteParts.length > 0 ? noteParts.join(' ') : 'Khớp đúng số thuế TNCN khấu trừ.'

      pitRows.push({
        periodKey: key,
        periodLabel: p.period.value,
        monthNum: p.period.month,
        residentWithheld: resident,
        nonResidentWithheld: nonResident,
        totalTaxWithheld: totalTax,
        glWithheld3335: glWithheld,
        diffWithheld,
        glPaid3335: glPaid,
        closingRemainingPayable: runningPayable,
        employeeCount: p.ct16_tongSoNguoiLaoDong,
        taxableIncome: taxable,
        withheldTax: totalTax,
        glPayrollExpense: glPayroll,
        payrollDiff,
        glPitWithheld: glWithheld,
        pitWithheldDiff: diffWithheld,
        status,
        auditNote,
      })
    }

    let finalizationDiff: bigint | undefined
    if (finalizationPit) {
      finalizationDiff = finalizationPit.ct21_tongThuNhapChiuThue - totalTaxableIncome
    }

    const totalPitWithheldDiff = totalWithheldTax - totalGlPitWithheld
    return {
      vatRows,
      vatSummary: {
        totalTaxRevenue,
        totalGlRevenue,
        totalRevenueDiff: totalTaxRevenue - totalGlRevenue,
        totalTaxOutputVat,
        totalGlOutputVat,
        totalOutputVatDiff: totalTaxOutputVat - totalGlOutputVat,
        totalTaxInputVat,
        totalGlInputVat,
        totalInputVatDiff: totalTaxInputVat - totalGlInputVat,
        totalTaxPayable40,
        totalRefund42,
        totalAdjustDecrease37,
        totalAdjustIncrease38,
        totalGlPaidVat33311,
        hasDiscrepancy:
          totalTaxRevenue !== totalGlRevenue ||
          totalTaxOutputVat !== totalGlOutputVat ||
          totalTaxInputVat !== totalGlInputVat,
      },
      pitRows,
      pitSummary: {
        totalResidentWithheld,
        totalNonResidentWithheld,
        totalWithheldTax,
        totalGlPitWithheld,
        totalPitWithheldDiff,
        totalGlPaid3335,
        closingRemainingPayable: runningPayable,
        totalTaxableIncome,
        totalGlPayroll,
        totalPayrollDiff: totalTaxableIncome - totalGlPayroll,
        finalizationIncome: finalizationPit?.ct21_tongThuNhapChiuThue,
        finalizationDiff,
        hasDiscrepancy: totalPitWithheldDiff !== 0n,
      },
    }
  }
}
