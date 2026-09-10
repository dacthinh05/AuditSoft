import { useState, useMemo } from 'react'
import { useApp } from '../state/store'
import {
  MODULES_REGISTRY,
  MODULE_CATEGORIES,
  type ModuleCategory,
  type ModuleDefinition,
} from '../config/modulesRegistry'
import {
  IconSearch,
  IconArrowRight,
  IconCheck,
  IconFileSpreadsheet,
  IconLayers,
  IconFileText,
  IconSpark,
  IconPackage,
  IconRefresh,
} from '../components/Icons'
import { ArchitectureDiagramModal } from '../components/ArchitectureDiagramModal'

function getModuleIcon(id: string, size = 22): JSX.Element {
  switch (id) {
    case 'b410':
      return <IconFileSpreadsheet size={size} />
    case 'reconcile_nkc':
      return <IconRefresh size={size} />
    case 'sampling_vsa530':
      return <IconLayers size={size} />
    case 'etax_qtt03':
      return <IconFileText size={size} />
    case 'wp_generator':
      return <IconPackage size={size} />
    case 'tax_risk_scanner':
      return <IconSpark size={size} />
    default:
      return <IconLayers size={size} />
  }
}

export function HubPage(): JSX.Element {
  const setView = useApp((s) => s.setView)
  const trialStatus = useApp((s) => s.trialStatus)
  const setLicenseModalOpen = useApp((s) => s.setLicenseModalOpen)

  const [diagramModalOpen, setDiagramModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | 'all'>('all')

  const filteredModules = useMemo(() => {
    return MODULES_REGISTRY.filter((mod) => {
      // 1. Lọc theo nhóm
      if (selectedCategory !== 'all' && mod.category !== selectedCategory) {
        return false
      }
      // 2. Lọc theo từ khóa tìm kiếm
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        mod.code.includes(q) ||
        mod.title.toLowerCase().includes(q) ||
        mod.shortTitle.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.categoryName.toLowerCase().includes(q) ||
        mod.highlights.some((h) => h.toLowerCase().includes(q))
      )
    })
  }, [searchQuery, selectedCategory])

  const activeCount = MODULES_REGISTRY.filter((m) => m.status === 'active').length
  const comingSoonCount = MODULES_REGISTRY.filter((m) => m.status === 'coming_soon').length

  const handleCardClick = (mod: ModuleDefinition) => {
    if (mod.status === 'active' && mod.viewKey) {
      setView(mod.viewKey)
    }
  }

  return (
    <div className="hub-container">
      {/* ── 1. Hero Header Banner ── */}
      <section className="hub-hero">
        <div className="hub-hero-badge">
          <IconSpark size={13} style={{ color: '#2563eb' }} />
          <span>HỆ THỐNG CÔNG CỤ PHỤC VỤ KIỂM TOÁN</span>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="hub-search-toolbar">
          <div className="hub-search-input-wrap">
            <IconSearch size={16} className="hub-search-icon" />
            <input
              type="text"
              className="hub-search-input"
              placeholder="Tìm nhanh công cụ (ví dụ: B410, NKC, VSA 530, eTax, Thuế...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="hub-search-clear"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          <div className="hub-category-pills">
            {MODULE_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`hub-category-pill ${selectedCategory === cat.key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="hub-quick-stats">
          <div className="quick-stat-item">
            <span className="stat-dot active" />
            <span><strong>{activeCount}</strong> Phân hệ sẵn sàng</span>
          </div>
          <div className="quick-stat-item">
            <span className="stat-dot upcoming" />
            <span><strong>{comingSoonCount}</strong> Công cụ đang phát triển</span>
          </div>
          <div className="quick-stat-item">
            <span className="stat-dot safe" />
            <span>Xử lý Offline 100% · Bảo mật dữ liệu</span>
          </div>
          <button
            type="button"
            className="hub-btn-diagram"
            onClick={() => setDiagramModalOpen(true)}
            title="Xem sơ đồ tương tác cách các phân hệ liên kết dữ liệu theo chuẩn Archify"
          >
            <IconSpark size={13} />
            <span>Sơ Đồ Luồng Nghiệp Vụ</span>
          </button>

          <button
            type="button"
            className="hub-license-pill"
            onClick={() => setLicenseModalOpen(true)}
            title="Xem chi tiết bản quyền và số lượt dùng thử"
          >
            {trialStatus.isLicensed ? '✓ Bản quyền VIP: Thịnh Lynx' : `Dùng thử: Còn ${trialStatus.remainingExports}/${trialStatus.maxExports} lượt`}
          </button>
        </div>
      </section>

      {/* ── 2. Scalable Modules Grid ── */}
      <section className="hub-grid-section">
        {filteredModules.length === 0 ? (
          <div className="hub-empty-state">
            <p>Không tìm thấy công cụ nào phù hợp với từ khóa &ldquo;<strong>{searchQuery}</strong>&rdquo;.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="hub-modules-grid">
            {filteredModules.map((mod) => {
              const isActive = mod.status === 'active'
              return (
                <div
                  key={mod.id}
                  className={`hub-module-card ${isActive ? 'is-active' : 'is-upcoming'}`}
                  onClick={() => handleCardClick(mod)}
                  role={isActive ? 'button' : 'region'}
                  tabIndex={isActive ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (isActive && (e.key === 'Enter' || e.key === ' ')) {
                      handleCardClick(mod)
                    }
                  }}
                >
                  {/* Card Topline: Code Badge + Category */}
                  <div className="hub-card-topline">
                    <span
                      className="hub-card-code"
                      style={{ color: mod.accentColor, borderColor: `${mod.accentColor}40` }}
                    >
                      #{mod.code}
                    </span>
                    <div className="hub-card-badges">
                      {mod.badgeText && (
                        <span
                          className="hub-card-badge-pill"
                          style={{
                            background: mod.accentBg,
                            color: mod.accentColor,
                            borderColor: `${mod.accentColor}30`,
                          }}
                        >
                          {mod.badgeText}
                        </span>
                      )}
                      <span className="hub-card-category-label">{mod.categoryName}</span>
                    </div>
                  </div>

                  {/* Card Main: Icon + Title */}
                  <div className="hub-card-header">
                    <div
                      className="hub-card-icon-box"
                      style={{
                        background: mod.accentBg,
                        color: mod.accentColor,
                        borderColor: `${mod.accentColor}35`,
                      }}
                    >
                      {getModuleIcon(mod.id, 24)}
                    </div>
                    <h3 className="hub-card-title">{mod.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="hub-card-desc">{mod.description}</p>

                  {/* Highlights Checklist */}
                  <ul className="hub-card-highlights">
                    {mod.highlights.map((h, idx) => (
                      <li key={idx}>
                        <IconCheck size={14} className="highlight-check-icon" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Card Action Footer */}
                  <div className="hub-card-footer">
                    {isActive ? (
                      <button
                        type="button"
                        className="hub-btn-launch"
                        style={{ backgroundColor: mod.accentColor }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCardClick(mod)
                        }}
                      >
                        <span>Vào Phân Hệ</span>
                        <IconArrowRight size={14} />
                      </button>
                    ) : (
                      <div className="hub-badge-upcoming">
                        <span>Đang phát triển theo lộ trình</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Architecture & Dataflow Diagram Modal (Archify Signal-Flow) ── */}
      <ArchitectureDiagramModal
        isOpen={diagramModalOpen}
        onClose={() => setDiagramModalOpen(false)}
      />
    </div>
  )
}
