import { useApp } from '../state/store'
import { IconArrowRight, IconCheck, IconLightbulb } from './Icons'

interface WorkflowStep {
  step: string
  phase: string
  title: string
  focus: string
  description: string
  primaryAction: {
    label: string
    viewKey: 'setup' | 'analytics' | 'sampling' | 'workingpaper'
  }
  secondaryAction?: {
    label: string
    viewKey: 'taxstats' | 'b410'
  }
  accentColor: string
  accentBg: string
  isCompleted?: boolean
  statusLabel?: string
}

export function AuditWorkflowStepper(): JSX.Element {
  const setView = useApp((s) => s.setView)
  const beforeSource = useApp((s) => s.before)
  const result = useApp((s) => s.result)
  const taxData = useApp((s) => s.taxData)

  const isStep1Done = Boolean(beforeSource.pasted || beforeSource.cfg)
  const isStep2Done = Boolean((taxData && taxData.totalFilesProcessed > 0) || result)

  const steps: WorkflowStep[] = [
    {
      step: '01',
      phase: 'GIAI ĐOẠN 1',
      title: 'Khởi Tạo & Sổ Sách',
      focus: 'Sổ NKC & Bảng CĐPS',
      description: 'Nạp sổ NKC kỳ này (Nguồn ①), đối chiếu biến động kỳ trước/kỳ sau hoặc nạp CĐPS.',
      primaryAction: {
        label: 'Nạp Sổ NKC',
        viewKey: 'setup',
      },
      accentColor: '#2563eb',
      accentBg: '#eff6ff',
      isCompleted: isStep1Done,
      statusLabel: isStep1Done ? 'Đã nạp NKC' : 'Chưa nạp dữ liệu',
    },
    {
      step: '02',
      phase: 'GIAI ĐOẠN 2',
      title: 'Rà Soát & Phân Tích',
      focus: 'VSA 520 & Thuế GTGT/TNCN',
      description: 'Phân tích biến động 12M, rà soát bên liên quan, EBITDA và đối chiếu tờ khai Thuế với Sổ NKC.',
      primaryAction: {
        label: 'Phân Tích VSA 520',
        viewKey: 'analytics',
      },
      secondaryAction: {
        label: 'Thống kê thuế',
        viewKey: 'taxstats',
      },
      accentColor: '#0d9488',
      accentBg: '#f0fdfa',
      isCompleted: isStep2Done,
      statusLabel: isStep2Done ? 'Đã có phân tích' : 'Chờ số liệu',
    },
    {
      step: '03',
      phase: 'GIAI ĐOẠN 3',
      title: 'Trọng Yếu & Bốc Mẫu',
      focus: 'VSA 320 & VSA 530',
      description: 'Tự động tính mức trọng yếu OM/PM/CTT, phân tầng Key Items, số tròn, Cutoff và bốc mẫu phát sinh.',
      primaryAction: {
        label: 'Bốc Mẫu VSA 530',
        viewKey: 'sampling',
      },
      accentColor: '#7c3aed',
      accentBg: '#f5f3ff',
    },
    {
      step: '04',
      phase: 'GIAI ĐOẠN 4',
      title: 'Lập Hồ Sơ & Tổng Hợp',
      focus: '15 GLV VACPA & B410',
      description: 'Tự động trích số liệu điền trọn bộ 15 Giấy làm việc chuẩn mẫu VACPA & tổng hợp sai sót B410.',
      primaryAction: {
        label: 'Lập 15 Giấy Làm Việc',
        viewKey: 'workingpaper',
      },
      secondaryAction: {
        label: 'Tổng hợp B410',
        viewKey: 'b410',
      },
      accentColor: '#059669',
      accentBg: '#ecfdf5',
    },
  ]

  return (
    <section className="audit-workflow-section" aria-label="Quy trình kiểm toán thực chiến chuẩn VSA">
      {/* ── Header Bar ── */}
      <div className="workflow-section-head">
        <div className="workflow-head-title-group">
          <span className="workflow-badge-pill">LỘ TRÌNH KIỂM TOÁN THỰC CHIẾN</span>
          <h2 className="workflow-main-title">Quy Trình 4 Bước Lập Hồ Sơ Kiểm Toán Chuẩn VSA</h2>
        </div>
        <div className="workflow-guide-hint" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconLightbulb size={14} style={{ color: '#d97706', flexShrink: 0 }} />
          <span>Khuyến nghị: Bắt đầu từ <strong>Bước 01 (Nạp Sổ NKC)</strong> để tự động cấp số liệu cho toàn bộ các bước sau.</span>
        </div>
      </div>

      {/* ── 4 Steps Stepper Grid ── */}
      <div className="workflow-stepper-grid">
        {steps.map((st, idx) => {
          return (
            <div
              key={st.step}
              className={`workflow-step-card ${st.isCompleted ? 'is-completed' : ''}`}
              style={{ '--step-color': st.accentColor, '--step-bg': st.accentBg } as React.CSSProperties}
            >
              {/* Connector Arrow (between steps) */}
              {idx < steps.length - 1 && (
                <div className="step-connector-arrow" aria-hidden="true">
                  <span>→</span>
                </div>
              )}

              {/* Step Card Topline */}
              <div className="step-card-topline">
                <span className="step-number-tag">{st.step}</span>
                <span className="step-phase-label">{st.phase}</span>
                {st.statusLabel && (
                  <span className={`step-status-pill ${st.isCompleted ? 'done' : 'pending'}`}>
                    {st.isCompleted && <IconCheck size={11} className="step-check-icon" />}
                    <span>{st.statusLabel}</span>
                  </span>
                )}
              </div>

              {/* Step Card Content */}
              <div className="step-card-body">
                <h3 className="step-card-title">{st.title}</h3>
                <div className="step-card-focus">{st.focus}</div>
                <p className="step-card-desc">{st.description}</p>
              </div>

              {/* Step Card Actions */}
              <div className="step-card-actions">
                <button
                  type="button"
                  className="btn-step-primary"
                  onClick={() => setView(st.primaryAction.viewKey)}
                >
                  <span>{st.primaryAction.label}</span>
                  <IconArrowRight size={13} />
                </button>
                {st.secondaryAction && (
                  <button
                    type="button"
                    className="btn-step-secondary"
                    onClick={() => setView(st.secondaryAction!.viewKey)}
                  >
                    {st.secondaryAction.label}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
