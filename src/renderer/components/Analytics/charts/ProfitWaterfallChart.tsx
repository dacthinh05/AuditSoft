import { useState, type MouseEvent } from 'react'
import type { WaterfallStep } from '../../../../domain/analytics/types'
import { moneyToNumber } from '../../../../domain/money'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  steps: WaterfallStep[]
}

export function ProfitWaterfallChart({ steps }: Props): JSX.Element {
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

  // Tìm giá trị max cumulative và min cumulative để scale trục Y
  const allVals = steps.map((s) => moneyToNumber(s.cumulative))
  const maxVal = Math.max(...allVals, 1000000000)
  const minVal = Math.min(...allVals, 0)
  const span = Math.max(maxVal - minVal, 1000000000)

  const X_START = 60
  const X_END = 940
  const Y_TOP = 25
  const Y_BOTTOM = 220
  const Y_HEIGHT = Y_BOTTOM - Y_TOP
  const BAR_WIDTH = 54

  const numSteps = steps.length
  const getX = (idx: number) => X_START + (idx / (numSteps - 1)) * (X_END - X_START)
  const getY = (val: number) => Y_BOTTOM - ((val - minVal) / (span * 1.15)) * Y_HEIGHT

  function fmtVndLabel(v: number): string {
    const absV = Math.abs(v)
    const sign = v < 0 ? '-' : ''
    if (absV >= 1000000000) return `${sign}${(absV / 1000000000).toFixed(2).replace('.00', '')} tỷ`
    if (absV >= 1000000) return `${sign}${(absV / 1000000).toFixed(0)} tr`
    return `${v.toLocaleString('vi-VN')} đ`
  }

  function handleBarHover(e: MouseEvent, idx: number): void {
    const step = steps[idx]
    if (!step) return

    const amtNum = moneyToNumber(step.amount)
    const cumNum = moneyToNumber(step.cumulative)

    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: step.label,
      subtitle: `Bước ${idx + 1}/${steps.length}`,
      items: [
        { label: 'Số phát sinh', value: `${amtNum > 0 ? '+' : ''}${amtNum.toLocaleString('vi-VN')} đ`, color: amtNum < 0 ? '#ef4444' : '#10b981' },
        { label: 'Lũy kế sau bước này', value: `${cumNum.toLocaleString('vi-VN')} đ`, color: '#0f172a' },
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
            Cầu Nối Dòng Chảy Lợi Nhuận (Profit Bridge Waterfall)
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Minh họa trực quan các lớp chi phí và doanh thu khấu trừ từ Doanh thu thuần về Lợi nhuận trước thuế
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '14px', fontSize: '11px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#0284c7' }} />
            Doanh thu khởi điểm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#ef4444' }} />
            Khoản giảm trừ
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#10b981' }} />
            Khoản bổ sung
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#059669' }} />
            LNTT kết quả
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '280px' }}>
        <svg viewBox="0 0 1000 280" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          {/* Y0 baseline */}
          <line x1={X_START - 20} y1={getY(0)} x2={X_END + 20} y2={getY(0)} stroke="#cbd5e1" strokeWidth="1.2" />

          {/* Render Waterfall Bars & Connecting Guides */}
          {steps.map((step, idx) => {
            const x = getX(idx) - BAR_WIDTH / 2
            const currentCum = moneyToNumber(step.cumulative)
            const prevCum = idx > 0 ? moneyToNumber(steps[idx - 1]!.cumulative) : 0

            let barTopY: number
            let barBottomY: number
            let fillColor: string

            if (step.type === 'start') {
              barTopY = getY(currentCum)
              barBottomY = getY(0)
              fillColor = '#0284c7'
            } else if (step.type === 'total') {
              barTopY = getY(currentCum)
              barBottomY = getY(0)
              fillColor = currentCum >= 0 ? '#059669' : '#b91c1c'
            } else if (step.type === 'subtotal') {
              barTopY = getY(currentCum)
              barBottomY = getY(0)
              fillColor = '#334155'
            } else if (step.type === 'decrease') {
              // Giá trị giảm: từ đỉnh prevCum tụt xuống currentCum
              barTopY = getY(prevCum)
              barBottomY = getY(currentCum)
              fillColor = '#ef4444'
            } else {
              // Giá trị tăng: từ đáy prevCum vọt lên currentCum
              barTopY = getY(currentCum)
              barBottomY = getY(prevCum)
              fillColor = '#10b981'
            }

            const barH = Math.max(2, Math.abs(barBottomY - barTopY))
            const rectY = Math.min(barTopY, barBottomY)

            // Dotted guide line to next step
            const _nextStep = steps[idx + 1]
            const guideLineY = getY(currentCum)
            const guideNextX = idx < numSteps - 1 ? getX(idx + 1) + BAR_WIDTH / 2 : null

            return (
              <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={(e) => handleBarHover(e, idx)} onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
                {/* Connecting Guide Line */}
                {guideNextX && (
                  <line
                    x1={x + BAR_WIDTH}
                    y1={guideLineY}
                    x2={guideNextX - BAR_WIDTH}
                    y2={guideLineY}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                )}

                {/* Waterfall Bar */}
                <rect x={x} y={rectY} width={BAR_WIDTH} height={barH} fill={fillColor} rx="3" opacity="0.9" />

                {/* Amount text badge above/below bar */}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={rectY - 6}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="9px"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {fmtVndLabel(moneyToNumber(step.amount))}
                </text>

                {/* Step Label (X-axis) */}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={Y_BOTTOM + 18}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="9.5px"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {step.label.split('(')[0]}
                </text>
              </g>
            )
          })}
        </svg>

        <ChartTooltip {...tooltip} />
      </div>
    </div>
  )
}
