import { useState, useId, type MouseEvent } from 'react'
import type { GrossMarginReport } from '../../../../domain/analytics/types'
import { moneyToNumber } from '../../../../domain/money'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  report: GrossMarginReport
}

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

export function RevenueCogsComboChart({ report }: Props): JSX.Element {
  const gradientId = useId()
  const [showRev, setShowRev] = useState(true)
  const [showCogs, setShowCogs] = useState(true)
  const [showMargin, setShowMargin] = useState(true)

  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    title: string
    subtitle?: string
    items: Array<{ label: string; value: string; color?: string; isWarning?: boolean }>
    visible: boolean
  }>({
    x: 0,
    y: 0,
    title: '',
    items: [],
    visible: false,
  })

  // Tìm giá trị max doanh thu và giá vốn để làm thang đo Y1
  const maxVal = Math.max(
    ...report.points.map((p) => Math.max(moneyToNumber(p.revenue), moneyToNumber(p.cogs))),
    1000000000,
  )

  const X_START = 80
  const X_END = 920
  const Y_TOP = 25
  const Y_BOTTOM = 220
  const Y_HEIGHT = Y_BOTTOM - Y_TOP

  const getX = (idx: number) => X_START + (idx / 11) * (X_END - X_START)
  const getY1 = (val: number) => Y_BOTTOM - (val / (maxVal * 1.15)) * Y_HEIGHT

  // Thang đo trục phải Y2: tự động mở rộng theo dữ liệu thực tế
  const rawPcts = report.points.map((p) => p.grossMarginPct)
  const minRawPct = Math.min(...rawPcts)
  const maxRawPct = Math.max(...rawPcts)
  // Giữ ít nhất từ -20 đến +60; nếu dữ liệu vượt, mở rộng thêm 10% khoảng
  const dataPad = Math.max((maxRawPct - minRawPct) * 0.1, 5)
  const MIN_PCT = Math.min(-20, minRawPct - dataPad)
  const MAX_PCT = Math.max(60, maxRawPct + dataPad)
  const isClamped = minRawPct < -20 || maxRawPct > 60
  const getY2 = (pct: number): number => {
    const clamped = Math.max(MIN_PCT, Math.min(MAX_PCT, pct))
    return Y_BOTTOM - ((clamped - MIN_PCT) / (MAX_PCT - MIN_PCT)) * Y_HEIGHT
  }

  // Xây dựng đường cong Bézier cho Biên lãi gộp
  let marginPath = ''
  for (let i = 0; i < 12; i++) {
    const x = getX(i)
    const y = getY2(report.points[i]?.grossMarginPct || 0)
    if (i === 0) {
      marginPath += `M ${x} ${y}`
    } else {
      const prevX = getX(i - 1)
      const prevY = getY2(report.points[i - 1]?.grossMarginPct || 0)
      const cpX1 = prevX + (x - prevX) / 2
      const cpX2 = cpX1
      marginPath += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`
    }
  }

  function handlePointHover(e: MouseEvent, idx: number): void {
    const pt = report.points[idx]
    if (!pt) return

    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: `Tháng ${idx + 1}`,
      subtitle: pt.isAnomaly ? 'Cảnh báo biên lãi gộp bất thường' : 'Chi tiết tháng',
      items: [
        { label: 'Doanh thu (511)', value: `${moneyToNumber(pt.revenue).toLocaleString('vi-VN')} đ`, color: '#0284c7' },
        { label: 'Giá vốn (632)', value: `${moneyToNumber(pt.cogs).toLocaleString('vi-VN')} đ`, color: '#ea580c' },
        { label: 'Lợi nhuận gộp', value: `${moneyToNumber(pt.grossProfit).toLocaleString('vi-VN')} đ`, color: pt.isNegative ? '#b91c1c' : '#0f172a' },
        { label: 'Biên lãi gộp', value: `${pt.grossMarginPct}%`, color: pt.isNegative ? '#b91c1c' : '#059669', isWarning: pt.isAnomaly },
      ],
      visible: true,
    })
  }

  function fmtY1Label(val: number): string {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1).replace('.0', '')} tỷ`
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)} tr`
    return '0 đ'
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Tương Quan Doanh Thu — Giá Vốn &amp; Biên Lãi Gộp (12 Tháng)
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Trục trái: Doanh thu &amp; Giá vốn (VNĐ) | Trục phải: Biên lãi gộp (%) | Mức trung bình năm: {report.annualGrossMarginPct}%
          </div>
        </div>

        {/* Series Toggles */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setShowRev(!showRev)}
            style={{
              background: showRev ? '#eff6ff' : '#f8fafc',
              border: `1px solid ${showRev ? '#bfdbfe' : '#e2e8f0'}`,
              color: showRev ? '#1d4ed8' : '#94a3b8',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#0284c7' }} />
            Doanh thu 511
          </button>

          <button
            type="button"
            onClick={() => setShowCogs(!showCogs)}
            style={{
              background: showCogs ? '#fff7ed' : '#f8fafc',
              border: `1px solid ${showCogs ? '#fed7aa' : '#e2e8f0'}`,
              color: showCogs ? '#c2410c' : '#94a3b8',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ea580c' }} />
            Giá vốn 632
          </button>

          <button
            type="button"
            onClick={() => setShowMargin(!showMargin)}
            style={{
              background: showMargin ? '#ecfdf5' : '#f8fafc',
              border: `1px solid ${showMargin ? '#a7f3d0' : '#e2e8f0'}`,
              color: showMargin ? '#047857' : '#94a3b8',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
            Biên lãi gộp %
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '260px' }}>
        <svg viewBox="0 0 1000 260" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`${gradientId}-rev`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id={`${gradientId}-cogs`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y1 labels (Trục trái) */}
          {[1.0, 0.75, 0.5, 0.25, 0].map((step, idx) => {
            const y = Y_BOTTOM - step * Y_HEIGHT
            const val = maxVal * 1.15 * step
            return (
              <g key={idx}>
                <line x1={X_START} y1={y} x2={X_END} y2={y} stroke={step === 0 ? '#cbd5e1' : '#f1f5f9'} strokeWidth={step === 0 ? 1.5 : 1} strokeDasharray={step === 0 ? 'none' : '3 3'} />
                <text x={X_START - 10} y={y + 3.5} textAnchor="end" fill="#94a3b8" fontSize="9.5px" fontFamily="monospace">
                  {fmtY1Label(val)}
                </text>
              </g>
            )
          })}

          {/* Y2 labels (Trục phải: Biên %) */}
          {showMargin &&
            [60, 40, 20, 0, -20].map((pct, idx) => {
              const y = getY2(pct)
              return (
                <text key={idx} x={X_END + 12} y={y + 3.5} textAnchor="start" fill="#94a3b8" fontSize="9.5px" fontFamily="monospace">
                  {pct}%
                </text>
              )
            })}

          {/* Đường baseline trung bình cả năm */}
          {showMargin && report.annualGrossMarginPct !== 0 && (
            <g>
              <line
                x1={X_START}
                y1={getY2(report.annualGrossMarginPct)}
                x2={X_END}
                y2={getY2(report.annualGrossMarginPct)}
                stroke="#64748b"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.7"
              />
              <text x={X_END + 45} y={getY2(report.annualGrossMarginPct) + 3} fill="#64748b" fontSize="9px" fontWeight="600">
                TB: {report.annualGrossMarginPct}%
              </text>
            </g>
          )}

          {/* X Axis labels (T1..T12) */}
          {MONTHS.map((m, idx) => (
            <text key={idx} x={getX(idx)} y={Y_BOTTOM + 18} textAnchor="middle" fill="#64748b" fontSize="10.5px" fontWeight="600" fontFamily="monospace">
              {m}
            </text>
          ))}

          {/* Bars (Doanh thu & Giá vốn) */}
          {report.points.map((pt, idx) => {
            const centerX = getX(idx)
            const revNum = moneyToNumber(pt.revenue)
            const cogsNum = moneyToNumber(pt.cogs)

            const barW = 14
            const revH = Math.max(0, Y_BOTTOM - getY1(revNum))
            const cogsH = Math.max(0, Y_BOTTOM - getY1(cogsNum))

            return (
              <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={(e) => handlePointHover(e, idx)} onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
                {/* Cột Doanh thu */}
                {showRev && (
                  <rect x={centerX - barW - 1} y={getY1(revNum)} width={barW} height={revH} fill={`url(#${gradientId}-rev)`} rx="2" opacity="0.9" />
                )}

                {/* Cột Giá vốn */}
                {showCogs && (
                  <rect x={centerX + 1} y={getY1(cogsNum)} width={barW} height={cogsH} fill={`url(#${gradientId}-cogs)`} rx="2" opacity="0.9" />
                )}
              </g>
            )
          })}

          {/* Line: Biên lãi gộp % */}
          {showMargin && (
            <g>
              <path d={marginPath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {report.points.map((pt, idx) => {
                const x = getX(idx)
                const y = getY2(pt.grossMarginPct)
                const isAnomaly = pt.isAnomaly

                return (
                  <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={(e) => handlePointHover(e, idx)} onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
                    {/* Vòng pulse nhấp nháy cho tháng bất thường */}
                    {isAnomaly && (
                      <circle cx={x} cy={y} r="8" fill="none" stroke="#b45309" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.8">
                        <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={x} cy={y} r={isAnomaly ? 4.5 : 3.5} fill={pt.isNegative ? '#b91c1c' : '#059669'} stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                )
              })}
            </g>
          )}
        </svg>

        <ChartTooltip {...tooltip} />
      </div>

      {isClamped && (
        <div style={{ marginTop: '8px', background: '#fef9c3', border: '1px solid #fef08a', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', color: '#713f12' }}>
          <strong>Lưu ý thang đo:</strong> Biên lãi gộp dao động ngoài phạm vi thông thường (−20% – +60%). Thang đo đã được mở rộng tự động theo dữ liệu thực tế ({Math.round(MIN_PCT)}% – {Math.round(MAX_PCT)}%). Con số thực trên tooltip vẫn chính xác.
        </div>
      )}
      {report.auditWarning && (
        <div style={{ marginTop: '8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', color: '#b45309' }}>
          <strong>Lưu ý kiểm toán:</strong> {report.auditWarning}
        </div>
      )}
    </div>
  )
}
