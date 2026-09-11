import { useState } from 'react'
import type { WaterfallStep } from '../../../../domain/analytics/types'
import { moneyToNumber } from '../../../../domain/money'

interface Props {
  steps: WaterfallStep[]
}

export function ProfitWaterfallChart({ steps }: Props): JSX.Element {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (steps.length === 0) return <div />

  const startStep = steps.find((s) => s.type === 'start')
  const baseRevenue = startStep ? Math.abs(moneyToNumber(startStep.amount)) : 1

  function getStepBadge(type: WaterfallStep['type']): { label: string; bg: string; color: string } {
    switch (type) {
      case 'start':
        return { label: 'KHỞI ĐIỂM', bg: '#eff6ff', color: '#1d4ed8' }
      case 'decrease':
        return { label: 'GIẢM TRỪ (-)', bg: '#fef2f2', color: '#b91c1c' }
      case 'increase':
        return { label: 'BỔ SUNG (+)', bg: '#f0fdf4', color: '#15803d' }
      case 'subtotal':
        return { label: 'TRUNG GIAN (=)', bg: '#f8fafc', color: '#0f172a' }
      case 'total':
        return { label: 'KẾT QUẢ CHỐT (=)', bg: '#fef3c7', color: '#b45309' }
    }
  }

  function fmtMoney(num: number): string {
    const abs = Math.abs(num)
    const sign = num < 0 ? '-' : ''
    return `${sign}${Math.round(abs).toLocaleString('vi-VN')} đ`
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Cầu Nối Dòng Chảy Lợi Nhuận (Profit Bridge Waterfall)
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Bóc tách từng lớp doanh thu và chi phí khấu trừ từ Doanh thu thuần về Lợi nhuận trước thuế
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '3px 8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
          Tỷ trọng tính trên Doanh thu thuần ({fmtMoney(baseRevenue)})
        </div>
      </div>

      {/* Visual Table Bridge */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              <th style={{ padding: '9px 12px', width: '40px', textAlign: 'center' }}>#</th>
              <th style={{ padding: '9px 14px', width: '220px' }}>Khoản Mục Dòng Chảy</th>
              <th style={{ padding: '9px 12px', textAlign: 'center', width: '120px' }}>Phân Loại</th>
              <th style={{ padding: '9px 14px', textAlign: 'right', width: '160px' }}>Số Phát Sinh</th>
              <th style={{ padding: '9px 16px', minWidth: '240px' }}>Thanh Tác Động Trực Quan</th>
              <th style={{ padding: '9px 14px', textAlign: 'right', width: '160px' }}>Lũy Kế Sau Bước</th>
              <th style={{ padding: '9px 12px', textAlign: 'right', width: '95px' }}>% Doanh Thu</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, idx) => {
              const badge = getStepBadge(step.type)
              const amtNum = moneyToNumber(step.amount)
              const cumNum = moneyToNumber(step.cumulative)
              const isHovered = hoverIdx === idx

              // Tính độ dài thanh trực quan (% trên base revenue, max 100%)
              const impactPct = baseRevenue > 0 ? Math.min(100, Math.abs(amtNum) / baseRevenue * 100) : 0
              const isSubtotalOrTotal = step.type === 'subtotal' || step.type === 'total' || step.type === 'start'
              const cumRatio = baseRevenue > 0 ? (cumNum / baseRevenue) * 100 : 0

              let rowBg = '#ffffff'
              if (isHovered) rowBg = '#f1f5f9'
              else if (step.type === 'total') rowBg = '#fffbeb'
              else if (step.type === 'subtotal') rowBg = '#f8fafc'

              return (
                <tr
                  key={idx}
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                  style={{
                    background: rowBg,
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 120ms ease',
                    fontWeight: isSubtotalOrTotal ? 700 : 500,
                  }}
                >
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '8px 12px', color: isSubtotalOrTotal ? '#0f172a' : '#334155' }}>
                    {step.label}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: `1px solid ${badge.color}30`,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: amtNum < 0 ? '#dc2626' : amtNum > 0 ? '#16a34a' : '#475569',
                    }}
                  >
                    {amtNum > 0 && step.type !== 'start' && step.type !== 'total' && step.type !== 'subtotal' ? '+' : ''}
                    {fmtMoney(amtNum)}
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(2, impactPct)}%`,
                          background:
                            step.type === 'decrease'
                              ? '#ef4444'
                              : step.type === 'increase'
                              ? '#10b981'
                              : step.type === 'total'
                              ? cumNum >= 0 ? '#059669' : '#dc2626'
                              : '#0284c7',
                          borderRadius: '5px',
                          transition: 'width 200ms ease',
                        }}
                      />
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: cumNum < 0 ? '#dc2626' : '#0f172a',
                    }}
                  >
                    {fmtMoney(cumNum)}
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: cumRatio < 0 ? '#dc2626' : '#475569',
                    }}
                  >
                    {cumRatio.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
