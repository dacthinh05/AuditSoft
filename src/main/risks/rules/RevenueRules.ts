import { addMoney, moneyFromNumber, subtractMoney, type Money } from '../../../domain/money'
import { formatPct, formatVnd } from '../../../shared/utils/moneyFormat'
import { isAccount } from '../../accounting/AccountClassifier'
import { materialityScore } from '../../analytics/MaterialityEngine'
import type { AuditRule } from '../AuditRuleEngine'

/** REVENUE_FLUCTUATION — so KQKD nay vs trước (§16). */
export const revenueFluctuationRule: AuditRule = {
  id: 'REVENUE_FLUCTUATION',
  description: 'Doanh thu thuần tăng/giảm bất thường so với năm trước',
  evaluate(ctx) {
    const is = ctx.isAnalysis
    if (!is || !is.hasPriorYear) return []
    const g = is.metrics.revenueGrowthPct
    if (g == null) return []
    const revCur = is.lines.find((l) => l.maSo === '10')?.current ?? null
    const revPri = is.lines.find((l) => l.maSo === '10')?.prior ?? null
    if (!revCur || !revPri) return []
    const delta = subtractMoney(revCur, revPri)
    const pm = ctx.config.materiality.performance

    // §46 gate: |growth| ≥ ngưỡng VÀ |Δ| ≥ PM
    if (Math.abs(g) < ctx.config.thresholds.revenueGrowthPct) return []
    if (absRaw(delta) < pm.raw) return []

    const scoreM = materialityScore(absOf(delta), ctx.config.materiality.overall)
    const anomaly = Math.min(30, Math.round(Math.abs(g) * 100))
    return [
      {
        ruleId: this.id,
        clusterKey: 'REVENUE',
        title: g > 0 ? 'Doanh thu tăng đáng kể so với năm trước' : 'Doanh thu giảm đáng kể so với năm trước',
        category: 'REVENUE',
        observation:
          `Doanh thu thuần năm nay ${formatVnd(revCur)} so với năm trước ${formatVnd(revPri)} ` +
          `(biến động ${formatPct(g)}). Đề xuất rà soát cơ cấu doanh thu và các giao dịch cuối kỳ.`,
        currentValue: formatVnd(revCur),
        priorValue: formatVnd(revPri),
        difference: formatVnd(delta),
        percentageChange: Math.round(g * 1000) / 10,
        scores: { materiality: scoreM, anomaly, timing: 0, pattern: 0 },
        reasons: [
          `Ngưỡng growth: |${pctLabel(ctx.config.thresholds.revenueGrowthPct)}| — thực tế ${formatPct(g)}`,
          `Chênh lệch tuyệt đối ${formatVnd(absOf(delta))} ≥ PM ${formatVnd(pm)}`,
        ],
        auditImplication: 'Khu vực doanh thu cần xem xét kỹ hơn — biến động bất thường không đồng nghĩa với sai sót.',
        recommendedProcedures: [
          'Phân tích doanh thu theo nhóm sản phẩm/khách hàng',
          'Rà soát cutoff hóa đơn đầu kỳ/cuối kỳ',
          'Đối chiếu doanh thu với khai thuế và dòng tiền thu',
        ],
        evidence: { accounts: ['511'] },
      },
    ]
  },
}

/** DECEMBER_REVENUE_CONCENTRATION — cụm JE tháng cuối kỳ (§16/§47). */
export const decemberRevenueConcentrationRule: AuditRule = {
  id: 'DECEMBER_REVENUE_CONCENTRATION',
  description: 'Tập trung doanh thu tháng cuối kỳ bất thường',
  evaluate(ctx) {
    const stats = ctx.monthly.get('REVENUE')
    if (!stats || stats.totalAmount.raw === 0n) return []
    const dec = amountOfMonth(stats.buckets, 12)
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => amountOfMonth(stats.buckets, m))
    const activeBase = base.filter((v) => v.raw > 0n)
    if (dec.raw === 0n || activeBase.length === 0) return []

    const pm = ctx.config.materiality.performance
    const multiple = ctx.config.thresholds.decemberShareMultiple
    const avgBase = divide(sum(activeBase), activeBase.length)
    // §46 gates: T12 ≥ PM và T12 ≥ multiple × TB tháng thường
    if (absRaw(dec) < pm.raw) return []
    if (compare(dec, multiply(avgBase, multiple)) < 0) return []

    const share = Number((absRaw(dec) * 10000n) / absRaw(stats.totalAmount)) / 100
    const ids = ctx.entries.filter((e) => e.month === 12 && isAccount(e.creditAccount, '511')).map((e) => e.id)
    const anomaly = Math.min(30, 10 + Math.round(multiple * 5))

    return [
      {
        ruleId: this.id,
        clusterKey: 'DEC',
        title: 'Tập trung doanh thu cao bất thường tại tháng cuối kỳ',
        category: 'REVENUE',
        observation:
          `Doanh thu T12 đạt ${formatVnd(dec)}, chiếm ${formatPct(share)} tổng doanh thu năm, trong khi trung bình ` +
          `các tháng T1–T11 chỉ ${formatVnd(avgBase)}/tháng. Đề xuất kiểm tra cutoff và tính hữu hiệu của ` +
          `doanh thu cuối kỳ. [${ids.length} bút toán]`,
        currentValue: formatVnd(dec),
        difference: `${formatPct(share)} của cả năm`,
        percentageChange: Math.round(share * 1000) / 10,
        scores: { materiality: materialityScore(dec, ctx.config.materiality.overall), anomaly, timing: 15, pattern: 0 },
        reasons: [
          `Ngưỡng: T12 ≥ ${String(multiple).replace('.', ',')}× trung bình tháng VÀ ≥ PM ${formatVnd(pm)}`,
          `Thực tế: ${formatVnd(dec)} vs TB ${formatVnd(avgBase)}/tháng`,
        ],
        auditImplication: 'Tiềm ẩn rủi ro cutoff/occurrence tại doanh thu cuối kỳ — cần xem xét, chưa kết luận sai sót.',
        recommendedProcedures: [
          'Cutoff test hóa đơn bán hàng T12 ↔ T1',
          'Đối chiếu xuất kho ↔ hóa đơn ↔ ghi nhận doanh thu',
          'Xác nhận công nợ khách hàng phát sinh lớn cuối kỳ',
        ],
        evidence: { journalEntryIds: ids, accounts: ['511'], months: [12] },
      },
    ]
  },
}

/** NEGATIVE_REVENUE — bút toán âm trên TK doanh thu (§16). */
export const negativeRevenueRule: AuditRule = {
  id: 'NEGATIVE_REVENUE',
  description: 'Bút toán số tiền âm trên tài khoản doanh thu',
  evaluate(ctx) {
    const ctt = ctx.config.materiality.clearlyTrivial
    const materialRows = ctx.entries.filter(
      (e) => e.amount.raw <= -ctt.raw && (isAccount(e.debitAccount, '511') || isAccount(e.creditAccount, '511')),
    )
    if (materialRows.length === 0) return []
    const sumAbs = materialRows.reduce((acc, e) => addMoney(acc, negate(e.amount)), moneyFromNumber(0))
    return [
      {
        ruleId: this.id,
        clusterKey: 'NEG',
        title: 'Có bút toán số âm trên tài khoản doanh thu',
        category: 'REVENUE',
        observation:
          `Phát hiện ${materialRows.length} bút toán số âm trên TK 511* với tổng trị giá ${formatVnd(sumAbs)}. ` +
          `Thông thường đây là điều chỉnh/hủy hóa đơn — đề xuất rà soát chứng từ gốc.`,
        scores: { materiality: materialityScore(sumAbs, ctx.config.materiality.overall), anomaly: 10, timing: 0, pattern: 5 },
        reasons: [`Số dòng âm ≥ CTT (${formatVnd(ctt)}): ${materialRows.length}`],
        auditImplication: 'Cần xác nhận bản chất điều chỉnh giảm doanh thu là hợp lệ.',
        recommendedProcedures: ['Kiểm tra biên bản/hóa đơn điều chỉnh', 'Rà soát hoàn trả hàng và quyền lợi khách hàng'],
        evidence: { journalEntryIds: materialRows.map((e) => e.id), accounts: ['511'] },
      },
    ]
  },
}

// ── helpers ──
function pctLabel(v: number): string {
  return `${(v * 100).toFixed(0).replace('.', ',')}%`
}
function amountOfMonth(buckets: readonly { month: number; debit: Money; credit: Money }[], month: number): Money {
  const b = buckets.find((x) => x.month === month)
  return b ? addMoney(b.debit, b.credit) : moneyFromNumber(0)
}
function sum(list: readonly Money[]): Money {
  return list.reduce((a, b) => addMoney(a, b), moneyFromNumber(0))
}
function divide(m: Money, n: number): Money {
  const scaleUp = 6
  const raw = (m.raw * 10n ** BigInt(scaleUp)) / BigInt(Math.max(1, n))
  return { raw, scale: m.scale + scaleUp }
}
function multiply(m: Money, k: number): Money {
  return { raw: BigInt(Math.round(Number(m.raw) * k)), scale: m.scale }
}
function compare(a: Money, b: Money): number {
  const s = Math.max(a.scale, b.scale)
  const fa = a.raw * 10n ** BigInt(s - a.scale)
  const fb = b.raw * 10n ** BigInt(s - b.scale)
  return fa < fb ? -1 : fa > fb ? 1 : 0
}
function negate(m: Money): Money {
  return { raw: -m.raw, scale: m.scale }
}
function absOf(m: Money): Money {
  return m.raw < 0n ? negate(m) : m
}
function absRaw(m: Money): bigint {
  return m.raw < 0n ? -m.raw : m.raw
}
