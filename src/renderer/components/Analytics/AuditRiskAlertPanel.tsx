import { useState } from 'react'
import type { GlAnalyticsResult } from '../../../domain/analytics/types'
import { moneyToNumber } from '../../../domain/money'
import { IconAlert, IconChevronDown } from '../Icons'
import { useApp } from '../../state/store'

interface Props {
  data: GlAnalyticsResult
  filePath?: string
}

interface RedFlag {
  id: string
  severity: 'HIGH' | 'MEDIUM'
  title: string
  norm: string // Chuẩn mực kiểm toán / Nghị định
  description: string
  impact: string
  actionLabel?: string
  targetWp?: string
}
export function AuditRiskAlertPanel({ data, filePath }: Props): JSX.Element | null {
  const [expanded, setExpanded] = useState(true)
  const setView = useApp((s) => s.setView)
  const setWorkingPaperSourcePath = useApp((s) => s.setWorkingPaperSourcePath)

  const { ebitda, correlations, relatedParties } = data
  const ebitdaNum = moneyToNumber(ebitda.ebitda)
  const disallowedNum = moneyToNumber(ebitda.disallowedInterest)
  const opProfitNum = moneyToNumber(ebitda.operatingProfit)
  const fExpNum = moneyToNumber(ebitda.interestExpense)

  const flags: RedFlag[] = []

  // 1. Cờ Đỏ 1: Kinh doanh dưới giá vốn / Biên gộp âm (VSA 520 & VSA 240)
  const annualMargin = correlations?.grossMargin?.annualGrossMarginPct ?? 0
  const hasNegativeMarginMonth = correlations?.grossMargin?.points.some((p) => p.isNegative)
  if (annualMargin < 0) {
    flags.push({
      id: 'gross-loss',
      severity: 'HIGH',
      title: 'Phát hiện Kinh doanh dưới giá vốn cả năm (Lỗ gộp)',
      norm: 'VSA 520 & VSA 240',
      description: `Biên lãi gộp cả năm đạt mức âm (${annualMargin}%). Doanh thu bán hàng không đủ bù đắp giá vốn.`,
      impact: 'Rủi ro hạch toán thiếu doanh thu, kết chuyển khống giá vốn hoặc bán phá giá. Cần kiểm tra kỹ các tháng dồn giá vốn cuối năm.',
      actionLabel: 'Mở Giấy làm việc D595 (Cut-off xuất kho)',
      targetWp: 'D595',
    })
  } else if (hasNegativeMarginMonth) {
    flags.push({
      id: 'gross-loss-month',
      severity: 'MEDIUM',
      title: 'Phát hiện tháng kinh doanh dưới giá vốn (Lỗ gộp theo tháng)',
      norm: 'VSA 520 & VSA 240',
      description: `Cả năm biên gộp đạt ${annualMargin}%, nhưng có tháng phát sinh biên gộp âm. Doanh thu trong tháng không đủ bù đắp giá vốn.`,
      impact: 'Cần kiểm tra tính chu kỳ mùa vụ, thời điểm kết chuyển giá vốn và các hợp đồng khuyến mại/chiết khấu lớn.',
      actionLabel: 'Mở Giấy làm việc D595 (Cut-off xuất kho)',
      targetWp: 'D595',
    })
  }

  // 2. Cờ Đỏ 2: Khống chế lãi vay thuế TNDN (Nghị định 132/2020/NĐ-CP)
  if (ebitda.isOverCap || ebitdaNum <= 0) {
    flags.push({
      id: 'interest-cap-nd132',
      severity: 'MEDIUM',
      title: 'Chi phí Lãi vay vượt trần khống chế 30% EBITDA',
      norm: 'Nghị định 132/2020/NĐ-CP',
      description: `EBITDA kỳ này đạt ${Math.round(ebitdaNum).toLocaleString('vi-VN')} đ (âm hoặc nhỏ). Chi phí lãi vay thuần vượt trần: ${Math.round(disallowedNum).toLocaleString('vi-VN')} đ.`,
      impact: 'Toàn bộ chi phí lãi vay vượt trần sẽ bị loại khi quyết toán thuế TNDN (buộc phải điều chỉnh tăng Chỉ tiêu B4 trên Tờ khai 03/TNDN).',
      actionLabel: 'Mở Giấy làm việc E382 (Tính thuế TNDN & B4)',
      targetWp: 'E382',
    })
  }

  // 3. Cờ Đỏ 3: Rủi ro Hoạt động liên tục (VSA 570)
  if (opProfitNum < 0 && fExpNum > 0) {
    flags.push({
      id: 'going-concern',
      severity: 'MEDIUM',
      title: 'Lỗ thuần từ HĐKD âm — Gánh nặng Chi phí tài chính',
      norm: 'VSA 570 (Hoạt động liên tục)',
      description: `Lợi nhuận thuần từ HĐKD âm ${Math.round(Math.abs(opProfitNum)).toLocaleString('vi-VN')} đ. Chi phí lãi vay phát sinh lớn (${Math.round(fExpNum).toLocaleString('vi-VN')} đ).`,
      impact: 'Doanh nghiệp kinh doanh thâm hụt vốn và chịu áp lực trả nợ vay lớn. KTV cần đánh giá khả năng thanh toán nợ đến hạn trong 12 tháng tới.',
      actionLabel: 'Mở Giấy làm việc E191 (Ước tính lãi vay & nợ)',
      targetWp: 'E191',
    })
  }

  // 4. Cờ Đỏ 4: Giao dịch bên liên quan & Vay mượn 0% (VSA 550)
  if (relatedParties.length > 0) {
    flags.push({
      id: 'related-parties-vsa550',
      severity: 'MEDIUM',
      title: `Phát hiện ${relatedParties.length} dấu hiệu giao dịch bên liên quan`,
      norm: 'VSA 550 & NĐ 132/2020',
      description: 'Phát hiện các nghiệp vụ vay, mượn tiền hoặc giao dịch nội bộ qua TK 1388, 3388, 128 không phát sinh lãi suất.',
      impact: 'Rủi ro bị ấn định thuế giao dịch liên kết theo giá thị trường. KTV cần kiểm tra nghĩa vụ kê khai Phụ lục giao dịch liên kết.',
      actionLabel: 'Mở Giấy làm việc D352/E252 (Gửi thư xác nhận)',
      targetWp: 'D352',
    })
  }

  if (flags.length === 0) {
    return (
      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#16a34a',
          fontSize: '12.5px',
          fontWeight: 600,
        }}
      >
        <span>✓</span>
        <span>Kiểm tra sơ bộ VSA 520 / NĐ 132: Chưa phát hiện cờ đỏ rủi ro bất thường trọng yếu.</span>
      </div>
    )
  }

  const highCount = flags.filter((f) => f.severity === 'HIGH').length

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderTop: highCount > 0 ? '3px solid #e11d48' : '3px solid #f59e0b',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        transition: 'all 150ms ease',
      }}
    >
      {/* ── Banner Header ── */}
      <div
        style={{
          padding: '12px 18px',
          background: '#ffffff',
          borderBottom: expanded ? '1px solid #f1f5f9' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: highCount > 0 ? '#fff1f2' : '#fffbeb',
              color: highCount > 0 ? '#e11d48' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconAlert size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>BẢNG CẢNH BÁO RỦI RO KIỂM TOÁN (VSA 520 / NĐ 132)</span>
              <span
                style={{
                  fontSize: '11px',
                  background: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  padding: '1px 8px',
                  borderRadius: '999px',
                  fontWeight: 600,
                }}
              >
                {flags.length} chỉ tiêu cần lưu ý {highCount > 0 ? `(${highCount} rủi ro cao)` : ''}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
              Hệ thống tự động phát hiện các chỉ số tài chính trọng yếu cần lập thủ tục kiểm toán chuyên sâu
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 500 }}>
            {expanded ? 'Thu gọn' : 'Xem chi tiết'}
          </span>
          <IconChevronDown
            size={14}
            className={expanded ? 'rotate-180' : ''}
            style={{ transition: 'transform 150ms ease' }}
          />
        </div>
      </div>

      {/* ── Banner Content List ── */}
      {expanded && (
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#ffffff' }}>
          {flags.map((flag, idx) => {
            const isHigh = flag.severity === 'HIGH'
            return (
              <div
                key={flag.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #f1f5f9',
                  borderLeft: isHigh ? '3.5px solid #e11d48' : '3.5px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        background: isHigh ? '#fff1f2' : '#fffbeb',
                        color: isHigh ? '#be123c' : '#b45309',
                        border: `1px solid ${isHigh ? '#fecdd3' : '#fde68a'}`,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isHigh ? 'Rủi Ro Cao' : 'Cảnh Báo'}
                    </span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                      {idx + 1}. {flag.title}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                      [{flag.norm}]
                    </span>
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.5, marginBottom: '4px' }}>
                    {flag.description}
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.45 }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>• Hệ quả kiểm toán:</span> {flag.impact}
                  </div>
                </div>

                {flag.actionLabel && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (filePath) {
                        setWorkingPaperSourcePath(filePath)
                      }
                      setView('workingpaper')
                    }}
                    style={{
                      background: '#ffffff',
                      color: '#0284c7',
                      border: '1px solid #bae6fd',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 1px 2px rgba(2, 132, 199, 0.06)',
                      transition: 'all 120ms ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f9ff'
                      e.currentTarget.style.borderColor = '#0284c7'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff'
                      e.currentTarget.style.borderColor = '#bae6fd'
                    }}
                    title={`Bấm để chuyển sang phân hệ Lập Giấy Làm Việc tương ứng (${flag.targetWp})`}
                  >
                    <span>📑</span>
                    <span>{flag.actionLabel}</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
