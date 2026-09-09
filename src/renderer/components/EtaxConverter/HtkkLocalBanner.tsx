import React, { useEffect, useState } from 'react'
import { PersistentTemplateStore, type SavedTemplateData } from '../../../domain/etax/PersistentTemplateStore'

interface HtkkLocalBannerProps {
  onTemplateChanged?: () => void
}

export const HtkkLocalBanner: React.FC<HtkkLocalBannerProps> = ({ onTemplateChanged }) => {
  const [htkkInfo, setHtkkInfo] = useState<{
    isInstalled: boolean
    installPath?: string
    appVersion?: string
  } | null>(null)

  const [savedTemplate, setSavedTemplate] = useState<SavedTemplateData | null>(null)

  const loadStatus = async () => {
    // 1. Kiểm tra template đã lưu
    setSavedTemplate(PersistentTemplateStore.getSavedTemplate())

    // 2. Dò tìm HTKK cục bộ qua Electron IPC nếu có
    if (typeof window !== 'undefined' && window.auditsoft && typeof window.auditsoft.detectLocalHtkk === 'function') {
      try {
        const info = await window.auditsoft.detectLocalHtkk()
        setHtkkInfo(info)
      } catch {
        setHtkkInfo({ isInstalled: false })
      }
    } else {
      setHtkkInfo({ isInstalled: false })
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  const handleResetTemplate = () => {
    PersistentTemplateStore.resetToDefault()
    setSavedTemplate(null)
    if (onTemplateChanged) onTemplateChanged()
  }

  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoString
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#475569',
      }}
    >
      {/* Cột trái: Trạng thái HTKK cục bộ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 600, color: '#0f172a' }}>Phần mềm HTKK trên máy tính:</span>
        {htkkInfo?.isInstalled ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            <strong style={{ color: '#047857' }}>Đã nhận diện phiên bản {htkkInfo.appVersion || 'mới nhất'}</strong>
            <span style={{ color: '#94a3b8' }}>({htkkInfo.installPath})</span>
          </span>
        ) : (
          <span style={{ color: '#64748b' }}>
            {htkkInfo === null ? 'Đang kiểm tra...' : 'Chưa phát hiện (áp dụng mẫu chuẩn HTKK 5.7.x)'}
          </span>
        )}
      </div>

      {/* Cột phải: Khuôn mẫu đang áp dụng */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontWeight: 600, color: '#0f172a' }}>Khuôn mẫu đang dùng:</span>
        {savedTemplate ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontWeight: 600,
                fontSize: '11px',
              }}
            >
              Mẫu tùy chỉnh đã lưu ({formatTime(savedTemplate.savedAt)})
            </span>
            <button
              type="button"
              onClick={handleResetTemplate}
              style={{
                padding: '2px 8px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                background: '#ffffff',
                color: '#64748b',
                fontSize: '11px',
                cursor: 'pointer',
              }}
              title="Khôi phục về khuôn mẫu Thông tư 80 chuẩn tích hợp sẵn"
            >
              Đặt lại mẫu chuẩn
            </button>
          </span>
        ) : (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #e2e8f0',
              fontWeight: 500,
              fontSize: '11px',
            }}
          >
            Mẫu chuẩn Thông tư 80 (XML 2.9.4)
          </span>
        )}
      </div>
    </div>
  )
}
