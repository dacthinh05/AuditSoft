import React from 'react'
import type { Qtt03Document, Qtt03ReconcileSummary } from '../../../domain/etax/types'

interface Qtt03KpiCardsProps {
  document: Qtt03Document
  summary: Qtt03ReconcileSummary
}

export const Qtt03KpiCards: React.FC<Qtt03KpiCardsProps> = ({ document, summary }) => {
  const formatVnd = (n: number) => n.toLocaleString('vi-VN') + ' đ'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Thông tin định danh Doanh nghiệp */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            {document.generalInfo.tenNNT || 'DOANH NGHIỆP KÊ KHAI'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
            Mã số thuế: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{document.generalInfo.mst}</strong>
            {' · '}Cơ quan thuế: <strong>{document.generalInfo.cqtNoiNop?.tenCQT || 'Thuế Quản Lý'}</strong>
            {' · '}Kỳ tính thuế: <strong>{document.generalInfo.kyKKhai.kyKKhaiDenNgay.slice(-4) || '2025'}</strong>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              background: summary.isAllPassed ? '#ecfdf5' : '#fef2f2',
              color: summary.isAllPassed ? '#047857' : '#b91c1c',
              border: `1px solid ${summary.isAllPassed ? '#a7f3d0' : '#fecaca'}`,
            }}
          >
            {summary.isAllPassed ? 'Khớp 100% số liệu gốc' : 'Có chênh lệch số liệu'}
          </span>
        </div>
      </div>

      {/* 4 Thẻ chỉ tiêu then chốt */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {/* Card 1: Lợi nhuận trước thuế [A1] */}
        <div
          style={{
            padding: '14px 16px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            borderLeft: '3px solid #2563eb',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Lợi nhuận trước thuế [A1]
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e40af', marginTop: '6px', fontFamily: 'monospace' }}>
            {formatVnd(summary.newLntt)}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
            Khớp chỉ tiêu bản gốc
          </div>
        </div>

        {/* Card 2: Thu nhập tính thuế [C4] */}
        <div
          style={{
            padding: '14px 16px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            borderLeft: '3px solid #7c3aed',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Thu nhập chịu thuế [C1]
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#6d28d9', marginTop: '6px', fontFamily: 'monospace' }}>
            {formatVnd(document.mainForm.ctC1)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Sau điều chỉnh tăng/giảm
          </div>
        </div>

        {/* Card 3: Thuế TNDN phát sinh [C9]/[C10] */}
        <div
          style={{
            padding: '14px 16px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            borderLeft: '3px solid #d97706',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Thuế TNDN phát sinh [C9]/[C10]
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#b45309', marginTop: '6px', fontFamily: 'monospace' }}>
            {formatVnd(summary.newTaxPayable)}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
            Thuế suất tính thuế 20%
          </div>
        </div>

        {/* Card 4: Sai lệch ròng (Variance) */}
        <div
          style={{
            padding: '14px 16px',
            background: summary.netVariance === 0 ? '#f0fdf4' : '#fef2f2',
            borderRadius: '8px',
            border: `1px solid ${summary.netVariance === 0 ? '#bbf7d0' : '#fecaca'}`,
            borderLeft: `3px solid ${summary.netVariance === 0 ? '#059669' : '#dc2626'}`,
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Chênh lệch số liệu (Variance)
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: summary.netVariance === 0 ? '#047857' : '#b91c1c',
              marginTop: '6px',
              fontFamily: 'monospace',
            }}
          >
            {summary.netVariance === 0 ? '0 đ' : formatVnd(summary.netVariance)}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: summary.netVariance === 0 ? '#047857' : '#b91c1c',
              marginTop: '4px',
              fontWeight: 500,
            }}
          >
            {summary.netVariance === 0 ? 'Không có sai lệch' : 'Cần rà soát chênh lệch'}
          </div>
        </div>
      </div>
    </div>
  )
}
