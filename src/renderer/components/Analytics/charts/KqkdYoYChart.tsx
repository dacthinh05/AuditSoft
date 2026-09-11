import { useState } from 'react'
import type { KqkdYoYRow } from '../../../../domain/analytics/types'

interface Props {
  rows: KqkdYoYRow[]
  noBorder?: boolean
}

const CHART_MASO = ['10', '11', '60', '25', '26', '70']
const SHORT_LABEL: Record<string, string> = {
  '10': 'Doanh thu thuần',
  '11': 'Giá vốn hàng bán',
  '60': 'Lợi nhuận gộp',
  '25': 'Chi phí bán hàng',
  '26': 'Chi phí QLDN',
  '70': 'Lợi nhuận HĐKD',
}

function fmtMoneyVnd(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)} tỷ`
  if (abs >= 1_000_000) return `${sign}${Math.round(abs / 1_000_000).toLocaleString('vi-VN')} tr`
  return `${sign}${abs.toLocaleString('vi-VN')} đ`
}

function fmtCompact(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)} tỷ`
  if (abs >= 1_000_000) return `${sign}${Math.round(abs / 1_000_000).toLocaleString('vi-VN')} tr`
  return `${sign}${abs.toLocaleString('vi-VN')}`
}

export function KqkdYoYChart({ rows, noBorder }: Props): JSX.Element {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const items = CHART_MASO.map((m) => rows.find((r) => r.maSo === m)).filter(
    (r): r is KqkdYoYRow => r != null,
  )

  if (items.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        Chưa có dữ liệu so sánh kỳ
      </div>
    )
  }

  // Tìm mức chênh lệch tuyệt đối lớn nhất để chuẩn hóa độ dài thanh bar
  const maxDiff = Math.max(
    ...items.map((r) => Math.abs(r.diff ?? 0)),
    1_000_000_000,
  )

  return (
    <div
      style={
        noBorder
          ? { width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }
          : {
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px',
            }
      }
    >
      {/* Legend & Chú giải */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          fontSize: '11.5px',
          color: '#475569',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#10b981' }} />
            Tích cực (Tăng DT / Tăng LN / Tiết kiệm CP)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#ef4444' }} />
            Rủi ro (Giảm DT / Giảm LN / Đội CP)
          </span>
        </div>

        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
          Trục giữa 0 · Thanh dạt Trái/Phải theo mức chênh lệch
        </span>
      </div>

      {/* Danh sách 6 hàng ngang trực quan hóa biến động */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-around' }}>
        {items.map((item, idx) => {
          const diff = item.diff ?? 0
          const pct = item.pct
          const isExpense = item.maSo === '11' || item.maSo === '25' || item.maSo === '26'
          const isRevenueOrProfit = !isExpense

          // Đánh giá tác động kiểm toán:
          // Đối với DT & Lợi nhuận: Tăng là Tốt (+), Giảm là Xấu (-)
          // Đối với Chi phí: Giảm là Tốt (Tiết kiệm), Tăng là Xấu (Đội chi phí)
          let isPositive = false
          if (isRevenueOrProfit) {
            isPositive = diff > 0
          } else {
            isPositive = diff < 0
          }

          const barColor = isPositive ? '#10b981' : '#ef4444'
          const barBg = isPositive ? '#ecfdf5' : '#fef2f2'
          const barBorder = isPositive ? '#a7f3d0' : '#fecaca'

          // Tỷ lệ độ dài thanh (tối đa 46% từ trục giữa ra mỗi bên)
          const barWidthPct = Math.min(46, Math.max(3, (Math.abs(diff) / maxDiff) * 46))
          const isLeft = diff < 0
          const isHovered = hoverIdx === idx

          return (
            <div
              key={item.maSo}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: '170px 1fr 140px',
                alignItems: 'center',
                gap: '12px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: isHovered ? '#f8fafc' : 'transparent',
                transition: 'background 120ms ease',
                position: 'relative',
              }}
            >
              {/* Cột 1: Tên chỉ tiêu & So sánh nhanh */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>{SHORT_LABEL[item.maSo] ?? item.chiTieu}</span>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>({item.maSo})</span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                  {fmtCompact(item.current)} <span style={{ color: '#94a3b8' }}>vs</span> {item.prior != null ? fmtCompact(item.prior) : 'Chưa có'}
                </div>
              </div>

              {/* Cột 2: Thanh ngang đối xứng qua trục 0 */}
              <div
                style={{
                  height: '22px',
                  background: '#f1f5f9',
                  borderRadius: '4px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                }}
              >
                {/* Vạch trục 0 ở giữa */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: '#94a3b8',
                    zIndex: 2,
                  }}
                />

                {/* Thanh Bar dạt Trái (< 0) hoặc Phải (> 0) */}
                {diff !== 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '3px',
                      bottom: '3px',
                      borderRadius: '3px',
                      background: barColor,
                      ...(isLeft
                        ? { right: '50%', width: `${barWidthPct}%` }
                        : { left: '50%', width: `${barWidthPct}%` }),
                      transition: 'width 200ms ease',
                      opacity: isHovered ? 1 : 0.88,
                    }}
                  />
                )}

                {/* Nhãn 0 đ mờ ở giữa */}
                <span
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#64748b',
                    zIndex: 3,
                    background: 'rgba(255, 255, 255, 0.75)',
                    padding: '0 2px',
                    borderRadius: '2px',
                  }}
                >
                  0
                </span>
              </div>

              {/* Cột 3: Số tiền chênh lệch & Badge % */}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: isPositive ? '#059669' : '#dc2626',
                    }}
                  >
                    {diff > 0 ? '+' : ''}
                    {fmtMoneyVnd(diff)}
                  </span>
                </div>

                <div>
                  {pct != null ? (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: barBg,
                        color: barColor,
                        border: `1px solid ${barBorder}`,
                        display: 'inline-block',
                      }}
                    >
                      {pct > 0 ? '+' : ''}
                      {pct}%
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Mới</span>
                  )}
                </div>
              </div>

              {/* Hover Tooltip chi tiết */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 4px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '11px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    zIndex: 50,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    pointerEvents: 'none',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 700, borderBottom: '1px solid #334155', paddingBottom: '3px', marginBottom: '3px' }}>
                    {item.chiTieu} (Mã {item.maSo})
                  </div>
                  <div>Năm nay: <b>{Math.round(item.current).toLocaleString('vi-VN')} đ</b></div>
                  <div>Năm trước: <b>{item.prior != null ? `${Math.round(item.prior).toLocaleString('vi-VN')} đ` : 'Chưa có'}</b></div>
                  <div>
                    Biến động:{' '}
                    <b style={{ color: isPositive ? '#34d399' : '#f87171' }}>
                      {diff > 0 ? '+' : ''}{Math.round(diff).toLocaleString('vi-VN')} đ {pct != null ? `(${pct > 0 ? '+' : ''}${pct}%)` : ''}
                    </b>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
