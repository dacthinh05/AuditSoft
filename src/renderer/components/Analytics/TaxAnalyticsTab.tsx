import type { IngestedTaxDeclarations } from '../../../shared/types/taxAnalytics'
import type { TaxCrossReconciliationResult } from '../../../domain/analytics/TaxCrossReconciler'
import { TaxDropZone } from './TaxDropZone'

interface Props {
  taxData: IngestedTaxDeclarations | null
  reconResult: TaxCrossReconciliationResult | null
  onFilesSelected: (filePaths: string[]) => void
  isLoading?: boolean
}

function fmtBigInt(v: bigint | undefined | null): string {
  if (v == null) return '-'
  return v.toLocaleString('vi-VN')
}

export function TaxAnalyticsTab({
  taxData,
  reconResult,
  onFilesSelected,
  isLoading,
}: Props): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', color: '#0f172a' }}>
      {/* Dropzone nạp file XML / ZIP */}
      <TaxDropZone onFilesSelected={onFilesSelected} disabled={isLoading} />

      {isLoading && (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#0284c7' }}>
          ⏳ Đang đọc và phân tích tệp tờ khai thuế...
        </div>
      )}

      {taxData && taxData.totalFilesProcessed > 0 && (
        <div
          style={{
            fontSize: '12.5px',
            color: '#475569',
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            background: '#ffffff',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ color: '#047857', fontWeight: 600 }}>✓ Đã nạp: <b>{taxData.totalFilesProcessed}</b> tệp XML</span>
          <span>• Tờ khai GTGT: <b>{taxData.vatDeclarations.length}</b></span>
          <span>• Tờ khai TNCN: <b>{taxData.pitDeclarations.length}</b></span>
          {taxData.failedFiles.length > 0 && (
            <span style={{ color: '#b45309' }}>• Bỏ qua {taxData.failedFiles.length} tệp không hợp lệ</span>
          )}
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
            <span>Bảng Thống Kê Thuế GTGT & Đối Chiếu Doanh Thu (TK 511)</span>
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
              {reconResult.vatSummary.hasDiscrepancy ? '⚠️ Có chênh lệch đối chiếu' : '✓ Khớp hoàn toàn'}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontFamily: 'sans-serif' }}>Kỳ Khai</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontFamily: 'sans-serif' }}>Loại Tờ Khai</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Doanh Thu Thuế [34]</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Thuế Đầu Ra [35]</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Thuế Phải Nộp [40]</th>
                  <th style={{ padding: '8px 10px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>Doanh Thu 511 (NKC)</th>
                  <th style={{ padding: '8px 10px', background: '#f8fafc', fontWeight: 600 }}>Lệch Doanh Thu</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontFamily: 'sans-serif' }}>Ghi Chú Kiểm Toán</th>
                </tr>
              </thead>
              <tbody style={{ color: '#1e293b' }}>
                {reconResult.vatRows.map((r) => {
                  const isDiff = r.status === 'DISCREPANCY'
                  return (
                    <tr key={r.periodKey} style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'sans-serif' }}>
                        <b>{r.periodLabel}</b>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'sans-serif', color: '#64748b' }}>
                        {r.declarationType}
                      </td>
                      <td style={{ padding: '8px 10px' }}>{fmtBigInt(r.taxRevenue)}</td>
                      <td style={{ padding: '8px 10px' }}>{fmtBigInt(r.taxOutputVat)}</td>
                      <td style={{ padding: '8px 10px' }}>{fmtBigInt(r.taxRevenue > 0n ? r.taxOutputVat : 0n)}</td>
                      <td style={{ padding: '8px 10px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                        {fmtBigInt(r.glRevenue)}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          fontWeight: 700,
                          color: isDiff ? '#b91c1c' : '#047857',
                        }}
                      >
                        {isDiff ? `${r.revenueDiff > 0n ? '+' : ''}${fmtBigInt(r.revenueDiff)}` : '0 (Khớp)'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'sans-serif', fontSize: '11.5px', color: isDiff ? '#b45309' : '#64748b' }}>
                        {r.auditNote}
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ background: '#f8fafc', fontWeight: 700, textAlign: 'right', borderTop: '2px solid #e2e8f0', color: '#0f172a' }}>
                  <td style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'sans-serif' }}>TỔNG CỘNG</td>
                  <td style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'sans-serif' }}>-</td>
                  <td style={{ padding: '8px 10px' }}>{fmtBigInt(reconResult.vatSummary.totalTaxRevenue)}</td>
                  <td style={{ padding: '8px 10px' }}>{fmtBigInt(reconResult.vatSummary.totalTaxOutputVat)}</td>
                  <td style={{ padding: '8px 10px' }}>-</td>
                  <td style={{ padding: '8px 10px', color: '#1d4ed8' }}>{fmtBigInt(reconResult.vatSummary.totalGlRevenue)}</td>
                  <td style={{ padding: '8px 10px', color: reconResult.vatSummary.hasDiscrepancy ? '#b91c1c' : '#047857' }}>
                    {fmtBigInt(reconResult.vatSummary.totalRevenueDiff)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'sans-serif' }}>-</td>
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
              {reconResult.pitSummary.hasDiscrepancy ? '⚠️ Có chênh lệch chi phí lương' : '✓ Khớp chi phí lương'}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontFamily: 'sans-serif' }}>Kỳ Khai Thuế</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, fontFamily: 'sans-serif' }}>Số LĐ [16]</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Tổng TNCT [21]</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Thuế Đã Khấu Trừ [29]</th>
                  <th style={{ padding: '8px 10px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>Chi Phí Lương (NKC)</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Chênh Lệch</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontFamily: 'sans-serif' }}>Ghi Chú</th>
                </tr>
              </thead>
              <tbody style={{ color: '#1e293b' }}>
                {reconResult.pitRows.map((p) => {
                  const isDiff = p.status === 'DISCREPANCY'
                  return (
                    <tr key={p.periodKey} style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'sans-serif' }}>
                        <b>{p.periodLabel}</b>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{fmtBigInt(p.employeeCount)}</td>
                      <td style={{ padding: '8px 10px' }}>{fmtBigInt(p.taxableIncome)}</td>
                      <td style={{ padding: '8px 10px' }}>{fmtBigInt(p.withheldTax)}</td>
                      <td style={{ padding: '8px 10px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                        {fmtBigInt(p.glPayrollExpense)}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          fontWeight: 700,
                          color: isDiff ? '#b91c1c' : '#047857',
                        }}
                      >
                        {isDiff ? `${p.payrollDiff > 0n ? '+' : ''}${fmtBigInt(p.payrollDiff)}` : '0 (Khớp)'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'sans-serif', fontSize: '11.5px', color: isDiff ? '#b45309' : '#64748b' }}>
                        {p.auditNote}
                      </td>
                    </tr>
                  )
                })}
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
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Chưa nạp file tờ khai thuế nào</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Hãy kéo thả các tệp XML hoặc tệp ZIP tờ khai 01/GTGT hoặc 05/TNCN vào ô trên để tự động nhận diện và đối chiếu.
          </div>
        </div>
      )}
    </div>
  )
}
