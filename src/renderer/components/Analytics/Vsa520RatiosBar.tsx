import type { GlAnalyticsResult } from '../../../domain/analytics/types'
import { moneyToNumber } from '../../../domain/money'

interface Props {
  data: GlAnalyticsResult
}

export function Vsa520RatiosBar({ data }: Props): JSX.Element {
  const { ebitda, correlations, pareto } = data
  const _ebitdaNum = ebitda ? moneyToNumber(ebitda.ebitda) : 0
  const fExpNum = moneyToNumber(ebitda.interestExpense)
  const opProfitNum = moneyToNumber(ebitda.operatingProfit)

  // 1. Biên lợi nhuận gộp (Gross Margin)
  const grossMarginPct = correlations?.grossMargin?.annualGrossMarginPct ?? 0
  const isGrossMarginDanger = grossMarginPct < 0
  const isGrossMarginWarning = grossMarginPct >= 0 && grossMarginPct < 15

  // 2. Hệ số khả năng trả lãi vay (Interest Coverage Ratio - ICR = EBIT / Lãi vay)
  // EBIT = LNTT HĐKD + Chi phí lãi vay
  const ebitNum = opProfitNum + fExpNum
  const icrRatio = fExpNum > 0 ? ebitNum / fExpNum : null
  const isIcrDanger = icrRatio == null || icrRatio < 1.0
  const isIcrWarning = icrRatio != null && icrRatio >= 1.0 && icrRatio < 1.5

  // 3. Tỷ lệ Chi phí hoạt động (OPEX / Doanh thu thuần)
  const totalRev = correlations?.grossMargin?.points.reduce((s, p) => s + moneyToNumber(p.revenue), 0) ?? 0
  const totalOpex = correlations?.opexRatios?.points.reduce((s, p) => s + moneyToNumber(p.totalOpex), 0) ?? 0
  const opexRatioPct = totalRev > 0 ? Number(((totalOpex / totalRev) * 100).toFixed(1)) : 0
  const isOpexWarning = opexRatioPct > 12

  // 4. Mức độ tập trung khách hàng (Pareto Top 1 & Top 5)
  const custTop1Pct = pareto.customerConcentrationRatio1
  const custTop5Pct = pareto.customerConcentrationRatio5
  const isCustWarning = custTop1Pct > 30 || pareto.customerRiskWarning
  const ratios = [
    {
      label: 'Biên Lợi Nhuận Gộp',
      value: `${grossMarginPct}%`,
      bench: 'Chuẩn ≥ 15%',
      eval: isGrossMarginDanger ? 'Kinh doanh dưới giá vốn' : isGrossMarginWarning ? 'Biên lãi mỏng' : 'Biên gộp an toàn',
      status: isGrossMarginDanger ? 'DANGER' : isGrossMarginWarning ? 'WARNING' : 'SAFE',
    },
    {
      label: 'Khả Năng Trả Lãi (ICR)',
      value: icrRatio != null ? `${icrRatio.toFixed(2)} lần` : 'N/A',
      bench: 'Chuẩn ≥ 1.5 lần',
      eval: isIcrDanger ? 'Không đủ trả nợ vay' : isIcrWarning ? 'Khả năng trả lãi thấp' : 'Dư trả lãi vay',
      status: isIcrDanger ? 'DANGER' : isIcrWarning ? 'WARNING' : 'SAFE',
    },
    {
      label: 'Tỷ Lệ OPEX / Doanh Thu',
      value: `${opexRatioPct}%`,
      bench: 'Chuẩn ≤ 10% - 12%',
      eval: isOpexWarning ? 'Chi phí hoạt động cao' : 'Kiểm soát tốt',
      status: isOpexWarning ? 'WARNING' : 'SAFE',
    },
    {
      label: 'Tập Trung Nguồn Thu (Top 1)',
      value: `${custTop1Pct}% DT`,
      bench: `Top 5: ${custTop5Pct}% DT`,
      eval: isCustWarning ? (custTop1Pct > 30 ? 'Phụ thuộc 1 KH lớn' : 'Mức độ tập trung cao') : 'Phân bổ an toàn',
      status: isCustWarning ? 'WARNING' : 'SAFE',
    },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '12px',
      }}
    >
      {ratios.map((r, i) => {
        const isDanger = r.status === 'DANGER'
        const isWarning = r.status === 'WARNING'

        const borderColor = isDanger ? '#fca5a5' : isWarning ? '#fde68a' : '#bbf7d0'
        const borderTopColor = isDanger ? '#dc2626' : isWarning ? '#d97706' : '#16a34a'
        const bgBadge = isDanger ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4'
        const textValColor = isDanger ? '#b91c1c' : isWarning ? '#b45309' : '#15803d'

        return (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: `1px solid ${borderColor}`,
              borderTop: `3px solid ${borderTopColor}`,
              borderRadius: '10px',
              padding: '12px 14px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {r.label}
              </span>
              <span style={{ fontSize: '9.5px', color: '#94a3b8', background: '#f8fafc', padding: '1px 5px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                {r.bench}
              </span>
            </div>

            <div style={{ fontSize: '18px', fontWeight: 800, color: textValColor, fontFamily: 'monospace', margin: '2px 0' }}>
              {r.value}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: bgBadge,
                  color: textValColor,
                  border: `1px solid ${borderColor}`,
                }}
              >
                {isDanger ? '● Báo động' : isWarning ? '▲ Cảnh báo' : '✓ An toàn'}
              </span>
              <span style={{ fontSize: '11px', color: '#475569' }}>{r.eval}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
