import type { JournalEntry } from '../../shared/types/analytics'
import type {
  PitDeclarationSnapshot,
  VatDeclarationSnapshot,
} from '../../shared/types/taxAnalytics'

export interface VatReconRow {
  periodKey: string // "2025-Q1", "2025-Q2"...
  periodLabel: string // "Quý 1/2025"
  declarationType: string
  taxRevenue: bigint
  glRevenue: bigint
  revenueDiff: bigint // taxRevenue - glRevenue
  taxOutputVat: bigint
  glOutputVat: bigint
  outputVatDiff: bigint
  taxInputVat: bigint
  glInputVat: bigint
  inputVatDiff: bigint
  status: 'MATCHED' | 'DISCREPANCY'
  auditNote: string
}

export interface PitReconRow {
  periodKey: string
  periodLabel: string
  employeeCount: bigint
  taxableIncome: bigint
  withheldTax: bigint
  glPayrollExpense: bigint
  payrollDiff: bigint // taxableIncome - glPayrollExpense
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
    hasDiscrepancy: boolean
  }
  pitRows: PitReconRow[]
  pitSummary: {
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
    // 1. Phân loại phát sinh NKC theo Quý và Tháng
    // month 1..12 => quarter 1..4
    const glRevByQuarter = new Map<number, bigint>([
      [1, 0n],
      [2, 0n],
      [3, 0n],
      [4, 0n],
    ])
    const glOutputVatByQuarter = new Map<number, bigint>([
      [1, 0n],
      [2, 0n],
      [3, 0n],
      [4, 0n],
    ])
    const glInputVatByQuarter = new Map<number, bigint>([
      [1, 0n],
      [2, 0n],
      [3, 0n],
      [4, 0n],
    ])
    const glPayrollByQuarter = new Map<number, bigint>([
      [1, 0n],
      [2, 0n],
      [3, 0n],
      [4, 0n],
    ])

    for (const e of entries) {
      if (!e.month || e.month < 1 || e.month > 12) continue
      const q = Math.ceil(e.month / 3)

      // Doanh thu bán hàng: Có 511
      if (e.creditAccount.startsWith('511')) {
        glRevByQuarter.set(q, (glRevByQuarter.get(q) || 0n) + e.amount.raw)
      }

      // Thuế GTGT đầu ra: Có 33311
      if (e.creditAccount.startsWith('33311')) {
        glOutputVatByQuarter.set(q, (glOutputVatByQuarter.get(q) || 0n) + e.amount.raw)
      }

      // Thuế GTGT đầu vào được khấu trừ: Nợ 1331
      if (e.debitAccount.startsWith('1331')) {
        glInputVatByQuarter.set(q, (glInputVatByQuarter.get(q) || 0n) + e.amount.raw)
      }

      // Chi phí tiền lương: Nợ 334 hoặc Nợ chi phí lương (6411, 6421, 622)
      if (
        e.debitAccount.startsWith('334') ||
        e.debitAccount.startsWith('6411') ||
        e.debitAccount.startsWith('6421') ||
        e.debitAccount.startsWith('622')
      ) {
        glPayrollByQuarter.set(q, (glPayrollByQuarter.get(q) || 0n) + e.amount.raw)
      }
    }

    // 2. Đối chiếu Tờ khai Thuế GTGT
    // Lọc lấy bản khai mới nhất cho từng kỳ
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

    // Duyệt qua các tờ khai đã nạp
    const sortedVatKeys = Array.from(vatByPeriod.keys()).sort()
    for (const key of sortedVatKeys) {
      const v = vatByPeriod.get(key)!
      const q = v.period.quarter || 1

      const taxRev = v.indicators['34']?.numericValue || 0n
      const glRev = glRevByQuarter.get(q) || 0n
      const revDiff = taxRev - glRev

      const taxOutVat = v.indicators['35']?.numericValue || 0n
      const glOutVat = glOutputVatByQuarter.get(q) || 0n
      const outVatDiff = taxOutVat - glOutVat

      const taxInVat = v.indicators['25']?.numericValue || 0n
      const glInVat = glInputVatByQuarter.get(q) || 0n
      const inVatDiff = taxInVat - glInVat

      totalTaxRevenue += taxRev
      totalGlRevenue += glRev
      totalTaxOutputVat += taxOutVat
      totalGlOutputVat += glOutVat
      totalTaxInputVat += taxInVat
      totalGlInputVat += glInVat

      let status: 'MATCHED' | 'DISCREPANCY' = 'MATCHED'
      let auditNote = 'Khớp hoàn toàn giữa Tờ khai thuế và Sổ NKC.'

      if (revDiff !== 0n || outVatDiff !== 0n) {
        status = 'DISCREPANCY'
        if (glRev > taxRev) {
          auditNote = `Doanh thu sổ NKC lớn hơn Tờ khai thuế (${(glRev - taxRev).toLocaleString('vi-VN')} đ). Kiểm tra xem có hóa đơn xuất sót kỳ hoặc doanh thu chưa đủ điều kiện xuất hóa đơn theo TT200.`
        } else if (glRev < taxRev) {
          auditNote = `Doanh thu sổ NKC nhỏ hơn Tờ khai thuế (${(taxRev - glRev).toLocaleString('vi-VN')} đ). Kiểm tra xem có hóa đơn xuất trước hoặc doanh thu thuế GTGT không hạch toán vào TK 511.`
        } else {
          auditNote = `Lệch tiền thuế GTGT đầu ra (${outVatDiff.toLocaleString('vi-VN')} đ). Kiểm tra lại mức thuế suất áp dụng.`
        }
      }

      vatRows.push({
        periodKey: key,
        periodLabel: v.period.value,
        declarationType:
          v.declarationType === 'SUPPLEMENTAL'
            ? `Bổ sung lần ${v.supplementalNo}`
            : 'Chính thức',
        taxRevenue: taxRev,
        glRevenue: glRev,
        revenueDiff: revDiff,
        taxOutputVat: taxOutVat,
        glOutputVat: glOutVat,
        outputVatDiff: outVatDiff,
        taxInputVat: taxInVat,
        glInputVat: glInVat,
        inputVatDiff: inVatDiff,
        status,
        auditNote,
      })
    }

    // 3. Đối chiếu Tờ khai Thuế TNCN
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

    const sortedPitKeys = Array.from(pitByPeriod.keys()).sort()
    for (const key of sortedPitKeys) {
      const p = pitByPeriod.get(key)!
      const q = p.period.quarter || 1

      const taxable = p.ct21_tongThuNhapChiuThue
      const glPayroll = glPayrollByQuarter.get(q) || 0n
      const payrollDiff = taxable - glPayroll

      totalTaxableIncome += taxable
      totalGlPayroll += glPayroll

      let status: 'MATCHED' | 'DISCREPANCY' = 'MATCHED'
      let auditNote = 'Thu nhập chịu thuế khớp với chi phí lương trên sổ NKC.'

      if (payrollDiff !== 0n) {
        status = 'DISCREPANCY'
        if (glPayroll > taxable) {
          auditNote = `Chi phí lương trên NKC lớn hơn TNCT tờ khai (${(glPayroll - taxable).toLocaleString('vi-VN')} đ). Kiểm tra các khoản thu nhập miễn thuế, phụ cấp không tính thuế hoặc chi phí lương chưa chi.`
        } else {
          auditNote = `TNCT trên tờ khai lớn hơn chi phí lương NKC (${(taxable - glPayroll).toLocaleString('vi-VN')} đ). Cần rà soát các khoản thưởng hoặc chi trả trực tiếp cho cá nhân.`
        }
      }

      pitRows.push({
        periodKey: key,
        periodLabel: p.period.value,
        employeeCount: p.ct16_tongSoNguoiLaoDong,
        taxableIncome: taxable,
        withheldTax: p.ct29_tongThueTncnDaKhauTru,
        glPayrollExpense: glPayroll,
        payrollDiff,
        status,
        auditNote,
      })
    }

    let finalizationDiff: bigint | undefined
    if (finalizationPit) {
      finalizationDiff = finalizationPit.ct21_tongThuNhapChiuThue - totalTaxableIncome
    }

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
        hasDiscrepancy: totalTaxRevenue !== totalGlRevenue || totalTaxOutputVat !== totalGlOutputVat,
      },
      pitRows,
      pitSummary: {
        totalTaxableIncome,
        totalGlPayroll,
        totalPayrollDiff: totalTaxableIncome - totalGlPayroll,
        finalizationIncome: finalizationPit?.ct21_tongThuNhapChiuThue,
        finalizationDiff,
        hasDiscrepancy: totalTaxableIncome !== totalGlPayroll,
      },
    }
  }
}
