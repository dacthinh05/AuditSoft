import { subtractMoney, type Money } from '../../../domain/money'
import { formatPP, formatPct, formatVnd } from '../../../shared/utils/moneyFormat'
import { materialityScore } from '../../analytics/MaterialityEngine'
import type { AuditRule, RiskContext } from '../AuditRuleEngine'

function lineOf(ctx: RiskContext, maSo: string): { current: Money | null; prior: Money | null } {
  const l = ctx.isAnalysis?.lines.find((x) => x.maSo === maSo)
  return { current: l?.current ?? null, prior: l?.prior ?? null }
}

/** GROSS_MARGIN_SHIFT — biên lợi nhuận gộp xấu đi (§17). */
export const grossMarginShiftRule: AuditRule = {
  id: 'GROSS_MARGIN_SHIFT',
  description: 'Biên lợi nhuận gộp thay đổi bất thường',
  evaluate(ctx) {
    const is = ctx.isAnalysis
    if (!is || !is.hasPriorYear) return []
    const m = is.metrics
    if (m.grossMarginChangePP == null) return []
    const threshold = ctx.config.thresholds.grossMarginDropPP
    // chỉ flag khi GM giảm vượt ngưỡng (deterioration)
    if (m.grossMarginChangePP > -threshold) return []

    const cogsCur = lineOf(ctx, '11').current
    const cogsPri = lineOf(ctx, '11').prior
    if (!cogsCur || !cogsPri) return []
    const cogsDelta = subtractMoney(cogsCur, cogsPri)
    const pm = ctx.config.materiality.performance
    if (cogsDelta.raw < pm.raw) return []

    return [
      {
        ruleId: this.id,
        clusterKey: 'GM',
        title: 'Biên lợi nhuận gộp suy giảm đáng kể',
        category: 'COGS',
        observation:
          `Biên lợi nhuận gộp giảm từ ${formatPct(m.grossMarginPrior)} xuống ${formatPct(m.grossMarginCurrent)} ` +
          `(${formatPP(m.grossMarginChangePP)}), trong khi giá vốn tăng ${formatVnd(cogsDelta)} ` +
          `(${formatPct(m.cogsGrowthPct)}). Biến động chủ yếu từ mức tăng giá vốn cao hơn mức tăng doanh thu. ` +
          `Đề xuất rà soát giá thành, định mức và chính sách giá bán.`,
        currentValue: formatPct(m.grossMarginCurrent),
        priorValue: formatPct(m.grossMarginPrior),
        difference: formatPP(m.grossMarginChangePP),
        scores: {
          materiality: materialityScore(cogsDelta, ctx.config.materiality.overall),
          anomaly: 25,
          timing: 0,
          pattern: 0,
        },
        reasons: [
          `Ngưỡng: GM giảm ≥ ${threshold} pp — thực tế ${formatPP(m.grossMarginChangePP)}`,
          `ΔGiá vốn ${formatVnd(cogsDelta)} ≥ PM ${formatVnd(pm)}`,
        ],
        auditImplication: 'Rủi ro định mức/giá thành/cutoff giá vốn cần xem xét — chưa kết luận sai sót.',
        recommendedProcedures: [
          'Phân tích biến động giá vốn theo sản phẩm/nhóm hàng',
          'Kiểm tra định mức NVL và bảng tính giá thành kỳ cuối',
          'Đối chiếu tồn kho ↔ giá vốn ↔ doanh thu theo tháng',
        ],
        evidence: { accounts: ['511', '632'] },
      },
    ]
  },
}
