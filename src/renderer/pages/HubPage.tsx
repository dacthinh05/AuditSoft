import { useState, useMemo } from 'react'
import { useApp } from '../state/store'
import {
  MODULES_REGISTRY,
  type ModuleDefinition,
} from '../config/modulesRegistry'
import {
  IconSearch,
  IconArrowRight,
  IconCheck,
  IconFileSpreadsheet,
  IconLayers,
  IconFileText,
  IconPackage,
  IconSpark,
  IconRefresh,
} from '../components/Icons'
import { ArchitectureDiagramModal } from '../components/ArchitectureDiagramModal'
import { AuditWorkflowStepper } from '../components/AuditWorkflowStepper'

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
    case 'tax_stats_vsa520':
      return <IconFileText size={size} />
    case 'wp_generator':
      return <IconPackage size={size} />
    case 'tax_risk_scanner':
      return <IconSpark size={size} />
    case 'ai_audit_copilot':
      return <IconSpark size={size} />
    default:
      return <IconLayers size={size} />
  }
}

export function HubPage(): JSX.Element {
  const setView = useApp((s) => s.setView)
  const [diagramModalOpen, setDiagramModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return MODULES_REGISTRY
    const q = searchQuery.toLowerCase().trim()
    return MODULES_REGISTRY.filter((mod) => {
      return (
        mod.code.includes(q) ||
        mod.title.toLowerCase().includes(q) ||
        mod.shortTitle.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.categoryName.toLowerCase().includes(q) ||
        mod.highlights.some((h) => h.toLowerCase().includes(q))
      )
    })
  }, [searchQuery])
  const handleCardClick = (mod: ModuleDefinition) => {
    if (mod.status === 'active' && mod.viewKey) {
      setView(mod.viewKey)
    }
  }

  return (
    <div className="hub-container">
      {/* ── 1. Hero Header Banner ── */}
      {/* ── 1. Compact Search & Workflow Toolbar (Single-Line 52px) ── */}
      <section className="hub-compact-toolbar">
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

        <button
          type="button"
          className="hub-btn-diagram"
          onClick={() => setDiagramModalOpen(true)}
          title="Xem sơ đồ tương tác cách các phân hệ liên kết dữ liệu theo chuẩn Archify"
        >
          <IconLayers size={14} className="hub-btn-diagram-icon" />
          <span>Sơ Đồ Luồng Nghiệp Vụ</span>
        </button>
      </section>
      {/* ── 2. Audit Workflow Stepper (4 Giai đoạn chuẩn VSA) ── */}
      <AuditWorkflowStepper />

      {/* ── 3. Scalable Modules Grid ── */}
      <section className="hub-grid-section">
        {filteredModules.length === 0 ? (
          <div className="hub-empty-state">
            <p>Không tìm thấy công cụ nào phù hợp với từ khóa &ldquo;<strong>{searchQuery}</strong>&rdquo;.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('')
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
                        <span>{mod.id === 'wp_generator' ? 'Tính năng đang hoàn thiện' : 'Đang phát triển theo lộ trình'}</span>
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
