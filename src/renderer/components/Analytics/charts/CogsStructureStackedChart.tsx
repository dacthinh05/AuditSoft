import { useState, type MouseEvent } from 'react'
import type { CogsStructureReport } from '../../../../domain/analytics/types'
import { moneyToNumber } from '../../../../domain/money'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  report: CogsStructureReport
}

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

export function CogsStructureStackedChart({ report }: Props): JSX.Element {
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

  const X_START = 60
  const X_END = 940
  const Y_TOP = 25
  const Y_BOTTOM = 210
  const BAR_HEIGHT = Y_BOTTOM - Y_TOP
  const BAR_WIDTH = 34

  const getX = (idx: number) => X_START + (idx / 11) * (X_END - X_START)

  function handleBarHover(e: MouseEvent, idx: number): void {
    const m = report.months[idx]
    if (!m) return

    const totalNum = moneyToNumber(m.totalCosts)

    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: `Tháng ${idx + 1} — Cơ Cấu Giá Thành`,
      subtitle: totalNum > 0 ? `Tổng chi phí: ${totalNum.toLocaleString('vi-VN')} đ` : 'Không phát sinh',
      items: [
        { label: 'NVL trực tiếp (621)', value: `${moneyToNumber(m.directMaterials).toLocaleString('vi-VN')} đ (${m.materialPct}%)`, color: '#10b981' },
        { label: 'Nhân công (622)', value: `${moneyToNumber(m.directLabor).toLocaleString('vi-VN')} đ (${m.laborPct}%)`, color: '#3b82f6' },
        { label: 'Sản xuất chung (627)', value: `${moneyToNumber(m.overhead).toLocaleString('vi-VN')} đ (${m.overheadPct}%)`, color: '#f59e0b' },
        { label: 'Dở dang / Mua ngoài (154/156)', value: `${moneyToNumber(m.wipOrTrade).toLocaleString('vi-VN')} đ (${m.wipOrTradePct}%)`, color: '#8b5cf6' },
      ],
      visible: true,
    })
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      {/* Header & Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Bóc Tách Cấu Trúc Chi Phí Giá Vốn &amp; Sản Xuất (100% Stacked Bar)
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Tỷ trọng % đóng góp của NVL (621), Nhân công (622), SXC (627) và Dở dang/Mua ngoài (154/156) theo từng tháng
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#10b981' }} />
            NVL 621: <b>{report.annualPcts.materialPct}%</b>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#3b82f6' }} />
            Nhân công 622: <b>{report.annualPcts.laborPct}%</b>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#f59e0b' }} />
            SXC 627: <b>{report.annualPcts.overheadPct}%</b>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#8b5cf6' }} />
            Dở dang / Mua ngoài: <b>{report.annualPcts.wipOrTradePct}%</b>
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '245px' }}>
        <svg viewBox="0 0 1000 245" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          {/* Y Axis Guide Lines (100%, 75%, 50%, 25%, 0%) */}
          {[1.0, 0.75, 0.5, 0.25, 0].map((step, idx) => {
            const y = Y_BOTTOM - step * BAR_HEIGHT
            const pct = Math.round(step * 100)
            return (
              <g key={idx}>
                <line x1={X_START} y1={y} x2={X_END} y2={y} stroke={step === 0 ? '#cbd5e1' : '#f1f5f9'} strokeWidth={step === 0 ? 1.5 : 1} strokeDasharray={step === 0 ? 'none' : '3 3'} />
                <text x={X_START - 10} y={y + 3.5} textAnchor="end" fill="#94a3b8" fontSize="9.5px" fontFamily="monospace">
                  {pct}%
                </text>
              </g>
            )
          })}

          {/* X Axis Month Labels */}
          {MONTHS.map((m, idx) => (
            <text key={idx} x={getX(idx)} y={Y_BOTTOM + 18} textAnchor="middle" fill="#64748b" fontSize="10.5px" fontWeight="600" fontFamily="monospace">
              {m}
            </text>
          ))}

          {/* 100% Stacked Bars */}
          {report.months.map((m, idx) => {
            const x = getX(idx) - BAR_WIDTH / 2
            const totalNum = moneyToNumber(m.totalCosts)

            if (totalNum === 0) {
              return (
                <g key={idx} onMouseEnter={(e) => handleBarHover(e, idx)} onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
                  <rect x={x} y={Y_TOP} width={BAR_WIDTH} height={BAR_HEIGHT} fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 3" rx="3" />
                  <text x={getX(idx)} y={Y_TOP + BAR_HEIGHT / 2} textAnchor="middle" fill="#cbd5e1" fontSize="11px">-</text>
                </g>
              )
            }

            // Tính chiều cao từng segment (pixel)
            const hMat = (m.materialPct / 100) * BAR_HEIGHT
            const hLab = (m.laborPct / 100) * BAR_HEIGHT
            const hOvh = (m.overheadPct / 100) * BAR_HEIGHT
            const hWip = Math.max(0, BAR_HEIGHT - (hMat + hLab + hOvh))

            let currentY = Y_BOTTOM

            return (
              <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={(e) => handleBarHover(e, idx)} onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
                {/* 1. Segment NVL 621 (ở đáy) */}
                {hMat > 0 && (
                  <rect x={x} y={(currentY -= hMat)} width={BAR_WIDTH} height={hMat} fill="#10b981" />
                )}

                {/* 2. Segment Nhân công 622 */}
                {hLab > 0 && (
                  <rect x={x} y={(currentY -= hLab)} width={BAR_WIDTH} height={hLab} fill="#3b82f6" />
                )}

                {/* 3. Segment SXC 627 */}
                {hOvh > 0 && (
                  <rect x={x} y={(currentY -= hOvh)} width={BAR_WIDTH} height={hOvh} fill="#f59e0b" />
                )}

                {/* 4. Segment Dở dang/Mua ngoài 154/156 (ở đỉnh) */}
                {hWip > 0 && (
                  <rect x={x} y={(currentY -= hWip)} width={BAR_WIDTH} height={hWip} fill="#8b5cf6" rx="2" />
                )}
              </g>
            )
          })}
        </svg>

        <ChartTooltip {...tooltip} />
      </div>
    </div>
  )
}
