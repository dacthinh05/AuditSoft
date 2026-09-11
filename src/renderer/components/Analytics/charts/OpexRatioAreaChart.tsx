import { useState, useId, type MouseEvent } from 'react'
import type { OpexRatioReport } from '../../../../domain/analytics/types'
import { moneyToNumber } from '../../../../domain/money'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  report: OpexRatioReport
}

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

export function OpexRatioAreaChart({ report }: Props): JSX.Element {
  const gradientId = useId()
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

  // Max OPEX ratio để scale trục Y (ít nhất 25%)
  const maxRatio = Math.max(...report.points.map((p) => p.totalOpexRatioPct), 25)
  const annualAvg = report.annualPcts.totalOpexRatioPct

  const X_START = 60
  const X_END = 940
  const Y_TOP = 25
  const Y_BOTTOM = 210
  const Y_HEIGHT = Y_BOTTOM - Y_TOP

  const getX = (idx: number) => X_START + (idx / 11) * (X_END - X_START)
  const getY = (pct: number) => Y_BOTTOM - (pct / (maxRatio * 1.15)) * Y_HEIGHT

  // Tạo đường dẫn Bézier mượt mà cho chuỗi giá trị
  function buildSmoothPath(getPct: (idx: number) => number): string {
    let d = ''
    for (let i = 0; i < 12; i++) {
      const x = getX(i)
      const y = getY(getPct(i))
      if (i === 0) {
        d += `M ${x} ${y}`
      } else {
        const prevX = getX(i - 1)
        const prevY = getY(getPct(i - 1))
        const cpX1 = prevX + (x - prevX) / 2
        const cpX2 = cpX1
        d += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`
      }
    }
    return d
  }

  // Đường 1: Chi phí bán hàng (từ đáy lên)
  const sellLinePath = buildSmoothPath((i) => report.points[i]?.sellingRatioPct || 0)
  const sellAreaPath = `${sellLinePath} L ${getX(11)} ${Y_BOTTOM} L ${getX(0)} ${Y_BOTTOM} Z`

  // Đường 2: Tổng OPEX (bán hàng + QLDN)
  const totalLinePath = buildSmoothPath((i) => report.points[i]?.totalOpexRatioPct || 0)
  const totalAreaPath = `${totalLinePath} L ${getX(11)} ${Y_BOTTOM} L ${getX(0)} ${Y_BOTTOM} Z`

  function handlePointHover(e: MouseEvent, idx: number): void {
    const pt = report.points[idx]
    if (!pt) return

    const isHigh = pt.totalOpexRatioPct > annualAvg * 1.25

    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: `Tháng ${idx + 1} — Hiệu Quả OPEX`,
      subtitle: `Doanh thu: ${moneyToNumber(pt.revenue).toLocaleString('vi-VN')} đ`,
      items: [
        { label: 'Chi phí bán hàng (641)', value: `${moneyToNumber(pt.sellingExpense).toLocaleString('vi-VN')} đ (${pt.sellingRatioPct}%)`, color: '#f43f5e' },
        { label: 'Chi phí QLDN (642)', value: `${moneyToNumber(pt.adminExpense).toLocaleString('vi-VN')} đ (${pt.adminRatioPct}%)`, color: '#6366f1' },
        { label: 'Tổng OPEX / Doanh thu', value: `${moneyToNumber(pt.totalOpex).toLocaleString('vi-VN')} đ (${pt.totalOpexRatioPct}%)`, color: '#0f172a', isWarning: isHigh },
      ],
      visible: true,
    })
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Tỷ Lệ Chi Phí Hoạt Động Trên Doanh Thu (OPEX Efficiency 12 Tháng)
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Chi phí bán hàng (641) và Chi phí QLDN (642) chiếm bao nhiêu % trên mỗi 100 đồng doanh thu
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '14px', fontSize: '11px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f43f5e' }} />
            CP Bán hàng: <b>{report.annualPcts.sellingRatioPct}%</b>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#6366f1' }} />
            CP Quản lý: <b>{report.annualPcts.adminRatioPct}%</b>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0f172a', fontWeight: 700 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#0f172a' }} />
            Tổng OPEX: <b>{report.annualPcts.totalOpexRatioPct}%</b>
          </span>
        </div>
      </div>

      {/* Chart Body: Area Chart (Trái) + KPI Summary Cards (Phải) */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* Left: SVG Canvas */}
        <div style={{ flex: '1 1 600px', minWidth: '320px', position: 'relative', height: '245px' }}>
          <svg viewBox="0 0 1000 245" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`${gradientId}-total`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id={`${gradientId}-sell`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis Labels */}
          {[1.0, 0.75, 0.5, 0.25, 0].map((step, idx) => {
            const y = Y_BOTTOM - step * Y_HEIGHT
            const val = Math.round(maxRatio * 1.15 * step)
            return (
              <g key={idx}>
                <line x1={X_START} y1={y} x2={X_END} y2={y} stroke={step === 0 ? '#cbd5e1' : '#f1f5f9'} strokeWidth={step === 0 ? 1.5 : 1} strokeDasharray={step === 0 ? 'none' : '3 3'} />
                <text x={X_START - 10} y={y + 3.5} textAnchor="end" fill="#64748b" fontSize="9.5px" fontFamily="monospace" fontWeight="500">
                  {val}%
                </text>
              </g>
            )
          })}

          {/* Đường tham chiếu Benchmark: Mức trung bình năm */}
          {annualAvg > 0 && (
            <g>
              <line
                x1={X_START}
                y1={getY(annualAvg)}
                x2={X_END}
                y2={getY(annualAvg)}
                stroke="#64748b"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.75"
              />
              <text x={X_END + 8} y={getY(annualAvg) + 3} fill="#475569" fontSize="9px" fontWeight="600">
                TB: {annualAvg}%
              </text>
            </g>
          )}

          {/* X Axis Months */}
          {MONTHS.map((m, idx) => (
            <text key={idx} x={getX(idx)} y={Y_BOTTOM + 18} textAnchor="middle" fill="#64748b" fontSize="10.5px" fontWeight="600" fontFamily="monospace">
              {m}
            </text>
          ))}

          {/* Layer 2: Total OPEX Area & Crisp Stroke */}
          <path d={totalAreaPath} fill={`url(#${gradientId}-total)`} />
          <path d={totalLinePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Layer 1: Selling Expense Area & Crisp Stroke */}
          <path d={sellAreaPath} fill={`url(#${gradientId}-sell)`} />
          <path d={sellLinePath} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points cho cả CP Bán hàng và Tổng OPEX */}
          {report.points.map((pt, idx) => {
            const x = getX(idx)
            const yTotal = getY(pt.totalOpexRatioPct)
            const ySell = getY(pt.sellingRatioPct)
            const isHigh = pt.totalOpexRatioPct > annualAvg * 1.25

            return (
              <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={(e) => handlePointHover(e, idx)} onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
                {/* Điểm của CP Bán hàng */}
                <circle cx={x} cy={ySell} r="3" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />

                {/* Pulse alert cho tháng có OPEX đột biến cao hơn đáng kể so với TB */}
                {isHigh && (
                  <circle cx={x} cy={yTotal} r="7" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8">
                    <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Điểm của Tổng OPEX */}
                <circle cx={x} cy={yTotal} r={isHigh ? 4.5 : 3.5} fill={isHigh ? '#ef4444' : '#0f172a'} stroke="#ffffff" strokeWidth="1.5" />
              </g>
            )
          })}
        </svg>

          <ChartTooltip {...tooltip} />
        </div>

        {/* Right: Cột Thẻ Tóm Tắt KPI Hiệu Năng OPEX Cả Năm */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          {/* Card 1: CP Bán hàng 641 */}
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#e11d48', fontWeight: 600 }}>Chi phí Bán hàng (641)</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#be123c', fontFamily: 'monospace' }}>{report.annualPcts.sellingRatioPct}% DT</span>
            </div>
            <div style={{ fontSize: '11px', color: '#9f1239', marginTop: '2px', fontFamily: 'monospace' }}>
              Tổng năm: {moneyToNumber(report.annualTotals.sellingExpense).toLocaleString('vi-VN')} đ
            </div>
          </div>

          {/* Card 2: CP QLDN 642 */}
          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 600 }}>Chi phí Quản lý (642)</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#3730a3', fontFamily: 'monospace' }}>{report.annualPcts.adminRatioPct}% DT</span>
            </div>
            <div style={{ fontSize: '11px', color: '#312e81', marginTop: '2px', fontFamily: 'monospace' }}>
              Tổng năm: {moneyToNumber(report.annualTotals.adminExpense).toLocaleString('vi-VN')} đ
            </div>
          </div>

          {/* Card 3: Tổng OPEX */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#334155', fontWeight: 700 }}>Tổng Chi Phí Hoạt Động</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{report.annualPcts.totalOpexRatioPct}% DT</span>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', fontFamily: 'monospace' }}>
              Tổng năm: {moneyToNumber(report.annualTotals.totalOpex).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
