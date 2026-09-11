import { describe, expect, it } from 'vitest'
import { makeMoney, moneyFromNumber } from '../src/domain/money'
import type { JournalEntry } from '../src/shared/types/analytics'
import { buildRiskContext, DEFAULT_RISK_CONFIG } from '../src/main/risks/AuditRuleEngine'
import {
  abnormalRevenueReversalRule,
  disposalRevenueWithoutAssetDerecognitionRule,
  expenseParkingTrapRule,
  prohibitedAccountPairsRule,
  suspiciousTaxExpenseDescriptionRule,
  virtualCashExcessiveDebtRule,
} from '../src/main/risks/rules/FraudAuditRules'

function makeEntry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: partial.id ?? 'E1',
    source: { fileName: 'test.xlsx', sheetName: 'NKC', rowNumber: 1 },
    postingDate: partial.postingDate ?? '2025-06-15',
    documentNumber: partial.documentNumber ?? 'CT01',
    description: partial.description ?? 'Test entry',
    debitAccount: partial.debitAccount ?? '156',
    creditAccount: partial.creditAccount ?? '331',
    amount: partial.amount ?? moneyFromNumber(10_000_000),
    foreignAmount: null,
    exchangeRate: null,
    objectCode: null,
    customerName: null,
    month: partial.month ?? 6,
    issues: [],
  }
}

describe('Audit Fraud & Tax Risk Rules (VSA 240, VSA 330, VSA 500, Luật Thuế TNDN)', () => {
  describe('Rule 1: virtualCashExcessiveDebtRule (Bẫy quỹ tiền mặt ảo)', () => {
    it('bắt dấu hiệu quỹ tiền mặt lớn (>= 1 tỷ) nhưng vẫn chịu chi phí lãi vay (>= 50tr)', () => {
      const entries: JournalEntry[] = [
        // Tiền mặt phát sinh lớn (2 tỷ)
        makeEntry({ id: 'CASH_1', debitAccount: '1111', creditAccount: '131', amount: moneyFromNumber(2_000_000_000) }),
        // Chi phí lãi vay lớn (100 triệu)
        makeEntry({ id: 'INT_1', debitAccount: '635', creditAccount: '1121', amount: moneyFromNumber(100_000_000) }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = virtualCashExcessiveDebtRule.evaluate(ctx)

      expect(findings.length).toBe(1)
      expect(findings[0]?.ruleId).toBe('VIRTUAL_CASH_EXCESSIVE_DEBT')
      expect(findings[0]?.category).toBe('CASH')
      expect(findings[0]?.title).toContain('quỹ tiền mặt ảo')
      expect(findings[0]?.auditImplication).toContain('Thông tư 96/2015/TT-BTC')
    })

    it('không báo động khi tiền mặt nhỏ hoặc không có chi phí lãi vay', () => {
      const entries: JournalEntry[] = [
        makeEntry({ id: 'CASH_SMALL', debitAccount: '1111', creditAccount: '131', amount: moneyFromNumber(50_000_000) }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = virtualCashExcessiveDebtRule.evaluate(ctx)
      expect(findings.length).toBe(0)
    })
  })

  describe('Rule 2: prohibitedAccountPairsRule (Cặp tài khoản đối ứng cấm/bất thường)', () => {
    it('bắt mua TSCĐ bằng tiền mặt >= 20 triệu (Nợ 211 - Có 111)', () => {
      const entries: JournalEntry[] = [
        makeEntry({ id: 'FA_1', debitAccount: '2111', creditAccount: '1111', amount: moneyFromNumber(80_000_000) }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = prohibitedAccountPairsRule.evaluate(ctx)

      const faFinding = findings.find((f) => f.clusterKey === 'FA_CASH')
      expect(faFinding).toBeDefined()
      expect(faFinding?.title).toContain('Mua tài sản cố định thanh toán bằng tiền mặt')
      expect(faFinding?.observation).toContain('>= 5 triệu theo NĐ 181/2025')
    })

    it('bắt xóa nợ phải thu trực tiếp vào chi phí (Nợ 642 - Có 131)', () => {
      const entries: JournalEntry[] = [
        makeEntry({ id: 'DEBT_1', debitAccount: '6422', creditAccount: '131', amount: moneyFromNumber(150_000_000) }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = prohibitedAccountPairsRule.evaluate(ctx)

      const debtFinding = findings.find((f) => f.clusterKey === 'DIRECT_DEBT_WRITEOFF')
      expect(debtFinding).toBeDefined()
      expect(debtFinding?.title).toContain('Xóa nợ phải thu khách hàng trực tiếp vào chi phí')
      expect(debtFinding?.auditImplication).toContain('Thông tư 48/2019/TT-BTC')
    })

    it('bắt xóa nợ phải trả người bán vào thu nhập khác (Nợ 331 - Có 711)', () => {
      const entries: JournalEntry[] = [
        makeEntry({ id: 'PAY_1', debitAccount: '331', creditAccount: '711', amount: moneyFromNumber(70_000_000) }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = prohibitedAccountPairsRule.evaluate(ctx)

      const payFinding = findings.find((f) => f.clusterKey === 'PAYABLE_TO_INCOME')
      expect(payFinding).toBeDefined()
      expect(payFinding?.title).toContain('Xóa nợ phải trả người bán vào thu nhập khác')
    })
  })

  describe('Rule 3: abnormalRevenueReversalRule (Ghi âm / giảm trừ doanh thu 511 bất thường)', () => {
    it('bắt bút toán Có 511 ghi số tiền âm', () => {
      const entries: JournalEntry[] = [
        makeEntry({ id: 'REV_NEG', debitAccount: '131', creditAccount: '5111', amount: makeMoney(-500_000_000n, 0) }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = abnormalRevenueReversalRule.evaluate(ctx)

      expect(findings.length).toBe(1)
      expect(findings[0]?.ruleId).toBe('ABNORMAL_REVENUE_REVERSAL')
      expect(findings[0]?.category).toBe('REVENUE')
      expect(findings[0]?.observation).toContain('ghi âm hoặc giảm trừ doanh thu TK 511')
    })

    it('bắt Nợ 511 đối ứng tài khoản lạ (không qua 521 hoặc 911)', () => {
      const entries: JournalEntry[] = [
        makeEntry({ id: 'REV_WEIRD', debitAccount: '5111', creditAccount: '3388', amount: moneyFromNumber(200_000_000) }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = abnormalRevenueReversalRule.evaluate(ctx)

      expect(findings.length).toBe(1)
      expect(findings[0]?.title).toContain('giảm trừ doanh thu TK 511 bất thường')
    })

    it('bỏ qua Nợ 511 đối ứng 911 kết chuyển hoặc 521 hợp lệ', () => {
      const entries: JournalEntry[] = [
        makeEntry({ id: 'REV_911', debitAccount: '5111', creditAccount: '911', amount: moneyFromNumber(1_000_000_000) }),
        makeEntry({ id: 'REV_521', debitAccount: '521', creditAccount: '131', amount: moneyFromNumber(50_000_000) }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = abnormalRevenueReversalRule.evaluate(ctx)
      expect(findings.length).toBe(0)
    })
  })

  describe('Rule 4: expenseParkingTrapRule (Bẫy treo chi phí giấu lỗ)', () => {
    it('bắt trường hợp chi phí treo vào TK 242/241 chiếm trên 35% tổng chi phí', () => {
      const entries: JournalEntry[] = [
        // Chi phí hoạt động thực tế: 600 triệu
        makeEntry({ id: 'EXP_1', debitAccount: '642', creditAccount: '1121', amount: moneyFromNumber(600_000_000) }),
        // Chi phí treo vào 242: 600 triệu (tổng = 1.2 tỷ, tỷ trọng 242 = 50% > 35%)
        makeEntry({ id: 'PARK_1', debitAccount: '242', creditAccount: '1121', amount: moneyFromNumber(600_000_000) }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = expenseParkingTrapRule.evaluate(ctx)

      expect(findings.length).toBe(1)
      expect(findings[0]?.ruleId).toBe('EXPENSE_PARKING_TRAP')
      expect(findings[0]?.category).toBe('EXPENSE')
      expect(findings[0]?.title).toContain('Bẫy treo chi phí giấu lỗ')
      expect(findings[0]?.observation).toContain('chiếm 50.0% tổng chi phí')
    })

    it('không báo động khi chi phí trả trước chiếm tỷ trọng thấp thông thường', () => {
      const entries: JournalEntry[] = [
        makeEntry({ id: 'EXP_1', debitAccount: '642', creditAccount: '1121', amount: moneyFromNumber(950_000_000) }),
        makeEntry({ id: 'PARK_1', debitAccount: '242', creditAccount: '1121', amount: moneyFromNumber(50_000_000) }), // 5%
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = expenseParkingTrapRule.evaluate(ctx)
      expect(findings.length).toBe(0)
    })
  })

  describe('Rule 5: disposalRevenueWithoutAssetDerecognitionRule (Thanh lý không ghi giảm TSCĐ)', () => {
    it('bắt có phát sinh Có 711 thanh lý máy móc nhưng không có Có 211/213', () => {
      const entries: JournalEntry[] = [
        makeEntry({
          id: 'DISP_1',
          debitAccount: '1121',
          creditAccount: '711',
          amount: moneyFromNumber(150_000_000),
          description: 'Thu tiền thanh lý máy móc thiết bị cũ xưởng 1',
        }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = disposalRevenueWithoutAssetDerecognitionRule.evaluate(ctx)

      expect(findings.length).toBe(1)
      expect(findings[0]?.ruleId).toBe('DISPOSAL_REVENUE_WITHOUT_ASSET_DERECOGNITION')
      expect(findings[0]?.title).toContain('không ghi giảm nguyên giá TSCĐ')
      expect(findings[0]?.observation).toContain('hoàn toàn KHÔNG có bút toán ghi giảm nguyên giá tài sản cố định')
    })

    it('bỏ qua khi có đầy đủ bút toán ghi giảm nguyên giá TSCĐ (Có 211)', () => {
      const entries: JournalEntry[] = [
        makeEntry({
          id: 'DISP_1',
          debitAccount: '1121',
          creditAccount: '711',
          amount: moneyFromNumber(150_000_000),
          description: 'Thanh lý xe ô tô chở hàng',
        }),
        makeEntry({
          id: 'DERECOG_1',
          debitAccount: '811',
          creditAccount: '2111',
          amount: moneyFromNumber(80_000_000),
          description: 'Giảm giá trị còn lại xe thanh lý',
        }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = disposalRevenueWithoutAssetDerecognitionRule.evaluate(ctx)
      expect(findings.length).toBe(0)
    })
  })

  describe('Rule 6: suspiciousTaxExpenseDescriptionRule (Diễn giải chi phí phạt & không hóa đơn B4)', () => {
    it('bắt bút toán chi phí phạt vi phạm giao thông / phạt thuế', () => {
      const entries: JournalEntry[] = [
        makeEntry({
          id: 'PEN_1',
          debitAccount: '811',
          creditAccount: '1121',
          amount: moneyFromNumber(12_000_000),
          description: 'Nộp phạt vi phạm hành chính chậm nộp thuế quý 3',
        }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = suspiciousTaxExpenseDescriptionRule.evaluate(ctx)

      const penFinding = findings.find((f) => f.clusterKey === 'PENALTY_EXPENSE')
      expect(penFinding).toBeDefined()
      expect(penFinding?.title).toContain('Chi phí phạt vi phạm hành chính, phạt thuế')
      expect(penFinding?.auditImplication).toContain('Chỉ tiêu B4')
    })

    it('bắt bút toán chi phí không có hóa đơn hợp lệ', () => {
      const entries: JournalEntry[] = [
        makeEntry({
          id: 'NO_INV_1',
          debitAccount: '6422',
          creditAccount: '1111',
          amount: moneyFromNumber(8_500_000),
          description: 'Chi phí tiếp khách mua ngoài không hóa đơn',
        }),
      ]

      const ctx = buildRiskContext(entries, DEFAULT_RISK_CONFIG)
      const findings = suspiciousTaxExpenseDescriptionRule.evaluate(ctx)

      const invFinding = findings.find((f) => f.clusterKey === 'MISSING_INVOICE_EXPENSE')
      expect(invFinding).toBeDefined()
      expect(invFinding?.title).toContain('Chi phí mua ngoài không có hóa đơn')
      expect(invFinding?.auditImplication).toContain('Chỉ tiêu B4')
    })
  })
})
