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
  // Tìm giá trị lớn nhất trong 12 tháng để tính chiều cao tương đối
  let maxAmount = 1n
  for (const m of monthly) {
    if (m.totalAmount > maxAmount) maxAmount = m.totalAmount
  }
  const chartHeight = 78 // pixels cao hơn để thoáng và có chỗ hiện số tiền
  return (
    <div className="timeline-risk-chart-card">
      <div className="timeline-chart-header">
        <div className="timeline-title-group">
          <span className="timeline-title">Phân Bổ Dòng Tiền 12 Tháng & Rủi Ro Khóa Sổ</span>
          <span className="timeline-hint">Nhấp vào cột để lọc chi tiết</span>
        </div>
        {cutoff.count31Dec > 0 && (
          <div
            className={`cutoff-alert-pill ${selectedMonth === 13 ? 'active' : ''}`}
            onClick={() => onSelectMonth(selectedMonth === 13 ? null : 13)}
            title="Bấm để lọc các giao dịch rủi ro khóa sổ ngày 31/12"
          >
            <span className="cutoff-dot"></span>
            <span>Cutoff 31/12: <strong>{cutoff.count31Dec}</strong> bút toán ({fmtShortMoney(cutoff.totalAmount31Dec)})</span>
          </div>
        )}
      </div>

      <div className="timeline-bars-container">
        {monthly.map((m) => {
          const isSelected = selectedMonth === m.month
          const isMonth12 = m.month === 12
          const isCutoffSelected = selectedMonth === 13
          const isT12Active = isSelected || (isMonth12 && isCutoffSelected)
          const ratio = maxAmount > 0n ? Number(m.totalAmount) / Number(maxAmount) : 0
          const barHeightPx = Math.max(m.count > 0 ? 6 : 2, Math.round(ratio * (chartHeight - 18)))
          const hasDiff = m.diffCount > 0
          const hasCutoffAlert = isMonth12 && cutoff.count31Dec > 0
          // Hiển thị nhãn số tiền nếu cột đáng kể hoặc đang được chọn
          const showTopValue = m.totalAmount >= 500_000_000n || isT12Active

          return (
            <div
              key={m.month}
              className={`timeline-bar-col ${isT12Active ? 'selected' : ''} ${m.count === 0 ? 'empty' : ''} ${hasCutoffAlert ? 'has-cutoff-risk' : ''}`}
              onClick={() => onSelectMonth(isSelected ? null : m.month)}
              title={`${m.label}: ${m.count.toLocaleString('vi-VN')} dòng · Tổng: ${fmtShortMoney(m.totalAmount)} đ${hasDiff ? ` · Chênh lệch: ${m.diffCount} dòng` : ''}${hasCutoffAlert ? ` · (Bao gồm Cutoff 31/12: ${cutoff.count31Dec} dòng / ${fmtShortMoney(cutoff.totalAmount31Dec)})` : ''}`}
            >
              <div className="bar-track" style={{ height: chartHeight }}>
                {showTopValue && m.count > 0 && (
                  <span className={`bar-floating-val ${isCutoffSelected ? 'cutoff-val' : ''}`}>
                    {fmtShortMoney(m.totalAmount)}
                  </span>
                )}
                <div
                  className={`bar-fill ${hasDiff ? 'has-diff' : ''} ${isCutoffSelected ? 'cutoff-fill' : ''}`}
                  style={{ height: `${barHeightPx}px` }}
                />
              </div>
              <span className="bar-label">
                {m.label}
                {hasCutoffAlert && <span className="cutoff-badge-sub" title="Chứa bút toán ngày khóa sổ 31/12">·31</span>}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
