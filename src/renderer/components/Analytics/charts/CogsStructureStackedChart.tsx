import { useState, type MouseEvent } from 'react'
import type { CogsStructureReport } from '../../../../domain/analytics/types'
import { moneyToNumber } from '../../../../domain/money'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  report: CogsStructureReport
}

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

export function CogsStructureStackedChart({ report }: Props): JSX.Element {
  // Chế độ xem: 'amount' (Số tiền VNĐ thực) hoặc 'percent' (Tỷ trọng 100%)
  const [viewMode, setViewMode] = useState<'amount' | 'percent'>('amount')

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

  const X_START = 65
  const X_END = 935
  const Y_TOP = 25
  const Y_BOTTOM = 220
  const BAR_HEIGHT = Y_BOTTOM - Y_TOP
  const BAR_WIDTH = 28

  const getX = (idx: number) => X_START + (idx / 11) * (X_END - X_START)

  // Tìm tháng có chi phí cao nhất để scale khi ở mode 'amount' và đánh dấu đỉnh chi phí
  const monthlyTotals = report.months.map((m) => moneyToNumber(m.totalCosts))
  const maxTotal = Math.max(...monthlyTotals, 1000000000)
  const peakMonthIdx = monthlyTotals.indexOf(Math.max(...monthlyTotals))

  function fmtAmountLabel(val: number): string {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1).replace('.0', '')} tỷ`
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)} tr`
    return '0 đ'
  }

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
        { label: 'NVL trực tiếp (621)', value: `${moneyToNumber(m.directMaterials).toLocaleString('vi-VN')} đ (${m.materialPct}%)`, color: '#059669' },
        { label: 'Nhân công (622)', value: `${moneyToNumber(m.directLabor).toLocaleString('vi-VN')} đ (${m.laborPct}%)`, color: '#2563eb' },
        { label: 'Sản xuất chung (627)', value: `${moneyToNumber(m.overhead).toLocaleString('vi-VN')} đ (${m.overheadPct}%)`, color: '#d97706' },
        { label: 'Dở dang / Mua ngoài (154/156)', value: `${moneyToNumber(m.wipOrTrade).toLocaleString('vi-VN')} đ (${m.wipOrTradePct}%)`, color: '#7c3aed' },
      ],
      visible: true,
    })
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      {/* Header & Mode Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
            Bóc Tách Cấu Trúc Chi Phí Giá Vốn &amp; Sản Xuất
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {viewMode === 'amount'
              ? 'Quy mô chi phí thực tế (VNĐ) & phân bổ 621/622/627/154/156 theo tháng'
              : 'Tỷ trọng % đóng góp của từng thành phần cấu thành giá vốn'}
          </div>
        </div>

        {/* View Mode Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setViewMode('amount')}
              style={{
                background: viewMode === 'amount' ? '#ffffff' : 'transparent',
                color: viewMode === 'amount' ? '#0f172a' : '#64748b',
                fontWeight: viewMode === 'amount' ? 700 : 500,
                boxShadow: viewMode === 'amount' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 9px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Giá trị thực (VNĐ)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('percent')}
              style={{
                background: viewMode === 'percent' ? '#ffffff' : 'transparent',
                color: viewMode === 'percent' ? '#0f172a' : '#64748b',
                fontWeight: viewMode === 'percent' ? 700 : 500,
                boxShadow: viewMode === 'percent' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 9px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Tỷ trọng (%)
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Summary */}
      <div style={{ display: 'flex', gap: '14px', fontSize: '11px', flexWrap: 'wrap', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f8fafc' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#059669' }} />
          NVL 621: <b>{report.annualPcts.materialPct}%</b>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#2563eb' }} />
          Nhân công 622: <b>{report.annualPcts.laborPct}%</b>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#d97706' }} />
          SXC 627: <b>{report.annualPcts.overheadPct}%</b>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#7c3aed' }} />
          Dở dang / Mua ngoài: <b>{report.annualPcts.wipOrTradePct}%</b>
        </span>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '260px' }}>
        <svg viewBox="0 0 1000 260" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          {/* Y Axis Guide Lines */}
          {[1.0, 0.75, 0.5, 0.25, 0].map((step, idx) => {
            const y = Y_BOTTOM - step * BAR_HEIGHT
            const label = viewMode === 'percent' ? `${Math.round(step * 100)}%` : fmtAmountLabel(maxTotal * 1.15 * step)
            return (
              <g key={idx}>
                <line x1={X_START} y1={y} x2={X_END} y2={y} stroke={step === 0 ? '#cbd5e1' : '#f1f5f9'} strokeWidth={step === 0 ? 1.5 : 1} strokeDasharray={step === 0 ? 'none' : '3 3'} />
                <text x={X_START - 10} y={y + 3.5} textAnchor="end" fill="#94a3b8" fontSize="9.5px" fontFamily="monospace">
                  {label}
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

          {/* Stacked Bars */}
          {report.months.map((m, idx) => {
            const centerX = getX(idx)
            const x = centerX - BAR_WIDTH / 2
            const totalNum = moneyToNumber(m.totalCosts)
            const isPeak = viewMode === 'amount' && idx === peakMonthIdx && totalNum > 0

            if (totalNum === 0) {
              return (
                <g key={idx} onMouseEnter={(e) => handleBarHover(e, idx)} onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
                  <rect x={x} y={Y_TOP} width={BAR_WIDTH} height={BAR_HEIGHT} fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 3" rx="3" />
                  <text x={centerX} y={Y_TOP + BAR_HEIGHT / 2} textAnchor="middle" fill="#cbd5e1" fontSize="11px">-</text>
                </g>
              )
            }

            // Tính tổng chiều cao của cột tuỳ theo mode
            const totalBarH = viewMode === 'percent' ? BAR_HEIGHT : (totalNum / (maxTotal * 1.15)) * BAR_HEIGHT

            // Chiều cao từng phân khúc
            const matVal = moneyToNumber(m.directMaterials)
            const labVal = moneyToNumber(m.directLabor)
            const ovhVal = moneyToNumber(m.overhead)
            const _wipVal = moneyToNumber(m.wipOrTrade)

            const hMat = (matVal / totalNum) * totalBarH
            const hLab = (labVal / totalNum) * totalBarH
            const hOvh = (ovhVal / totalNum) * totalBarH
            const hWip = Math.max(0, totalBarH - (hMat + hLab + hOvh))

            let currentY = Y_BOTTOM

            return (
              <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={(e) => handleBarHover(e, idx)} onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
                {/* 1. Segment NVL 621 (ở đáy) */}
                {hMat > 0 && (
                  <rect x={x} y={(currentY -= hMat)} width={BAR_WIDTH} height={hMat} fill="#059669" />
                )}

                {/* 2. Segment Nhân công 622 */}
                {hLab > 0 && (
                  <rect x={x} y={(currentY -= hLab)} width={BAR_WIDTH} height={hLab} fill="#2563eb" />
                )}

                {/* 3. Segment SXC 627 */}
                {hOvh > 0 && (
                  <rect x={x} y={(currentY -= hOvh)} width={BAR_WIDTH} height={hOvh} fill="#d97706" />
                )}

                {/* 4. Segment Dở dang/Mua ngoài 154/156 (ở đỉnh) */}
                {hWip > 0 && (
                  <rect x={x} y={(currentY -= hWip)} width={BAR_WIDTH} height={hWip} fill="#7c3aed" rx="2" />
                )}

                {/* Badge/Highlight cho tháng đỉnh chi phí trong chế độ xem giá trị thực */}
                {isPeak && (
                  <g>
                    <rect x={x - 2} y={currentY - 18} width={BAR_WIDTH + 4} height={14} rx="3" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
                    <text x={centerX} y={currentY - 8} textAnchor="middle" fill="#b45309" fontSize="8.5px" fontWeight="700" fontFamily="monospace">
                      Đỉnh
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        <ChartTooltip {...tooltip} />
      </div>

      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '4px 8px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.25, fontSize: '11px' }}>
          <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>[Cơ cấu CPSX]</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Bóc tách chi phí phát sinh thực tế đầu vào (đã loại trừ kết chuyển nội bộ 154/62x).</span>
        </div>
      </div>
    </div>
  )
}
