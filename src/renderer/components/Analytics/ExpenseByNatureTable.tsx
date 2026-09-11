import { useState } from 'react'
import { useApp } from '../../state/store'
import type { ExpenseByNatureReport } from '../../../domain/analytics/types'
import { IconCheck, IconAlert, IconFileSpreadsheet } from '../Icons'
interface Props {
  report: ExpenseByNatureReport
}

function fmtMoney(val: number): string {
  if (val === 0) return '-'
  return Math.round(val).toLocaleString('vi-VN')
}

export function ExpenseByNatureTable({ report }: Props): JSX.Element {
  const engagement = useApp((s) => s.engagement)
  const [viewMode, setViewMode] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT')
  const [isExporting, setIsExporting] = useState(false)
  const { rows, annualTotals, bctcReconciliation } = report
  const recon = bctcReconciliation

  async function handleExportExcel(): Promise<void> {
    if (!window.auditsoft?.exportExpenseByNature) return
    setIsExporting(true)
    try {
      const yr = engagement?.fiscalYearEnd?.slice(-4) || '2026'
      const client = engagement?.clientName || 'Doanh nghiệp kiểm toán'
      const res = await window.auditsoft.exportExpenseByNature({
        report,
        clientName: client,
        fiscalYear: yr,
        suggestedName: `MaTran-ChiPhi-YeuTo-12M-${yr}.xlsx`,
      })
      if (res.ok && res.outPath) {
        if (window.auditsoft.showItemInFolder) {
          await window.auditsoft.showItemInFolder(res.outPath)
        } else if (window.auditsoft.openPath) {
          await window.auditsoft.openPath(res.outPath)
        }
      }
    } catch (err) {
      console.error('Lỗi xuất Excel ma trận chi phí yếu tố:', err)
    } finally {
      setIsExporting(false)
    }
  }
  const renderCell = (val: number, total: number) => {
    if (val === 0) return <span style={{ color: '#94a3b8' }}>-</span>
    if (viewMode === 'PERCENT' && total > 0) {
      const pct = ((val / total) * 100).toFixed(1)
      return <span style={{ fontWeight: 600 }}>{pct}%</span>
    }
    return fmtMoney(val)
  }

  return (
    <div className="nature-matrix-container">
      {/* ── Header Bar ── */}
      <div className="nature-matrix-head">
        <div className="nature-head-left">
          <div className="nature-title-row">
            <h3 className="nature-matrix-title">
              Ma Trận Chi Phí Theo Yếu Tố 12 Tháng &amp; Cân Đối Thuyết Minh BCTC
            </h3>
            <span className="nature-standard-badge">
              CHUẨN MỰC VAS 01 / THÔNG TƯ 200 (MỤC 28)
            </span>
          </div>
          <div className="nature-matrix-subtitle">
            Bóc tách 5 yếu tố chi phí đầu vào thực tế • Kiểm tra phương trình cân đối luân chuyển kho 154, 155 và kết chuyển P&amp;L 911
          </div>
        </div>

        <div className="nature-head-right">
          {/* Balance Status Badge */}
          {recon.isBalanced ? (
            <div className="nature-balance-tag balanced" title="Chi phí theo yếu tố cân đối 100% với chi phí kết chuyển 911 và biến động dở dang/thành phẩm">
              <IconCheck size={13} />
              <span>YẾU TỐ CHI PHÍ: 0 đ (Khớp Chuẩn 100%)</span>
            </div>
          ) : (
            <div className="nature-balance-tag unbalanced" title="Có độ lệch giữa tổng chi phí yếu tố luân chuyển với chi phí kết chuyển 911">
              <IconAlert size={13} />
              <span>Độ lệch: {fmtMoney(recon.difference)} đ</span>
            </div>
          )}

          {/* View Mode Toggle & Export Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

            <button
              type="button"
              className="btn-export-nature-excel"
              disabled={isExporting}
              onClick={async () => {
                if (!window.auditsoft?.exportExpenseByNature) return
                try {
                  setIsExporting(true)
                  await window.auditsoft.exportExpenseByNature({
                    report,
                    clientName: 'Doanh nghiệp kiểm toán',
                    fiscalYear: '2026',
                  })
                } catch {
                  // ignore
                } finally {
                  setIsExporting(false)
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#dcfce7'
                e.currentTarget.style.borderColor = '#86efac'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f0fdf4'
                e.currentTarget.style.borderColor = '#bbf7d0'
              }}
              title="Xuất Ma trận chi phí theo yếu tố dọc-ngang kèm chi tiết tài khoản ra tệp Excel"
            >
              <IconFileSpreadsheet size={15} />
              <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel Ma Trận'}</span>
            </button>
          </div>
        </div>
      </div>
      {/* ── Grid Layout: Matrix 12M + Reconciliation Card ── */}
      <div className="nature-grid-layout">
        {/* Panel 1: Ma Trận 12 Tháng Theo 5 Yếu Tố */}
        <div className="nature-matrix-wrap">
          <table className="nature-table">
            <thead>
              <tr className="th-group-row">
                <th rowSpan={2} className="th-sticky-col">Kỳ Kế Toán</th>
                <th colSpan={5} style={{ background: '#f0fdf4', color: '#166534' }}>
                  5 YẾU TỐ CHI PHÍ ĐẦU VÀO PHÁT SINH TRONG KỲ
                </th>
                <th rowSpan={2} className="th-subtotal" title="Tổng 5 yếu tố chi phí phát sinh trong tháng">
                  TỔNG YẾU TỐ
                </th>
              </tr>
              <tr className="th-sub-row">
                <th title="Chi phí Nguyên liệu, vật liệu (621, 6272, 6412, 6422, đối ứng 152)">Nguyên Vật Liệu</th>
                <th title="Chi phí Nhân công & Trích theo lương (622, 6271, 6411, 6421, 334, 338)">Nhân Công</th>
                <th title="Chi phí Khấu hao TSCĐ (6274, 6414, 6424, đối ứng 214)">Khấu Hao</th>
                <th title="Chi phí Dịch vụ mua ngoài (6277, 6417, 6427)">Dịch Vụ Ngoài</th>
                <th title="Chi phí khác bằng tiền (6278, 6418, 6428)">Khác Bằng Tiền</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} className="nature-row">
                  <td className="td-sticky-col">
                    <strong>{r.monthLabel}</strong>
                  </td>
                  <td className="td-num">{renderCell(r.rawMaterials, annualTotals.totalNature)}</td>
                  <td className="td-num">{renderCell(r.labor, annualTotals.totalNature)}</td>
                  <td className="td-num">{renderCell(r.depreciation, annualTotals.totalNature)}</td>
                  <td className="td-num">{renderCell(r.outsideServices, annualTotals.totalNature)}</td>
                  <td className="td-num">{renderCell(r.otherCash, annualTotals.totalNature)}</td>
                  <td className="td-num td-subtotal">
                    <strong>{renderCell(r.totalNature, annualTotals.totalNature)}</strong>
                  </td>
                </tr>
              ))}

              {/* Annual Totals Row */}
              <tr className="nature-total-row">
                <td className="td-sticky-col td-total-label">CẢ NĂM</td>
                <td className="td-num">{fmtMoney(annualTotals.rawMaterials)}</td>
                <td className="td-num">{fmtMoney(annualTotals.labor)}</td>
                <td className="td-num">{fmtMoney(annualTotals.depreciation)}</td>
                <td className="td-num">{fmtMoney(annualTotals.outsideServices)}</td>
                <td className="td-num">{fmtMoney(annualTotals.otherCash)}</td>
                <td className="td-num td-subtotal">
                  <strong>{fmtMoney(annualTotals.totalNature)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Panel 2: Bảng Cân Đối Thuyết Minh BCTC (Khớp 100% Ảnh Thực Tế) */}
        <div className="nature-recon-card">
          <div className="recon-card-head">
            <h4 className="recon-card-title">BẢNG ĐỐI CHIẾU THUYẾT MINH BCTC</h4>
            <span className="recon-tag">MỤC CHI PHÍ THEO YẾU TỐ</span>
          </div>

          <div className="recon-table-wrap">
            <table className="recon-table">
              <tbody>
                {recon.commercialCogs > 0 && (
                  <tr>
                    <td className="recon-label">Giá vốn kinh doanh thương mại (TK 156)</td>
                    <td className="recon-num">{fmtMoney(recon.commercialCogs)}</td>
                  </tr>
                )}
                <tr>
                  <td className="recon-label">Chi phí nguyên liệu, vật liệu</td>
                  <td className="recon-num">{fmtMoney(recon.rawMaterials)}</td>
                </tr>
                <tr>
                  <td className="recon-label">Chi phí nhân công</td>
                  <td className="recon-num">{fmtMoney(recon.labor)}</td>
                </tr>
                <tr>
                  <td className="recon-label">Chi phí khấu hao tài sản cố định</td>
                  <td className="recon-num">{fmtMoney(recon.depreciation)}</td>
                </tr>
                <tr>
                  <td className="recon-label">Chi phí dịch vụ mua ngoài</td>
                  <td className="recon-num">{fmtMoney(recon.outsideServices)}</td>
                </tr>
                <tr>
                  <td className="recon-label">Chi phí khác bằng tiền</td>
                  <td className="recon-num">{fmtMoney(recon.otherCash)}</td>
                </tr>
                <tr className="recon-row-sum">
                  <td className="recon-label bold red">CỘNG 5 YẾU TỐ CHI PHÍ</td>
                  <td className="recon-num bold red">{fmtMoney(recon.totalNatureCost)}</td>
                </tr>

                {/* Luân chuyển kho 154 và 155 */}
                <tr className="recon-row-divider">
                  <td className="recon-label">Cộng: Chi phí SXKD dở dang đầu năm (TK 154 ĐK)</td>
                  <td className="recon-num">{recon.wipOpening154 > 0 ? fmtMoney(recon.wipOpening154) : '-'}</td>
                </tr>
                <tr>
                  <td className="recon-label">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Tồn kho thành phẩm đầu năm (TK 155 ĐK)</td>
                  <td className="recon-num">{recon.finishedOpening155 > 0 ? fmtMoney(recon.finishedOpening155) : '-'}</td>
                </tr>
                <tr>
                  <td className="recon-label">Trừ: Chi phí SXKD dở dang cuối năm (TK 154 CK)</td>
                  <td className="recon-num">{recon.wipClosing154 > 0 ? `(${fmtMoney(recon.wipClosing154)})` : '(-)'}</td>
                </tr>
                <tr>
                  <td className="recon-label">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Tồn kho thành phẩm cuối năm (TK 155 CK)</td>
                  <td className="recon-num">{recon.finishedClosing155 > 0 ? `(${fmtMoney(recon.finishedClosing155)})` : '(-)'}</td>
                </tr>
                {/* Tổng chi phí SXKD tính toán */}
                <tr className="recon-row-total">
                  <td className="recon-label bold">Tổng cộng chi phí sản xuất kinh doanh trong kỳ</td>
                  <td className="recon-num bold">{fmtMoney(recon.calculatedTotalOperatingCost)}</td>
                </tr>

                {/* Tổng chi phí kết chuyển 911 (Sổ kế toán) */}
                <tr className="recon-row-sub">
                  <td className="recon-label muted">
                    <em>(Đối ứng sổ kế toán: Nợ 911 / Có 632, 641, 642)</em>
                  </td>
                  <td className="recon-num muted">
                    <em>{fmtMoney(recon.totalTransferred911Cost)}</em>
                  </td>
                </tr>

                {/* YẾU TỐ CHI PHÍ (Kiểm tra chênh lệch) */}
                <tr className="recon-row-diff">
                  <td className="recon-label bold">
                    <span className="diff-title">YẾU TỐ CHI PHÍ (ĐỘ LỆCH KIỂM TRA)</span>
                  </td>
                  <td className="recon-num bold">
                    <span className={recon.isBalanced ? 'diff-val balanced' : 'diff-val unbalanced'}>
                      {recon.isBalanced ? '0 đ' : `${fmtMoney(recon.difference)} đ`}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="recon-footer-notes">
            {recon.isBalanced ? (
              <span className="recon-note-ok" style={{ color: '#047857', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                ✓ <strong>Khớp 100%:</strong> Số liệu 5 yếu tố chi phí thuần và biến động tồn kho đã cân đối hoàn hảo với tổng chi phí sản xuất kinh doanh P&amp;L (đã bù trừ các bút toán kết chuyển ngược và giảm giá vốn).
              </span>
            ) : (
              <span className="recon-note-warn">
                ⚠️ <strong>Điểm lưu ý:</strong> Chênh lệch {fmtMoney(recon.difference)} đ. Đang rà soát các bút toán hoàn nhập chi phí, xuất dùng nội bộ hoặc giảm giá vốn trực tiếp.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
