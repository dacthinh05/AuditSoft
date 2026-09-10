import { useState, useMemo } from 'react'
import type { Cogs12MMatrixReport } from '../../../domain/analytics/types'
import { moneyToNumber } from '../../../domain/money'
import { IconAlert } from '../Icons'

interface Props {
  matrix: Cogs12MMatrixReport
}

function fmtMoneyNum(v: number): string {
  if (v === 0) return '-'
  return Math.round(v).toLocaleString('vi-VN')
}

export function CogsMatrix12MTable({ matrix }: Props): JSX.Element {
  const [hideEmpty, setHideEmpty] = useState(true)
  const [viewMode, setViewMode] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT')

  const totals = matrix.annualTotals

  // Xác định các cột có phát sinh số liệu cả năm
  const colActivity = useMemo(() => {
    return {
      mat621: matrix.rows.some((r) => moneyToNumber(r.directMaterials621) > 0),
      lab622: matrix.rows.some((r) => moneyToNumber(r.directLabor622) > 0),
      ovh627: matrix.rows.some((r) => moneyToNumber(r.overhead627) > 0),
      wip154: matrix.rows.some((r) => moneyToNumber(r.wipIncurred154) > 0),
      purch156: matrix.rows.some((r) => moneyToNumber(r.inventoryPurchased156) > 0),
      cogsTrade156: matrix.rows.some((r) => moneyToNumber(r.cogsTradeGoods156) > 0),
      cogsFinished155: matrix.rows.some((r) => moneyToNumber(r.cogsFinishedGoods155) > 0),
      cogsWip154: matrix.rows.some((r) => moneyToNumber(r.cogsServiceWip154) > 0),
      cogsOther: matrix.rows.some((r) => moneyToNumber(r.cogsDirectOther) > 0),
    }
  }, [matrix.rows])

  // Lọc hiển thị: nếu hideEmpty = true, chỉ hiện cột có tiền
  const showMat = !hideEmpty || colActivity.mat621
  const showLab = !hideEmpty || colActivity.lab622
  const showOvh = !hideEmpty || colActivity.ovh627
  const showWip = !hideEmpty || colActivity.wip154
  const showPurch = !hideEmpty || colActivity.purch156

  const showTrade = !hideEmpty || colActivity.cogsTrade156
  const showFinished = !hideEmpty || colActivity.cogsFinished155
  const showCogsWip = !hideEmpty || colActivity.cogsWip154
  const showOther = !hideEmpty || colActivity.cogsOther

  // Đếm colSpan cho header nhóm
  const inputColCount = [showMat, showLab, showOvh, showWip, showPurch].filter(Boolean).length + 1 // +1 for Tổng CPSX
  const cogsColCount = [showTrade, showFinished, showCogsWip, showOther].filter(Boolean).length + 1 // +1 for Tổng 632

  const annualCogsTotal = moneyToNumber(totals.totalCogs632)
  const annualProdTotal = moneyToNumber(totals.totalProductionCost)

  const renderCell = (num: number, colTotal: number) => {
    if (num === 0) return <span style={{ color: '#94a3b8' }}>-</span>
    if (viewMode === 'PERCENT') {
      const pct = colTotal > 0 ? ((num / colTotal) * 100).toFixed(1) : '0'
      return <span style={{ fontWeight: 600 }}>{pct}%</span>
    }
    return fmtMoneyNum(num)
  }

  const businessTypeBadge = {
    MANUFACTURING: { label: 'SẢN XUẤT / XÂY LẮP (TK 621, 622, 627, 154)', bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
    TRADING: { label: 'THƯƠNG MẠI THUẦN TÚY (TK 156 ➔ 632)', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    HYBRID: { label: 'SẢN XUẤT & THƯƠNG MẠI HỖN HỢP', bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  }[matrix.businessType]

  return (
    <div className="cogs-matrix-container">
      {/* ── Header Bar ── */}
      <div className="cogs-matrix-head">
        <div className="cogs-head-left">
          <div className="cogs-title-row">
            <h3 className="cogs-matrix-title">
              Ma Trận Chi Phí Cấu Thành Giá Vốn 12 Tháng (Trước Kết Chuyển 911)
            </h3>
            <span
              className="cogs-business-badge"
              style={{ background: businessTypeBadge.bg, color: businessTypeBadge.color, borderColor: businessTypeBadge.border }}
            >
              {businessTypeBadge.label}
            </span>
          </div>
          <div className="cogs-matrix-subtitle">
            Bóc tách dòng chảy chi phí đầu vào thực tế và giá vốn xuất bán 632 từng tháng • Phát hiện treo chi phí dở dang hoặc dồn giá vốn cuối năm
          </div>
        </div>

        <div className="cogs-head-right">
          {/* Toggle Hide Empty */}
          <button
            type="button"
            className={`btn-cogs-toggle ${hideEmpty ? 'active' : ''}`}
            onClick={() => setHideEmpty(!hideEmpty)}
            title="Ẩn các cột tài khoản không có số liệu phát sinh cả năm"
          >
            {hideEmpty ? '✓ Đang ẩn cột rỗng' : 'Hiện đủ mọi cột'}
          </button>

          {/* View Mode Segmented */}
          <div className="cogs-view-mode-pills">
            <button
              type="button"
              className={`pill-btn ${viewMode === 'AMOUNT' ? 'active' : ''}`}
              onClick={() => setViewMode('AMOUNT')}
            >
              Số tiền (VNĐ)
            </button>
            <button
              type="button"
              className={`pill-btn ${viewMode === 'PERCENT' ? 'active' : ''}`}
              onClick={() => setViewMode('PERCENT')}
            >
              Tỷ trọng %
            </button>
          </div>
        </div>
      </div>

      {/* ── Table Grid ── */}
      <div className="cogs-matrix-table-wrap">
        <table className="cogs-matrix-table">
          <thead>
            {/* Header Level 1: Grouped Columns */}
            <tr className="th-group-row">
              <th rowSpan={2} className="th-sticky-col">Kỳ Kế Toán</th>
              <th colSpan={inputColCount} className="th-group-incurred">
                CHI PHÍ ĐẦU VÀO PHÁT SINH THỰC TẾ TRONG KỲ (TRƯỚC KẾT CHUYỂN)
              </th>
              <th colSpan={cogsColCount} className="th-group-cogs">
                GIÁ VỐN HẠCH TOÁN XUẤT BÁN TRONG KỲ (NỢ TK 632)
              </th>
              <th colSpan={2} className="th-group-rev">
                DOANH THU &amp; BIÊN
              </th>
              <th rowSpan={2} className="th-audit-flag">
                CẢNH BÁO KIỂM TOÁN VSA 520
              </th>
            </tr>

            {/* Header Level 2: Specific Accounts */}
            <tr className="th-sub-row">
              {showMat && <th title="Chi phí NVL trực tiếp (Nợ 621)">NVL (621)</th>}
              {showLab && <th title="Chi phí nhân công trực tiếp (Nợ 622)">Nhân công (622)</th>}
              {showOvh && <th title="Chi phí sản xuất chung (Nợ 627)">SXC (627)</th>}
              {showWip && <th title="Chi phí SXKD dở dang tập hợp (Nợ 154)">Dở dang (154)</th>}
              {showPurch && <th title="Mua hàng hóa nhập kho (Nợ 156)">Mua 156</th>}
              <th className="th-subtotal-prod" title="Tổng chi phí SX phát sinh trong kỳ">Tổng CPSX</th>

              {showTrade && <th title="Giá vốn hàng hóa xuất bán (Nợ 632 / Có 156)">Xuất 156</th>}
              {showFinished && <th title="Giá vốn thành phẩm xuất bán (Nợ 632 / Có 155)">Xuất 155</th>}
              {showCogsWip && <th title="Giá vốn dịch vụ hoàn thành (Nợ 632 / Có 154)">Dịch vụ 154</th>}
              {showOther && <th title="Giá vốn trực tiếp / khác (Nợ 632 đối ứng khác)">Khác</th>}
              <th className="th-subtotal-cogs" title="Tổng Nợ 632 hạch toán trong kỳ">Tổng 632</th>

              <th title="Doanh thu bán hàng và cung cấp dịch vụ (Có 511)">Doanh Thu 511</th>
              <th title="Tỷ lệ % Giá vốn 632 / Doanh thu 511">% GV / DT</th>
            </tr>
          </thead>

          <tbody>
            {matrix.rows.map((r) => {
              const cogsNum = moneyToNumber(r.totalCogs632)
              const revNum = moneyToNumber(r.revenue511)
              const prodNum = moneyToNumber(r.totalProductionCost)

              return (
                <tr
                  key={r.month}
                  className={`cogs-row ${r.isLumpSumYearEnd ? 'row-lump-sum' : ''} ${r.isSuspiciousDeferred ? 'row-deferred' : ''}`}
                >
                  {/* Sticky Month */}
                  <td className="td-sticky-month">
                    <strong>{r.monthLabel}</strong>
                  </td>

                  {/* Input Incurred Columns */}
                  {showMat && <td className="td-num">{renderCell(moneyToNumber(r.directMaterials621), annualProdTotal)}</td>}
                  {showLab && <td className="td-num">{renderCell(moneyToNumber(r.directLabor622), annualProdTotal)}</td>}
                  {showOvh && <td className="td-num">{renderCell(moneyToNumber(r.overhead627), annualProdTotal)}</td>}
                  {showWip && <td className="td-num">{renderCell(moneyToNumber(r.wipIncurred154), annualProdTotal)}</td>}
                  {showPurch && <td className="td-num">{renderCell(moneyToNumber(r.inventoryPurchased156), annualProdTotal)}</td>}
                  <td className="td-num td-subtotal-prod">{renderCell(prodNum, annualProdTotal)}</td>

                  {/* COGS Output Columns */}
                  {showTrade && <td className="td-num">{renderCell(moneyToNumber(r.cogsTradeGoods156), annualCogsTotal)}</td>}
                  {showFinished && <td className="td-num">{renderCell(moneyToNumber(r.cogsFinishedGoods155), annualCogsTotal)}</td>}
                  {showCogsWip && <td className="td-num">{renderCell(moneyToNumber(r.cogsServiceWip154), annualCogsTotal)}</td>}
                  {showOther && <td className="td-num">{renderCell(moneyToNumber(r.cogsDirectOther), annualCogsTotal)}</td>}
                  <td className="td-num td-subtotal-cogs">
                    <strong>{renderCell(cogsNum, annualCogsTotal)}</strong>
                  </td>

                  {/* Revenue & Ratio */}
                  <td className="td-num td-rev">{fmtMoneyNum(revNum)}</td>
                  <td className="td-num td-ratio">
                    {r.cogsToRevenuePct > 0 ? (
                      <span className={r.cogsToRevenuePct > 90 ? 'ratio-high' : ''}>
                        {r.cogsToRevenuePct}%
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>-</span>
                    )}
                  </td>

                  {/* Audit Flag Micro-Badge */}
                  <td className="td-audit-note" style={{ textAlign: 'center' }}>
                    {r.auditFlag ? (
                      <span
                        className={`cogs-audit-tag ${r.isLumpSumYearEnd ? 'danger' : 'warn'}`}
                        title={r.auditFlag}
                        style={{ cursor: 'help', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {r.isLumpSumYearEnd ? '🔴 Dồn giá vốn T12' : '🟠 Treo CPSX (Chưa ghi 632)'}
                      </span>
                    ) : (
                      <span className="cogs-audit-ok" title="Ghi nhận giá vốn khớp nhịp với doanh thu">✓ Khớp nhịp</span>
                    )}
                  </td>
                </tr>
              )
            })}

            {/* ── Annual Totals Row ── */}
            <tr className="cogs-total-row">
              <td className="td-sticky-month td-total-label">CẢ NĂM</td>

              {showMat && <td className="td-num">{fmtMoneyNum(moneyToNumber(totals.directMaterials621))}</td>}
              {showLab && <td className="td-num">{fmtMoneyNum(moneyToNumber(totals.directLabor622))}</td>}
              {showOvh && <td className="td-num">{fmtMoneyNum(moneyToNumber(totals.overhead627))}</td>}
              {showWip && <td className="td-num">{fmtMoneyNum(moneyToNumber(totals.wipIncurred154))}</td>}
              {showPurch && <td className="td-num">{fmtMoneyNum(moneyToNumber(totals.inventoryPurchased156))}</td>}
              <td className="td-num td-subtotal-prod">{fmtMoneyNum(annualProdTotal)}</td>

              {showTrade && <td className="td-num">{fmtMoneyNum(moneyToNumber(totals.cogsTradeGoods156))}</td>}
              {showFinished && <td className="td-num">{fmtMoneyNum(moneyToNumber(totals.cogsFinishedGoods155))}</td>}
              {showCogsWip && <td className="td-num">{fmtMoneyNum(moneyToNumber(totals.cogsServiceWip154))}</td>}
              {showOther && <td className="td-num">{fmtMoneyNum(moneyToNumber(totals.cogsDirectOther))}</td>}
              <td className="td-num td-subtotal-cogs">
                <strong>{fmtMoneyNum(annualCogsTotal)}</strong>
              </td>

              <td className="td-num td-rev">{fmtMoneyNum(moneyToNumber(totals.revenue511))}</td>
              <td className="td-num td-ratio">
                <strong>{matrix.annualPcts.annualCogsToRevenuePct}%</strong>
              </td>
              <td className="td-audit-note">
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {matrix.summaryWarnings.length > 0 ? 'Có điểm lưu ý kiểm toán' : 'Chuẩn mực'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Summary Warnings Box ── */}
      {matrix.summaryWarnings.length > 0 && (
        <div className="cogs-warning-box">
          <div className="cogs-warning-head">
            <IconAlert size={14} />
            <strong>Phát hiện trọng yếu từ Ma trận Giá vốn:</strong>
          </div>
          <ul className="cogs-warning-list">
            {matrix.summaryWarnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
