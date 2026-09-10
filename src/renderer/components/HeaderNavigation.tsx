import { useState, useRef, useEffect } from 'react'
import { useApp } from '../state/store'
import { getActiveModules, getModuleByView } from '../config/modulesRegistry'
import { IconHome, IconChevronDown, IconCheck } from './Icons'

export function HeaderNavigation(): JSX.Element | null {
  const view = useApp((s) => s.view)
  const setView = useApp((s) => s.setView)
  const result = useApp((s) => s.result)

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!switcherOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [switcherOpen])

  // Khi đang ở Trang Chủ thì ẩn thanh điều hướng breadcrumb
  if (view === 'hub') {
    return null
  }

  const activeModule = getModuleByView(view)
  const allActiveModules = getActiveModules()

  return (
    <nav className="header-nav-breadcrumb" aria-label="Điều hướng phân hệ">
      {/* ── Nút Quay Về Trang Chủ ── */}
      <button
        type="button"
        className="btn-header-home"
        onClick={() => setView('hub')}
        title="Quay về Trang Chủ Tổng Quan"
      >
        <IconHome size={14} />
        <span>Trang Chủ</span>
      </button>

      <span className="nav-breadcrumb-slash">/</span>

      {/* ── Bộ Chuyển Đổi Phân Hệ Nhanh (Quick Switcher) ── */}
      <div className="header-switcher-container" ref={dropdownRef}>
        <button
          type="button"
          className={`btn-header-switcher ${switcherOpen ? 'is-open' : ''}`}
          onClick={() => setSwitcherOpen((prev) => !prev)}
          title="Bấm để đổi nhanh sang phân hệ kiểm toán khác"
          aria-expanded={switcherOpen}
        >
          {activeModule && (
            <span
              className="switcher-badge-code"
              style={{
                color: activeModule.accentColor,
                backgroundColor: activeModule.accentBg,
              }}
            >
              #{activeModule.code}
            </span>
          )}

          <span className="switcher-active-title">
            {view === 'results'
              ? 'Đối Chiếu 2 Sổ NKC (Kết Quả)'
              : activeModule?.shortTitle || 'Phân Hệ Chức Năng'}
          </span>

          {view === 'results' && result && (
            <span className="switcher-result-tag">
              {result.diffRows.length.toLocaleString('vi-VN')} lệch
            </span>
          )}

          <IconChevronDown
            size={13}
            className={`switcher-chevron ${switcherOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {switcherOpen && (
          <div className="switcher-dropdown-menu" role="menu">
            <div className="switcher-dropdown-header">
              <span>CHUYỂN NHANH PHÂN HỆ KIỂM TOÁN</span>
            </div>

            <div className="switcher-dropdown-list">
              {allActiveModules.map((mod) => {
                const isCurrent =
                  mod.viewKey === view || (view === 'results' && mod.viewKey === 'setup')

                return (
                  <button
                    key={mod.id}
                    type="button"
                    className={`switcher-item ${isCurrent ? 'is-selected' : ''}`}
                    onClick={() => {
                      if (mod.viewKey) {
                        setView(mod.viewKey)
                      }
                      setSwitcherOpen(false)
                    }}
                    role="menuitem"
                  >
                    <span
                      className="switcher-item-code"
                      style={{
                        color: mod.accentColor,
                        backgroundColor: mod.accentBg,
                      }}
                    >
                      #{mod.code}
                    </span>

                    <div className="switcher-item-info">
                      <div className="switcher-item-title">{mod.shortTitle}</div>
                      <div className="switcher-item-category">{mod.categoryName}</div>
                    </div>

                    {isCurrent && (
                      <IconCheck size={14} className="switcher-selected-check" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="switcher-dropdown-footer">
              <button
                type="button"
                className="btn-switcher-back-hub"
                onClick={() => {
                  setView('hub')
                  setSwitcherOpen(false)
                }}
              >
                <IconHome size={13} />
                <span>Xem tất cả công cụ tại Trang Chủ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
