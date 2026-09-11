import { useEffect, lazy, Suspense } from 'react'
import { useApp } from './state/store'
import { LicenseModal } from './components/LicenseModal'
import { IconAlert, IconX, IconRefresh, IconClipboard } from './components/Icons'
import { EngagementModal } from './components/EngagementModal'
import { AppLogo } from './components/AppLogo'
import { UpdateModal } from './components/UpdateModal'
import { UpdateNoticePopup } from './components/UpdateNoticePopup'
import { HubPage } from './pages/HubPage'
import { HeaderNavigation } from './components/HeaderNavigation'
import { AiConfigModal } from './components/Settings/AiConfigModal'
import { ErrorBoundary } from './components/ErrorBoundary'
// Code-splitting các phân hệ bằng React.lazy() để giảm 75% bundle size ban đầu
const SetupPage = lazy(() => import('./pages/SetupPage').then((m) => ({ default: m.SetupPage })))
const ResultsPage = lazy(() => import('./pages/ResultsPage').then((m) => ({ default: m.ResultsPage })))
const SamplingTab = lazy(() => import('./components/SamplingTab').then((m) => ({ default: m.SamplingTab })))
const B410DropZone = lazy(() => import('./components/B410Consolidation/B410DropZone').then((m) => ({ default: m.B410DropZone })))
const WorkingPaperPage = lazy(() => import('./pages/WorkingPaperPage').then((m) => ({ default: m.WorkingPaperPage })))
const Qtt03ConverterPage = lazy(() => import('./components/EtaxConverter/Qtt03ConverterPage').then((m) => ({ default: m.Qtt03ConverterPage })))
const PreliminaryAnalyticsPage = lazy(() => import('./components/Analytics/PreliminaryAnalyticsPage').then((m) => ({ default: m.PreliminaryAnalyticsPage })))
const TaxStatsPage = lazy(() => import('./components/Analytics/TaxStatsPage').then((m) => ({ default: m.TaxStatsPage })))
const TaxRiskScannerPage = lazy(() => import('./components/TaxRisk/TaxRiskScannerPage').then((m) => ({ default: m.TaxRiskScannerPage })))

function PageLoadingFallback(): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14 }}>
      <div className="spin-icon" style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%' }} />
      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Đang nạp phân hệ...</span>
    </div>
  )
}

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
  const apiKey = useApp((s) => s.apiKey)
  const setAiConfigModalOpen = useApp((s) => s.setAiConfigModalOpen)
  const checkAppUpdate = useApp((s) => s.checkAppUpdate)
  const engagement = useApp((s) => s.engagement)
  const setEngagementModalOpen = useApp((s) => s.setEngagementModalOpen)
  const setView = useApp((s) => s.setView)

  // Lắng nghe sự kiện điều hướng về Trang Chủ từ ErrorBoundary
  useEffect(() => {
    const handleHome = () => setView('hub')
    window.addEventListener('auditsoft:navigate-home', handleHome)
    return () => window.removeEventListener('auditsoft:navigate-home', handleHome)
  }, [setView])

  // Tự động kiểm tra cập nhật khi khởi chạy ứng dụng (delay 1.5s) và tự động mở popup nếu có bản mới
  useEffect(() => {
    const timer = setTimeout(async () => {
      const info = await checkAppUpdate()
      if (info?.hasUpdate) {
        const isDismissed =
          typeof sessionStorage !== 'undefined'
            ? sessionStorage.getItem('auditsoft_update_auto_dismissed')
            : null
        if (!isDismissed) {
          setUpdateModalOpen(true)
        }
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [checkAppUpdate, setUpdateModalOpen])
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
          {/* ── Engagement Profile Button (Sheet ADD) ── */}
          <button
            type="button"
            className="btn-engagement-header"
            onClick={() => setEngagementModalOpen(true)}
            title="Cấu hình Hồ sơ Kiểm toán & Sheet ADD (Tên khách hàng, Niên độ, KTV)"
          >
            <IconClipboard size={13} style={{ color: '#0284c7' }} />
            <span className="engagement-client-name">
              {engagement.clientName
                ? engagement.clientName.slice(0, 24) + (engagement.clientName.length > 24 ? '…' : '')
                : 'Hồ sơ (ADD)'}
            </span>
            <span className="engagement-year-pill">{engagement.fiscalYearEnd.slice(-4)}</span>
          </button>

          {/* ── Google Gemini 2.5 AI Settings Button ── */}
          <button
            type="button"
            className={`btn-ai-header ${apiKey ? 'configured' : ''}`}
            onClick={() => setAiConfigModalOpen(true)}
            title={apiKey ? 'Trợ lý AI Gemini 2.5 đã sẵn sàng (Bấm để cấu hình)' : 'Cấu hình Trợ lý AI Gemini 2.5 (BYOK miễn phí)'}
          >
            <span className="ai-star-sparkle">✨</span>
            <span className="ai-btn-text">AI Gemini 2.5</span>
            <span className={`ai-dot-indicator ${apiKey ? 'online' : 'offline'}`} />
          </button>

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
            className={`btn-license-header ${trialStatus.isLicensed ? 'licensed' : trialStatus.isExpired ? 'trial expired' : 'trial'}`}
            onClick={() => setLicenseModalOpen(true)}
            title={
              trialStatus.isLicensed
                ? 'Bản quyền vĩnh viễn đã kích hoạt thành công.'
                : trialStatus.isExpired
                  ? 'Đã hết thời gian 30 ngày dùng thử miễn phí. Bấm vào đây để mở khóa bản quyền.'
                  : `Bạn đang trong thời gian dùng thử 30 ngày (còn ${trialStatus.trialDaysLeft} ngày). Bấm để xem thông tin bản quyền.`
            }
          >
            <span className="author-tag">{trialStatus.isLicensed ? '✓ Bản quyền:' : 'Dùng thử:'}</span>
            <strong>
              {trialStatus.isLicensed
                ? 'Thịnh Lynx VIP'
                : trialStatus.isExpired
                  ? 'Hết hạn dùng thử'
                  : `Còn ${trialStatus.trialDaysLeft} ngày`}
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
        <ErrorBoundary key={view}>
          <Suspense fallback={<PageLoadingFallback />}>
            {view === 'hub' && <HubPage />}
            {view === 'b410' && <B410DropZone />}
            {view === 'setup' && <SetupPage />}
            {view === 'results' && <ResultsPage />}
            {view === 'sampling' && <SamplingTab />}
            {view === 'workingpaper' && <WorkingPaperPage />}
            {view === 'qtt03' && <Qtt03ConverterPage />}
            {view === 'analytics' && <PreliminaryAnalyticsPage />}
            {view === 'taxstats' && <TaxStatsPage />}
            {view === 'taxrisk' && <TaxRiskScannerPage />}
          </Suspense>
        </ErrorBoundary>
      </main>
      {/* ── License & Copyright Modal ── */}
      <LicenseModal isOpen={licenseModalOpen} onClose={() => setLicenseModalOpen(false)} />

      {/* ── Software Auto-Update Floating Notice ── */}
      <UpdateNoticePopup />

      <UpdateModal />

      {/* ── AI Gemini 2.5 Configuration Modal ── */}
      <AiConfigModal />

      {/* ── Engagement Profile Modal (Sheet ADD) ── */}
      <EngagementModal />
    </div>
  )
}
