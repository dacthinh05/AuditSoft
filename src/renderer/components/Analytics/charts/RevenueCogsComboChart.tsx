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
  const [viewMode, setViewMode] = useState<'NORMALIZED' | 'RAW'>('NORMALIZED')

  const isNormalized = Boolean(report.isNormalizedByActualCost && report.rawPoints)
  const activePoints = isNormalized && viewMode === 'RAW' && report.rawPoints ? report.rawPoints : report.points
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
    ...activePoints.map((p) => Math.max(moneyToNumber(p.revenue), moneyToNumber(p.cogs))),
    1000000000,
  )

  const X_START = 80
  const X_END = 920
  const Y_TOP = 25
  const Y_BOTTOM = 220
  const Y_HEIGHT = Y_BOTTOM - Y_TOP

  const getX = (idx: number) => X_START + (idx / 11) * (X_END - X_START)
  const getY1 = (val: number) => Y_BOTTOM - (val / (maxVal * 1.15)) * Y_HEIGHT

  // Thang đo trục phải Y2: Cố định dải [-100%, +100%] để các tháng bình thường đọc rõ được dao động
  // Các tháng ngoại lai cực đoan (như T12: -1162% do dồn giá vốn) được chạm trần đáy kèm nhãn cảnh báo
  const rawPcts = activePoints.map((p) => p.grossMarginPct)
  const minRawPct = Math.min(...rawPcts)
  const maxRawPct = Math.max(...rawPcts)
  const MIN_PCT = -100
  const MAX_PCT = 100
  const hasOutlier = minRawPct < -100 || maxRawPct > 100
  const getY2 = (pct: number): number => {
    const clamped = Math.max(MIN_PCT, Math.min(MAX_PCT, pct))
    return Y_BOTTOM - ((clamped - MIN_PCT) / (MAX_PCT - MIN_PCT)) * Y_HEIGHT
  }

  // Xây dựng đường cong Bézier cho Biên lãi gộp
  let marginPath = ''
  for (let i = 0; i < 12; i++) {
    const x = getX(i)
    const y = getY2(activePoints[i]?.grossMarginPct || 0)
    if (i === 0) {
      marginPath += `M ${x} ${y}`
    } else {
      const prevX = getX(i - 1)
      const prevY = getY2(activePoints[i - 1]?.grossMarginPct || 0)
      const cpX1 = prevX + (x - prevX) / 2
      const cpX2 = cpX1
      marginPath += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`
    }
  }

  function handlePointHover(e: MouseEvent, idx: number): void {
    const pt = activePoints[idx]
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
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
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

        {/* View Mode (Chuẩn kỳ vs Sổ sách) & Series Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {isNormalized && (
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setViewMode('NORMALIZED')}
                style={{
                  background: viewMode === 'NORMALIZED' ? '#ffffff' : 'transparent',
                  color: viewMode === 'NORMALIZED' ? '#047857' : '#64748b',
                  fontWeight: viewMode === 'NORMALIZED' ? 700 : 500,
                  boxShadow: viewMode === 'NORMALIZED' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 9px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
                title="Biểu đồ chuẩn hóa giá vốn theo chi phí sản xuất thực tế từng tháng (chuẩn kỳ VSA 520)"
              >
                Chuẩn kỳ VSA 520
              </button>
              <button
                type="button"
                onClick={() => setViewMode('RAW')}
                style={{
                  background: viewMode === 'RAW' ? '#ffffff' : 'transparent',
                  color: viewMode === 'RAW' ? '#b91c1c' : '#64748b',
                  fontWeight: viewMode === 'RAW' ? 700 : 500,
                  boxShadow: viewMode === 'RAW' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 9px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
                title="Xem theo đúng số hạch toán sổ sách (dồn toàn bộ giá vốn vào 31/12)"
              >
                Sổ sách (31/12)
              </button>
            </div>
          )}

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
                <text x={X_START - 10} y={y + 3.5} textAnchor="end" fill="#64748b" fontSize="9.5px" fontFamily="monospace">
                  {fmtY1Label(val)}
                </text>
              </g>
            )
          })}

          {/* Y2 labels (Trục phải: Biên lãi gộp %) */}
          {[60, 40, 20, 0, -20].map((pct, idx) => {
            const y = getY2(pct)
            return (
              <text key={idx} x={X_END + 12} y={y + 3.5} textAnchor="start" fill={pct === 0 ? '#ef4444' : '#94a3b8'} fontSize="9.5px" fontFamily="monospace" fontWeight={pct === 0 ? '700' : '400'}>
                {pct}%
              </text>
            )
          })}

          {/* Đường Baseline 0% rõ ràng cho Biên lãi gộp */}
          {showMargin && (
            <g>
              <line
                x1={X_START}
                y1={getY2(0)}
                x2={X_END}
                y2={getY2(0)}
                stroke="#ef4444"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.85"
              />
              <text x={X_END + 38} y={getY2(0) + 3} fill="#ef4444" fontSize="8.5px" fontWeight="700">
                Mốc 0%
              </text>
            </g>
          )}

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
                strokeDasharray="3 3"
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
          {activePoints.map((pt, idx) => {
            const centerX = getX(idx)
            const revNum = moneyToNumber(pt.revenue)
            const cogsNum = moneyToNumber(pt.cogs)

            // Tinh chỉnh độ rộng thanh bar và khoảng cách thoáng hơn
            const barW = 12
            const revH = Math.max(0, Y_BOTTOM - getY1(revNum))
            const cogsH = Math.max(0, Y_BOTTOM - getY1(cogsNum))

            return (
              <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={(e) => handlePointHover(e, idx)} onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
                {/* Cột Doanh thu */}
                {showRev && (
                  <rect x={centerX - barW - 1.5} y={getY1(revNum)} width={barW} height={revH} fill={`url(#${gradientId}-rev)`} rx="3" opacity="0.9" />
                )}

                {/* Cột Giá vốn */}
                {showCogs && (
                  <rect x={centerX + 1.5} y={getY1(cogsNum)} width={barW} height={cogsH} fill={`url(#${gradientId}-cogs)`} rx="3" opacity="0.9" />
                )}
              </g>
            )
          })}

          {/* Line: Biên lãi gộp % */}
          {showMargin && (
            <g>
              <path d={marginPath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {activePoints.map((pt, idx) => {
                const x = getX(idx)
                const y = getY2(pt.grossMarginPct)
                const isNegative = pt.isNegative || pt.grossMarginPct < 0
                const isAnomaly = pt.isAnomaly || isNegative

                return (
                  <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={(e) => handlePointHover(e, idx)} onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
                    {/* Vòng pulse nhấp nháy đỏ cho tháng âm hoặc bất thường */}
                    {isNegative ? (
                      <circle cx={x} cy={y} r="8" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.8">
                        <animate attributeName="r" values="5;11;5" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    ) : isAnomaly ? (
                      <circle cx={x} cy={y} r="8" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.8">
                        <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                      </circle>
                    ) : null}

                    {/* Điểm nút tròn */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isNegative ? 5 : isAnomaly ? 4.5 : 3.5}
                      fill={isNegative ? '#ef4444' : '#059669'}
                      stroke="#ffffff"
                      strokeWidth={isNegative ? 2 : 1.5}
                    />

                    {/* Badge nhãn cảnh báo trực tiếp trên điểm âm */}
                    {isNegative && (
                      <g transform={`translate(${x}, ${y > Y_BOTTOM - 25 ? y - 14 : y + 16})`}>
                        <rect x="-18" y="-9" width="36" height="15" rx="3" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" />
                        <text x="0" y="2" textAnchor="middle" fill="#b91c1c" fontSize="8.5px" fontWeight="700" fontFamily="monospace">
                          {pt.grossMarginPct.toFixed(0)}%
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </g>
          )}
        </svg>

        <ChartTooltip {...tooltip} />
      </div>

      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
        {isNormalized && viewMode === 'NORMALIZED' && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '5px', padding: '4px 8px', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.25, fontSize: '11px' }}>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>[Chuẩn kỳ VSA 520]</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Chuẩn hóa giá vốn theo chi phí SX thực tế từng tháng (kế toán dồn kết chuyển 31/12).</span>
          </div>
        )}
        {isNormalized && viewMode === 'RAW' && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '5px', padding: '4px 8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.25, fontSize: '11px' }}>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>[Sổ sách 31/12]</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Kế toán dồn 100% giá vốn vào 31/12 (Biên gộp T1–T11 đạt 100%, T12: {minRawPct.toFixed(1)}%).</span>
          </div>
        )}
        {!isNormalized && hasOutlier && (
          <div style={{ background: '#fef9c3', border: '1px solid #fef08a', borderRadius: '5px', padding: '4px 8px', color: '#713f12', display: 'flex', alignItems: 'center', gap: '5px', lineHeight: 1.25, fontSize: '11px' }}>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>[Thang đo]</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Neo dải [−100%, +100%]. Tháng biên âm cực đoan (T12: {minRawPct.toFixed(1)}%) chạm sàn kèm nhãn.</span>
          </div>
        )}
        {!isNormalized && report.auditWarning && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '5px', padding: '4px 8px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '5px', lineHeight: 1.25, fontSize: '11px' }}>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>[Kiểm toán]</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.auditWarning}</span>
          </div>
        )}
      </div>
    </div>
  )
}
