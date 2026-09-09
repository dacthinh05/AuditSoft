import { useEffect } from 'react'
import { useApp } from './state/store'
import { SetupPage } from './pages/SetupPage'
import { ResultsPage } from './pages/ResultsPage'
import { SamplingTab } from './components/SamplingTab'
import { WorkingPaperPage } from './pages/WorkingPaperPage'
import { B410DropZone } from './components/B410Consolidation/B410DropZone'
import { LicenseModal } from './components/LicenseModal'
import { IconAlert, IconX, IconRefresh } from './components/Icons'
import { AppLogo } from './components/AppLogo'
import { UpdateModal } from './components/UpdateModal'
import { Qtt03ConverterPage } from './components/EtaxConverter/Qtt03ConverterPage'
export default function App(): JSX.Element {
  const view = useApp((s) => s.view)
  const result = useApp((s) => s.result)
  const error = useApp((s) => s.error)
  const setError = useApp((s) => s.setError)
  const running = useApp((s) => s.running)
  const licenseModalOpen = useApp((s) => s.licenseModalOpen)
  const setLicenseModalOpen = useApp((s) => s.setLicenseModalOpen)
  const trialStatus = useApp((s) => s.trialStatus)
  const updateInfo = useApp((s) => s.updateInfo)
  const setUpdateModalOpen = useApp((s) => s.setUpdateModalOpen)
  const checkAppUpdate = useApp((s) => s.checkAppUpdate)

  // Tự động kiểm tra cập nhật khi khởi chạy ứng dụng (delay 2s)
  useEffect(() => {
    const timer = setTimeout(() => {
      void checkAppUpdate()
    }, 2000)
    return () => clearTimeout(timer)
  }, [checkAppUpdate])

  return (
    <div className="app-container">
      {/* ── Enterprise Topbar ── */}
      <header className="app-header">
        <div className="header-left">
          <AppLogo />
        </div>

        <div className="header-center">
          <div className="segmented-nav">
            <button
              type="button"
              className={`segmented-btn ${view === 'b410' ? 'active' : ''}`}
              onClick={() => useApp.getState().setView('b410')}
            >
              <span className="step-badge">1</span>
              <span className="btn-label">Tổng Hợp B410</span>
            </button>

            <button
              type="button"
              className={`segmented-btn ${view === 'setup' ? 'active' : ''}`}
              onClick={() => useApp.getState().setView('setup')}
            >
              <span className="step-badge">2</span>
              <span className="btn-label">Đối Chiếu 2 Sổ NKC</span>
            </button>
            {result && (
              <button
                type="button"
                className={`segmented-btn ${view === 'results' ? 'active' : ''}`}
                onClick={() => useApp.getState().setView('results')}
              >
                <span className="step-badge">✓</span>
                <span className="btn-label">Kết Quả Đối Chiếu</span>
                <span className="result-chip">
                  {result.diffRows.length.toLocaleString('vi-VN')} chênh lệch
                </span>
              </button>
            )}

            <button
              type="button"
              className={`segmented-btn ${view === 'sampling' ? 'active' : ''}`}
              onClick={() => useApp.getState().setView('sampling')}
            >
              <span className="step-badge">3</span>
              <span className="btn-label">Chọn Mẫu VSA 530</span>
            </button>

            <button
              type="button"
              className={`segmented-btn ${view === 'qtt03' ? 'active' : ''}`}
              onClick={() => useApp.getState().setView('qtt03')}
            >
              <span className="step-badge">4</span>
              <span className="btn-label">Chuyển Đổi Tờ Khai eTax</span>
            </button>

          </div>
        </div>

        <div className="header-right">
          {/* ── Version & Auto-Update Badge ── */}
          <button
            type="button"
            className={`btn-update-header ${updateInfo?.hasUpdate ? 'has-update' : ''}`}
            onClick={() => setUpdateModalOpen(true)}
            title={
              updateInfo?.hasUpdate
                ? `Đã có bản cập nhật mới v${updateInfo.latestVersion}! Bấm để xem chi tiết.`
                : `Phiên bản hiện tại: v${updateInfo?.currentVersion || '0.1.0'} (Bấm để kiểm tra cập nhật)`
            }
          >
            <IconRefresh size={13} style={{ color: updateInfo?.hasUpdate ? '#0284c7' : '#64748b' }} />
            <span>v{updateInfo?.currentVersion || '0.1.0'}</span>
            {updateInfo?.hasUpdate && (
              <span className="update-pill-badge">Bản mới</span>
            )}
          </button>

          <button
            type="button"
            className={`btn-license-header ${trialStatus.isLicensed ? 'licensed' : trialStatus.isExpired ? 'trial expired' : ''}`}
            onClick={() => setLicenseModalOpen(true)}
            title={
              trialStatus.isLicensed
                ? 'Đã kích hoạt Bản quyền Vĩnh viễn — Tác giả Thịnh Lynx'
                : trialStatus.isExpired
                  ? 'Đã hết lượt dùng thử miễn phí. Bấm để kích hoạt bản quyền.'
                  : 'Xem thông tin bản quyền tác giả Thịnh Lynx & Quét mã VietQR'
            }
          >
            <span className="author-tag">{trialStatus.isLicensed ? '✓ Bản quyền:' : 'Bản quyền:'}</span>
            <strong>
              {trialStatus.isLicensed
                ? 'Thịnh Lynx VIP'
                : trialStatus.isExpired
                  ? 'Hết hạn dùng thử'
                  : 'Thịnh Lynx'}
            </strong>
          </button>
          {running ? (
            <div className="status-badge running">
              <span className="pulse-dot"></span> Đang xử lý…
            </div>
          ) : result ? (
            <div className="status-badge ready">
              <span className="status-indicator-dot ready"></span> Đã đối chiếu
            </div>
          ) : (
            <div className="status-badge idle">
              <span className="status-indicator-dot idle"></span> Sẵn sàng
            </div>
          )}
        </div>
      </header>

      {/* ── Global Error Banner ── */}
      {error && (
        <div className="floating-error-banner">
          <div className="error-content">
            <span className="error-icon"><IconAlert size={16} /></span>
            <span className="error-msg">{error}</span>
          </div>
          <button className="error-close-btn" onClick={() => setError(null)} title="Đóng">
            <IconX size={14} />
          </button>
        </div>
      )}
      {/* ── Main View Area ── */}
      <main className="app-main">
        {view === 'b410' && <B410DropZone />}
        {view === 'setup' && <SetupPage />}
        {view === 'results' && <ResultsPage />}
        {view === 'sampling' && <SamplingTab />}
        {/* view === 'workingpaper' tam thoi an theo yeu cau */}
        {view === 'qtt03' && <Qtt03ConverterPage />}
      </main>

      {/* ── License & Copyright Modal ── */}
      <LicenseModal isOpen={licenseModalOpen} onClose={() => setLicenseModalOpen(false)} />

      {/* ── Software Auto-Update Modal ── */}
      <UpdateModal />
    </div>
  )
}
