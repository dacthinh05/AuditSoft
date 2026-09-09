import { subtractMoney } from '../../../domain/money'
import { formatPct, formatVnd } from '../../../shared/utils/moneyFormat'
import type { RawFinding } from '../../../shared/types/analytics'
import { materialityScore } from '../../analytics/MaterialityEngine'
import type { AuditRule } from '../AuditRuleEngine'

interface GroupDef {
  maSo: string
  label: string
  accounts: string[]
}

const GROUPS: GroupDef[] = [
  { maSo: '25', label: 'Chi phí quản lý doanh nghiệp', accounts: ['642'] },
  { maSo: '24', label: 'Chi phí bán hàng', accounts: ['641'] },
  { maSo: '22', label: 'Chi phí tài chính', accounts: ['635'] },
]

/** EXPENSE_INCREASE — chi phí tăng vượt ngưỡng vs năm trước (§18). */
export const expenseIncreaseRule: AuditRule = {
  id: 'EXPENSE_INCREASE',
  description: 'Chi phí tăng đáng kể so với năm trước',
  evaluate(ctx) {
    const is = ctx.isAnalysis
    if (!is || !is.hasPriorYear) return []
    const findings: RawFinding[] = []
    const ctt = ctx.config.materiality.clearlyTrivial
    const growthThreshold = ctx.config.thresholds.expenseGrowthPct

    for (const g of GROUPS) {
      const cur = is.lines.find((l) => l.maSo === g.maSo)?.current ?? null
      const pri = is.lines.find((l) => l.maSo === g.maSo)?.prior ?? null
      if (!cur || !pri) continue
      const delta = subtractMoney(cur, pri)
      if (delta.raw < ctt.raw) continue
      const growth = Number(pri.raw) !== 0 ? Number(delta.raw * 10000n / (pri.raw < 0n ? -pri.raw : pri.raw)) / 10000 : null
      if (growth == null || growth < growthThreshold) continue

      const omRatio = materialityScore(delta, ctx.config.materiality.overall)
      findings.push({
        ruleId: this.id,
        clusterKey: g.maSo,
        title: `${g.label} tăng đáng kể so với năm trước`,
        category: 'EXPENSE',
        observation:
          `${g.label} năm nay ${formatVnd(cur)} so với ${formatVnd(pri)} năm trước (${formatPct(growth)}). ` +
          `Đề xuất phân tích cơ cấu chi phí và rà soát các khoản phát sinh bất thường.`,
        currentValue: formatVnd(cur),
        priorValue: formatVnd(pri),
        difference: formatVnd(delta),
        percentageChange: Math.round(growth * 1000) / 10,
        scores: { materiality: omRatio, anomaly: Math.min(25, Math.round(growth * 50)), timing: 0, pattern: 0 },
        reasons: [
          `Ngưỡng growth ≥ ${String(growthThreshold * 100).replace('.', ',')}% — thực tế ${formatPct(growth)}`,
          `Δ ≥ CTT ${formatVnd(ctt)}`,
        ],
        auditImplication: 'Biến động chi phí cần được giải trình — chưa kết luận ghi nhận thừa chi phí.',
        recommendedProcedures: [
          `Phân tích ${g.accounts.join('/')}* theo TK cấp 2 và theo tháng`,
          'Rà soát các khoản chi một lần/không lặp lại',
          'Đối chiếu với hợp đồng, hóa đơn của khoản tăng chính',
        ],
        evidence: { accounts: g.accounts },
      })
    }
    return findings
  },
}

/** NEW_MATERIAL_ACCOUNT — TK mới phát sinh lớn so với tập TK năm trước (§36). */
export const newMaterialAccountRule: AuditRule = {
  id: 'NEW_MATERIAL_ACCOUNT',
  description: 'Tài khoản mới phát sinh trọng yếu',
  evaluate(ctx) {
    const prior = ctx.priorAccountSet
    if (!prior || prior.size === 0) return [] // thiếu dữ liệu trước → không chạy (§46)
    const pm10 = ctx.config.materiality.performance
    const threshold = { raw: pm10.raw / 2n, scale: pm10.scale }
    const rows: Array<{ account: string; amount: bigint }> = []
    for (const s of ctx.accountStats.values()) {
      if (prior.has(s.account)) continue
      // bỏ nếu prefix đã tồn tại ở năm trước (chỉ là chi tiết hóa TK cũ — §35)
      let covered = false
      for (let len = 3; len < s.account.length; len++) {
        if (prior.has(s.account.slice(0, len))) {
          covered = true
          break
        }
      }
      if (covered) continue
      const movement = s.debitTurnover.raw > s.creditTurnover.raw ? s.debitTurnover.raw : s.creditTurnover.raw
      if (movement >= threshold.raw) rows.push({ account: s.account, amount: movement })
    }
    if (rows.length === 0) return []
    rows.sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : a.account.localeCompare(b.account)))
    return [
      {
        ruleId: this.id,
        clusterKey: 'NEWACC',
        title: 'Tài khoản mới phát sinh với giá trị trọng yếu',
        category: 'JOURNAL_ENTRY',
        observation:
          `${rows.length} tài khoản không xuất hiện ở dữ liệu năm trước nhưng phát sinh ≥ ${formatVnd(threshold)}: ` +
          rows.slice(0, 8).map((r) => r.account).join(', ') +
          `${rows.length > 8 ? ' …' : ''}. Đây là chỉ dấu — đề xuất xác nhận bản chất hạch toán.`,
        scores: { materiality: 16, anomaly: 12, timing: 0, pattern: 5 },
        reasons: [`Ngưỡng movement ≥ PM/2 (${formatVnd(threshold)})`, 'TK không có ở năm trước (không tính TK chi tiết hóa từ TK cũ)'],
        auditImplication: 'Tài khoản mới chỉ là chỉ dấu cần xem xét, không đồng nghĩa hạch toán sai.',
        recommendedProcedures: ['Hỏi khách hàng mục đích mở TK mới', 'Rà soát bút toán đầu tiên trên TK'],
        evidence: { accounts: rows.slice(0, 20).map((r) => r.account) },
      },
    ]
  },
}
