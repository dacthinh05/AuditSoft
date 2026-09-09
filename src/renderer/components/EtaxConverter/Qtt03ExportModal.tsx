import React, { useState } from 'react'

interface Qtt03ExportModalProps {
  isOpen: boolean
  onClose: () => void
  xmlContent: string
  defaultFileName: string
}

export const Qtt03ExportModal: React.FC<Qtt03ExportModalProps> = ({
  isOpen,
  onClose,
  xmlContent,
  defaultFileName,
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleDownload = () => {
    const cleanXml = xmlContent.replace(/^\uFEFF/, '')
    const blob = new Blob([cleanXml], { type: 'application/xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = defaultFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  // Lấy 25 dòng đầu để preview
  const previewSnippet = xmlContent.split(/\r?\n/).slice(0, 25).join('\n')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '680px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Xuất tệp tờ khai XML chuẩn Thông tư 80/2021/TT-BTC
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Định dạng XML UTF-8 No BOM · Tương thích iTaxViewer và cổng Thuế điện tử
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            Đóng
          </button>
        </div>

        {/* Body Modal */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Hộp tên tệp */}
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Tên tệp xuất ra:</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
                {defaultFileName}
              </div>
            </div>
            <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#047857', fontWeight: 600 }}>
              {(xmlContent.length / 1024).toFixed(1)} KB
            </span>
          </div>

          {/* Xem trước XML */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Xem trước nội dung tệp:</div>
            <pre
              style={{
                background: '#0f172a',
                color: '#e2e8f0',
                fontSize: '11px',
                fontFamily: 'Consolas, Monaco, monospace',
                padding: '12px',
                borderRadius: '6px',
                maxHeight: '150px',
                overflowY: 'auto',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {previewSnippet}
              {'\n... (các dòng tiếp theo đã được ẩn bớt) ...'}
            </pre>
          </div>

          {/* Hướng dẫn kế toán */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#0f172a' }}>Hướng dẫn sử dụng tệp sau khi tải về:</div>
            <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px', color: '#475569' }}>
              <li><strong>Kiểm tra trên iTaxViewer:</strong> Mở tệp để kiểm tra trực quan các trang tờ khai chính và phụ lục.</li>
              <li><strong>Mở trên phần mềm HTKK:</strong> Chọn chức năng Nhập tờ khai từ XML nếu cần cập nhật số liệu.</li>
              <li><strong>Nộp trực tiếp trên thuedientu.gdt.gov.vn:</strong> Đăng nhập hệ thống Thuế điện tử và ký số USB Token để nộp.</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            background: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={handleCopy}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {copied ? 'Đã sao chép vào bộ nhớ tạm' : 'Sao chép XML'}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            style={{
              padding: '7px 18px',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tải tệp XML về máy tính
          </button>
        </div>
      </div>
    </div>
  )
}
