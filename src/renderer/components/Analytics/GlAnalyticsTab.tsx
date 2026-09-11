import { useState } from 'react'
import type { ExpenseDetailReport, GlAnalyticsResult } from '../../../domain/analytics/types'
import { moneyToNumber } from '../../../domain/money'
import { RevenueCogsComboChart } from './charts/RevenueCogsComboChart'
import { CogsStructureStackedChart } from './charts/CogsStructureStackedChart'
import { OpexRatioAreaChart } from './charts/OpexRatioAreaChart'
import { ProfitWaterfallChart } from './charts/ProfitWaterfallChart'
import { KqkdYoYChart } from './charts/KqkdYoYChart'
import { AiAuditAdvisorPanel } from './AiAuditAdvisorPanel'
import { CogsMatrix12MTable } from './CogsMatrix12MTable'
import { ExpenseByNatureTable } from './ExpenseByNatureTable'
import { AuditRiskAlertPanel } from './AuditRiskAlertPanel'
import { Vsa520RatiosBar } from './Vsa520RatiosBar'

interface Props {
  data: GlAnalyticsResult
  filePath?: string
}

function fmtMoneyNum(v: number): string {
  return Math.round(v).toLocaleString('vi-VN')
}

const MONTH_NAMES = [
  'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04',
  'Tháng 05', 'Tháng 06', 'Tháng 07', 'Tháng 08',
  'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12',
]

/** Ô đột biến: hover hiện ghi chú kiểm toán ngắn, không dùng ký hiệu cảm thán trong ngoặc */
function AnomalyCell({ value, note, alignRight }: { value: string; note: string; alignRight?: boolean }): JSX.Element {
  const [showNote, setShowNote] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowNote(true)}
      onMouseLeave={() => setShowNote(false)}
    >
      <span
        style={{
          color: showNote ? '#b45309' : '#0f172a',
          background: showNote ? '#fef3c7' : 'transparent',
          borderBottom: '2px dotted #d97706',
          padding: '1px 4px',
          borderRadius: '3px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          cursor: 'help',
          transition: 'all 120ms ease',
        }}
      >
        <span style={{ fontSize: '8px', color: '#d97706', lineHeight: 1 }}>●</span>
        <span>{value}</span>
      </span>
      {showNote && (
        <span
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            ...(alignRight ? { right: 0 } : { left: 0 }),
            width: 'max-content',
            maxWidth: '250px',
            whiteSpace: 'normal',
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '11px',
            fontWeight: 500,
            padding: '8px 10px',
            borderRadius: '6px',
            textAlign: 'left',
            lineHeight: 1.5,
            zIndex: 50,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            pointerEvents: 'none',
          }}
        >
          {note}
        </span>
      )}
    </span>
  )
}

const SHORT_MONTHS = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12']

/** Bảng chi tiết chi phí theo TK 4 số × 12 tháng (mẫu giấy G353/G453) */
function ExpenseDetailTable({ title, subtitle, report }: { title: string; subtitle: string; report: ExpenseDetailReport }): JSX.Element {
  const grandTotal = report.totals.reduce((s, v) => s + v, 0)
  const grandRevenue = report.revenue.reduce((s, v) => s + v, 0)
  const grandRatio = grandRevenue > 0 ? Number(((grandTotal / grandRevenue) * 100).toFixed(1)) : null
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '12px' }}>{subtitle}</div>
      {report.accounts.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', fontSize: '13px' }}>
          Sổ NKC không phát sinh tài khoản Nợ {report.prefix} nào.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '13px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 3, padding: '10px 12px', textAlign: 'left', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>Tháng</th>
                {report.accounts.map((acc) => (
                  <th key={acc} style={{ padding: '10px 10px', fontWeight: 700, minWidth: '110px' }}>TK {acc}</th>
                ))}
                <th style={{ padding: '10px 10px', fontWeight: 700, background: '#f8fafc', minWidth: '120px' }}>Tổng CP</th>
                <th style={{ padding: '10px 10px', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', minWidth: '130px' }}>Doanh thu</th>
                <th style={{ padding: '10px 10px', fontWeight: 700, minWidth: '80px' }}>Tỷ lệ</th>
              </tr>
            </thead>
            <tbody style={{ color: '#1e293b' }}>
              {SHORT_MONTHS.map((mLabel, mIdx) => {
                const monthTotal = report.months.reduce((s, m) => s + (m[mIdx] ?? 0), 0)
                const rev = report.revenue[mIdx] ?? 0
                const ratio = report.ratios[mIdx]
                return (
                  <tr key={mLabel} style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'right', background: mIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ position: 'sticky', left: 0, background: mIdx % 2 === 0 ? '#ffffff' : '#f8fafc', zIndex: 2, padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#0284c7', borderRight: '1px solid #e2e8f0' }}>{mLabel}</td>
                    {report.months.map((col, cIdx) => {
                      const v = col[mIdx] ?? 0
                      return (
                        <td key={cIdx} style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>
                          {v === 0 ? <span style={{ color: '#94a3b8' }}>-</span> : <span style={{ fontWeight: 600, color: '#0f172a' }}>{fmtMoneyNum(v)}</span>}
                        </td>
                      )
                    })}
                    <td style={{ padding: '9px 10px', fontWeight: 700, color: '#0f172a', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{monthTotal === 0 ? <span style={{ color: '#94a3b8' }}>-</span> : fmtMoneyNum(monthTotal)}</td>
                    <td style={{ padding: '9px 10px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{rev === 0 ? <span style={{ color: '#94a3b8' }}>-</span> : fmtMoneyNum(rev)}</td>
                    <td style={{ padding: '9px 10px', fontWeight: 700, color: '#0f172a', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{ratio == null ? <span style={{ color: '#94a3b8' }}>-</span> : `${ratio}%`}</td>
                  </tr>
                )
              })}
              <tr style={{ background: '#f8fafc', fontWeight: 700, textAlign: 'right', color: '#0f172a' }}>
                <td style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2, padding: '10px 12px', textAlign: 'left', borderRight: '1px solid #e2e8f0', borderTop: '2px solid #cbd5e1' }}>Cộng</td>
                {report.totals.map((t, i) => (
                  <td key={i} style={{ padding: '10px 10px', borderTop: '2px solid #cbd5e1', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{t === 0 ? <span style={{ color: '#94a3b8' }}>-</span> : fmtMoneyNum(t)}</td>
                ))}
                <td style={{ padding: '10px 10px', borderTop: '2px solid #cbd5e1', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{grandTotal === 0 ? <span style={{ color: '#94a3b8' }}>-</span> : fmtMoneyNum(grandTotal)}</td>
                <td style={{ padding: '10px 10px', color: '#1d4ed8', borderTop: '2px solid #cbd5e1', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{grandRevenue === 0 ? <span style={{ color: '#94a3b8' }}>-</span> : fmtMoneyNum(grandRevenue)}</td>
                <td style={{ padding: '10px 10px', borderTop: '2px solid #cbd5e1', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{grandRatio == null ? <span style={{ color: '#94a3b8' }}>-</span> : `${grandRatio}%`}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ExpenseDetailSection({ sell, admin }: { sell: ExpenseDetailReport; admin: ExpenseDetailReport }): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ExpenseDetailTable title="Tỷ lệ Chi phí bán hàng / Doanh thu qua các tháng (TK 641)" subtitle="Chi tiết theo TK 4 số — phục vụ giấy làm việc G353" report={sell} />
      <ExpenseDetailTable title="Tỷ lệ Chi phí quản lý doanh nghiệp / Doanh thu qua các tháng (TK 642)" subtitle="Chi tiết theo TK 4 số — phục vụ giấy làm việc G453" report={admin} />
    </div>
  )
}
export function GlAnalyticsTab({ data, filePath }: Props): JSX.Element {
  const { ebitda, relatedParties, pareto, trend12m, correlations } = data
  const netInterestNum = moneyToNumber(ebitda.netInterest)
  const ebitdaNum = moneyToNumber(ebitda.ebitda)
  const cap30Num = moneyToNumber(ebitda.cap30)
  const disallowedNum = moneyToNumber(ebitda.disallowedInterest)
  const opProfitNum = moneyToNumber(ebitda.operatingProfit)
  const deprNum = moneyToNumber(ebitda.depreciation)
  const fExpNum = moneyToNumber(ebitda.interestExpense)
  const fIncNum = moneyToNumber(ebitda.interestIncome)

  // Tính tổng cộng theo tháng (cho dòng tổng cộng dưới cùng)
  const monthlyTotals = Array.from({ length: 12 }, (_, mIdx) => {
    return trend12m.rows.reduce((sum, r) => sum + moneyToNumber(r.months[mIdx]!), 0)
  })

  // Tính tổng cộng toàn bộ cả năm (góc dưới cùng bên phải)
  const grandYearTotal = trend12m.rows.reduce((sum, r) => sum + moneyToNumber(r.total), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#0f172a' }}>
      {/* ── AI Audit Advisor (Google Gemini 2.5 VSA 520) ── */}
      <AiAuditAdvisorPanel data={data} filePath={filePath} />

      {/* ── Bảng Cảnh Báo Cờ Đỏ Trọng Yếu (Executive Audit Red Flags Panel) ── */}
      <AuditRiskAlertPanel data={data} filePath={filePath} />
      {/* ── 5 KPI Cards (Clean Enterprise SaaS Standard, Zero Emojis) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: Lãi vay thuần */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px',
            border: '1px solid #e2e8f0',
            borderTop: '3px solid #0284c7',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Chi phí Lãi vay thuần
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px', fontFamily: 'monospace' }}>
            {fmtMoneyNum(netInterestNum)} đ
          </div>
          <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '4px' }}>
            TK 635 chi tiết trừ TK 515 (Lãi tiền gửi)
          </div>
        </div>

        {/* Card 2: EBITDA */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px',
            border: '1px solid #e2e8f0',
            borderTop: '3px solid #059669',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            EBITDA Hoạt động KD
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#059669', marginTop: '4px', fontFamily: 'monospace' }}>
            {fmtMoneyNum(ebitdaNum)} đ
          </div>
          <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '4px' }}>
            LNTT HĐKD + Lãi vay thuần + Khấu hao 214
          </div>
        </div>

        {/* Card 3: Tỷ lệ Lãi vay / EBITDA */}
        <div
          style={{
            background: ebitda.isOverCap ? '#fff1f2' : '#ffffff',
            padding: '16px',
            border: `1px solid ${ebitda.isOverCap ? '#fecdd3' : '#e2e8f0'}`,
            borderTop: `3px solid ${ebitda.isOverCap ? '#e11d48' : '#10b981'}`,
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '11px', color: ebitda.isOverCap ? '#be123c' : '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Tỷ lệ Lãi vay / EBITDA
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: ebitda.isOverCap ? '#be123c' : '#0f172a',
              marginTop: '4px',
              fontFamily: 'monospace',
            }}
          >
            {ebitda.interestToEbitdaRatio != null ? `${ebitda.interestToEbitdaRatio.toFixed(1)}%` : 'N/A (EBITDA ≤ 0)'}
          </div>
          <div style={{ fontSize: '11.5px', marginTop: '4px' }}>
            {ebitda.isOverCap ? (
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                [!] Vượt trần 30%: Vượt {fmtMoneyNum(disallowedNum)} đ (Chỉ tiêu B4)
              </span>
            ) : (
              <span style={{ color: '#047857', fontWeight: 600 }}>Trong hạn mức trần 30%</span>
            )}
          </div>
        </div>

        {/* Card 4: Bên liên quan */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px',
            border: '1px solid #e2e8f0',
            borderTop: '3px solid #f59e0b',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Nghi ngờ Bên liên quan (0%)
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: relatedParties.length > 0 ? '#b45309' : '#059669',
              marginTop: '4px',
              fontFamily: 'monospace',
            }}
          >
            {relatedParties.length} Đối tượng
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
            Vay/Mượn tiền không phát sinh lãi
          </div>
        </div>

        {/* Card 5: Top 5 Khách hàng */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px',
            border: '1px solid #e2e8f0',
            borderTop: '3px solid #8b5cf6',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Tập trung Top 5 Khách hàng
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px', fontFamily: 'monospace' }}>
            {pareto.customerConcentrationRatio5}% DT
          </div>
          <div style={{ fontSize: '11.5px', color: pareto.customerRiskWarning ? '#b45309' : '#64748b', marginTop: '4px' }}>
            {pareto.customerRiskWarning ? '[!] Mức độ tập trung cao' : 'Phân bổ an toàn'}
          </div>
        </div>
      </div>

      {/* ── Thanh 4 Tỷ Số Tài Chính Kiểm Toán VSA 520 ── */}
      <Vsa520RatiosBar data={data} />
      {/* ── Section 2: Báo Cáo KQKD (B02) & Biểu Đồ So Sánh YoY ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', alignItems: 'stretch' }}>
        {/* Cột Trái (50%): Bảng KQKD B02 */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Kết Quả Kinh Doanh — Năm Nay vs Năm Trước</span>
            {data.kqkdYoY && (
              <span
                style={{
                  fontSize: '11px',
                  background: data.kqkdYoY.fromB02 ? '#eff6ff' : '#f8fafc',
                  color: data.kqkdYoY.fromB02 ? '#1d4ed8' : '#64748b',
                  border: `1px solid ${data.kqkdYoY.fromB02 ? '#bfdbfe' : '#e2e8f0'}`,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                {data.kqkdYoY.fromB02 ? 'Số B02' : 'Kết từ NKC'}
              </span>
            )}
          </div>

          {!data.kqkdYoY || data.kqkdYoY.rows.length === 0 ? (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Chưa có dữ liệu kết quả kinh doanh. Nạp file có sheet KQKD/BCTC hoặc Sổ NKC để xem so sánh.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 600 }}>Mã số</th>
                      <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 600 }}>Chỉ tiêu</th>
                      <th style={{ padding: '7px 8px', fontWeight: 600 }}>Năm nay</th>
                      <th style={{ padding: '7px 8px', fontWeight: 600 }}>Năm trước</th>
                      <th style={{ padding: '7px 8px', fontWeight: 600 }}>Chênh lệch</th>
                      <th style={{ padding: '7px 8px', fontWeight: 600 }}>%</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontFamily: 'monospace', color: '#1e293b' }}>
                    {data.kqkdYoY.rows.map((r) => {
                      const isLoss = (r.maSo === '60' || r.maSo === '70') && r.current < 0
                      const isAnomaly = Math.abs(r.pct ?? 0) >= 50 && r.current !== 0

                      let rowBg = '#ffffff'
                      if (isLoss) rowBg = '#fff1f2'
                      else if (isAnomaly) rowBg = '#fffbeb'

                      return (
                        <tr key={r.maSo} style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'right', background: rowBg, transition: 'background 120ms ease' }}>
                          <td style={{ padding: '6px 8px', textAlign: 'left', color: isLoss ? '#b91c1c' : '#64748b', fontWeight: isLoss ? 700 : 500 }}>
                            {r.maSo}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'left', fontFamily: 'sans-serif', fontWeight: isLoss ? 700 : 500, color: isLoss ? '#991b1b' : '#0f172a' }}>
                            <span>{r.chiTieu}</span>
                          </td>
                          <td style={{ padding: '6px 8px', fontWeight: 700, color: isLoss ? '#b91c1c' : '#0f172a' }}>
                            {r.current === 0 ? <span style={{ color: '#94a3b8' }}>-</span> : fmtMoneyNum(r.current)}
                          </td>
                          <td style={{ padding: '6px 8px', fontWeight: 600, color: '#475569' }}>
                            {r.prior == null || r.prior === 0 ? <span style={{ color: '#94a3b8' }}>-</span> : fmtMoneyNum(r.prior)}
                          </td>
                          <td style={{ padding: '6px 8px', fontWeight: 700, color: isLoss ? '#b91c1c' : '#0f172a' }}>
                            {r.diff == null || r.diff === 0 ? <span style={{ color: '#94a3b8' }}>-</span> : `${r.diff > 0 ? '+' : ''}${fmtMoneyNum(r.diff)}`}
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            {r.pct == null ? (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            ) : (
                              <span
                                style={{
                                  background: isLoss ? '#fee2e2' : isAnomaly ? '#fef3c7' : '#eff6ff',
                                  color: isLoss ? '#dc2626' : isAnomaly ? '#b45309' : '#1d4ed8',
                                  border: `1px solid ${isLoss ? '#fca5a5' : isAnomaly ? '#fde68a' : '#bfdbfe'}`,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                }}
                              >
                                {r.pct > 0 ? '+' : ''}
                                {r.pct}%
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {!data.kqkdYoY.rows.some((r) => r.prior != null) && (
                <div style={{ fontSize: '11px', color: '#b45309', marginTop: '8px' }}>
                  Chưa có số năm trước — nạp file có sheet KQKD/BCTC đủ 2 năm để bật so sánh.
                </div>
              )}
            </>
          )}
        </div>

        {/* Cột Phải (50%): Biểu đồ YoY Chart */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Biến Động Các Chỉ Tiêu Trọng Yếu (YoY)</span>
            <span style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
              6 Chỉ tiêu chính
            </span>
          </div>

          {data.kqkdYoY && data.kqkdYoY.rows.length > 0 ? (
            <div id="chart-kqkd-yoy" data-chart-title="Biến Động Các Chỉ Tiêu Trọng Yếu (YoY)">
              <KqkdYoYChart rows={data.kqkdYoY.rows} noBorder />
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Chưa có dữ liệu biểu đồ
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Tuân Thủ Thuế NĐ 132/2020 & Giao Dịch Bên Liên Quan VSA 550 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', alignItems: 'stretch' }}>
        {/* Panel EBITDA */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Bóc Tách Lãi Vay &amp; EBITDA (Nghị định 132/2020/NĐ-CP)</span>
            {ebitda.isOverCap && (
              <span
                style={{
                  fontSize: '11px',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                Khuyến nghị điều chỉnh B4
              </span>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '7px 10px', fontWeight: 600 }}>Khoản Mục</th>
                <th style={{ padding: '7px 10px', fontWeight: 600 }}>Căn Cứ</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>Số Tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: 'monospace', color: '#1e293b' }}>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '7px 10px', fontFamily: 'sans-serif' }}>Lợi nhuận thuần từ HĐKD</td>
                <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'sans-serif' }}>Mã số 30 (KQKD)</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmtMoneyNum(opProfitNum)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '7px 10px', fontFamily: 'sans-serif' }}>Khấu hao tài sản cố định</td>
                <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'sans-serif' }}>Có TK 214</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmtMoneyNum(deprNum)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '7px 10px', fontFamily: 'sans-serif' }}>Chi phí lãi vay phát sinh</td>
                <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'sans-serif' }}>Nợ TK 635</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmtMoneyNum(fExpNum)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '7px 10px', fontFamily: 'sans-serif' }}>Lãi tiền gửi, cho vay</td>
                <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'sans-serif' }}>Có TK 515</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>({fmtMoneyNum(fIncNum)})</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#eff6ff', fontWeight: 700 }}>
                <td style={{ padding: '7px 10px', color: '#1d4ed8', fontFamily: 'sans-serif' }}>EBITDA Kỳ Này</td>
                <td style={{ padding: '7px 10px', color: '#1d4ed8', fontFamily: 'sans-serif' }}>NĐ 132/2020</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: '#1d4ed8' }}>{fmtMoneyNum(ebitdaNum)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>
                <td style={{ padding: '7px 10px', fontFamily: 'sans-serif' }}>Mức trần lãi vay được trừ (30%)</td>
                <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'sans-serif' }}>30% × EBITDA</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmtMoneyNum(cap30Num)}</td>
              </tr>
              <tr style={{ background: ebitda.isOverCap ? '#fef2f2' : 'transparent', fontWeight: 700, color: ebitda.isOverCap ? '#b91c1c' : '#047857' }}>
                <td style={{ padding: '7px 10px', fontFamily: 'sans-serif' }}>Lãi vay vượt trần (Chỉ tiêu B4)</td>
                <td style={{ padding: '7px 10px', fontFamily: 'sans-serif' }}>Chi phí không được trừ</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmtMoneyNum(disallowedNum)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: 1.4 }}>
            [Lưu ý] {ebitda.note}
          </div>
        </div>

        {/* Panel Bên Liên Quan (VSA 550) */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Rà Soát Giao Dịch Bên Liên Quan (VSA 550)</span>
            <span
              style={{
                fontSize: '11px',
                background: relatedParties.length > 0 ? '#fffbeb' : '#f0fdf4',
                color: relatedParties.length > 0 ? '#b45309' : '#15803d',
                border: `1px solid ${relatedParties.length > 0 ? '#fde68a' : '#bbf7d0'}`,
                padding: '3px 8px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              {relatedParties.length > 0 ? `${relatedParties.length} Dấu hiệu nghi ngờ` : 'Không phát hiện bất thường'}
            </span>
          </div>

          {relatedParties.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '24px',
                border: '1px solid #f1f5f9',
                textAlign: 'center',
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '8px', fontWeight: 700 }}>
                ✓
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Không phát hiện giao dịch vay/mượn không lãi suất</div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', maxWidth: '380px', lineHeight: 1.45 }}>
                Sổ NKC không có các nghiệp vụ cho vay, mượn tiền qua TK 1388, 3388, 128 với lãi suất 0% hoặc chênh lệch bất thường theo chuẩn mực VSA 550.
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11.5px', color: '#78350f', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 12px', lineHeight: 1.4 }}>
                <strong>Cảnh báo kiểm toán (VSA 550 &amp; NĐ 132/2020):</strong> Phát hiện các nghiệp vụ vay/mượn hoặc giao dịch nội bộ có dấu hiệu liên kết. Kiểm tra nghĩa vụ kê khai Phụ lục giao dịch liên kết và rà soát mức khống chế lãi vay.
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '235px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                {relatedParties.map((rp) => (
                  <div
                    key={rp.id}
                    style={{
                      fontSize: '12px',
                      color: '#451a03',
                      background: '#ffffff',
                      border: '1px solid #fef3c7',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{rp.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{rp.description}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#b45309', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                      {fmtMoneyNum(rp.totalAmount ? moneyToNumber(rp.totalAmount) : 0)} đ
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Pareto Khách hàng & Nhà cung cấp ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
        {/* Top Khách Hàng */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Top Khách Hàng (Tỷ Trọng Doanh Thu TK 511)
            </div>
            {pareto.customerConcentrationRatio1 > 30 && (
              <span style={{ fontSize: '10.5px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Tập trung cao ({pareto.customerConcentrationRatio1}%)
              </span>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '9px 12px', fontWeight: 700 }}>Khách Hàng</th>
                <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700 }}>Doanh Thu</th>
                <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700 }}>Tỷ Trọng %</th>
                <th style={{ padding: '9px 12px', width: '90px', fontWeight: 700 }}>Tích Lũy</th>
              </tr>
            </thead>
            <tbody style={{ color: '#1e293b' }}>
              {pareto.topCustomers.map((c) => (
                <tr key={c.rank} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 12px', fontFamily: 'system-ui, sans-serif', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyNum(moneyToNumber(c.amount))}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{c.percentage}%</td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ background: '#0284c7', height: '100%', width: `${c.cumulativePercentage}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pareto.customerRiskWarning && (
            <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '10px' }}>
              [Lưu ý] {pareto.customerRiskWarning}
            </div>
          )}
        </div>

        {/* Top Nhà Cung Cấp */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Top Nhà Cung Cấp (Mua Hàng &amp; Chi Phí)
            </div>
            {pareto.topSuppliers[0] && (pareto.topSuppliers[0].percentage ?? 0) > 35 && (
              <span style={{ fontSize: '10.5px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Tập trung nguồn cung ({pareto.topSuppliers[0].percentage}%)
              </span>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '9px 12px', fontWeight: 700 }}>Nhà Cung Cấp</th>
                <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700 }}>Giá Trị Mua</th>
                <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700 }}>Tỷ Trọng %</th>
                <th style={{ padding: '9px 12px', width: '90px', fontWeight: 700 }}>Tích Lũy</th>
              </tr>
            </thead>
            <tbody style={{ color: '#1e293b' }}>
              {pareto.topSuppliers.map((s) => (
                <tr key={s.rank} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 12px', fontFamily: 'system-ui, sans-serif', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyNum(moneyToNumber(s.amount))}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{s.percentage}%</td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ background: '#059669', height: '100%', width: `${s.cumulativePercentage}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pareto.supplierRiskWarning && (
            <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '10px' }}>
              [Lưu ý] {pareto.supplierRiskWarning}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 5: Cầu Nối Dòng Chảy Lợi Nhuận (Full-Width) ── */}
      {correlations?.waterfall && (
        <div id="chart-waterfall" data-chart-title="Cầu Nối Dòng Chảy Lợi Nhuận (Waterfall)">
          <ProfitWaterfallChart steps={correlations.waterfall} />
        </div>
      )}

      {/* ── Section 6: Bộ 3 Đồ Thị Tài Chính Tương Quan 12 Tháng (Mô hình 2 Hàng Chuẩn SaaS) ── */}
      {correlations && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Hàng 1: 2 Đồ thị chu trình Bán hàng & Sản xuất - Giá vốn (Tỷ lệ 50/50, chiều cao đồng bộ) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
              gap: '16px',
              alignItems: 'stretch',
            }}
          >
            <div id="chart-gross-margin" data-chart-title="Doanh Thu & Biên Lãi Gộp 12 Tháng" style={{ display: 'flex', flexDirection: 'column' }}>
              <RevenueCogsComboChart report={correlations.grossMargin} />
            </div>
            <div id="chart-cogs-structure" data-chart-title="Cơ Cấu Chi Phí Giá Vốn 12 Tháng" style={{ display: 'flex', flexDirection: 'column' }}>
              <CogsStructureStackedChart report={correlations.cogsStructure} />
            </div>
          </div>

          {/* Hàng 2: Đồ thị OPEX trải dài Full-Width cân đối hoàn hảo */}
          <div id="chart-opex-ratio" data-chart-title="Tỷ Trọng Chi Phí Hoạt Động (OPEX / Doanh Thu)">
            <OpexRatioAreaChart report={correlations.opexRatios} />
          </div>
        </div>
      )}
      {/* ── Section 4b: Ma Trận Chi Phí Cấu Thành Giá Vốn 12 Tháng (Trước Kết Chuyển 911) ── */}
      {correlations?.cogs12mMatrix && (
        <CogsMatrix12MTable matrix={correlations.cogs12mMatrix} />
      )}

      {/* ── Section 4c: Ma Trận Chi Phí Theo Yếu Tố 12 Tháng & Bảng Cân Đối Thuyết Minh BCTC ── */}
      {correlations?.expenseByNature && (
        <ExpenseByNatureTable report={correlations.expenseByNature} />
      )}
      {/* ── Section 5: Ma Trận 12 Tháng Đã Tối Ưu (Sticky Col, Muted Zero '-') ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Ma Trận Biến Động 12 Tháng Theo Khoản Mục
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Cột tháng bên trái cố định • Các khoản mục dàn hàng ngang • Dấu [-] thể hiện tháng không phát sinh
            </div>
          </div>
          <span
            style={{
              fontSize: '11.5px',
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              padding: '3px 9px',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            12 Kỳ Kế Toán
          </span>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '12px', fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <th
                  style={{
                    position: 'sticky',
                    left: 0,
                    background: '#f8fafc',
                    zIndex: 3,
                    padding: '9px 12px',
                    textAlign: 'left',
                    minWidth: '105px',
                    fontWeight: 700,
                    fontFamily: 'system-ui, sans-serif',
                    borderBottom: '1px solid #e2e8f0',
                    borderRight: '1px solid #e2e8f0',
                  }}
                >
                  Kỳ Kế Toán
                </th>
                {trend12m.rows.map((r) => (
                  <th
                    key={r.key}
                    style={{
                      padding: '9px 8px',
                      textAlign: 'center',
                      minWidth: '150px',
                      fontWeight: 700,
                      borderBottom: '1px solid #e2e8f0',
                      borderRight: '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ color: '#0f172a', fontFamily: 'system-ui, sans-serif', fontSize: '12px', lineHeight: 1.35 }}>{r.label}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>({r.accountPattern})</div>
                  </th>
                ))}
                <th
                  style={{
                    padding: '9px 12px',
                    textAlign: 'right',
                    minWidth: '145px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontWeight: 700,
                    borderBottom: '1px solid #e2e8f0',
                    borderLeft: '1px solid #bfdbfe',
                  }}
                >
                  TỔNG THÁNG
                </th>
              </tr>
            </thead>

            <tbody style={{ color: '#1e293b' }}>
              {MONTH_NAMES.map((monthName, mIdx) => {
                const monthNum = mIdx + 1
                const monthTotal = monthlyTotals[mIdx] ?? 0

                return (
                  <tr
                    key={monthNum}
                    style={{
                      background: mIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    {/* Cột tháng bên trái */}
                    <td
                      style={{
                        position: 'sticky',
                        left: 0,
                        background: mIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        zIndex: 2,
                        padding: '9px 12px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: '#0284c7',
                        fontFamily: 'system-ui, sans-serif',
                        borderBottom: '1px solid #f1f5f9',
                        borderRight: '1px solid #e2e8f0',
                        boxShadow: '2px 0 5px rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      {monthName}
                    </td>

                    {/* Các cột khoản mục */}
                    {trend12m.rows.map((r) => {
                      const mVal = r.months[mIdx]
                      const valNum = mVal ? moneyToNumber(mVal) : 0
                      const isAnomaly = r.anomalyMonths.includes(monthNum)

                      return (
                        <td
                          key={r.key}
                          style={{
                            padding: '9px 10px',
                            textAlign: 'right',
                            borderBottom: '1px solid #f1f5f9',
                            borderRight: '1px solid #f8fafc',
                            background: 'transparent',
                            fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace',
                          }}
                        >
                          {valNum === 0 ? (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          ) : isAnomaly ? (
                            <AnomalyCell
                              value={fmtMoneyNum(valNum)}
                              note={
                                r.cellNotes?.[monthNum] ??
                                `Biến động đột biến T${String(monthNum).padStart(2, '0')} — rà soát chứng từ phát sinh lớn / cut-off.`
                              }
                              alignRight={mIdx >= 9}
                            />
                          ) : (
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                              {fmtMoneyNum(valNum)}
                            </span>
                          )}
                        </td>
                      )
                    })}

                    {/* Cột tổng phát sinh tháng */}
                    <td
                      style={{
                        padding: '9px 12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#1d4ed8',
                        background: '#eff6ff',
                        borderBottom: '1px solid #e2e8f0',
                        borderLeft: '1px solid #bfdbfe',
                        fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {monthTotal > 0 ? fmtMoneyNum(monthTotal) : '-'}
                    </td>
                  </tr>
                )
              })}

              {/* Hàng cuối: TỔNG CỘNG CẢ NĂM */}
              <tr
                style={{
                  background: '#f8fafc',
                  fontWeight: 700,
                  textAlign: 'right',
                }}
              >
                <td
                  style={{
                    position: 'sticky',
                    left: 0,
                    background: '#f8fafc',
                    zIndex: 2,
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontFamily: 'system-ui, sans-serif',
                    borderRight: '1px solid #e2e8f0',
                    borderTop: '2px solid #cbd5e1',
                    color: '#0f172a',
                  }}
                >
                  TỔNG CỘNG CẢ NĂM
                </td>

                {trend12m.rows.map((r) => {
                  const totalNum = moneyToNumber(r.total)
                  return (
                    <td
                      key={r.key}
                      style={{
                        padding: '10px 10px',
                        borderTop: '2px solid #cbd5e1',
                        borderRight: '1px solid #f8fafc',
                        color: totalNum === 0 ? '#94a3b8' : '#0f172a',
                        fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {totalNum === 0 ? '-' : fmtMoneyNum(totalNum)}
                    </td>
                  )
                })}

                {/* Tổng dòng chót góc dưới cùng bên phải */}
                <td
                  style={{
                    padding: '10px 12px',
                    fontWeight: 800,
                    color: '#1d4ed8',
                    background: '#eff6ff',
                    borderTop: '2px solid #93c5fd',
                    borderLeft: '1px solid #bfdbfe',
                    fontSize: '13px',
                    fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {grandYearTotal > 0 ? fmtMoneyNum(grandYearTotal) : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {data.expenseDetail && (
        <ExpenseDetailSection sell={data.expenseDetail.sell} admin={data.expenseDetail.admin} />
      )}
    </div>
  )
}
