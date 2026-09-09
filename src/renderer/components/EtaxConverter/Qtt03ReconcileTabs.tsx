import React, { useState } from 'react'
import type { DiffItem, Qtt03ReconcileSummary } from '../../../domain/etax/types'

interface Qtt03ReconcileTabsProps {
  summary: Qtt03ReconcileSummary
}

export const Qtt03ReconcileTabs: React.FC<Qtt03ReconcileTabsProps> = ({ summary }) => {
  // activeKey: 'main' hoặc tag của phụ lục (ví dụ 'PLuc_03_1A_TNDN', 'PL_GDLK2-01')
  const [activeKey, setActiveKey] = useState<string>('main')
  const [search, setSearch] = useState('')
  const [onlyNonZero, setOnlyNonZero] = useState(false)

  const formatVnd = (n: number) => {
    if (n === 0) return '-'
    return n.toLocaleString('vi-VN') + ' đ'
  }

  // Lọc danh sách DiffItem theo tìm kiếm và checkbox non-zero
  const filterItems = (items: DiffItem[]) => {
    return items.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (onlyNonZero) {
        return item.oldValue !== 0 || item.newValue !== 0
      }
      return true
    })
  }

  // Lấy danh sách item đang hiển thị dựa theo tab đang chọn
  let currentItems: DiffItem[] = []
  let currentTabTitle = 'Tờ khai chính 03/TNDN'

  if (activeKey === 'main') {
    currentItems = filterItems(summary.mainFormDiffs)
  } else {
    const app = summary.appendixList?.find((a) => a.tag === activeKey)
    if (app) {
      currentItems = filterItems(app.diffs)
      currentTabTitle = app.name
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Top Bar: Thanh chuyển Sub-Tabs phụ lục động */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
            Danh mục tờ khai chính và các phụ lục đính kèm ({1 + (summary.appendixList?.length || 0)} biểu mẫu):
          </div>

          {/* Ô tìm kiếm & lọc */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={onlyNonZero}
                onChange={(e) => setOnlyNonZero(e.target.checked)}
              />
              Chỉ hiển thị chỉ tiêu có số liệu
            </label>

            <input
              type="text"
              placeholder="Tìm mã hoặc tên chỉ tiêu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '5px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none',
                width: '200px',
              }}
            />
          </div>
        </div>

        {/* Danh sách các Tab (Tờ khai chính + Tất cả các phụ lục động) */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {/* Tab 1: Tờ khai chính */}
          <button
            type="button"
            onClick={() => setActiveKey('main')}
            style={{
              padding: '6px 14px',
              border: activeKey === 'main' ? '1px solid #2563eb' : '1px solid #e2e8f0',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              background: activeKey === 'main' ? '#eff6ff' : '#f8fafc',
              color: activeKey === 'main' ? '#1d4ed8' : '#475569',
              transition: 'all 0.15s',
            }}
          >
            Tờ Khai Chính 03/TNDN ({summary.mainFormDiffs.length})
          </button>

          {/* Các tab Phụ lục có trong tài liệu */}
          {summary.appendixList?.map((app) => (
            <button
              key={app.tag}
              type="button"
              onClick={() => setActiveKey(app.tag)}
              style={{
                padding: '6px 14px',
                border: activeKey === app.tag ? '1px solid #2563eb' : '1px solid #e2e8f0',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                background: activeKey === app.tag ? '#eff6ff' : '#f8fafc',
                color: activeKey === app.tag ? '#1d4ed8' : '#475569',
                transition: 'all 0.15s',
              }}
            >
              {app.name.split(':')[0]} ({app.fieldCount})
            </button>
          ))}
        </div>
      </div>

      {/* Tiêu đề mục đang xem */}
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginTop: '4px' }}>
        Biểu mẫu đang xem: <span style={{ color: '#0f172a' }}>{currentTabTitle}</span> ({currentItems.length} chỉ tiêu)
      </div>

      {/* Bảng dữ liệu đối chiếu */}
      <div style={{ overflowX: 'auto', maxHeight: '450px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              <th style={{ padding: '8px 12px', width: '110px' }}>Mã chỉ tiêu</th>
              <th style={{ padding: '8px 12px' }}>Tên chỉ tiêu</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', width: '150px' }}>Số liệu tệp cũ</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', width: '150px' }}>Số liệu tệp mới</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', width: '130px' }}>Chênh lệch</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', width: '110px' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((row) => renderRow(row, formatVnd))}
          </tbody>
        </table>

        {currentItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
            Không có chỉ tiêu nào phù hợp với bộ lọc tìm kiếm.
          </div>
        )}
      </div>
    </div>
  )
}

function renderRow(row: DiffItem, formatVnd: (n: number) => string) {
  const isMatch = row.status === 'MATCHED'
  const isZero = row.variance === 0
  const isNew = row.status === 'NEW'

  return (
    <tr
      key={row.code}
      style={{
        borderBottom: '1px solid #f1f5f9',
        background: isMatch ? 'transparent' : isNew ? '#f0fdf4' : '#fff1f2',
      }}
    >
      <td style={{ padding: '8px 12px' }}>
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            padding: '2px 6px',
            background: '#f1f5f9',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#0f172a',
          }}
        >
          {row.code.replace(/^ct/, '')}
        </span>
      </td>
      <td style={{ padding: '8px 12px', color: '#1e293b' }}>{row.name}</td>
      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b', fontFamily: 'monospace' }}>
        {formatVnd(row.oldValue)}
      </td>
      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
        {formatVnd(row.newValue)}
      </td>
      <td
        style={{
          padding: '8px 12px',
          textAlign: 'right',
          fontWeight: 600,
          fontFamily: 'monospace',
          color: isZero ? '#059669' : '#dc2626',
        }}
      >
        {isZero ? '0 đ' : formatVnd(row.variance)}
      </td>
      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            background: isMatch ? '#ecfdf5' : isNew ? '#eff6ff' : '#fef2f2',
            color: isMatch ? '#047857' : isNew ? '#1d4ed8' : '#b91c1c',
            border: `1px solid ${isMatch ? '#a7f3d0' : isNew ? '#bfdbfe' : '#fecaca'}`,
          }}
        >
          {isMatch ? 'Khớp 100%' : isNew ? 'Bổ sung' : 'Chênh lệch'}
        </span>
      </td>
    </tr>
  )
}
