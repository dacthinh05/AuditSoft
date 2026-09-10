import { useState } from 'react'
import { NKC_COLUMN_SPEC, NKC_ERROR_CODES, NKC_ROW_RULES } from '../../domain/nkcRequirements'

const SAMPLE_CSV_HEADER = 'Ngày chứng từ,Số chứng từ,Diễn giải,TK Nợ,TK Có,Số tiền'
const SAMPLE_CSV_ROWS = [
  '02/01/2026,CT001,Thu tiền bán hàng hóa,1111,5111,150000000',
  '05/01/2026,CT002,Chi tiền mua văn phòng phẩm,6428,1111,3500000',
  '10/01/2026,UNC003,Thanh toán tiền hàng cho NCC An Phát,3311,1121,275000000',
  '15/01/2026,PT004,Thu hồi công nợ khách hàng Minh Đức,1111,1311,98000000',
  '20/01/2026,PC005,Trích khấu hao TSCĐ tháng 1,6424,2141,12500000',
  '32/13/2026,CT006,Dòng lỗi ngày minh họa (sẽ bị gắn cờ LOI_NGAY),6428,1111,1000000',
  '25/01/2026,CT007,Dòng tiền bằng 0 minh họa (sẽ bị loại),6428,1111,0',
]

/**
 * Section chuẩn NKC inline: 6 cột bắt buộc, quy tắc xử lý dòng, mã lỗi,
 * nút tải file mẫu CSV và gợi ý mở bằng Excel.
 */
export function NkcSpecSection(): JSX.Element {
  const [downloading, setDownloading] = useState(false)

  function downloadSample(): void {
    setDownloading(true)
    try {
      const csv = `﻿${SAMPLE_CSV_HEADER}\n${SAMPLE_CSV_ROWS.join('\n')}\n`
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'MAU_NKC_CHUAN.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <details
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 16px',
        marginTop: '14px',
        fontSize: '12.5px',
        color: '#334155',
      }}
    >
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>
        📋 File NKC cần chuẩn gì? (bấm để xem + tải file mẫu)
      </summary>

      <div style={{ marginTop: '10px', fontWeight: 700, color: '#0f172a' }}>6 cột bắt buộc:</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#eef2ff', textAlign: 'left' }}>
            <th style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>Cột</th>
            <th style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>Ý nghĩa</th>
          </tr>
        </thead>
        <tbody>
          {NKC_COLUMN_SPEC.map((c) => (
            <tr key={c.key}>
              <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 700 }}>{c.label}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>{c.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '10px', fontWeight: 700, color: '#0f172a' }}>Phần mềm xử lý từng dòng thế nào:</div>
      <ul style={{ margin: '6px 0', paddingLeft: '18px' }}>
        {NKC_ROW_RULES.map((r) => (
          <li key={r.title} style={{ marginBottom: '3px' }}>
            <strong>{r.title}:</strong> {r.detail}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '6px' }}>
        Mã lỗi có thể gặp trên dòng dữ liệu:{' '}
        {NKC_ERROR_CODES.map((e) => (
          <code
            key={e.code}
            style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', padding: '1px 6px', marginRight: '6px' }}
          >
            {e.code} ({e.label})
          </code>
        ))}
      </div>

      <button
        type="button"
        onClick={downloadSample}
        disabled={downloading}
        style={{
          marginTop: '10px',
          background: '#0284c7',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          padding: '7px 14px',
          fontSize: '12.5px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ⬇ Tải file NKC mẫu (CSV, mở được bằng Excel)
      </button>
    </details>
  )
}
