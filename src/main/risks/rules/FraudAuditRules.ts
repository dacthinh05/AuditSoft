import { addMoney, makeMoney, moneyToNumber, MONEY_ZERO } from '../../../domain/money'
import { formatVnd } from '../../../shared/utils/moneyFormat'
import { normalizeKeyword } from '../../../shared/utils/text'
import type { JournalEntry, RawFinding } from '../../../shared/types/analytics'
import { materialityScore } from '../../analytics/MaterialityEngine'
import type { AuditRule } from '../AuditRuleEngine'

/**
 * 1. VIRTUAL_CASH_EXCESSIVE_DEBT: Bẫy quỹ tiền mặt ảo (VSA 240, VSA 550, TT 96/2015).
 * Doanh nghiệp duy trì phát sinh/tồn quỹ tiền mặt lớn nhưng đồng thời đi vay ngân hàng chịu chi phí lãi vay lớn.
 */
export const virtualCashExcessiveDebtRule: AuditRule = {
  id: 'VIRTUAL_CASH_EXCESSIVE_DEBT',
  description: 'Dấu hiệu quỹ tiền mặt ảo khi phát sinh chi phí lãi vay ngân hàng',
  evaluate(ctx) {
    const findings: RawFinding[] = []
    let cashDebit = MONEY_ZERO
    let cashCredit = MONEY_ZERO
    let interestExpense = MONEY_ZERO
    const cashEntryIds: string[] = []
    const interestEntryIds: string[] = []

    for (const e of ctx.entries) {
      if (e.debitAccount.startsWith('111')) {
        cashDebit = addMoney(cashDebit, e.amount)
        if (cashEntryIds.length < 50) cashEntryIds.push(e.id)
      }
      if (e.creditAccount.startsWith('111')) {
        cashCredit = addMoney(cashCredit, e.amount)
        if (cashEntryIds.length < 50) cashEntryIds.push(e.id)
      }
      // Chi phí lãi vay: Nợ 635
      if (e.debitAccount.startsWith('635')) {
        interestExpense = addMoney(interestExpense, e.amount)
        interestEntryIds.push(e.id)
      }
    }

    const maxCash = cashDebit.raw > cashCredit.raw ? cashDebit : cashCredit
    const ctt = ctx.config.materiality.clearlyTrivial
    const om = ctx.config.materiality.overall

    // Điều kiện: Phát sinh tiền mặt lớn (>= OM hoặc >= 1 tỷ) VÀ chi phí lãi vay >= CTT (>= 50tr)
    const minCashThreshold = om.raw > 1_000_000_000n ? om.raw : 1_000_000_000n
    if (maxCash.raw >= minCashThreshold && interestExpense.raw >= ctt.raw && interestExpense.raw > 0n) {
      const scoreM = materialityScore(interestExpense, ctx.config.materiality.overall)
      findings.push({
        ruleId: this.id,
        clusterKey: 'CASH_VS_INTEREST',
        title: 'Bẫy quỹ tiền mặt ảo: Phát sinh tiền mặt lớn nhưng vẫn chịu chi phí lãi vay ngân hàng',
        category: 'CASH',
        observation:
          `Tổng phát sinh tiền mặt (TK 111) đạt ${formatVnd(maxCash)} trong khi phát sinh chi phí lãi vay (TK 635) là ${formatVnd(interestExpense)}. ` +
          `Doanh nghiệp có dấu hiệu duy trì quỹ tiền mặt nhàn rỗi lớn trên sổ sách nhưng vẫn phải đi vay ngân hàng chịu lãi.`,
        currentValue: formatVnd(interestExpense),
        priorValue: formatVnd(maxCash),
        difference: formatVnd(interestExpense),
        scores: { materiality: scoreM, anomaly: 25, timing: 10, pattern: 20 },
        reasons: [
          `Phát sinh tiền mặt TK 111 ${formatVnd(maxCash)} >= ngưỡng ${formatVnd(makeMoney(minCashThreshold, 0))}`,
          `Chi phí lãi vay TK 635 ${formatVnd(interestExpense)} >= CTT ${formatVnd(ctt)}`,
        ],
        auditImplication:
          'Theo Thông tư 96/2015/TT-BTC và VSA 240, tiền mặt tồn lớn nhưng vẫn vay nợ chịu lãi là dấu hiệu tiền mặt ảo hoặc cổ đông rút vốn. ' +
          'Rủi ro bị cơ quan thuế loại trừ chi phí lãi vay tương ứng với phần tiền mặt nhàn rỗi khi quyết toán thuế TNDN (cộng Chỉ tiêu B4).',
        recommendedProcedures: [
          'Yêu cầu kiểm kê quỹ tiền mặt đột xuất và đối chiếu biên bản kiểm kê quỹ',
          'Yêu cầu doanh nghiệp giải trình mục đích vay vốn ngân hàng khi tồn quỹ tiền mặt dồi dào',
          'Rà soát hợp đồng tín dụng và dòng tiền giải ngân thực tế',
        ],
        evidence: {
          journalEntryIds: [...interestEntryIds, ...cashEntryIds].slice(0, 100),
          accounts: ['111', '635', '341'],
        },
      })
    }

    return findings
  },
}

/**
 * 2. PROHIBITED_UNUSUAL_PAIRS: Cặp tài khoản đối ứng bất thường / cấm (VSA 240, TT 200).
 */
export const prohibitedAccountPairsRule: AuditRule = {
  id: 'PROHIBITED_UNUSUAL_PAIRS',
  description: 'Phát hiện các cặp tài khoản đối ứng trái chuẩn mực hoặc rủi ro cao',
  evaluate(ctx) {
    const findings: RawFinding[] = []
    const ctt = ctx.config.materiality.clearlyTrivial

    // a. Nợ 211, 213, 217 / Có 111 (Mua TSCĐ bằng tiền mặt >= 5 triệu theo NĐ 181/2025 & Luật Thuế GTGT 2024)
    const fixedAssetCashEntries = ctx.entries.filter(
      (e) =>
        (e.debitAccount.startsWith('211') || e.debitAccount.startsWith('213') || e.debitAccount.startsWith('217')) &&
        e.creditAccount.startsWith('111') &&
        e.amount.raw >= 5_000_000n,
    )

    if (fixedAssetCashEntries.length > 0) {
      const total = fixedAssetCashEntries.reduce((s, e) => addMoney(s, e.amount), MONEY_ZERO)
      findings.push({
        ruleId: this.id,
        clusterKey: 'FA_CASH',
        title: 'Mua tài sản cố định thanh toán bằng tiền mặt (Nợ 211/213/217 - Có 111)',
        category: 'JOURNAL_ENTRY',
        observation:
          `Phát hiện ${fixedAssetCashEntries.length} bút toán mua TSCĐ bằng tiền mặt với tổng giá trị ${formatVnd(total)} (>= 5 triệu theo NĐ 181/2025). ` +
          `Vi phạm quy định thanh toán không dùng tiền mặt đối với tài sản cố định.`,
        currentValue: formatVnd(total),
        scores: { materiality: materialityScore(total, ctx.config.materiality.overall), anomaly: 30, timing: 0, pattern: 25 },
        reasons: [`${fixedAssetCashEntries.length} bút toán mua TSCĐ bằng tiền mặt >= 5 triệu`],
        auditImplication:
          'Không có chứng từ thanh toán qua ngân hàng theo quy định thuế GTGT và TNDN. TSCĐ này có rủi ro không được trích khấu hao vào chi phí hợp lý.',
        recommendedProcedures: [
          'Kiểm tra hóa đơn và hợp đồng mua TSCĐ',
          'Xác minh nguồn gốc thanh toán và loại chi phí khấu hao nếu vi phạm',
        ],
        evidence: { journalEntryIds: fixedAssetCashEntries.map((e) => e.id) },
      })
    }

    // b. Nợ 642, 811 / Có 131 (Xóa nợ phải thu trực tiếp không qua dự phòng 2293)
    const directBadDebtEntries = ctx.entries.filter(
      (e) =>
        (e.debitAccount.startsWith('642') || e.debitAccount.startsWith('811')) &&
        e.creditAccount.startsWith('131') &&
        e.amount.raw >= ctt.raw,
    )

    if (directBadDebtEntries.length > 0) {
      const total = directBadDebtEntries.reduce((s, e) => addMoney(s, e.amount), MONEY_ZERO)
      findings.push({
        ruleId: this.id,
        clusterKey: 'DIRECT_DEBT_WRITEOFF',
        title: 'Xóa nợ phải thu khách hàng trực tiếp vào chi phí (Nợ 642/811 - Có 131)',
        category: 'JOURNAL_ENTRY',
        observation:
          `Phát hiện ${directBadDebtEntries.length} bút toán xóa nợ phải thu trực tiếp vào chi phí với tổng giá trị ${formatVnd(total)} mà không thông qua TK dự phòng 2293.`,
        currentValue: formatVnd(total),
        scores: { materiality: materialityScore(total, ctx.config.materiality.overall), anomaly: 30, timing: 0, pattern: 20 },
        reasons: [`Xóa nợ trực tiếp không qua trích lập dự phòng TK 2293, tổng ${formatVnd(total)} >= CTT`],
        auditImplication:
          'Theo Thông tư 48/2019/TT-BTC, việc xóa nợ phải có quyết định của Hội đồng xử lý nợ và hồ sơ chứng minh nợ không thể thu hồi. Xóa nợ tùy tiện sẽ bị cơ quan thuế loại chi phí.',
        recommendedProcedures: [
          'Kiểm tra hồ sơ pháp lý đòi nợ, biên bản đối chiếu công nợ và quyết định xóa nợ',
          'Kiểm tra việc trích lập dự phòng phải thu khó đòi tương ứng',
        ],
        evidence: { journalEntryIds: directBadDebtEntries.map((e) => e.id) },
      })
    }

    // c. Nợ 331 / Có 711 (Xóa nợ phải trả người bán vào thu nhập khác bất thường)
    const payableToIncomeEntries = ctx.entries.filter(
      (e) => e.debitAccount.startsWith('331') && e.creditAccount.startsWith('711') && e.amount.raw >= ctt.raw,
    )

    if (payableToIncomeEntries.length > 0) {
      const total = payableToIncomeEntries.reduce((s, e) => addMoney(s, e.amount), MONEY_ZERO)
      findings.push({
        ruleId: this.id,
        clusterKey: 'PAYABLE_TO_INCOME',
        title: 'Xóa nợ phải trả người bán vào thu nhập khác (Nợ 331 - Có 711)',
        category: 'JOURNAL_ENTRY',
        observation:
          `Phát hiện ${payableToIncomeEntries.length} bút toán xóa nợ phải trả người bán hạch toán vào Thu nhập khác với tổng giá trị ${formatVnd(total)}.`,
        currentValue: formatVnd(total),
        scores: { materiality: materialityScore(total, ctx.config.materiality.overall), anomaly: 25, timing: 0, pattern: 20 },
        reasons: [`Xóa nợ phải trả vào Có 711 với tổng ${formatVnd(total)} >= CTT`],
        auditImplication:
          'Nghi ngờ xóa sổ nợ phải trả không có biên bản thanh lý hợp đồng hoặc che giấu các nghiệp vụ hoa hồng/chiết khấu thương mại.',
        recommendedProcedures: [
          'Kiểm tra thư xác nhận số dư công nợ người bán (AP Circularization)',
          'Kiểm tra biên bản hòa giải hoặc thanh lý hợp đồng xóa nợ',
        ],
        evidence: { journalEntryIds: payableToIncomeEntries.map((e) => e.id) },
      })
    }

    return findings
  },
}

/**
 * 3. ABNORMAL_REVENUE_REVERSAL: Bút toán đảo / ghi âm doanh thu Có 511 (VSA 240).
 */
export const abnormalRevenueReversalRule: AuditRule = {
  id: 'ABNORMAL_REVENUE_REVERSAL',
  description: 'Bút toán ghi âm hoặc giảm doanh thu TK 511 bất thường',
  evaluate(ctx) {
    const findings: RawFinding[] = []
    const suspiciousEntries: JournalEntry[] = []

    for (const e of ctx.entries) {
      // Bút toán Có 511 nhưng số tiền < 0
      if (e.creditAccount.startsWith('511') && e.amount.raw < 0n) {
        suspiciousEntries.push(e)
      }
      // Bút toán Nợ 511 đối ứng tài khoản lạ (không phải 521 chiết khấu/giảm giá, không phải 911 kết chuyển, không phải 133)
      if (
        e.debitAccount.startsWith('511') &&
        !e.creditAccount.startsWith('521') &&
        !e.creditAccount.startsWith('911') &&
        !e.creditAccount.startsWith('133')
      ) {
        suspiciousEntries.push(e)
      }
    }

    if (suspiciousEntries.length > 0) {
      const total = suspiciousEntries.reduce((s, e) => addMoney(s, e.amount), MONEY_ZERO)
      findings.push({
        ruleId: this.id,
        clusterKey: 'REV_REVERSAL',
        title: 'Bút toán ghi âm hoặc giảm trừ doanh thu TK 511 bất thường',
        category: 'REVENUE',
        observation:
          `Phát hiện ${suspiciousEntries.length} bút toán ghi âm hoặc giảm trừ doanh thu TK 511 trực tiếp (tổng ${formatVnd(total)}) ` +
          `không thông qua tài khoản giảm trừ doanh thu (TK 521) hoặc kết chuyển KQKD (TK 911).`,
        currentValue: formatVnd(total),
        scores: { materiality: materialityScore(total, ctx.config.materiality.overall), anomaly: 35, timing: 0, pattern: 25 },
        reasons: [`${suspiciousEntries.length} bút toán Có 511 ghi âm hoặc Nợ 511 đối ứng tài khoản lạ`],
        auditImplication:
          'Theo VSA 240, bút toán giảm doanh thu thủ công là một trong những chỉ báo rủi ro gian lận hàng đầu để che giấu doanh thu, trốn thuế hoặc xóa sổ hóa đơn không đúng niên độ.',
        recommendedProcedures: [
          'Kiểm tra biên bản hủy hóa đơn, hóa đơn điều chỉnh giảm và lý do giảm doanh thu',
          'Kiểm tra tờ khai thuế GTGT các kỳ tương ứng để đối chiếu số liệu giảm',
        ],
        evidence: { journalEntryIds: suspiciousEntries.map((e) => e.id) },
      })
    }

    return findings
  },
}

/**
 * 4. EXPENSE_PARKING_TRAP: Bẫy treo chi phí vào tài sản 242/241 để giấu lỗ (VSA 330, VSA 520).
 */
export const expenseParkingTrapRule: AuditRule = {
  id: 'EXPENSE_PARKING_TRAP',
  description: 'Treo chi phí hoạt động vào TK 242 hoặc 241 để giấu lỗ',
  evaluate(ctx) {
    const findings: RawFinding[] = []
    let totalOperatingExpenses = MONEY_ZERO
    let totalPrepaidAdditions = MONEY_ZERO
    const prepaidEntryIds: string[] = []

    for (const e of ctx.entries) {
      // Chi phí kinh doanh thực tế trong kỳ: Nợ 621, 622, 627, 641, 642, 635, 811
      if (
        e.debitAccount.startsWith('621') ||
        e.debitAccount.startsWith('622') ||
        e.debitAccount.startsWith('627') ||
        e.debitAccount.startsWith('641') ||
        e.debitAccount.startsWith('642') ||
        e.debitAccount.startsWith('635') ||
        e.debitAccount.startsWith('811')
      ) {
        totalOperatingExpenses = addMoney(totalOperatingExpenses, e.amount)
      }

      // Treo chi phí trả trước hoặc XDCB: Nợ 242, Nợ 241
      if (e.debitAccount.startsWith('242') || e.debitAccount.startsWith('241')) {
        totalPrepaidAdditions = addMoney(totalPrepaidAdditions, e.amount)
        if (prepaidEntryIds.length < 50) prepaidEntryIds.push(e.id)
      }
    }

    const ctt = ctx.config.materiality.clearlyTrivial
    const expNum = moneyToNumber(totalOperatingExpenses)
    const prepNum = moneyToNumber(totalPrepaidAdditions)

    // Điều kiện: Chi phí treo >= 200 triệu (hoặc >= CTT) VÀ chiếm trên 35% tổng (chi phí + chi phí treo)
    const totalCombined = expNum + prepNum
    const parkingRatio = totalCombined > 0 ? prepNum / totalCombined : 0

    if (totalPrepaidAdditions.raw >= ctt.raw && prepNum >= 200_000_000 && parkingRatio >= 0.35) {
      const scoreM = materialityScore(totalPrepaidAdditions, ctx.config.materiality.overall)
      findings.push({
        ruleId: this.id,
        clusterKey: 'EXPENSE_PARKING',
        title: 'Bẫy treo chi phí giấu lỗ: Tỷ trọng chi phí trả trước / dở dang (242/241) cao bất thường',
        category: 'EXPENSE',
        observation:
          `Phát sinh Nợ TK 242 / 241 đạt ${formatVnd(totalPrepaidAdditions)}, chiếm ${(parkingRatio * 100).toFixed(1)}% ` +
          `tổng chi phí phát sinh trong kỳ. Có dấu hiệu vốn hóa chi phí hoặc phân bổ kéo dài để tránh ghi nhận lỗ.`,
        currentValue: formatVnd(totalPrepaidAdditions),
        priorValue: formatVnd(totalOperatingExpenses),
        scores: { materiality: scoreM, anomaly: 20, timing: 0, pattern: 25 },
        reasons: [
          `Chi phí treo Nợ 242/241 đạt ${formatVnd(totalPrepaidAdditions)} >= CTT ${formatVnd(ctt)}`,
          `Tỷ trọng treo chi phí ${(parkingRatio * 100).toFixed(1)}% >= ngưỡng 35%`,
        ],
        auditImplication:
          'Theo nguyên tắc phù hợp (Matching Principle) và VSA 330, việc phân bổ chi phí không đúng kỳ sẽ làm sai lệch nghiêm trọng kết quả kinh doanh. Chi phí không đủ tiêu chuẩn phân bổ cần phải trích ngay vào KQKD trong kỳ.',
        recommendedProcedures: [
          'Kiểm tra bảng kê phân bổ chi phí trả trước 242 và căn cứ xác định kỳ hạn phân bổ',
          'Rà soát các khoản chi phí sửa chữa lớn, thuê mặt bằng, quảng cáo bị treo trên 242',
          'Rà soát các công trình XDCB dở dang trên 241 đã đưa vào sử dụng nhưng chưa nghiệm thu',
        ],
        evidence: {
          journalEntryIds: prepaidEntryIds,
          accounts: ['242', '241'],
        },
      })
    }

    return findings
  },
}

/**
 * 5. DISPOSAL_REVENUE_WITHOUT_ASSET_DERECOGNITION:
 * Có Doanh thu thanh lý / nhượng bán TSCĐ (Có 711) nhưng không có bút toán ghi giảm nguyên giá TSCĐ (Có 211/213)
 * và giảm khấu hao hao mòn lũy kế (Nợ 214) (VSA 500, VSA 240).
 */
export const disposalRevenueWithoutAssetDerecognitionRule: AuditRule = {
  id: 'DISPOSAL_REVENUE_WITHOUT_ASSET_DERECOGNITION',
  description: 'Có doanh thu thanh lý/nhượng bán (TK 711) nhưng không ghi giảm TSCĐ (TK 211/213/214)',
  evaluate(ctx) {
    const findings: RawFinding[] = []
    const ctt = ctx.config.materiality.clearlyTrivial
    const disposalKeywords = [
      'THANH LY',
      'NHUONG BAN',
      'BAN TAI SAN',
      'BAN XE',
      'BAN MAY MOC',
      'BAN THIET BI',
      'THANH LY TAI SAN',
      'THANH LY TSCD',
      'NHUONG BAN TSCD',
      'DISPOSAL',
    ]

    // Tìm các bút toán Có 711 có diễn giải thanh lý/nhượng bán
    const disposalIncomeEntries = ctx.entries.filter((e) => {
      if (!e.creditAccount.startsWith('711')) return false
      const descNorm = normalizeKeyword(e.description)
      return disposalKeywords.some((kw) => descNorm.includes(kw))
    })

    if (disposalIncomeEntries.length === 0) return []

    const totalDisposalIncome = disposalIncomeEntries.reduce((s, e) => addMoney(s, e.amount), MONEY_ZERO)
    if (totalDisposalIncome.raw < ctt.raw) return []

    // Kiểm tra trong toàn bộ sổ có bút toán ghi giảm TSCĐ (Có 211, Có 213, Có 217) hay không
    const assetReductionEntries = ctx.entries.filter(
      (e) => e.creditAccount.startsWith('211') || e.creditAccount.startsWith('213') || e.creditAccount.startsWith('217'),
    )
    const totalAssetReduction = assetReductionEntries.reduce((s, e) => addMoney(s, e.amount), MONEY_ZERO)

    // Nếu không có ghi giảm TSCĐ hoặc giảm quá nhỏ so với doanh thu thanh lý
    if (totalAssetReduction.raw === 0n) {
      const scoreM = materialityScore(totalDisposalIncome, ctx.config.materiality.overall)
      findings.push({
        ruleId: this.id,
        clusterKey: 'DISPOSAL_NO_DERECOG',
        title: 'Có thu nhập thanh lý TSCĐ (TK 711) nhưng không ghi giảm nguyên giá TSCĐ (TK 211/213)',
        category: 'JOURNAL_ENTRY',
        observation:
          `Phát hiện ${disposalIncomeEntries.length} bút toán thu nhập thanh lý/nhượng bán TSCĐ (TK 711) với tổng số tiền ${formatVnd(totalDisposalIncome)}, ` +
          `nhưng trong kỳ hoàn toàn KHÔNG có bút toán ghi giảm nguyên giá tài sản cố định (Có TK 211/213) và giảm hao mòn (Nợ TK 214).`,
        currentValue: formatVnd(totalDisposalIncome),
        priorValue: '0 đ',
        scores: { materiality: scoreM, anomaly: 35, timing: 0, pattern: 25 },
        reasons: [
          `Doanh thu thanh lý Có 711 đạt ${formatVnd(totalDisposalIncome)} >= CTT ${formatVnd(ctt)}`,
          `Không phát hiện bút toán ghi giảm tài sản Có 211/213/217 trong toàn bộ sổ NKC`,
        ],
        auditImplication:
          'Theo Chuẩn mực Kế toán VAS 03 và VSA 500, khi thanh lý/nhượng bán TSCĐ bắt buộc phải thực hiện đồng thời 2 thủ tục: (1) Phản ánh thu nhập nhượng bán (Có 711) và (2) Xóa sổ TSCĐ (Nợ 214, Nợ 811 / Có 211). ' +
          'Việc không ghi giảm tài sản dẫn đến rủi ro tài sản đã bán nhưng vẫn nằm trên BCTC và tiếp tục trích khấu hao khống vào chi phí tính thuế TNDN.',
        recommendedProcedures: [
          'Yêu cầu đơn vị cung cấp Biên bản thanh lý TSCĐ, Hợp đồng bán và Hóa đơn GTGT đầu ra',
          'Đối chiếu Sổ tài sản cố định và Bảng tính khấu hao xem tài sản đã thanh lý có còn trích khấu hao không',
          'Yêu cầu hạch toán bổ sung bút toán ghi giảm nguyên giá và giá trị hao mòn lũy kế của TSCĐ đã bán',
        ],
        evidence: {
          journalEntryIds: disposalIncomeEntries.map((e) => e.id),
          accounts: ['711', '211', '213', '214', '811'],
        },
      })
    }

    return findings
  },
}

/**
 * 6. SUSPICIOUS_DESCRIPTION_TAX_RISK:
 * Diễn giải bút toán bất thường, chứa từ khóa chi phí phạt vi phạm, không hóa đơn, không chứng từ hợp lệ
 * (nguy cơ 100% bị loại trừ khỏi chi phí hợp lý khi quyết toán thuế TNDN - Chỉ tiêu B4 Tờ khai 03/TNDN).
 */
export const suspiciousTaxExpenseDescriptionRule: AuditRule = {
  id: 'SUSPICIOUS_DESCRIPTION_TAX_RISK',
  description: 'Diễn giải chi phí bất thường, chi phí phạt, không hóa đơn hợp lệ (Chỉ tiêu B4 TNDN)',
  evaluate(ctx) {
    const findings: RawFinding[] = []
    const ctt = ctx.config.materiality.clearlyTrivial

    // Danh sách từ khóa rủi ro thuế cao
    const penaltyKeywords = [
      'PHAT VI PHAM',
      'TIEN PHAT',
      'PHAT THUE',
      'PHAT HANH CHINH',
      'PHAT GIAO THONG',
      'TRUY THU THUE',
      'CHAM NOP THUE',
      'TIEN CHAM NOP',
      'CUONG CHE THUE',
    ]

    const missingInvoiceKeywords = [
      'KHONG HOA DON',
      'KHONG CO HOA DON',
      'CHUA CO HOA DON',
      'HOA DON BAN LE',
      'MUA CHO',
      'HOA DON HUY',
      'BOI DUONG',
      'HOA HONG',
      'MUA NGOAI KHONG',
      'CHI NGOAI',
    ]

    const penaltyEntries: JournalEntry[] = []
    const missingInvoiceEntries: JournalEntry[] = []

    for (const e of ctx.entries) {
      // Chỉ xét các tài khoản chi phí hoặc tài khoản nhạy cảm (6xx, 811, 1388, 242)
      const isExpense =
        e.debitAccount.startsWith('6') ||
        e.debitAccount.startsWith('811') ||
        e.debitAccount.startsWith('1388') ||
        e.debitAccount.startsWith('242')

      if (!isExpense) continue
      const descNorm = normalizeKeyword(e.description)

      if (penaltyKeywords.some((kw) => descNorm.includes(kw))) {
        penaltyEntries.push(e)
      } else if (missingInvoiceKeywords.some((kw) => descNorm.includes(kw))) {
        missingInvoiceEntries.push(e)
      }
    }

    // 1. Cảnh báo chi phí phạt, chậm nộp thuế (Luật Thuế TNDN loại trừ 100%)
    if (penaltyEntries.length > 0) {
      const totalPenalty = penaltyEntries.reduce((s, e) => addMoney(s, e.amount), MONEY_ZERO)
      if (totalPenalty.raw >= 1_000_000n) {
        findings.push({
          ruleId: this.id,
          clusterKey: 'PENALTY_EXPENSE',
          title: 'Chi phí phạt vi phạm hành chính, phạt thuế, tiền chậm nộp thuế (B4 TNDN)',
          category: 'EXPENSE',
          observation:
            `Phát hiện ${penaltyEntries.length} bút toán ghi nhận tiền phạt hành chính, phạt thuế, tiền chậm nộp với tổng giá trị ${formatVnd(totalPenalty)}. ` +
            `Các khoản chi này ghi nhận vào chi phí nhưng không được trừ khi tính thuế TNDN.`,
          currentValue: formatVnd(totalPenalty),
          scores: { materiality: materialityScore(totalPenalty, ctx.config.materiality.overall), anomaly: 35, timing: 0, pattern: 30 },
          reasons: [
            `${penaltyEntries.length} bút toán có diễn giải liên quan phạt vi phạm, chậm nộp thuế`,
            `Tổng giá trị phát sinh: ${formatVnd(totalPenalty)}`,
          ],
          auditImplication:
            'Theo Điều 4 Thông tư 96/2015/TT-BTC, tiền phạt vi phạm hành chính, vi phạm pháp luật giao thông, tiền phạt chậm nộp thuế không được tính vào chi phí được trừ khi xác định thuế TNDN. ' +
            'KTV bắt buộc phải điều chỉnh TĂNG thu nhập chịu thuế tại Chỉ tiêu B4 trên Tờ khai Quyết toán thuế TNDN (Mẫu 03/TNDN).',
          recommendedProcedures: [
            'Kiểm tra Quyết định xử phạt vi phạm hành chính hoặc Thông báo tiền thuế nợ, tiền phạt của cơ quan thuế',
            'Đưa toàn bộ số tiền phạt vào danh mục điều chỉnh tăng thu nhập chịu thuế Chỉ tiêu B4',
            'Ước tính thuế TNDN phải nộp thêm tương ứng (20% x Tiền phạt)',
          ],
          evidence: {
            journalEntryIds: penaltyEntries.map((e) => e.id),
            accounts: ['811', '642', '3339'],
          },
        })
      }
    }

    // 2. Cảnh báo chi phí không có hóa đơn, mua chợ, bồi dưỡng
    if (missingInvoiceEntries.length > 0) {
      const totalMissing = missingInvoiceEntries.reduce((s, e) => addMoney(s, e.amount), MONEY_ZERO)
      if (totalMissing.raw >= ctt.raw || totalMissing.raw >= 5_000_000n) {
        findings.push({
          ruleId: this.id,
          clusterKey: 'MISSING_INVOICE_EXPENSE',
          title: 'Chi phí mua ngoài không có hóa đơn, chứng từ hợp lệ (B4 TNDN)',
          category: 'EXPENSE',
          observation:
            `Phát hiện ${missingInvoiceEntries.length} bút toán chi phí có diễn giải ghi rõ "không hóa đơn", "mua chợ", "hóa đơn bán lẻ", "chi bồi dưỡng"... với tổng giá trị ${formatVnd(totalMissing)}.`,
          currentValue: formatVnd(totalMissing),
          scores: { materiality: materialityScore(totalMissing, ctx.config.materiality.overall), anomaly: 30, timing: 0, pattern: 25 },
          reasons: [
            `${missingInvoiceEntries.length} bút toán ghi nhận chi phí thiếu chứng từ/hóa đơn hợp lệ`,
            `Tổng giá trị: ${formatVnd(totalMissing)}`,
          ],
          auditImplication:
            'Theo Luật Thuế TNDN và Thông tư 78/2014/TT-BTC, khoản chi không có đủ hóa đơn, chứng từ hợp pháp theo quy định của pháp luật không được tính vào chi phí được trừ. ' +
            'KTV bắt buộc phải tổng hợp và điều chỉnh tăng thu nhập chịu thuế tại Chỉ tiêu B4 trên Tờ khai Quyết toán thuế 03/TNDN, tránh rủi ro bị cơ quan thuế truy thu 20% và phạt chậm nộp.',
          recommendedProcedures: [
            'Rà soát hồ sơ chứng từ gốc của các khoản chi này xem có bổ sung được hóa đơn điện tử không',
            'Nếu không có hóa đơn hợp lệ, tổng hợp và chuyển toàn bộ vào Chỉ tiêu B4 khi lập hồ sơ kiểm toán',
          ],
          evidence: {
            journalEntryIds: missingInvoiceEntries.map((e) => e.id),
            accounts: ['641', '642', '627', '811'],
          },
        })
      }
    }

    return findings
  },
}
