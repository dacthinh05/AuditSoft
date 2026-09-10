import { useEffect } from 'react'
import { useApp } from './state/store'
import { SetupPage } from './pages/SetupPage'
import { ResultsPage } from './pages/ResultsPage'
import { SamplingTab } from './components/SamplingTab'
import { B410DropZone } from './components/B410Consolidation/B410DropZone'
import { WorkingPaperPage } from './pages/WorkingPaperPage'
import { LicenseModal } from './components/LicenseModal'
import { IconAlert, IconX, IconRefresh } from './components/Icons'
import { AppLogo } from './components/AppLogo'
import { UpdateModal } from './components/UpdateModal'
import { UpdateNoticePopup } from './components/UpdateNoticePopup'
import { HubPage } from './pages/HubPage'
import { HeaderNavigation } from './components/HeaderNavigation'
import { Qtt03ConverterPage } from './components/EtaxConverter/Qtt03ConverterPage'
import { PreliminaryAnalyticsPage } from './components/Analytics/PreliminaryAnalyticsPage'
import { DbConnectionModal } from './components/DatabaseConnector/DbConnectionModal'
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
          <HeaderNavigation />
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
            {updateInfo?.hasUpdate && <span className="update-pulse-dot" />}
            <IconRefresh size={13} style={{ color: updateInfo?.hasUpdate ? '#d97706' : '#64748b' }} />
            <span>v{updateInfo?.currentVersion || '0.1.0'}</span>
            {updateInfo?.hasUpdate && (
              <span className="update-pill-badge">Bản mới v{updateInfo.latestVersion}</span>
            )}
          </button>

          <button
            type="button"
            className={`btn-license-header ${trialStatus.isLicensed ? 'licensed' : trialStatus.isExpired ? 'trial expired' : ''}`}
            onClick={() => setLicenseModalOpen(true)}
            title={
              trialStatus.isLicensed
                ? 'Bản quyền vĩnh viễn đã kích hoạt thành công.'
                : trialStatus.isExpired
                  ? `Đã dùng hết ${trialStatus.maxExports} lượt xuất thử miễn phí. Bấm vào đây để mở khóa bản quyền.`
                  : `Bạn còn ${trialStatus.remainingExports}/${trialStatus.maxExports} lượt xuất thử miễn phí. Bấm để xem thông tin bản quyền.`
            }
          >
            <span className="author-tag">{trialStatus.isLicensed ? '✓ Bản quyền:' : 'Dùng thử:'}</span>
            <strong>
              {trialStatus.isLicensed
                ? 'Thịnh Lynx VIP'
                : trialStatus.isExpired
                  ? 'Hết lượt dùng thử'
                  : `Còn ${trialStatus.remainingExports}/${trialStatus.maxExports} lượt`}
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
        {view === 'hub' && <HubPage />}
        {view === 'b410' && <B410DropZone />}
        {view === 'setup' && <SetupPage />}
        {view === 'results' && <ResultsPage />}
        {view === 'sampling' && <SamplingTab />}
        {view === 'workingpaper' && <WorkingPaperPage />}
        {view === 'qtt03' && <Qtt03ConverterPage />}
        {view === 'analytics' && <PreliminaryAnalyticsPage />}
      </main>

      {/* ── License & Copyright Modal ── */}
      <LicenseModal isOpen={licenseModalOpen} onClose={() => setLicenseModalOpen(false)} />

      {/* ── Software Auto-Update Floating Notice ── */}
      <UpdateNoticePopup />

      <UpdateModal />
      {/* ── Database Connection Modal ── */}
      <DbConnectionModal />
    </div>
  )
}
