import { useState } from 'react'
import type { GlAnalyticsResult } from '../../../domain/analytics/types'
import { moneyToNumber } from '../../../domain/money'
import { RevenueCogsComboChart } from './charts/RevenueCogsComboChart'
import { CogsStructureStackedChart } from './charts/CogsStructureStackedChart'
import { OpexRatioAreaChart } from './charts/OpexRatioAreaChart'
import { ProfitWaterfallChart } from './charts/ProfitWaterfallChart'
import { SmartAuditAlerts } from './SmartAuditAlerts'

interface Props {
  data: GlAnalyticsResult
}

type ChartViewKey = 'combo' | 'cogs_struct' | 'opex' | 'waterfall'

function fmtMoneyNum(v: number): string {
  return Math.round(v).toLocaleString('vi-VN')
}

const MONTH_NAMES = [
  'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04',
  'Tháng 05', 'Tháng 06', 'Tháng 07', 'Tháng 08',
  'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12',
]
export function GlAnalyticsTab({ data }: Props): JSX.Element {
  const { ebitda, relatedParties, pareto, trend12m, correlations } = data
  const [activeChartView, setActiveChartView] = useState<ChartViewKey>('combo')

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', color: '#0f172a' }}>
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

      {/* ── Grid 2: EBITDA Chi Tiết & Bên Liên Quan ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        {/* Panel EBITDA */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Khoản Mục</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Căn Cứ</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Số Tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: 'monospace', color: '#1e293b' }}>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', fontFamily: 'sans-serif' }}>Lợi nhuận thuần từ HĐKD</td>
                <td style={{ padding: '8px 10px', color: '#64748b', fontFamily: 'sans-serif' }}>Mã số 30 (KQKD)</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtMoneyNum(opProfitNum)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', fontFamily: 'sans-serif' }}>Khấu hao tài sản cố định</td>
                <td style={{ padding: '8px 10px', color: '#64748b', fontFamily: 'sans-serif' }}>Có TK 214</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtMoneyNum(deprNum)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', fontFamily: 'sans-serif' }}>Chi phí lãi vay phát sinh</td>
                <td style={{ padding: '8px 10px', color: '#64748b', fontFamily: 'sans-serif' }}>Nợ TK 635</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtMoneyNum(fExpNum)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', fontFamily: 'sans-serif' }}>Lãi tiền gửi, cho vay</td>
                <td style={{ padding: '8px 10px', color: '#64748b', fontFamily: 'sans-serif' }}>Có TK 515</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>({fmtMoneyNum(fIncNum)})</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#eff6ff', fontWeight: 700 }}>
                <td style={{ padding: '8px 10px', color: '#1d4ed8', fontFamily: 'sans-serif' }}>EBITDA Kỳ Này</td>
                <td style={{ padding: '8px 10px', color: '#1d4ed8', fontFamily: 'sans-serif' }}>NĐ 132/2020</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#1d4ed8' }}>{fmtMoneyNum(ebitdaNum)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>
                <td style={{ padding: '8px 10px', fontFamily: 'sans-serif' }}>Mức trần lãi vay được trừ (30%)</td>
                <td style={{ padding: '8px 10px', color: '#64748b', fontFamily: 'sans-serif' }}>30% × EBITDA</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtMoneyNum(cap30Num)}</td>
              </tr>
              <tr style={{ background: ebitda.isOverCap ? '#fef2f2' : 'transparent', fontWeight: 700, color: ebitda.isOverCap ? '#b91c1c' : '#047857' }}>
                <td style={{ padding: '8px 10px', fontFamily: 'sans-serif' }}>Lãi vay vượt trần (Chỉ tiêu B4)</td>
                <td style={{ padding: '8px 10px', fontFamily: 'sans-serif' }}>Chi phí không được trừ</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtMoneyNum(disallowedNum)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '10px', lineHeight: 1.45 }}>
            [Lưu ý] {ebitda.note}
          </div>
        </div>

        {/* Panel Bên Liên Quan */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Nghi Ngờ Giao Dịch Bên Liên Quan (VSA 550)</span>
            <span
              style={{
                fontSize: '11px',
                background: relatedParties.length > 0 ? '#fffbeb' : '#ecfdf5',
                color: relatedParties.length > 0 ? '#b45309' : '#047857',
                border: `1px solid ${relatedParties.length > 0 ? '#fde68a' : '#a7f3d0'}`,
                padding: '3px 8px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              {relatedParties.length} cảnh báo
            </span>
          </div>
          {relatedParties.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#059669', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              Không phát hiện nghiệp vụ cho vay hoặc mượn vốn 0% lãi suất bất thường trên sổ NKC.
            </div>
          ) : (
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '8px 10px', fontWeight: 600 }}>Đối tượng</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600 }}>Loại</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Số Tiền</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600 }}>Cảnh báo</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedParties.map((rp) => (
                    <tr key={rp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px' }}>
                        <b>{rp.name}</b>
                        {rp.objectCode && <div style={{ fontSize: '11px', color: '#64748b' }}>Mã: {rp.objectCode}</div>}
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: '11.5px', color: '#0284c7', fontWeight: 600 }}>
                        {rp.type === 'ZERO_INTEREST_LENDING' && 'Cho vay 0%'}
                        {rp.type === 'ZERO_INTEREST_BORROWING' && 'Mượn vốn 0%'}
                        {rp.type === 'UNRESOLVED_ADVANCE' && 'Tạm ứng lớn'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                        {fmtMoneyNum(rp.totalAmount ? moneyToNumber(rp.totalAmount) : 0)}
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: '11.5px', color: '#b45309' }}>
                        {rp.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Grid 2: Pareto Khách hàng & Nhà cung cấp ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        {/* Top Khách Hàng */}
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
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Top Khách Hàng (Tỷ Trọng Doanh Thu TK 511)
            </div>
            {pareto.customerConcentrationRatio1 > 30 && (
              <span style={{ fontSize: '10.5px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Tập trung cao ({pareto.customerConcentrationRatio1}%)
              </span>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Khách Hàng</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Doanh Thu</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Tỷ Trọng %</th>
                <th style={{ padding: '8px 10px', width: '90px', fontWeight: 600 }}>Tích Lũy</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: 'monospace', color: '#1e293b' }}>
              {pareto.topCustomers.map((c) => (
                <tr key={c.rank} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'sans-serif', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{fmtMoneyNum(moneyToNumber(c.amount))}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{c.percentage}%</td>
                  <td style={{ padding: '8px 10px' }}>
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
            padding: '18px 20px',
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Nhà Cung Cấp</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Giá Trị Mua</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Tỷ Trọng %</th>
                <th style={{ padding: '8px 10px', width: '90px', fontWeight: 600 }}>Tích Lũy</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: 'monospace', color: '#1e293b' }}>
              {pareto.topSuppliers.map((s) => (
                <tr key={s.rank} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'sans-serif', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{fmtMoneyNum(moneyToNumber(s.amount))}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{s.percentage}%</td>
                  <td style={{ padding: '8px 10px' }}>
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

      {/* ── Section 4: Bộ Đồ Thị Tài Chính Tương Quan VSA 520 (Pure SVG SaaS Grade) ── */}
      {correlations && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Sub-View Switcher Tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '7px',
              border: '1px solid #e2e8f0',
              gap: '4px',
              width: 'fit-content',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveChartView('combo')}
              style={{
                background: activeChartView === 'combo' ? '#ffffff' : 'transparent',
                color: activeChartView === 'combo' ? '#0284c7' : '#64748b',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: activeChartView === 'combo' ? 700 : 600,
                boxShadow: activeChartView === 'combo' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Tương Quan Doanh Thu — Giá Vốn &amp; Biên Lãi Gộp
            </button>

            <button
              type="button"
              onClick={() => setActiveChartView('cogs_struct')}
              style={{
                background: activeChartView === 'cogs_struct' ? '#ffffff' : 'transparent',
                color: activeChartView === 'cogs_struct' ? '#0284c7' : '#64748b',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: activeChartView === 'cogs_struct' ? 700 : 600,
                boxShadow: activeChartView === 'cogs_struct' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Bóc Tách Cấu Trúc Giá Vốn (621/622/627)
            </button>

            <button
              type="button"
              onClick={() => setActiveChartView('opex')}
              style={{
                background: activeChartView === 'opex' ? '#ffffff' : 'transparent',
                color: activeChartView === 'opex' ? '#0284c7' : '#64748b',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: activeChartView === 'opex' ? 700 : 600,
                boxShadow: activeChartView === 'opex' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Tỷ Lệ Chi Phí Hoạt Động (OPEX / DT)
            </button>

            <button
              type="button"
              onClick={() => setActiveChartView('waterfall')}
              style={{
                background: activeChartView === 'waterfall' ? '#ffffff' : 'transparent',
                color: activeChartView === 'waterfall' ? '#0284c7' : '#64748b',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: activeChartView === 'waterfall' ? 700 : 600,
                boxShadow: activeChartView === 'waterfall' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Cầu Nối Lợi Nhuận Waterfall
            </button>
          </div>

          {/* Active Chart Component */}
          {activeChartView === 'combo' && <RevenueCogsComboChart report={correlations.grossMargin} />}
          {activeChartView === 'cogs_struct' && <CogsStructureStackedChart report={correlations.cogsStructure} />}
          {activeChartView === 'opex' && <OpexRatioAreaChart report={correlations.opexRatios} />}
          {activeChartView === 'waterfall' && <ProfitWaterfallChart steps={correlations.waterfall} />}
        </div>
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
                      textAlign: 'right',
                      minWidth: '135px',
                      fontWeight: 700,
                      borderBottom: '1px solid #e2e8f0',
                      borderRight: '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ color: '#0f172a', fontFamily: 'system-ui, sans-serif', fontSize: '12px' }}>{r.label}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>({r.accountPattern})</div>
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

            <tbody>
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
                        padding: '8px 12px',
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
                            padding: '8px 8px',
                            textAlign: 'right',
                            borderBottom: '1px solid #f1f5f9',
                            borderRight: '1px solid #f8fafc',
                            background: isAnomaly ? '#fffbeb' : 'transparent',
                          }}
                        >
                          {valNum === 0 ? (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          ) : isAnomaly ? (
                            <span
                              style={{
                                color: '#b45309',
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                display: 'inline-block',
                              }}
                            >
                              {fmtMoneyNum(valNum)} (!)
                            </span>
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
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#1d4ed8',
                        background: '#eff6ff',
                        borderBottom: '1px solid #e2e8f0',
                        borderLeft: '1px solid #bfdbfe',
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
                    padding: '9px 12px',
                    textAlign: 'left',
                    color: '#0f172a',
                    fontFamily: 'system-ui, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    borderRight: '1px solid #e2e8f0',
                    borderTop: '2px solid #cbd5e1',
                  }}
                >
                  CẢ NĂM
                </td>

                {trend12m.rows.map((r) => (
                  <td
                    key={r.key}
                    style={{
                      padding: '9px 8px',
                      textAlign: 'right',
                      color: '#0f172a',
                      fontFamily: 'monospace',
                      borderTop: '2px solid #cbd5e1',
                      borderRight: '1px solid #f1f5f9',
                      fontWeight: 700,
                    }}
                  >
                    {fmtMoneyNum(moneyToNumber(r.total))}
                  </td>
                ))}

                <td
                  style={{
                    padding: '9px 12px',
                    textAlign: 'right',
                    color: '#1d4ed8',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    background: '#eff6ff',
                    borderTop: '2px solid #3b82f6',
                    borderLeft: '1px solid #bfdbfe',
                  }}
                >
                  {fmtMoneyNum(grandYearTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Smart Audit Alerts */}
        <div style={{ marginTop: '14px' }}>
          <SmartAuditAlerts notes={trend12m.warningNotes} />
        </div>
      </div>
    </div>
  )
}
