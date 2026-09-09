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
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(PRICING_PLANS[1]!) // Mặc định Gói Vĩnh Viễn 990k

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

  async function handleActivate(): Promise<void> {
    if (!inputKey.trim()) {
      setStatusMsg({ type: 'err', text: 'Vui lòng nhập License Key nhận được từ Thịnh Lynx.' })
      return
    }

    const res = await saveLicense(inputKey, inputName)
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
    setStatusMsg({ type: 'ok', text: 'Đã hủy kích hoạt bản quyền trên máy này.' })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box compact-license-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* ── Modal Head ── */}
        <div className="modal-head compact-head">
          <div className="modal-title-group">
            <AppLogoIcon size={24} />
            <div>
              <div className="modal-title">Bản Quyền & Kích Hoạt Phần Mềm — AuditSoft (Audit Suite)</div>
              <div className="modal-subtitle">
                {licenseState.isLicensed
                  ? 'Bản quyền Vĩnh Viễn đã kích hoạt thành công'
                  : trialInfo.isExpired
                    ? 'Đã hết lượt dùng thử miễn phí — Vui lòng kích hoạt bản quyền'
                    : 'Tác giả: Thịnh Lynx · Hệ thống Đối chiếu Kiểm toán Chuyên sâu'}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Đóng">
            <IconX size={16} />
          </button>
        </div>

        {/* ── Modal Body (Compact, Single View, Zero Scroll) ── */}
        <div className="modal-body compact-license-body">
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
              {trialInfo.isExpired && (
                <div className="trial-expired-compact-bar">
                  <span>❌ Đã hết lượt dùng thử miễn phí. Quét mã VietQR bên dưới hoặc nhập License Key để mở khóa vĩnh viễn.</span>
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
                  placeholder="Nhập License Key: ASKEY-XXXX-XXXX-XXXX-XXXX"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                />
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

          {/* Section 2: Pricing Selector Cards */}
          <div className="compact-pricing-row">
            {PRICING_PLANS.map((plan) => {
              const isSelected = selectedPlan.id === plan.id
              return (
                <div
                  key={plan.id}
                  className={`compact-pricing-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {plan.badge && <span className="compact-popular-badge">{plan.badge}</span>}
                  <div className="compact-plan-title-row">
                    <span className="compact-plan-name">{plan.name}</span>
                    <span className="compact-discount-tag">Tiết kiệm -{plan.discountPercent}%</span>
                  </div>
                  <div className="compact-price-row">
                    <span className="compact-main-price">{plan.price.toLocaleString('vi-VN')} VNĐ</span>
                    <span className="compact-orig-price">{plan.originalPrice.toLocaleString('vi-VN')} đ</span>
                    <span className={`compact-select-pill ${isSelected ? 'active' : ''}`}>
                      {isSelected ? '✓ Đang chọn' : 'Chọn gói'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

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
                👉 Sau khi chuyển khoản, gửi bill & Mã máy qua Zalo <strong>0817.567.008</strong> (Thịnh Lynx) để nhận key kích hoạt ngay!
              </div>
            </div>
          </div>
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
