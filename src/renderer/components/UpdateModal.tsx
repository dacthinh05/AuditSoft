import { useState, useEffect } from 'react'
import { useApp } from '../state/store'
import { IconX, IconDownloadCloud, IconRefresh, IconCheck } from './Icons'
import type { UpdateProgress } from '../../shared/types/update'
export function UpdateModal(): JSX.Element | null {
  const updateModalOpen = useApp((s) => s.updateModalOpen)
  const setUpdateModalOpen = useApp((s) => s.setUpdateModalOpen)
  const setUpdateNoticeDismissed = useApp((s) => s.setUpdateNoticeDismissed)
  const updateInfo = useApp((s) => s.updateInfo)
  const isCheckingUpdate = useApp((s) => s.isCheckingUpdate)
  const checkAppUpdate = useApp((s) => s.checkAppUpdate)
  const [checking, setChecking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    if (!window.auditsoft?.onUpdateProgress) return
    const cleanup = window.auditsoft.onUpdateProgress((p) => {
      setDownloadProgress(p)
      if (p.stage === 'error') {
        setDownloading(false)
        setDownloadError(p.message || 'Lỗi khi tải bản cập nhật')
      }
    })
    return cleanup
  }, [])

  const handleAutoInstall = async () => {
    if (downloading) return
    setDownloading(true)
    setDownloadError(null)
    const targetUrl = updateInfo?.downloadUrl || `https://github.com/dacthinh05/AuditSoft/releases/download/v${latestVer}/AuditSoft-${latestVer}-Setup.exe`
    try {
      if (window.auditsoft?.downloadAndInstallUpdate) {
        const res = await window.auditsoft.downloadAndInstallUpdate(targetUrl)
        if (!res.success) {
          setDownloading(false)
          setDownloadError(res.message)
        }
      } else {
        handleOpenUrl(targetUrl)
        setDownloading(false)
      }
    } catch (err) {
      setDownloading(false)
      setDownloadError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleDismissLater = () => {
    setUpdateModalOpen(false)
    setUpdateNoticeDismissed(true)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('auditsoft_update_auto_dismissed', 'true')
    }
  }

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
      onClick={handleDismissLater}
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
            onClick={handleDismissLater}
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

              {/* Lỗi tải nếu có */}
              {downloadError && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: 12.5,
                  }}
                >
                  ⚠️ {downloadError}
                </div>
              )}

              {/* Tiến trình tải ngầm */}
              {downloading ? (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 10,
                    padding: '14px 16px',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5, fontWeight: 600, color: '#15803d' }}>
                    <span>{downloadProgress?.message || 'Đang tải bản cập nhật...'}</span>
                    <span>{downloadProgress?.percent || 0}%</span>
                  </div>
                  <div style={{ height: 8, width: '100%', background: '#dcfce7', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${downloadProgress?.percent || 0}%`,
                        background: '#16a34a',
                        borderRadius: 4,
                        transition: 'width 200ms ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11.5, color: '#166534', marginTop: 6, textAlign: 'center' }}>
                    Tải xong ứng dụng sẽ tự động mở bộ cài đặt và khởi động lại.
                  </div>
                </div>
              ) : (
                /* Nhóm Nút Hành Động: Để Sau & Cập Nhật Ngay */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      style={{
                        flex: '0 0 115px',
                        padding: '11px 16px',
                        fontSize: 13.5,
                        fontWeight: 600,
                        background: '#f1f5f9',
                        color: '#475569',
                        borderRadius: 9,
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                      onClick={handleDismissLater}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e2e8f0'
                        e.currentTarget.style.color = '#1e293b'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f1f5f9'
                        e.currentTarget.style.color = '#475569'
                      }}
                    >
                      Để sau
                    </button>

                    <button
                      type="button"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '11px 18px',
                        fontSize: 13.5,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        borderRadius: 9,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        transition: 'transform 120ms ease, box-shadow 120ms ease',
                      }}
                      onClick={handleAutoInstall}
                    >
                      <IconDownloadCloud size={17} />
                      <span>CẬP NHẬT NGAY</span>
                    </button>
                  </div>
                  {/* Nút phụ: Mở trình duyệt tải thủ công */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    {updateInfo?.downloadUrl && (
                      <button
                        type="button"
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '7px 12px',
                          fontSize: 12,
                          fontWeight: 500,
                          background: '#f8fafc',
                          color: '#475569',
                          borderRadius: 7,
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleOpenUrl(updateInfo.downloadUrl)}
                        title="Tải thủ công qua trình duyệt"
                      >
                        <span>Tải thủ công (Setup)</span>
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
                          gap: 6,
                          padding: '7px 12px',
                          fontSize: 12,
                          fontWeight: 500,
                          background: '#f8fafc',
                          color: '#475569',
                          borderRadius: 7,
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleOpenUrl(updateInfo.portableUrl)}
                        title="Tải bản Portable qua trình duyệt"
                      >
                        <span>Bản Portable (.exe)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
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
