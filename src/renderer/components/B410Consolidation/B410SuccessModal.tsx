import React, { useState, useEffect, useRef } from 'react'
import { IconCheck, IconX, IconFolder, IconFileSpreadsheet, IconClipboard } from '../Icons'

export interface B410SuccessModalProps {
  isOpen: boolean
  outputPath?: string
  message?: string
  fileCount: number
  onClose: () => void
  onOpenFile: (path: string) => void
  onOpenFolder: (path: string) => void
}

export const B410SuccessModal: React.FC<B410SuccessModalProps> = ({
  isOpen,
  outputPath,
  message,
  fileCount,
  onClose,
  onOpenFile,
  onOpenFolder
}) => {
  const [copied, setCopied] = useState(false)

  const copyTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      clearTimeout(copyTimerRef.current)
    }
  }, [])

  // Xử lý đóng modal bằng phím ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !outputPath) return null

  const fileName = outputPath.split(/[\\/]/).pop() || outputPath

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(outputPath)
      setCopied(true)
      clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback nếu clipboard API bị hạn chế
    }
  }

  const handlePrimaryOpen = () => {
    onOpenFile(outputPath)
    onClose()
  }

  const handleShowInFolder = () => {
    onOpenFolder(outputPath)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 94vw)',
          borderRadius: '16px',
          boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(16, 185, 129, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Head */}
        <div
          className="modal-head"
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
            borderBottom: '1px solid #dcfce7',
            padding: '18px 24px'
          }}
        >
          <div className="modal-title-group" style={{ gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#dcfce7',
                border: '1px solid #86efac',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <IconCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                Tổng Hợp B410 Thành Công!
              </div>
              <div style={{ fontSize: '13px', color: '#15803d', marginTop: '2px', fontWeight: 500 }}>
                Đã xử lý xong dữ liệu từ {fileCount} file thành viên
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Đóng (ESC)"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px 24px', background: '#ffffff' }}>
          {/* Thông điệp chi tiết */}
          {message && (
            <div
              style={{
                fontSize: '13.5px',
                color: '#334155',
                marginBottom: '16px',
                lineHeight: 1.5,
                background: '#f8fafc',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            >
              {message}
            </div>
          )}

          {/* File Card info */}
          <div
            style={{
              border: '1px solid #bbf7d0',
              background: '#f0fdf4',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <IconFileSpreadsheet size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#166534', wordBreak: 'break-all' }}>
                {fileName}
              </span>
            </div>

            {/* Path row with copy */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                border: '1px solid #dcfce7',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                color: '#475569',
                gap: '8px'
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  direction: 'rtl',
                  textAlign: 'left'
                }}
                title={outputPath}
              >
                {outputPath}
              </span>
              <button
                type="button"
                onClick={handleCopyPath}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#16a34a' : '#2563eb',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}
                title="Sao chép đường dẫn file vào Clipboard"
              >
                {copied ? (
                  <>
                    <IconCheck size={13} />
                    Đã chép
                  </>
                ) : (
                  <>
                    <IconClipboard size={13} />
                    Chép
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Prompt Question */}
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Bạn có muốn mở file B410 đã gộp ngay bây giờ không?
          </div>
        </div>

        {/* Modal Foot Actions */}
        <div
          className="modal-foot"
          style={{
            padding: '14px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 16px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Để sau
          </button>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleShowInFolder}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: '#ffffff',
                border: '1px solid #94a3b8',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
              title="Mở thư mục chứa file trong Windows Explorer"
            >
              <IconFolder size={15} style={{ color: '#2563eb' }} />
              Mở thư mục
            </button>

            <button
              type="button"
              onClick={handlePrimaryOpen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                background: '#16a34a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
                transition: 'all 0.15s ease'
              }}
              title="Mở file B410 Master trực tiếp bằng Microsoft Excel"
            >
              <IconFileSpreadsheet size={15} />
              Mở file Excel ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default B410SuccessModal
