import type { IngestedTaxDeclarations } from '../../../shared/types/taxAnalytics'
import type { TaxCrossReconciliationResult } from '../../../domain/analytics/TaxCrossReconciler'
import { TaxDropZone } from './TaxDropZone'

interface Props {
  taxData: IngestedTaxDeclarations | null
  reconResult: TaxCrossReconciliationResult | null
  onFilesSelected: (filePaths: string[]) => void
  isLoading?: boolean
  /** false khi chưa có Sổ NKC: cột đối chiếu 511/334 hiển thị '-' thay vì số 0 */
  hasGlData?: boolean
}

function fmtBigInt(v: bigint | undefined | null): string {
  if (v == null) return '-'
  return v.toLocaleString('vi-VN')
}

function fmtMoneyCell(v: bigint | undefined | null): JSX.Element | string {
  if (v == null || v === 0n) return <span style={{ color: '#94a3b8' }}>-</span>
  return fmtBigInt(v)
}

export function TaxAnalyticsTab({
  taxData,
  reconResult,
  onFilesSelected,
  isLoading,
  hasGlData = true,
}: Props): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', color: '#0f172a' }}>
      {/* Dropzone nạp file XML / ZIP */}
      <TaxDropZone onFilesSelected={onFilesSelected} disabled={isLoading} />

      {isLoading && (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#0d9488', fontWeight: 600 }}>
          Đang đọc và phân tích tệp tờ khai thuế...
        </div>
      )}

      {taxData && taxData.totalFilesProcessed > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              borderTop: '3px solid #0d9488',
              borderRadius: '10px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Tệp XML đã nạp
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px', fontFamily: 'monospace' }}>
              {taxData.totalFilesProcessed}
            </div>
          </div>
          <div
            style={{
              background: '#ffffff',
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              borderTop: '3px solid #0284c7',
              borderRadius: '10px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Tờ khai GTGT 01
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px', fontFamily: 'monospace' }}>
              {taxData.vatDeclarations.length}
            </div>
          </div>
          <div
            style={{
              background: '#ffffff',
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              borderTop: '3px solid #7c3aed',
              borderRadius: '10px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Tờ khai TNCN 05
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px', fontFamily: 'monospace' }}>
              {taxData.pitDeclarations.length}
            </div>
          </div>
          <div
            style={{
              background: taxData.failedFiles.length > 0 ? '#fffbeb' : '#ffffff',
              padding: '14px 16px',
              border: `1px solid ${taxData.failedFiles.length > 0 ? '#fde68a' : '#e2e8f0'}`,
              borderTop: `3px solid ${taxData.failedFiles.length > 0 ? '#f59e0b' : '#10b981'}`,
              borderRadius: '10px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Tệp bỏ qua
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: taxData.failedFiles.length > 0 ? '#b45309' : '#059669',
                marginTop: '4px',
                fontFamily: 'monospace',
              }}
            >
              {taxData.failedFiles.length}
            </div>
          </div>
        </div>
      )}

      {/* Bảng 1: Thống Kê Thuế GTGT & Đối Chiếu Doanh Thu */}
      {reconResult && reconResult.vatRows.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span>B.1. Phát Sinh: Đối Chiếu Kê Khai Thuế GTGT &amp; Sổ Kế Toán (Mẫu E380)</span>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', fontWeight: 400 }}>
                So khớp 2 khối độc lập: Số liệu Tờ khai thuế 01/GTGT đối chiếu trực tiếp với Sổ cái TK 133 và TK 33311
              </div>
            </div>
            <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  if (window.auditsoft?.exportTaxReport && reconResult) {
                    void window.auditsoft.exportTaxReport(reconResult).then((res) => {
                      if (res.ok && res.outPath) window.auditsoft.openPath(res.outPath)
                    })
                  }
                }}
                style={{ fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px', border: '1px solid #0d9488', background: '#0d9488', color: '#fff', cursor: 'pointer' }}
              >
                Xuất Excel Mẫu E380
              </button>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  background: reconResult.vatSummary.hasDiscrepancy ? '#fef2f2' : '#ecfdf5',
                  color: reconResult.vatSummary.hasDiscrepancy ? '#b91c1c' : '#047857',
                  border: `1px solid ${reconResult.vatSummary.hasDiscrepancy ? '#fecaca' : '#a7f3d0'}`,
                }}
              >
                {reconResult.vatSummary.hasDiscrepancy ? 'Có chênh lệch đối chiếu' : 'Khớp hoàn toàn'}
              </span>
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '520px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '13px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <thead>
                {/* Tầng 1: Phân nhóm 2 Khối lớn */}
                <tr style={{ background: '#f8fafc', color: '#334155', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>
                  <th rowSpan={2} style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 4, padding: '10px 12px', textAlign: 'left', fontWeight: 700, borderRight: '1px solid #e2e8f0', width: '110px' }}>
                    Kỳ Kê Khai
                  </th>
                  <th colSpan={7} style={{ background: '#f0fdfa', color: '#0f766e', fontWeight: 800, padding: '8px 12px', borderRight: '2px solid #99f6e4', letterSpacing: '0.04em' }}>
                    KÊ KHAI THUẾ GTGT (TỜ KHAI 01/GTGT)
                  </th>
                  <th colSpan={5} style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, padding: '8px 12px', borderRight: '2px solid #bfdbfe', letterSpacing: '0.04em' }}>
                    SỔ KẾ TOÁN (SỔ NHẬT KÝ CHUNG)
                  </th>
                  <th rowSpan={2} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, minWidth: '220px' }}>
                    Ghi Chú Kiểm Toán VSA 520
                  </th>
                </tr>

                {/* Tầng 2: Các cột chi tiết */}
                <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'right', borderBottom: '1px solid #cbd5e1', fontSize: '12px' }}>
                  {/* Khối Thuế */}
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>VAT Đầu Vào [25]</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>VAT Đầu Ra [35]</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Đ/c Giảm [37]</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Đ/c Tăng [38]</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Xin Hoàn [42]</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Phải Nộp [40]</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, color: '#0f766e', background: '#f0fdfa', borderRight: '2px solid #99f6e4' }}>Số Dư [43]</th>

                  {/* Khối Sổ Sách */}
                  <th style={{ padding: '8px 10px', fontWeight: 600, background: '#eff6ff', color: '#1e40af' }}>PS Nợ 133*</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>CL Đầu Vào</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600, background: '#eff6ff', color: '#1e40af' }}>PS Có 33311</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>CL Đầu Ra</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600, borderRight: '2px solid #bfdbfe' }}>Đã Nộp (Nợ 33311)</th>
                </tr>
              </thead>

              <tbody style={{ color: '#1e293b' }}>
                {reconResult.vatRows.map((r) => {
                  const inDiff = r.inputVatDiff
                  const outDiff = r.outputVatDiff
                  const hasRowDiff = inDiff !== 0n || outDiff !== 0n

                  return (
                    <tr key={r.periodKey} style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'right', background: hasRowDiff ? '#fffbfb' : '#ffffff' }}>
                      {/* Kỳ Khai */}
                      <td style={{ position: 'sticky', left: 0, background: '#ffffff', zIndex: 2, padding: '9px 12px', textAlign: 'left', borderRight: '1px solid #e2e8f0', boxShadow: '2px 0 5px rgba(0, 0, 0, 0.02)' }}>
                        <b style={{ color: '#0f172a', fontSize: '13.5px' }}>{r.periodLabel}</b>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{r.declarationType}</div>
                      </td>

                      {/* Khối Thuế */}
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', fontWeight: 500 }}>{fmtMoneyCell(r.taxInputVat25)}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', fontWeight: 500 }}>{fmtMoneyCell(r.taxOutputVat35)}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', fontWeight: 500 }}>{fmtMoneyCell(r.adjustDecrease37)}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', fontWeight: 500 }}>{fmtMoneyCell(r.adjustIncrease38)}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', fontWeight: 500 }}>{fmtMoneyCell(r.refund42)}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', fontWeight: 500 }}>{fmtMoneyCell(r.taxPayable40)}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', fontWeight: 700, background: '#f0fdfa', color: '#0f766e', borderRight: '2px solid #99f6e4' }}>
                        {fmtMoneyCell(r.closingBalance43)}
                      </td>

                      {/* Khối Sổ Sách */}
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', background: '#eff6ff', color: '#1e40af', fontWeight: 600 }}>
                        {hasGlData ? fmtBigInt(r.glInputVat133) : <span style={{ color: '#94a3b8' }}>-</span>}
                      </td>
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', fontWeight: 700, color: inDiff !== 0n ? '#b91c1c' : '#059669' }}>
                        {inDiff !== 0n ? `${inDiff > 0n ? '+' : ''}${fmtBigInt(inDiff)}` : '-'}
                      </td>
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', background: '#eff6ff', color: '#1e40af', fontWeight: 600 }}>
                        {hasGlData ? fmtBigInt(r.glOutputVat33311) : <span style={{ color: '#94a3b8' }}>-</span>}
                      </td>
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', fontWeight: 700, color: outDiff !== 0n ? '#b91c1c' : '#059669' }}>
                        {outDiff !== 0n ? `${outDiff > 0n ? '+' : ''}${fmtBigInt(outDiff)}` : '-'}
                      </td>
                      <td style={{ padding: '9px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', borderRight: '2px solid #bfdbfe' }}>
                        {hasGlData ? fmtMoneyCell(r.glPaidVat33311) : <span style={{ color: '#94a3b8' }}>-</span>}
                      </td>

                      {/* Ghi chú */}
                      <td style={{ padding: '9px 14px', textAlign: 'left', fontSize: '12px', color: hasRowDiff ? '#b45309' : '#475569', lineHeight: 1.4 }}>
                        {r.auditNote}
                      </td>
                    </tr>
                  )
                })}

                {/* Dòng TỔNG CỘNG CẢ NĂM */}
                <tr style={{ background: '#f8fafc', fontWeight: 700, textAlign: 'right', borderTop: '2px solid #0f172a', color: '#0f172a' }}>
                  <td style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2, padding: '10px 12px', textAlign: 'left', borderRight: '1px solid #e2e8f0', letterSpacing: '0.04em' }}>
                    CỘNG CẢ NĂM
                  </td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyCell(reconResult.vatSummary.totalTaxInputVat)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyCell(reconResult.vatSummary.totalTaxOutputVat)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyCell(reconResult.vatSummary.totalAdjustDecrease37)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyCell(reconResult.vatSummary.totalAdjustIncrease38)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyCell(reconResult.vatSummary.totalRefund42)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyCell(reconResult.vatSummary.totalTaxPayable40)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', fontWeight: 800, background: '#f0fdfa', color: '#0f766e', borderRight: '2px solid #99f6e4' }}>
                    {reconResult.vatRows.length > 0 ? fmtMoneyCell(reconResult.vatRows[reconResult.vatRows.length - 1]!.closingBalance43) : '-'}
                  </td>

                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', background: '#eff6ff', color: '#1e40af' }}>{hasGlData ? fmtBigInt(reconResult.vatSummary.totalGlInputVat) : '-'}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', color: reconResult.vatSummary.totalInputVatDiff !== 0n ? '#b91c1c' : '#059669' }}>
                    {reconResult.vatSummary.totalInputVatDiff !== 0n ? fmtBigInt(reconResult.vatSummary.totalInputVatDiff) : '-'}
                  </td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', background: '#eff6ff', color: '#1e40af' }}>{hasGlData ? fmtBigInt(reconResult.vatSummary.totalGlOutputVat) : '-'}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', color: reconResult.vatSummary.totalOutputVatDiff !== 0n ? '#b91c1c' : '#059669' }}>
                    {reconResult.vatSummary.totalOutputVatDiff !== 0n ? fmtBigInt(reconResult.vatSummary.totalOutputVatDiff) : '-'}
                  </td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace', borderRight: '2px solid #bfdbfe' }}>{hasGlData ? fmtMoneyCell(reconResult.vatSummary.totalGlPaidVat33311) : '-'}</td>

                  <td style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12.5px' }}>
                    {reconResult.vatSummary.hasDiscrepancy ? 'Có chênh lệch giữa Tờ khai và Sổ kế toán' : 'Khớp đúng hoàn toàn'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bảng 2: Thống Kê Thuế TNCN & Đối Chiếu Lương */}
      {reconResult && reconResult.pitRows.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Bảng Thống Kê Thuế TNCN & Đối Chiếu Chi Phí Tiền Lương (TK 334)</span>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                background: reconResult.pitSummary.hasDiscrepancy ? '#fef2f2' : '#ecfdf5',
                color: reconResult.pitSummary.hasDiscrepancy ? '#b91c1c' : '#047857',
                border: `1px solid ${reconResult.pitSummary.hasDiscrepancy ? '#fecaca' : '#a7f3d0'}`,
              }}
            >
              {reconResult.pitSummary.hasDiscrepancy ? 'Có chênh lệch chi phí lương' : 'Khớp chi phí lương'}
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '13px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <th style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 3, padding: '10px 12px', textAlign: 'left', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>Kỳ Khai Thuế</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700 }}>Số LĐ [16]</th>
                  <th style={{ padding: '10px 10px', fontWeight: 700, background: '#f0fdfa', color: '#0f766e' }}>Tổng TNCT [21]</th>
                  <th style={{ padding: '10px 10px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}>Quỹ Lương Sổ (Có 334)</th>
                  <th style={{ padding: '10px 10px', fontWeight: 700 }}>CL Quỹ Lương</th>
                  <th style={{ padding: '10px 10px', fontWeight: 700, background: '#fdf4ff', color: '#7c3aed' }}>Thuế Đã Khấu Trừ [29]</th>
                  <th style={{ padding: '10px 10px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}>Thuế Khấu Trừ Sổ (Có 3335)</th>
                  <th style={{ padding: '10px 10px', fontWeight: 700 }}>CL Thuế TNCN</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, minWidth: '220px' }}>Ghi Chú Kiểm Toán</th>
                </tr>
              </thead>
              <tbody style={{ color: '#1e293b' }}>
                {reconResult.pitRows.map((p) => {
                  const isDiff = p.status === 'DISCREPANCY'
                  return (
                    <tr key={p.periodKey} style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                      <td style={{ position: 'sticky', left: 0, background: '#ffffff', zIndex: 2, padding: '9px 12px', textAlign: 'left', borderRight: '1px solid #e2e8f0', boxShadow: '2px 0 5px rgba(0, 0, 0, 0.02)' }}>
                        <b style={{ color: '#0f172a', fontSize: '13.5px' }}>{p.periodLabel}</b>
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 700, color: '#0f172a', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtBigInt(p.employeeCount)}</td>
                      <td style={{ padding: '9px 10px', fontWeight: 700, color: '#0f172a', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyCell(p.taxableIncome)}</td>
                      <td style={{ padding: '9px 10px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>
                        {hasGlData ? fmtBigInt(p.glPayrollExpense) : <span style={{ color: '#94a3b8' }}>-</span>}
                      </td>
                      <td
                        style={{
                          padding: '9px 10px',
                          fontWeight: 700,
                          color: p.payrollDiff !== 0n ? '#b91c1c' : '#047857',
                          fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace'
                        }}
                      >
                        {p.payrollDiff !== 0n ? `${p.payrollDiff > 0n ? '+' : ''}${fmtBigInt(p.payrollDiff)}` : '-'}
                      </td>
                      <td style={{ padding: '9px 10px', fontWeight: 700, color: '#0f172a', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyCell(p.withheldTax)}</td>
                      <td style={{ padding: '9px 10px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>
                        {hasGlData ? fmtBigInt(p.glPitWithheld) : <span style={{ color: '#94a3b8' }}>-</span>}
                      </td>
                      <td
                        style={{
                          padding: '9px 10px',
                          fontWeight: 700,
                          color: p.pitWithheldDiff !== 0n ? '#b91c1c' : '#047857',
                          fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace'
                        }}
                      >
                        {p.pitWithheldDiff !== 0n ? `${p.pitWithheldDiff > 0n ? '+' : ''}${fmtBigInt(p.pitWithheldDiff)}` : '-'}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'left', fontSize: '12px', color: isDiff ? '#b45309' : '#475569', lineHeight: 1.4 }}>
                        {p.auditNote}
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ background: '#f8fafc', fontWeight: 700, textAlign: 'right', borderTop: '2px solid #0f172a', color: '#0f172a' }}>
                  <td style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2, padding: '10px 12px', textAlign: 'left', borderRight: '1px solid #e2e8f0', letterSpacing: '0.04em' }}>
                    CỘNG CẢ NĂM
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>-</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyCell(reconResult.pitSummary.totalTaxableIncome)}</td>
                  <td style={{ padding: '10px 10px', background: '#eff6ff', color: '#1d4ed8', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>
                    {hasGlData ? fmtBigInt(reconResult.pitSummary.totalGlPayroll) : '-'}
                  </td>
                  <td style={{ padding: '10px 10px', color: reconResult.pitSummary.totalPayrollDiff !== 0n ? '#b91c1c' : '#047857', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>
                    {reconResult.pitSummary.totalPayrollDiff !== 0n ? `${reconResult.pitSummary.totalPayrollDiff > 0n ? '+' : ''}${fmtBigInt(reconResult.pitSummary.totalPayrollDiff)}` : '-'}
                  </td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>{fmtMoneyCell(reconResult.pitSummary.totalWithheldTax)}</td>
                  <td style={{ padding: '10px 10px', background: '#eff6ff', color: '#1d4ed8', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>
                    {hasGlData ? fmtBigInt(reconResult.pitSummary.totalGlPitWithheld) : '-'}
                  </td>
                  <td style={{ padding: '10px 10px', color: reconResult.pitSummary.totalPitWithheldDiff !== 0n ? '#b91c1c' : '#047857', fontFamily: 'Consolas, ui-monospace, SFMono-Regular, monospace' }}>
                    {reconResult.pitSummary.totalPitWithheldDiff !== 0n ? `${reconResult.pitSummary.totalPitWithheldDiff > 0n ? '+' : ''}${fmtBigInt(reconResult.pitSummary.totalPitWithheldDiff)}` : '-'}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12.5px' }}>
                    {reconResult.pitSummary.hasDiscrepancy ? 'Có chênh lệch đối chiếu' : 'Khớp đúng hoàn toàn'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!reconResult || (reconResult.vatRows.length === 0 && reconResult.pitRows.length === 0)) && (
        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#64748b',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Trống</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Chưa nạp file tờ khai thuế nào</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Hãy kéo thả các tệp XML hoặc tệp ZIP tờ khai 01/GTGT hoặc 05/TNCN vào ô trên để tự động nhận diện và đối chiếu.
          </div>
        </div>
      )}
    </div>
  )
}
