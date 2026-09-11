import React, { useState, useMemo, useEffect } from 'react'
import type { JournalRowDTO } from '../../../shared/types/analytics'
import { VirtualTable, type VirtualColumn } from '../VirtualTable'
import { IconSearch, IconAlert, IconFileSpreadsheet } from '../Icons'
import { exportMatrixDrilldownExcel } from './exportMatrixDrilldownExcel'

export interface MatrixDrilldownModalProps {
  isOpen: boolean
  onClose: () => void
  columnKey: string
  columnLabel: string
  accountPattern: string
  month: number
  monthName: string
  anomalyNote?: string
  journals: JournalRowDTO[]
  companyName?: string
  fiscalYear?: string
}

export function matchJournalToColumn(j: JournalRowDTO, rowKey: string): boolean {
  const d = j.debit || ''
  const c = j.credit || ''
  switch (rowKey) {
    case 'REV_511':
      return c.startsWith('511')
    case 'INV_BUY_15X':
      return (
        d.startsWith('152') ||
        d.startsWith('153') ||
        d.startsWith('155') ||
        d.startsWith('156')
      )
    case 'COGS_632':
      return d.startsWith('632')
    case 'SELL_641':
      return d.startsWith('641')
    case 'ADMIN_642':
      return d.startsWith('642')
    case 'FIN_EXP_635':
      return d.startsWith('635')
    case 'FIN_REV_515':
      return c.startsWith('515')
    case 'OTHER_EXP_811':
      return d.startsWith('811')
    default:
      return false
  }
}

export function getJournalMonth(j: JournalRowDTO): number | null {
  if (typeof j.month === 'number' && j.month >= 1 && j.month <= 12) {
    return j.month
  }
  if (j.date) {
    const isoMatch = j.date.match(/^\d{4}-(\d{2})/)
    if (isoMatch && isoMatch[1]) return parseInt(isoMatch[1], 10)
    const dmyMatch = j.date.match(/[-/](\d{1,2})[-/]/)
    if (dmyMatch && dmyMatch[1]) return parseInt(dmyMatch[1], 10)
  }
  return null
}

function fmtVnd(num: number): string {
  return Math.round(num).toLocaleString('vi-VN') + ' đ'
}

export function MatrixDrilldownModal({
  isOpen,
  onClose,
  columnKey,
  columnLabel,
  accountPattern,
  month,
  monthName,
  anomalyNote,
  journals,
  companyName,
  fiscalYear,
}: MatrixDrilldownModalProps): JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Đóng bằng phím Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lọc bút toán tương ứng ô ma trận (theo cột và theo tháng)
  const cellRows = useMemo(() => {
    if (!isOpen || !journals || journals.length === 0) return []
    return journals
      .filter((j) => {
        const m = getJournalMonth(j)
        if (m !== month) return false
        return matchJournalToColumn(j, columnKey)
      })
      .sort((a, b) => b.amount - a.amount)
  }, [isOpen, journals, columnKey, month])

  const totalCellAmount = useMemo(() => {
    return cellRows.reduce((sum, r) => sum + r.amount, 0)
  }, [cellRows])

  // Lọc tiếp theo từ khóa tìm kiếm
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return cellRows
    return cellRows.filter((r) => {
      return (
        (r.doc && r.doc.toLowerCase().includes(q)) ||
        (r.desc && r.desc.toLowerCase().includes(q)) ||
        (r.debit && r.debit.toLowerCase().includes(q)) ||
        (r.credit && r.credit.toLowerCase().includes(q)) ||
        (r.date && r.date.toLowerCase().includes(q)) ||
        String(r.amount).includes(q)
      )
    })
  }, [cellRows, searchQuery])

  const filteredTotal = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + r.amount, 0)
  }, [filteredRows])

  const handleExport = async () => {
    if (cellRows.length === 0 || isExporting) return
    setIsExporting(true)
    try {
      await exportMatrixDrilldownExcel({
        columnKey,
        columnLabel,
        accountPattern,
        month,
        companyName,
        fiscalYear,
        anomalyNote,
        rows: cellRows,
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  const columns: VirtualColumn<JournalRowDTO>[] = [
    {
      key: 'idx',
      label: 'STT',
      width: 50,
      align: 'center',
      render: (_r, idx) => <span style={{ color: '#64748b', fontSize: '11px' }}>{idx + 1}</span>,
    },
    {
      key: 'date',
      label: 'Ngày CT',
      width: 95,
      align: 'center',
      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{r.date || '-'}</span>,
    },
    {
      key: 'doc',
      label: 'Số CT',
      width: 110,
      align: 'center',
      render: (r) => (
        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '11.5px', fontFamily: 'monospace' }}>
          {r.doc || '-'}
        </span>
      ),
    },
    {
      key: 'desc',
      label: 'Diễn Giải Nghiệp Vụ',
      width: 320,
      flex: true,
      align: 'left',
      render: (r) => (
        <span
          style={{ fontSize: '12px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
          title={r.desc}
        >
          {r.desc}
        </span>
      ),
    },
    {
      key: 'debit',
      label: 'Nợ',
      width: 65,
      align: 'center',
      render: (r) => (
        <span style={{ fontWeight: 600, color: '#047857', fontSize: '11.5px', fontFamily: 'monospace' }}>
          {r.debit}
        </span>
      ),
    },
    {
      key: 'credit',
      label: 'Có',
      width: 65,
      align: 'center',
      render: (r) => (
        <span style={{ fontWeight: 600, color: '#b45309', fontSize: '11.5px', fontFamily: 'monospace' }}>
          {r.credit}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Số Tiền (VNĐ)',
      width: 145,
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '12px', fontFamily: 'monospace' }}>
          {Math.round(r.amount).toLocaleString('vi-VN')}
        </span>
      ),
    },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🔍</span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Chi Tiết Bút Toán Phát Sinh — {columnLabel} ({accountPattern})
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>Kỳ: <strong style={{ color: '#0369a1' }}>{monthName}</strong></span>
              <span>•</span>
              <span>Tổng phát sinh ô: <strong style={{ color: '#0f172a' }}>{fmtVnd(totalCellAmount)}</strong></span>
              <span>•</span>
              <span>Số lượng: <strong style={{ color: '#4338ca' }}>{cellRows.length} bút toán</strong></span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Đóng (Phím Esc)"
          >
            ✕
          </button>
        </div>

        {/* ── Anomaly Alert Banner (Nếu có) ── */}
        {anomalyNote && (
          <div
            style={{
              padding: '10px 20px',
              background: '#fffbeb',
              borderBottom: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#92400e',
            }}
          >
            <IconAlert size={15} style={{ flexShrink: 0 }} />
            <span>
              <strong>Cảnh báo biến động đột biến:</strong> {anomalyNote}
            </span>
          </div>
        )}

        {/* ── Action Bar & Search ── */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            background: '#ffffff',
          }}
        >
          <div style={{ position: 'relative', width: '360px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              <IconSearch size={14} />
            </span>
            <input
              type="text"
              placeholder="Tìm theo số CT, diễn giải, tài khoản, số tiền..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || cellRows.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                background: '#047857',
                border: 'none',
                borderRadius: '6px',
                cursor: cellRows.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'opacity 0.15s ease',
                opacity: isExporting ? 0.7 : 1,
              }}
              title="Xuất Excel 2 Sheet: Sheet 1 Pivot cơ cấu phát sinh + Top bút toán, Sheet 2 Sổ chi tiết có AutoFilter"
            >
              <IconFileSpreadsheet size={15} />
              <span>{isExporting ? 'Đang xuất file...' : '📥 Xuất Excel (Pivot 2 Sheet)'}</span>
            </button>
          </div>
        </div>

        {/* ── Main VirtualTable Body ── */}
        <div style={{ flex: 1, minHeight: '380px', maxHeight: '520px', padding: '0 20px', background: '#ffffff' }}>
          {filteredRows.length > 0 ? (
            <VirtualTable
              rows={filteredRows}
              columns={columns}
              height={460}
              rowHeight={32}
            />
          ) : (
            <div
              style={{
                padding: '60px 0',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              {searchQuery
                ? `Không tìm thấy bút toán nào khớp với từ khóa "${searchQuery}".`
                : 'Không có bút toán nào phát sinh trong tháng này cho khoản mục đã chọn.'}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11.5px',
            color: '#64748b',
          }}
        >
          <div>
            Hiển thị <strong>{filteredRows.length}</strong> / <strong>{cellRows.length}</strong> bút toán phát sinh
            {searchQuery && (
              <span style={{ marginLeft: '8px', color: '#0f172a' }}>
                (Tổng tiền đang lọc: <strong>{fmtVnd(filteredTotal)}</strong>)
              </span>
            )}
          </div>
          <div>
            <span>Nhấn <kbd style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '3px' }}>Esc</kbd> để đóng cửa sổ</span>
          </div>
        </div>
      </div>
    </div>
  )
}
