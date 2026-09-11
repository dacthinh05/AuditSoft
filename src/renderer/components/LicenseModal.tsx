import { useState, useEffect } from 'react'
import { IconX, IconCheck, IconClipboard, IconAlert } from './Icons'
import { AppLogoIcon } from './AppLogo'
import { getLicenseStatus, saveLicense, removeLicense, getTrialExportStatus, type LicenseStatus, type TrialExportStatus } from '../../shared/license'
import { PRICING_PLANS, buildVietQrPayload, generateQrDataUrl, type PricingPlan } from '../../shared/vietqr'
import { useApp } from '../state/store'

interface LicenseModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LicenseModal({ isOpen, onClose }: LicenseModalProps): JSX.Element | null {
  const [copiedStk, setCopiedStk] = useState(false)
  const [copiedMid, setCopiedMid] = useState(false)
  const [copiedMemo, setCopiedMemo] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(PRICING_PLANS[2]!) // Mặc định Early Bird
  const [activeTab, setActiveTab] = useState<'benefits' | 'activate'>('benefits')
  const [licenseState, setLicenseState] = useState<LicenseStatus>({
    isLicensed: false,
    machineId: '',
    licenseKey: null,
    activatedAt: null,
  })
  const [trialInfo, setTrialInfo] = useState<TrialExportStatus>(getTrialExportStatus())
  const [inputKey, setInputKey] = useState('')
  const [inputName, setInputName] = useState('')
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      const st = getLicenseStatus()
      setLicenseState(st)
      setTrialInfo(getTrialExportStatus())
      setActiveTab(st.isLicensed ? 'activate' : 'benefits')
      setStatusMsg(null)
      setInputKey('')
      setInputName('')
      useApp.getState().refreshTrialStatus()
    }
  }, [isOpen])

  // Tự động sinh mã VietQR tức thì khi thay đổi gói giá hoặc Machine ID
  useEffect(() => {
    if (isOpen && licenseState.machineId) {
      const memo = `AS ${licenseState.machineId.replace('AS-', '')}`
      const payload = buildVietQrPayload({
        amount: selectedPlan.price,
        memo,
      })
      void generateQrDataUrl(payload).then((url) => {
        setQrDataUrl(url)
      })
    }
  }, [isOpen, selectedPlan, licenseState.machineId])

  if (!isOpen) return null

  const bankInfo = {
    bankName: 'MB BANK (Ngân hàng TMCP Quân Đội)',
    accountNumber: '0817567008',
    accountName: 'THỊNH LYNX (NGUYỄN ĐẮC THỊNH)',
    amount: selectedPlan.price,
    memo: `AS ${licenseState.machineId.replace('AS-', '')}`,
  }

  async function handleCopy(text: string, setCopiedFn: (v: boolean) => void): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFn(true)
      setTimeout(() => setCopiedFn(false), 2000)
    } catch {
      // Fallback
    }
  }

  async function handlePasteFromClipboard(): Promise<void> {
    try {
      let text = ''
      if (typeof window.auditsoft?.readClipboardText === 'function') {
        text = await window.auditsoft.readClipboardText()
      }
      if (!text && navigator.clipboard) {
        text = await navigator.clipboard.readText()
      }
      if (text) {
        const trimmed = text.trim()
        // Tự động tìm chuỗi ASKEY-xxx.yyy kể cả khi lẫn trong tin nhắn dài
        const match = trimmed.match(/ASKEY-[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)
        if (match) {
          setInputKey(match[0])
          setStatusMsg({ type: 'ok', text: 'Đã tự động lấy đúng mã bản quyền từ Clipboard!' })
        } else {
          setInputKey(trimmed)
        }
      }
    } catch {
      // Clipboard fallback
    }
  }

  async function handleActivate(): Promise<void> {
    const rawKey = inputKey.trim()
    if (!rawKey) {
      setStatusMsg({ type: 'err', text: 'Vui lòng dán mã bản quyền bạn đã nhận.' })
      return
    }

    // Tự động bóc tách nếu người dùng dán nguyên cả tin nhắn Zalo chứa key
    const match = rawKey.match(/ASKEY-[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)
    const cleanKey = match ? match[0] : rawKey

    const res = await saveLicense(cleanKey, inputName)
    if (res.success) {
      const updated = getLicenseStatus()
      setLicenseState(updated)
      setTrialInfo(getTrialExportStatus())
      useApp.getState().refreshTrialStatus()
      setStatusMsg({ type: 'ok', text: res.message })
    } else {
      setStatusMsg({ type: 'err', text: res.message })
    }
  }

  function handleDeactivate(): void {
    removeLicense()
    const updated = getLicenseStatus()
    setLicenseState(updated)
    setTrialInfo(getTrialExportStatus())
    useApp.getState().refreshTrialStatus()
    setStatusMsg({ type: 'ok', text: 'Đã xóa bản quyền khỏi máy này.' })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box compact-license-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* ── Modal Head ── */}
        <div className="modal-head compact-head">
          <div className="modal-title-group">
            <AppLogoIcon size={24} />
            <div>
              <div className="modal-title">Bản quyền phần mềm AuditSoft</div>
              <div className="modal-subtitle">
                {licenseState.isLicensed
                  ? 'Bản quyền vĩnh viễn đã kích hoạt'
                  : trialInfo.isExpired
                    ? 'Đã hết 30 ngày dùng thử miễn phí — Vui lòng kích hoạt bản quyền'
                    : `Bản dùng thử: Còn ${trialInfo.trialDaysLeft} ngày trải nghiệm đầy đủ tính năng`}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Đóng">
            <IconX size={16} />
          </button>
        </div>

        {/* ── Modal Tabs Switcher ── */}
        <div className="compact-license-tabs">
          <button
            type="button"
            className={`license-tab-btn ${activeTab === 'benefits' ? 'active' : ''}`}
            onClick={() => setActiveTab('benefits')}
          >
            <span>Quyền lợi bản quyền</span>
            {!licenseState.isLicensed && <span className="tab-badge-highlight">Chi tiết</span>}
          </button>
          <button
            type="button"
            className={`license-tab-btn ${activeTab === 'activate' ? 'active' : ''}`}
            onClick={() => setActiveTab('activate')}
          >
            <span>Kích hoạt & Thanh toán</span>
            {trialInfo.isExpired && !licenseState.isLicensed && (
              <span className="tab-badge-highlight" style={{ background: '#ef4444' }}>Hết hạn</span>
            )}
          </button>
        </div>

        {/* ── Modal Body (Compact, Single View, Zero Scroll) ── */}
        <div className="modal-body compact-license-body">
          {activeTab === 'benefits' ? (
            <div className="benefits-tab-body">
              {/* Hero Banner */}
              <div className="benefits-hero-card">
                <div className="benefits-hero-left">
                  <div className="benefits-hero-title">
                    <span>AuditSoft Pro dành cho kiểm toán viên</span>
                  </div>
                  <div className="benefits-hero-desc">
                    Tự động hóa bốc mẫu VSA 530, đối chiếu sổ NKC và tổng hợp bảng sai sót B410.
                  </div>
                </div>
                <div className="benefits-hero-badge">
                  Bản quyền vĩnh viễn
                </div>
              </div>

              {/* 6 Value Proposition Cards */}
              <div className="benefits-grid-2col">
                <div className="benefit-item-card">
                  <div className="benefit-item-icon">1</div>
                  <div className="benefit-item-content">
                    <div className="benefit-item-title">Bốc mẫu VSA 530 tự động trong 3 giây</div>
                    <div className="benefit-item-desc">
                      Tự tính mức trọng yếu OM, PM, CTT; chia tầng Key Items, số tròn, rủi ro 31/12 và chọn mẫu hệ thống.
                    </div>
                  </div>
                </div>

                <div className="benefit-item-card">
                  <div className="benefit-item-icon">2</div>
                  <div className="benefit-item-content">
                    <div className="benefit-item-title">Đối chiếu tự động 2 sổ Nhật ký chung</div>
                    <div className="benefit-item-desc">
                      So khớp chi tiết từng dòng chứng từ Nợ/Có giữa 2 kỳ, tự động phát hiện giao dịch thêm mới, bị xóa hoặc lệch tiền.
                    </div>
                  </div>
                </div>

                <div className="benefit-item-card">
                  <div className="benefit-item-icon">3</div>
                  <div className="benefit-item-content">
                    <div className="benefit-item-title">Tổng hợp bảng sai sót B410 chuẩn mực</div>
                    <div className="benefit-item-desc">
                      Gộp dữ liệu từ các nhóm kiểm toán, tự động sửa lỗi hiển thị, lọc ảnh thừa và chống đè định dạng.
                    </div>
                  </div>
                </div>

                <div className="benefit-item-card">
                  <div className="benefit-item-icon">4</div>
                  <div className="benefit-item-content">
                    <div className="benefit-item-title">Xuất file Excel không giới hạn</div>
                    <div className="benefit-item-desc">
                      Mở khóa toàn quyền trọn đời, xử lý và xuất các bộ báo cáo kiểm toán không giới hạn thời gian.
                    </div>
                  </div>
                </div>

                <div className="benefit-item-card">
                  <div className="benefit-item-icon">5</div>
                  <div className="benefit-item-content">
                    <div className="benefit-item-title">Bảo mật dữ liệu trên máy tính cá nhân</div>
                    <div className="benefit-item-desc">
                      Xử lý trực tiếp trên máy nội bộ, không gửi nhật ký chung hay sổ cái ra ngoài môi trường máy chủ.
                    </div>
                  </div>
                </div>

                <div className="benefit-item-card">
                  <div className="benefit-item-icon">6</div>
                  <div className="benefit-item-content">
                    <div className="benefit-item-title">Hỗ trợ kỹ thuật trực tiếp từ tác giả</div>
                    <div className="benefit-item-desc">
                      Hỗ trợ qua Zalo và UltraViewer khi gặp file dữ liệu lỗi cấu trúc hoặc cần xử lý gấp trong mùa kiểm toán.
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="benefits-highlight-strip">
                <span>Xử lý tệp dữ liệu lớn trên 60.000 dòng</span>
                <span>•</span>
                <span>Đối chiếu chính xác từng dòng chứng từ</span>
                <span>•</span>
                <span>Kích hoạt 1 lần, sử dụng lâu dài</span>
              </div>

              {/* Strong Call to Action */}
              <button
                type="button"
                className="btn-cta-upgrade"
                onClick={() => {
                  setActiveTab('activate')
                  setSelectedPlan(PRICING_PLANS[2]!)
                }}
              >
                <span>🔥 Nhận ưu đãi Early Bird — Vĩnh viễn chỉ 899.000 đ →</span>
              </button>
            </div>
          ) : (
            <>
          {/* Section 1: Activation / Machine ID Row */}
          {licenseState.isLicensed ? (
            <div className="licensed-compact-banner">
              <div className="licensed-info-left">
                <span className="licensed-badge-check">✓</span>
                <div>
                  <div className="licensed-title-txt">ĐÃ KÍCH HOẠT BẢN QUYỀN VĨNH VIỄN</div>
                  <div className="licensed-sub-txt">
                    Cấp cho: <strong>{licenseState.customerName || 'Kiểm toán viên VIP'}</strong> · Mã máy: <code>{licenseState.machineId}</code> · Ngày: {licenseState.activatedAt}
                  </div>
                </div>
              </div>
              <button type="button" className="btn-deactivate-sm" onClick={handleDeactivate}>
                Hủy kích hoạt
              </button>
            </div>
          ) : (
            <div className="compact-activation-panel">
              {trialInfo.isExpired ? (
                <div className="trial-expired-compact-bar">
                  <span>Bạn đã hết 30 ngày dùng thử miễn phí. Hãy quét mã QR bên dưới hoặc nhập mã bản quyền để mở khóa vĩnh viễn.</span>
                </div>
              ) : (
                <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '12px', fontSize: '12.5px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Chế độ dùng thử 30 ngày: Còn <strong>{trialInfo.trialDaysLeft} ngày</strong> trải nghiệm miễn phí toàn bộ tính năng.</span>
                </div>
              )}
              {/* Machine ID Row */}
              <div className="compact-mid-row">
                <div className="compact-mid-label">
                  MÃ MÁY (MACHINE ID): <span className="compact-mid-code">{licenseState.machineId}</span>
                </div>
                <button
                  type="button"
                  className={`btn-copy-sm ${copiedMid ? 'copied' : ''}`}
                  onClick={() => void handleCopy(licenseState.machineId, setCopiedMid)}
                >
                  {copiedMid ? <><IconCheck size={12} /> Đã chép</> : <><IconClipboard size={12} /> Sao chép mã máy</>}
                </button>
              </div>

              {/* License Key Input Row */}
              <div className="compact-key-row">
                <input
                  type="text"
                  className="styled-input compact-key-input"
                  placeholder="Nhập License Key: ASKEY-XXXX..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  style={{ flex: 1.5 }}
                />
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  title="Dán nhanh từ Clipboard"
                  className="btn-copy-sm"
                  style={{ height: '32px', padding: '0 10px', fontSize: '11.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  📋 Dán
                </button>
                <input
                  type="text"
                  className="styled-input compact-name-input"
                  placeholder="Tên KTV / Đơn vị"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                />
                <button type="button" className="btn-activate-compact" onClick={handleActivate}>
                  Kích hoạt ngay
                </button>
              </div>

              {statusMsg && (
                <div className={`activation-status-sm ${statusMsg.type}`}>
                  {statusMsg.type === 'ok' ? <IconCheck size={13} /> : <IconAlert size={13} />}
                  <span>{statusMsg.text}</span>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Pricing Selector Cards — 3 mức giá */}
          <div className="pricing-3col-row">
            {PRICING_PLANS.map((plan) => {
              const isSelected = selectedPlan.id === plan.id
              const slotPct = plan.slots ? Math.round((1 - plan.slots.remaining / plan.slots.total) * 100) : null
              return (
                <div
                  key={plan.id}
                  className={[
                    'pricing-tier-card',
                    isSelected ? 'selected' : '',
                    plan.isHero ? 'hero' : '',
                    plan.isDecoy ? 'decoy' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {/* Badge trên cùng */}
                  {plan.badge && (
                    <div className={`pricing-tier-badge ${plan.isHero ? 'badge-fire' : 'badge-neutral'}`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Tên gói */}
                  <div className="tier-name">{plan.name}</div>

                  {/* Giá chính */}
                  <div className="tier-price-block">
                    <span className="tier-price-main">{plan.price.toLocaleString('vi-VN')} đ</span>
                    {plan.isHero && (
                      <span className="tier-orig-crossed">{plan.originalPrice.toLocaleString('vi-VN')} đ</span>
                    )}
                  </div>

                  {/* Tiết kiệm */}
                  {plan.isHero && (
                    <div className="tier-savings-callout">
                      Bạn tiết kiệm <strong>1.991.000 đ</strong> so với giá gốc
                    </div>
                  )}

                  {/* Duration */}
                  <div className="tier-duration">{plan.duration}</div>

                  {/* Scarcity bar — chỉ cho Early Bird */}
                  {plan.slots && slotPct !== null && (
                    <div className="tier-slots-wrap">
                      <div className="tier-slots-bar">
                        <div className="tier-slots-fill" style={{ width: `${slotPct}%` }} />
                      </div>
                      <div className="tier-slots-label">
                        Còn <strong>{plan.slots.remaining}</strong>/{plan.slots.total} suất Early Bird
                      </div>
                    </div>
                  )}

                  {/* Select pill */}
                  <div className={`tier-select-pill ${isSelected ? 'active' : ''}`}>
                    {isSelected ? '✓ Đang chọn gói này' : plan.isHero ? 'Chọn Early Bird' : 'Chọn gói'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Savings urgency strip — chỉ hiện khi chọn Early Bird */}
          {selectedPlan.id === 'early_bird' && (
            <div className="urgency-strip">
              <span className="urgency-flame">🔥</span>
              <span>Ưu đãi Early Bird <strong>899.000 đ / Vĩnh viễn</strong> — tiết kiệm 1.991.000 đ so với giá gốc. Hết suất là hết, không mở lại.</span>
            </div>
          )}

          {/* Section 3: VietQR & Bank Info Row */}
          <div className="compact-payment-grid">
            {/* VietQR Frame */}
            <div className="compact-qr-box">
              <div className="compact-qr-head">
                <span className="vietqr-mini-brand">Viet<span className="qr-red">QR</span></span>
                <span className="compact-amount-badge">{selectedPlan.price.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="compact-qr-img-wrapper">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="VietQR" className="compact-qr-img" />
                ) : (
                  <div className="qr-loading-mini">Đang tạo QR...</div>
                )}
              </div>
              <div className="compact-qr-note">Quét tự động điền STK & Số tiền</div>
            </div>

            {/* Bank Transfer Info Card */}
            <div className="compact-bank-box">
              <div className="compact-bank-rows">
                <div className="bank-info-line">
                  <span className="lbl">Ngân hàng:</span>
                  <span className="val bold">MB BANK (Ngân hàng TMCP Quân Đội)</span>
                </div>

                <div className="bank-info-line stk-line">
                  <span className="lbl">Số TK MB:</span>
                  <span className="val-stk">{bankInfo.accountNumber}</span>
                  <button
                    type="button"
                    className={`btn-copy-mini ${copiedStk ? 'copied' : ''}`}
                    onClick={() => void handleCopy(bankInfo.accountNumber, setCopiedStk)}
                  >
                    {copiedStk ? '✓ Đã chép' : 'Sao chép STK'}
                  </button>
                </div>

                <div className="bank-info-line">
                  <span className="lbl">Chủ tài khoản:</span>
                  <span className="val">{bankInfo.accountName}</span>
                </div>

                <div className="bank-info-line memo-line">
                  <span className="lbl">Nội dung CK:</span>
                  <span className="val-memo">{bankInfo.memo}</span>
                  <button
                    type="button"
                    className={`btn-copy-mini ${copiedMemo ? 'copied' : ''}`}
                    onClick={() => void handleCopy(bankInfo.memo, setCopiedMemo)}
                  >
                    {copiedMemo ? '✓ Đã chép' : 'Sao chép Memo'}
                  </button>
                </div>
              </div>

              <div className="compact-support-hint">
                Sau khi chuyển khoản, bạn gửi ảnh giao dịch và mã máy qua Zalo <strong>0817.567.008</strong> (Thịnh Lynx) để nhận mã kích hoạt.
              </div>
            </div>
          </div>
            </>
          )}
        </div>

        {/* ── Modal Foot ── */}
        <div className="modal-foot compact-foot">
          <div className="modal-foot-left">
            <span>AuditSoft · Zalo/SĐT hỗ trợ: <strong>0817.567.008</strong> (Thịnh Lynx)</span>
          </div>
          <div className="modal-foot-right">
            <button className="btn-modal primary" onClick={onClose} style={{ padding: '6px 16px', fontSize: 12.5 }}>
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
