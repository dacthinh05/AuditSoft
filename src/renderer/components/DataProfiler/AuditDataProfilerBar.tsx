import React from 'react'
import type { ProfileSummary, AmountTierKey } from '../../../domain/profiling/dataProfiler'
import { TimelineRiskChart } from './TimelineRiskChart'

interface AuditDataProfilerBarProps {
  summary: ProfileSummary
  selectedMonth: number | null
  selectedTier: AmountTierKey | null
  onSelectMonth: (month: number | null) => void
  onSelectTier: (tier: AmountTierKey | null) => void
  onClearFilters: () => void
  isOpen: boolean
  onToggleOpen: () => void
}

function fmtShortVnd(amount: bigint): string {
  const n = Number(amount)
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(0)} tr`
  }
  return n.toLocaleString('vi-VN')
}

export function AuditDataProfilerBar({
  summary,
  selectedMonth,
  selectedTier,
  onSelectMonth,
  onSelectTier,
  onClearFilters,
  isOpen,
  onToggleOpen,
}: AuditDataProfilerBarProps): JSX.Element {
  const hasActiveFilter = selectedMonth !== null || selectedTier !== null

  return (
    <div className="audit-data-profiler-wrapper">
      {/* ── Collapsible Header Toggle Bar ── */}
      <div className="profiler-header-toggle" onClick={onToggleOpen}>
        <div className="profiler-title-left">
          <span className="profiler-badge-icon">DP</span>
          <span className="profiler-main-title">Trực Quan Hóa Dữ Liệu & Phân Tích Rủi Ro (Data Profiler)</span>
          <span className="profiler-stats-chip">
            {summary.quality.totalRows.toLocaleString('vi-VN')} dòng · Tổng phát sinh: {fmtShortVnd(summary.totalProfiledAmount)} đ
          </span>
        </div>

        <div className="profiler-header-right" onClick={(e) => e.stopPropagation()}>
          {hasActiveFilter && (
            <div className="active-filter-indicator">
              <span className="filter-tag">
                Đang lọc: {selectedMonth === 13 ? 'Khóa sổ 31/12' : selectedMonth !== null ? `Tháng ${selectedMonth}` : ''}
                {selectedMonth !== null && selectedTier !== null ? ' · ' : ''}
                {selectedTier ? summary.tiers.find((t) => t.key === selectedTier)?.label : ''}
              </span>
              <button
                type="button"
                className="btn-clear-profiler-filter"
                onClick={onClearFilters}
                title="Bỏ lọc trực quan"
              >
                ✕ Xóa lọc
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn-toggle-profiler-view"
            onClick={onToggleOpen}
            title={isOpen ? 'Thu gọn' : 'Mở rộng bảng phân tích trực quan'}
          >
            {isOpen ? 'Thu gọn ▲' : 'Mở phân tích ▼'}
          </button>
        </div>
      </div>

      {/* ── Expanded Profiler Content ── */}
      {isOpen && (
        <div className="profiler-body-grid">
          {/* Cột 1: Phân tầng số tiền (Amount Tiers) & Chất lượng */}
          <div className="profiler-tiers-panel">
            <div className="panel-sub-header">
              <span className="panel-sub-title">Phân Tầng Rủi Ro Theo Giá Trị</span>
              <span className="panel-sub-desc">Nhấp để lọc nhanh</span>
            </div>

            <div className="tier-pills-list">
              {summary.tiers.map((t) => {
                const isSelected = selectedTier === t.key
                return (
                  <div
                    key={t.key}
                    className={`tier-pill-card ${isSelected ? 'selected' : ''} tier-${t.key.toLowerCase()}`}
                    onClick={() => onSelectTier(isSelected ? null : t.key)}
                  >
                    <div className="tier-card-top">
                      <span className="tier-label">{t.label}</span>
                      <span className="tier-sub-tag">{t.subLabel}</span>
                    </div>

                    <div className="tier-card-bottom">
                      <span className="tier-count">
                        <strong>{t.count.toLocaleString('vi-VN')}</strong> dòng ({t.percentOfTotal}%)
                      </span>
                      <span className="tier-amount">{fmtShortVnd(t.totalAmount)} đ</span>
                    </div>

                    <div className="tier-progress-bg">
                      <div
                        className="tier-progress-bar"
                        style={{ width: `${Math.min(100, Math.max(t.count > 0 ? 5 : 0, t.percentOfTotal))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Thống kê bổ sung: Tiền tròn */}
            {summary.quality.roundAmountCount > 0 && (
              <div className="round-amount-notice">
                <span>Số tiền tròn chẵn (&gt;=10tr): <strong>{summary.quality.roundAmountCount}</strong> bút toán</span>
              </div>
            )}
          </div>

          {/* Cột 2: Timeline 12 tháng & Cutoff 31/12 */}
          <div className="profiler-timeline-panel">
            <TimelineRiskChart
              monthly={summary.monthly}
              cutoff={summary.cutoff}
              selectedMonth={selectedMonth}
              onSelectMonth={onSelectMonth}
            />
          </div>
        </div>
      )}
    </div>
  )
}
