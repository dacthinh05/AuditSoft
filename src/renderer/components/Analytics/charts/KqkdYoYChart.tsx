import { useState } from 'react'
import type { KqkdYoYRow } from '../../../../domain/analytics/types'

interface Props {
  rows: KqkdYoYRow[]
}

const CHART_MASO = ['10', '11', '60', '25', '26', '70']
const SHORT_LABEL: Record<string, string> = {
  '10': 'DT thuần',
  '11': 'Giá vốn',
  '60': 'LN gộp',
  '25': 'CPBH',
  '26': 'CPQLDN',
  '70': 'LN HĐKD',
}

function fmtShort(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)} tỷ`
  if (abs >= 1_000_000) return `${sign}${Math.round(abs / 1_000_000).toLocaleString('vi-VN')} tr`
  return `${sign}${abs.toLocaleString('vi-VN')}`
}

export function KqkdYoYChart({ rows }: Props): JSX.Element {
  const [hover, setHover] = useState<number | null>(null)
  const items = CHART_MASO.map((m) => rows.find((r) => r.maSo === m)).filter(
    (r): r is KqkdYoYRow => r != null,
  )
  if (items.length === 0) return <div />

  const W = 1000
  const H = 260
  const Y_TOP = 24
  const Y_BOTTOM = 224
  const Y_HEIGHT = Y_BOTTOM - Y_TOP

  const allVals = items.flatMap((r) => [r.current, r.prior ?? 0])
  const maxPos = Math.max(1, ...allVals)
  const minNeg = Math.min(0, ...allVals)
  const hasNegative = minNeg < 0
  const totalRange = (maxPos - minNeg) * 1.18

  // Trục 0 nằm ở đâu trên đồ thị:
  const yZero = hasNegative
    ? Y_TOP + (maxPos / (maxPos - minNeg)) * Y_HEIGHT
    : Y_BOTTOM

  const getY = (val: number): number => {
    return yZero - (val / totalRange) * Y_HEIGHT
  }

  const slotW = W / items.length
  const barW = Math.min(52, slotW / 4.2)

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginTop: '14px' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '10px', fontSize: '11.5px', color: '#475569', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#0284c7' }} />
          Năm nay (Dương)
        </span>
        {hasNegative && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} />
            Năm nay (Lỗ / Giảm)
          </span>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#cbd5e1' }} />
          Năm trước
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
          Đơn vị: VNĐ · Trục 0 phân định rõ lãi / lỗ
        </span>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', height: `${H}px` }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          {/* Baseline Y = 0 */}
          <line x1="0" y1={yZero} x2={W} y2={yZero} stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="4" y={yZero - 5} fontSize="10" fontWeight="700" fill="#64748b">0 đ</text>

          {/* Grid lines dương */}
          {[0.5, 1].map((f) => {
            const y = yZero - f * (maxPos / totalRange) * Y_HEIGHT
            if (y < Y_TOP) return null
            return (
              <g key={`pos-${f}`}>
                <line x1="0" y1={y} x2={W} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x="4" y={y - 3} fontSize="10" fill="#94a3b8">{fmtShort(maxPos * f)}</text>
              </g>
            )
          })}

          {/* Grid lines âm nếu có */}
          {hasNegative && (
            <g>
              <line x1="0" y1={Y_BOTTOM} x2={W} y2={Y_BOTTOM} stroke="#fef2f2" strokeWidth="1" />
              <text x="4" y={Y_BOTTOM - 3} fontSize="10" fill="#f87171">{fmtShort(minNeg)}</text>
            </g>
          )}

          {/* Bars */}
          {items.map((r, idx) => {
            const cx = slotW * idx + slotW / 2

            // Năm nay
            const curVal = r.current
            const curY = getY(curVal)
            const curH = Math.max(2, Math.abs(curY - yZero))
            const curTop = curVal >= 0 ? curY : yZero
            const curColor = curVal >= 0 ? '#0284c7' : '#ef4444'

            // Năm trước
            const priVal = r.prior
            const priY = priVal != null ? getY(priVal) : yZero
            const priH = priVal != null ? Math.max(2, Math.abs(priY - yZero)) : 0
            const priTop = priVal != null && priVal >= 0 ? priY : yZero
            const priColor = priVal != null && priVal < 0 ? '#fca5a5' : '#cbd5e1'

            return (
              <g
                key={r.maSo}
                onMouseEnter={() => setHover(idx)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Cột Năm nay */}
                <rect
                  x={cx - barW - 2}
                  y={curTop}
                  width={barW}
                  height={curH}
                  fill={curColor}
                  rx="3"
                  opacity={hover === idx ? 1 : 0.88}
                />
                {/* Nhãn giá trị Năm nay */}
                <text
                  x={cx - barW / 2 - 2}
                  y={curVal >= 0 ? curTop - 5 : curTop + curH + 12}
                  fontSize="10"
                  fontWeight="700"
                  fill={curColor}
                  textAnchor="middle"
                >
                  {fmtShort(curVal)}
                </text>

                {/* Cột Năm trước */}
                {priVal != null && (
                  <>
                    <rect
                      x={cx + 2}
                      y={priTop}
                      width={barW}
                      height={priH}
                      fill={priColor}
                      rx="3"
                      opacity={hover === idx ? 1 : 0.88}
                    />
                    <text
                      x={cx + barW / 2 + 2}
                      y={priVal >= 0 ? priTop - 5 : priTop + priH + 12}
                      fontSize="9.5"
                      fill="#64748b"
                      textAnchor="middle"
                    >
                      {fmtShort(priVal)}
                    </text>
                  </>
                )}

                {/* Label khoản mục bên dưới trục */}
                <text
                  x={cx}
                  y={hasNegative ? Y_BOTTOM + 22 : yZero + 18}
                  fontSize="11.5"
                  fontWeight="600"
                  fill="#1e293b"
                  textAnchor="middle"
                  fontFamily="system-ui, sans-serif"
                >
                  {SHORT_LABEL[r.maSo] ?? r.maSo}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Hover Tooltip */}
        {hover != null && items[hover] && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '11.5px',
              padding: '10px 14px',
              borderRadius: '8px',
              lineHeight: 1.55,
              zIndex: 50,
              pointerEvents: 'none',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
              border: '1px solid #334155',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '12px', borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '6px' }}>
              {items[hover]?.chiTieu} ({SHORT_LABEL[items[hover]?.maSo ?? '']})
            </div>
            <div>Năm nay: <b style={{ color: (items[hover]?.current ?? 0) >= 0 ? '#38bdf8' : '#f87171' }}>{Math.round(items[hover]?.current ?? 0).toLocaleString('vi-VN')} đ</b></div>
            <div>
              Năm trước:{' '}
              <b>
                {items[hover]?.prior != null
                  ? `${Math.round(items[hover]?.prior ?? 0).toLocaleString('vi-VN')} đ`
                  : 'Chưa có số liệu'}
              </b>
            </div>
            {items[hover]?.diff != null && (
              <div>
                Chênh lệch:{' '}
                <b style={{ color: (items[hover]?.diff ?? 0) >= 0 ? '#34d399' : '#f87171' }}>
                  {(items[hover]?.diff ?? 0) > 0 ? '+' : ''}
                  {Math.round(items[hover]?.diff ?? 0).toLocaleString('vi-VN')} đ
                  {items[hover]?.pct != null && ` (${items[hover]?.pct}%)`}
                </b>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
