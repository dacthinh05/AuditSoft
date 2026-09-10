import React from 'react'
import type { MonthlyBucket, CutoffStats } from '../../../domain/profiling/dataProfiler'

interface TimelineRiskChartProps {
  monthly: MonthlyBucket[]
  cutoff: CutoffStats
  selectedMonth: number | null // 1..12 hoặc 13 (31/12)
  onSelectMonth: (month: number | null) => void
}

function fmtShortMoney(amount: bigint): string {
  const n = Number(amount)
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(0)} tr`
  }
  return n.toLocaleString('vi-VN')
}

export function TimelineRiskChart({
  monthly,
  cutoff,
  selectedMonth,
  onSelectMonth,
}: TimelineRiskChartProps): JSX.Element {
  // Tìm giá trị lớn nhất để tính chiều cao tương đối
  let maxAmount = 1n
  for (const m of monthly) {
    if (m.totalAmount > maxAmount) maxAmount = m.totalAmount
  }
  if (cutoff.totalAmount31Dec > maxAmount) {
    maxAmount = cutoff.totalAmount31Dec
  }

  const chartHeight = 56 // pixels

  return (
    <div className="timeline-risk-chart-card">
      <div className="timeline-chart-header">
        <div className="timeline-title-group">
          <span className="timeline-title">Phân Bổ Dòng Tiền 12 Tháng & Rủi Ro Khóa Sổ</span>
          <span className="timeline-hint">Nhấp vào tháng để lọc</span>
        </div>
        {cutoff.count31Dec > 0 && (
          <div
            className={`cutoff-alert-pill ${selectedMonth === 13 ? 'active' : ''}`}
            onClick={() => onSelectMonth(selectedMonth === 13 ? null : 13)}
            title="Bấm để lọc các giao dịch ngày 31/12"
          >
            <span className="cutoff-dot"></span>
            <span>Cutoff 31/12: <strong>{cutoff.count31Dec}</strong> bút toán ({fmtShortMoney(cutoff.totalAmount31Dec)})</span>
          </div>
        )}
      </div>

      <div className="timeline-bars-container">
        {monthly.map((m) => {
          const isSelected = selectedMonth === m.month
          const ratio = maxAmount > 0n ? Number(m.totalAmount) / Number(maxAmount) : 0
          const barHeightPx = Math.max(m.count > 0 ? 4 : 1, Math.round(ratio * chartHeight))
          const hasDiff = m.diffCount > 0

          return (
            <div
              key={m.month}
              className={`timeline-bar-col ${isSelected ? 'selected' : ''} ${m.count === 0 ? 'empty' : ''}`}
              onClick={() => onSelectMonth(isSelected ? null : m.month)}
              title={`${m.label}: ${m.count.toLocaleString('vi-VN')} dòng · Tổng: ${fmtShortMoney(m.totalAmount)} đ${hasDiff ? ` · Chênh lệch: ${m.diffCount} dòng` : ''}`}
            >
              <div className="bar-track" style={{ height: chartHeight }}>
                <div
                  className={`bar-fill ${hasDiff ? 'has-diff' : ''}`}
                  style={{ height: `${barHeightPx}px` }}
                />
              </div>
              <span className="bar-label">{m.label}</span>
            </div>
          )
        })}

        {/* Cột thứ 13 đặc biệt: 31/12 */}
        {cutoff.count31Dec > 0 && (
          <div
            className={`timeline-bar-col cutoff-col ${selectedMonth === 13 ? 'selected' : ''}`}
            onClick={() => onSelectMonth(selectedMonth === 13 ? null : 13)}
            title={`Khóa sổ 31/12: ${cutoff.count31Dec.toLocaleString('vi-VN')} dòng · Tổng: ${fmtShortMoney(cutoff.totalAmount31Dec)} đ`}
          >
            <div className="bar-track" style={{ height: chartHeight }}>
              <div
                className="bar-fill cutoff-fill"
                style={{
                  height: `${Math.max(4, Math.round((Number(cutoff.totalAmount31Dec) / Number(maxAmount)) * chartHeight))}px`,
                }}
              />
            </div>
            <span className="bar-label cutoff-text">31/12</span>
          </div>
        )}
      </div>
    </div>
  )
}
