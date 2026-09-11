import { useApp } from '../state/store'
import { IconX, IconArrowRight } from './Icons'

export function UpdateNoticePopup(): JSX.Element | null {
  const updateInfo = useApp((s) => s.updateInfo)
  const updateModalOpen = useApp((s) => s.updateModalOpen)
  const setUpdateModalOpen = useApp((s) => s.setUpdateModalOpen)
  const updateNoticeDismissed = useApp((s) => s.updateNoticeDismissed)
  const setUpdateNoticeDismissed = useApp((s) => s.setUpdateNoticeDismissed)

  // Không hiển thị nếu không có bản mới, hoặc đã tắt trong phiên này, hoặc đang mở modal cập nhật
  if (!updateInfo?.hasUpdate || updateNoticeDismissed || updateModalOpen) {
    return null
  }

  const latestVer = updateInfo.latestVersion || '1.1.X'
  const changelog = updateInfo.changelog || []
  // Lấy tối đa 2 điểm nổi bật nhất để thẻ luôn gọn gàng
  const highlights = changelog.slice(0, 2)

  const handleOpenModal = () => {
    setUpdateModalOpen(true)
    setUpdateNoticeDismissed(true)
  }

  return (
    <div
      className="update-notice-card"
      role="alert"
      aria-live="polite"
    >
      {/* ── Card Header ── */}
      <div className="update-notice-header">
        <div className="update-notice-title-group">
          <div className="update-notice-icon-box">
            <span style={{ fontSize: 15, lineHeight: 1 }}>🔔</span>
          </div>
          <div>
            <div className="update-notice-tag">ĐÃ CÓ BẢN MỚI</div>
            <h4 className="update-notice-version">AuditSoft v{latestVer}</h4>
          </div>
        </div>
        <button
          type="button"
          className="update-notice-close-btn"
          onClick={() => setUpdateNoticeDismissed(true)}
          title="Đóng thông báo (để sau)"
          aria-label="Đóng"
        >
          <IconX size={14} />
        </button>
      </div>

      {/* ── Card Body ── */}
      <div className="update-notice-body">
        {updateInfo.title && (
          <p className="update-notice-subtitle">
            {updateInfo.title}
          </p>
        )}

        {highlights.length > 0 && (
          <ul className="update-notice-list">
            {highlights.map((item, idx) => (
              <li key={idx}>
                <span className="update-notice-bullet">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Card Footer Actions ── */}
      <div className="update-notice-actions">
        <button
          type="button"
          className="btn-notice-dismiss"
          onClick={() => setUpdateNoticeDismissed(true)}
        >
          Để sau
        </button>
        <button
          type="button"
          className="btn-notice-primary"
          onClick={handleOpenModal}
        >
          <span>Cập nhật ngay</span>
          <IconArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}
