import { makeMoney, moneyToNumber } from '../money'
import type { JournalEntry } from '../../shared/types/analytics'
import type {
  CashRiskCluster,
  CashRiskItem,
  CashTaxRiskResult,
  CashThresholdMode,
} from './types'
import { extractPartnerCodeFromAccount } from './PartnerExtractor'

export interface ScanOptions {
  mode?: CashThresholdMode
  customThreshold?: number
  taxRate?: number
}

// Các tài khoản nợ phản ánh mua hàng hóa, vật tư, TSCĐ, chi phí sản xuất kinh doanh hoặc công nợ người bán
export const CASH_EXPENSE_DEBIT_PREFIXES = [
  '151', '152', '153', '154', '155', '156', '157', '158', // Hàng tồn kho
  '211', '212', '213', '217', '241',                      // TSCĐ & XDCB dở dang
  '242',                                                   // Chi phí trả trước
  '621', '622', '623', '627',                             // Chi phí sản xuất trực tiếp/SXC
  '635',                                                   // Chi phí tài chính
  '641', '642',                                            // Chi phí bán hàng & QLDN
  '811',                                                   // Chi phí khác
  '331',                                                   // Thanh toán công nợ người bán
  '133', '1331', '1332',                                   // Thuế GTGT đầu vào
]

// Từ khóa phát hiện tiền phạt vi phạm hành chính, phạt thuế, chậm nộp (TK 811)
const PENALTY_KEYWORDS = [
  'PHẠT', 'PHAT', 'CHẬM NỘP', 'CHAM NOP', 'TRUY THU', 'VPHC', 'VI PHAM',
  'VI PHẠM', 'ÁN PHÍ', 'AN PHI', 'TIỀN PHẠT', 'TIEN PHAT', 'HÀNH CHÍNH',
  'HANH CHINH', 'PHẠT THUẾ', 'PHAT THUE', 'GIAO THÔNG', 'GIAO THONG',
]

// Từ khóa phát hiện chi phí không có hóa đơn hợp pháp / bảng kê mua lẻ
const NO_INVOICE_KEYWORDS = [
  'KHÔNG HÓA ĐƠN', 'KHONG HOA DON', 'KHONG HD', 'KHÔNG HĐ',
  'MUA LẺ', 'MUA LE', 'MUA CHỢ', 'MUA CHO', 'BẢNG KÊ LẺ', 'BANG KE LE',
  'TIẾP KHÁCH KHÔNG HÓA ĐƠN', 'TIEP KHACH KHONG HOA DON', 'KHONG CO HOA DON',
]

export function resolveThreshold(mode: CashThresholdMode, customThreshold?: number): number {
  if (mode === '5M') return 5_000_000
  if (mode === '20M') return 20_000_000
  if (mode === 'CUSTOM' && customThreshold && customThreshold > 0) return customThreshold
  return 5_000_000
}

function cleanStr(s: string | null | undefined): string {
  if (!s) return ''
  return s.trim()
}

/** Trích xuất tên đối tượng từ diễn giải nếu không có partnerCode/customerName */
function extractVendorFromDesc(desc: string | null | undefined): string {
  if (!desc) return ''
  const upper = desc.toUpperCase()
  const ctyMatch = upper.match(/(?:CÔNG TY|CTY|TNHH|CP|DOANH NGHIỆP|DNTN|NCC|NHÀ CUNG CẤP|ĐỐI TÁC)\s+([^,;.-]+)/i)
  if (ctyMatch && ctyMatch[0]) {
    return ctyMatch[0].trim()
  }
  return ''
}

export class CashTaxRiskScanner {
  public static scan(entries: JournalEntry[], options: ScanOptions = {}): CashTaxRiskResult {
    const mode = options.mode ?? '5M'
    const threshold = resolveThreshold(mode, options.customThreshold)
    const taxRate = options.taxRate ?? 0.20 // Thuế suất TNDN phổ thông 20%
    const thresholdFormatted = threshold.toLocaleString('vi-VN') + ' đ'

    const singleRiskItems: CashRiskItem[] = []
    const subThresholdEntries: Array<{
      entry: JournalEntry
      amountNum: number
      partnerIdent: string
      dateNormalized: string
    }> = []

    const penaltyItems: CashRiskItem[] = []
    const noInvoiceItems: CashRiskItem[] = []
    const otherRiskItems: CashRiskItem[] = []

    // ── VÒNG QUÉT CHÍNH: QUÉT MỌI CHỨNG TỪ THEO 5 CHUYÊN ĐỀ ──
    for (const e of entries) {
      const amountNum = moneyToNumber(e.amount)
      if (amountNum <= 0) continue

      const descUpper = (e.description || '').toUpperCase()

      // ─────────────────────────────────────────────────────────────
      // CHUYÊN ĐỀ 2: Tiền phạt VPHC, phạt thuế, phạt chậm nộp (TK 811)
      // Căn cứ: Điều 4 Thông tư 96/2015/TT-BTC
      // ─────────────────────────────────────────────────────────────
      if (e.debitAccount.startsWith('811')) {
        const isPenalty = PENALTY_KEYWORDS.some((kw) => descUpper.includes(kw))
        if (isPenalty) {
          penaltyItems.push({
            id: e.id,
            date: e.postingDate,
            voucher: e.documentNumber,
            description: e.description,
            debit: e.debitAccount,
            credit: e.creditAccount,
            amount: e.amount,
            amountNumber: amountNum,
            partnerCode: e.objectCode,
            partnerName: e.customerName || 'Cơ quan Nhà nước / Khác',
            riskType: 'PENALTY_811',
            riskLabel: 'Tiền phạt VPHC / Thuế (TK 811)',
            auditNote: 'Khoản tiền phạt vi phạm hành chính, phạt thuế, chậm nộp theo Điều 4 TT 96/2015/TT-BTC. 100% không được trừ khi tính thuế TNDN (điều chỉnh tăng Chỉ tiêu B4).',
          })
          continue // Đã ghi nhận vào chuyên đề phạt, chuyển dòng tiếp
        }
      }

      // ─────────────────────────────────────────────────────────────
      // CHUYÊN ĐỀ 3: Chi phí không có hóa đơn hợp pháp / Bảng kê lẻ
      // Căn cứ: Điều 4 TT 96/2015/TT-BTC & TT 78/2014/TT-BTC
      // ─────────────────────────────────────────────────────────────
      const isOperatingCostDebit =
        e.debitAccount.startsWith('641') ||
        e.debitAccount.startsWith('642') ||
        e.debitAccount.startsWith('627') ||
        e.debitAccount.startsWith('154')

      if (isOperatingCostDebit) {
        const isNoInvoice = NO_INVOICE_KEYWORDS.some((kw) => descUpper.includes(kw))
        if (isNoInvoice) {
          noInvoiceItems.push({
            id: e.id,
            date: e.postingDate,
            voucher: e.documentNumber,
            description: e.description,
            debit: e.debitAccount,
            credit: e.creditAccount,
            amount: e.amount,
            amountNumber: amountNum,
            partnerCode: e.objectCode,
            partnerName: e.customerName || 'Không rõ đối tượng',
            riskType: 'NO_INVOICE',
            riskLabel: 'Không hóa đơn hợp pháp',
            auditNote: 'Khoản chi không có hóa đơn hợp pháp theo quy định tại Điều 4 TT 96/2015/TT-BTC. Rủi ro bị loại trừ toàn bộ khỏi chi phí được trừ khi quyết toán thuế TNDN (Chỉ tiêu B4).',
          })
          continue
        }
      }

      // ─────────────────────────────────────────────────────────────
      // CHUYÊN ĐỀ 1: Chi tiền mặt (Có 111) vi phạm điều kiện thanh toán ngân hàng
      // Căn cứ: NĐ 181/2025/NĐ-CP & Luật Thuế GTGT 2024 (>=5tr) hoặc NĐ 209/2013 (>=20tr)
      // ─────────────────────────────────────────────────────────────
      if (e.creditAccount.startsWith('111')) {
        // Bỏ qua luân chuyển tiền mặt nội bộ (Nợ 111, Nợ 112)
        if (e.debitAccount.startsWith('111') || e.debitAccount.startsWith('112')) continue

        const isExpenseDebit = CASH_EXPENSE_DEBIT_PREFIXES.some((p) => e.debitAccount.startsWith(p))
        if (!isExpenseDebit) continue

        const extractedFromAcc = extractPartnerCodeFromAccount(e.debitAccount) || extractPartnerCodeFromAccount(e.creditAccount)
        const partnerDirect = cleanStr(e.customerName || e.objectCode || extractedFromAcc)
        const partnerIdent = partnerDirect || extractVendorFromDesc(e.description)
        const dateNormalized = cleanStr(e.postingDate) || 'UNKNOWN_DATE'

        if (amountNum >= threshold) {
          let note = ''
          if (mode === '5M') {
            note = `Chi tiền mặt >= 5.000.000 đ theo quy định mới (NĐ 181/2025/NĐ-CP & Luật Thuế GTGT 2024). Rủi ro bị loại thuế GTGT đầu vào và không được trừ khi tính thuế TNDN (điều chỉnh tăng Chỉ tiêu B4).`
          } else if (mode === '20M') {
            note = `Chi tiền mặt >= 20.000.000 đ theo quy định cũ (NĐ 209/2013/NĐ-CP). Không có chứng từ thanh toán qua ngân hàng, rủi ro bị loại khỏi chi phí được trừ (tăng Chỉ tiêu B4).`
          } else {
            note = `Chi tiền mặt vượt ngưỡng ${thresholdFormatted}. Cần rà soát chứng từ thanh toán qua ngân hàng hoặc chuyển sang Chỉ tiêu B4.`
          }

          singleRiskItems.push({
            id: e.id,
            date: e.postingDate,
            voucher: e.documentNumber,
            description: e.description,
            debit: e.debitAccount,
            credit: e.creditAccount,
            amount: e.amount,
            amountNumber: amountNum,
            partnerCode: e.objectCode,
            partnerName: e.customerName || partnerIdent || null,
            riskType: 'SINGLE_OVER_THRESHOLD',
            riskLabel: `Chi tiền mặt >= ${thresholdFormatted}`,
            auditNote: note,
          })
        } else {
          subThresholdEntries.push({
            entry: e,
            amountNum,
            partnerIdent,
            dateNormalized,
          })
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // GOM NHÓM: Phát hiện xé nhỏ phiếu chi tiền mặt cùng ngày cùng NCC
    // ─────────────────────────────────────────────────────────────
    const partnerDayGroups = new Map<string, typeof subThresholdEntries>()

    for (const item of subThresholdEntries) {
      if (!item.partnerIdent || item.partnerIdent === 'UNKNOWN' || item.dateNormalized === 'UNKNOWN_DATE') {
        continue
      }
      const groupKey = `${item.dateNormalized}|${item.partnerIdent.toUpperCase()}`
      let grp = partnerDayGroups.get(groupKey)
      if (!grp) {
        grp = []
        partnerDayGroups.set(groupKey, grp)
      }
      grp.push(item)
    }

    const splitClusters: CashRiskCluster[] = []
    const splitRiskItems: CashRiskItem[] = []

    for (const [key, groupItems] of partnerDayGroups.entries()) {
      if (groupItems.length < 2) continue

      const dayTotal = groupItems.reduce((sum, it) => sum + it.amountNum, 0)

      if (dayTotal >= threshold) {
        const [dateStr, partnerName] = key.split('|')
        const totalMoney = makeMoney(BigInt(Math.round(dayTotal)), 0)

        const clusterNote = `Ngày ${dateStr}, có ${groupItems.length} phiếu chi cho '${partnerName}' tổng ${dayTotal.toLocaleString('vi-VN')} đ (>= ${thresholdFormatted}). Dấu hiệu chia nhỏ thanh toán để lách luật thuế.`

        const clusterRiskItems: CashRiskItem[] = groupItems.map((it) => ({
          id: it.entry.id,
          date: it.entry.postingDate,
          voucher: it.entry.documentNumber,
          description: it.entry.description,
          debit: it.entry.debitAccount,
          credit: it.entry.creditAccount,
          amount: it.entry.amount,
          amountNumber: it.amountNum,
          partnerCode: it.entry.objectCode,
          partnerName: it.entry.customerName || it.partnerIdent,
          riskType: 'SPLIT_SAME_DAY',
          riskLabel: `Nghi ngờ chia nhỏ cùng ngày (${groupItems.length} phiếu)`,
          auditNote: `Thuộc cụm ${groupItems.length} phiếu chi cùng ngày cho '${partnerName}' (tổng ${dayTotal.toLocaleString('vi-VN')} đ). Dấu hiệu chia nhỏ thanh toán, rủi ro loại trừ Chỉ tiêu B4.`,
          clusterKey: key,
        }))

        splitClusters.push({
          clusterKey: key,
          date: dateStr || '',
          partner: partnerName || '',
          itemsCount: groupItems.length,
          totalAmount: totalMoney,
          totalAmountNumber: dayTotal,
          items: clusterRiskItems,
          auditNote: clusterNote,
        })

        splitRiskItems.push(...clusterRiskItems)
      }
    }

    // ─────────────────────────────────────────────────────────────
    // TỔNG HỢP TOÀN BỘ 5 CHUYÊN ĐỀ RỦI RO THUẾ & CHỈ TIÊU B4
    // ─────────────────────────────────────────────────────────────
    const allItems = [
      ...singleRiskItems,
      ...splitRiskItems,
      ...penaltyItems,
      ...noInvoiceItems,
      ...otherRiskItems,
    ]

    const totalRiskNumber = allItems.reduce((sum, it) => sum + it.amountNumber, 0)
    const totalRiskAmount = makeMoney(BigInt(Math.round(totalRiskNumber)), 0)

    const cashRiskNumber = singleRiskItems.reduce((s, it) => s + it.amountNumber, 0) + splitRiskItems.reduce((s, it) => s + it.amountNumber, 0)
    const penaltyRiskNumber = penaltyItems.reduce((s, it) => s + it.amountNumber, 0)
    const noInvoiceRiskNumber = noInvoiceItems.reduce((s, it) => s + it.amountNumber, 0)
    const otherRiskNumber = otherRiskItems.reduce((s, it) => s + it.amountNumber, 0)

    const estimatedB4Number = totalRiskNumber
    const estimatedB4Adjustment = totalRiskAmount

    const estimatedTaxPayableNumber = Math.round(estimatedB4Number * taxRate)
    const estimatedTaxPayableIncrease = makeMoney(BigInt(estimatedTaxPayableNumber), 0)

    return {
      thresholdUsed: threshold,
      thresholdMode: mode,
      taxRate,
      totalRiskAmount,
      totalRiskNumber,
      estimatedB4Adjustment,
      estimatedB4Number,
      estimatedTaxPayableIncrease,
      estimatedTaxPayableNumber,
      cashRiskNumber,
      penaltyRiskNumber,
      noInvoiceRiskNumber,
      otherRiskNumber,
      singleItems: singleRiskItems,
      splitClusters,
      penaltyItems,
      noInvoiceItems,
      allItems,
    }
  }
}
