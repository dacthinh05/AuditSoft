import { useState } from 'react'
import { useApp } from '../state/store'
import { IconX, IconDownloadCloud, IconRefresh, IconCheck } from './Icons'

export function UpdateModal(): JSX.Element | null {
  const updateModalOpen = useApp((s) => s.updateModalOpen)
  const setUpdateModalOpen = useApp((s) => s.setUpdateModalOpen)
  const updateInfo = useApp((s) => s.updateInfo)
  const isCheckingUpdate = useApp((s) => s.isCheckingUpdate)
  const checkAppUpdate = useApp((s) => s.checkAppUpdate)

  const [checking, setChecking] = useState(false)

  if (!updateModalOpen) return null

  const handleManualCheck = async () => {
    setChecking(true)
    await checkAppUpdate()
    setChecking(false)
  }

  const handleOpenUrl = (url?: string) => {
    if (!url) return
    if (window.auditsoft?.openExternalUrl) {
      void window.auditsoft.openExternalUrl(url)
    } else {
      window.open(url, '_blank')
    }
  }

  const currentVer = updateInfo?.currentVersion || '0.1.0'
  const latestVer = updateInfo?.latestVersion || currentVer
  const hasUpdate = Boolean(updateInfo?.hasUpdate)
  const changelog = updateInfo?.changelog || []

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={() => setUpdateModalOpen(false)}
    >
      <div
        className="modal-box update-modal-box"
        style={{
          width: 'min(480px, 92vw)',
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: '18px 22px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: hasUpdate ? '#eff6ff' : '#f8fafc',
                border: `1px solid ${hasUpdate ? '#bfdbfe' : '#e2e8f0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: hasUpdate ? '#2563eb' : '#0f172a',
              }}
            >
              <IconRefresh size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Cập nhật Phần mềm AuditSoft
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 1 }}>
                Phiên bản hiện tại: <strong>v{currentVer}</strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 120ms ease, color 120ms ease',
            }}
            onClick={() => setUpdateModalOpen(false)}
            title="Đóng (ESC)"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.color = '#0f172a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#94a3b8'
            }}
          >
            <IconX size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 22px' }}>
          {hasUpdate ? (
            /* Có phiên bản mới */
            <div>
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ color: '#2563eb', marginTop: 2 }}>
                  <IconDownloadCloud size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a' }}>
                    {updateInfo?.title || `Bản phát hành chính thức v${latestVer}`}
                  </div>
                  <div style={{ fontSize: 12, color: '#2563eb', marginTop: 2 }}>
                    Phiên bản mới: <strong>v{latestVer}</strong>
                    {updateInfo?.releaseDate && ` · Ngày phát hành: ${updateInfo.releaseDate}`}
                  </div>
                </div>
              </div>

              {changelog.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: 8,
                    }}
                  >
                    Các điểm mới trong bản này:
                  </div>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '12px 16px',
                      maxHeight: 180,
                      overflowY: 'auto',
                    }}
                  >
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                      {changelog.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tải về */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 8 }}>
                {updateInfo?.downloadUrl && (
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '9px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      background: '#2563eb',
                      color: '#ffffff',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenUrl(updateInfo.downloadUrl)}
                  >
                    <IconDownloadCloud size={15} />
                    Tải Bộ Cài (Setup.exe)
                  </button>
                )}
                {updateInfo?.portableUrl && (
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '9px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      background: '#f8fafc',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenUrl(updateInfo.portableUrl)}
                  >
                    <IconDownloadCloud size={15} />
                    Bản Portable (.exe)
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Bản mới nhất / Chưa có thông báo mới (Không bao giờ báo lỗi 404 đáng sợ) */
            <div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    flexShrink: 0,
                  }}
                >
                  <IconCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                    AuditSoft đang ở phiên bản mới nhất (v{currentVer})
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Chưa có thông báo cập nhật mới. Hệ thống sẽ tự động nhắc bạn khi có tính năng mới.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 22px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
            Kiểm tra lúc: {updateInfo?.checkedAt ? new Date(updateInfo.checkedAt).toLocaleTimeString('vi-VN') : 'Mới mở app'}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                fontSize: 12.5,
                fontWeight: 500,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 7,
                color: '#334155',
                cursor: checking || isCheckingUpdate ? 'wait' : 'pointer',
                transition: 'all 120ms ease',
              }}
              disabled={checking || isCheckingUpdate}
              onClick={() => void handleManualCheck()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1'
                e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.background = '#ffffff'
              }}
            >
              <IconRefresh size={13} className={checking || isCheckingUpdate ? 'spin-icon' : ''} />
              {checking || isCheckingUpdate ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
            </button>

            <button
              type="button"
              style={{
                padding: '6px 18px',
                fontSize: 12.5,
                fontWeight: 600,
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 7,
                cursor: 'pointer',
                transition: 'background 120ms ease',
              }}
              onClick={() => setUpdateModalOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#0f172a')}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
