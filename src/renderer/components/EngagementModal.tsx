import { useState, useEffect } from 'react'
import { useApp, type EngagementProfile } from '../state/store'
import { IconClipboard, IconX, IconFolder, IconCheck } from './Icons'

export function EngagementModal(): JSX.Element | null {
  const isOpen = useApp((s) => s.isEngagementModalOpen)
  const setOpen = useApp((s) => s.setEngagementModalOpen)
  const engagement = useApp((s) => s.engagement)
  const setEngagement = useApp((s) => s.setEngagement)
  const setView = useApp((s) => s.setView)

  const [formData, setFormData] = useState<EngagementProfile>(engagement)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData(engagement)
      setSavedSuccess(false)
    }
  }, [isOpen, engagement])

  if (!isOpen) return null

  function handleSave(): void {
    setEngagement(formData)
    setSavedSuccess(true)
    setTimeout(() => {
      setOpen(false)
    }, 400)
  }

  function handleSaveAndNavigate(): void {
    setEngagement(formData)
    setOpen(false)
    setView('workingpaper')
  }

  async function handlePickDir(): Promise<void> {
    if (!window.auditsoft) return
    try {
      const picked = await window.auditsoft.pickDirectory()
      if (picked.canceled || !picked.filePath) return
      setFormData((prev) => ({ ...prev, outputDir: picked.filePath || '' }))
    } catch {
      // Ignore
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div
        className="modal-box"
        style={{
          maxWidth: '560px',
          width: '90%',
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Head ── */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe',
              }}
            >
              <IconClipboard size={20} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Thông Tin Hồ Sơ Kiểm Toán (Sheet ADD)
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Dùng chung cho toàn bộ 15 tệp Giấy làm việc chuẩn mẫu VACPA
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Đóng (Esc)"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* ── Modal Body / Form ── */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tên công ty được kiểm toán */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Tên Công Ty Được Kiểm Toán (Khách hàng): <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Ví dụ: CÔNG TY TNHH SẢN XUẤT THƯƠNG MẠI ABC"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'system-ui, sans-serif',
              }}
            />
          </div>

          {/* Niên độ & KTV */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Niên độ khóa sổ:
              </label>
              <input
                type="text"
                value={formData.fiscalYearEnd}
                onChange={(e) => setFormData({ ...formData, fiscalYearEnd: e.target.value })}
                placeholder="31/12/2026"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {['31/12/2026', '31/12/2025', '31/12/2024'].map((y) => {
                  const yr = y.slice(-4)
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          fiscalYearEnd: y,
                          auditPeriod1: `01/01 - 30/06/${yr}`,
                          auditPeriod2: `01/07 - 31/12/${yr}`,
                        })
                      }
                      style={{
                        fontSize: '11px',
                        background: formData.fiscalYearEnd === y ? '#eff6ff' : '#f8fafc',
                        color: formData.fiscalYearEnd === y ? '#1d4ed8' : '#64748b',
                        border: `1px solid ${formData.fiscalYearEnd === y ? '#bfdbfe' : '#e2e8f0'}`,
                        borderRadius: '4px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {yr}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Kiểm toán viên thực hiện:
              </label>
              <input
                type="text"
                value={formData.auditorName}
                onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                placeholder="Nguyễn Đắc Thịnh"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Đợt kiểm toán (Đợt 1 & Đợt 2) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Đợt kiểm toán 1 (Giữa kỳ):
              </label>
              <input
                type="text"
                value={formData.auditPeriod1}
                onChange={(e) => setFormData({ ...formData, auditPeriod1: e.target.value })}
                placeholder="01/01 - 30/06/2026"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Đợt kiểm toán 2 (Cuối kỳ):
              </label>
              <input
                type="text"
                value={formData.auditPeriod2}
                onChange={(e) => setFormData({ ...formData, auditPeriod2: e.target.value })}
                placeholder="01/07 - 31/12/2026"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Công ty kiểm toán */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Công ty Kiểm toán phụ trách:
            </label>
            <input
              type="text"
              value={formData.auditFirmName}
              onChange={(e) => setFormData({ ...formData, auditFirmName: e.target.value })}
              placeholder="Công ty TNHH Kiểm toán BẮC ĐẨU"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Thư mục lưu kết quả */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Thư mục lưu hồ sơ xuất ra (tùy chọn):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={formData.outputDir}
                onChange={(e) => setFormData({ ...formData, outputDir: e.target.value })}
                placeholder="Mặc định: Tự tạo thư mục HoSoKiemToan_[TênCty]_[Năm]"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => void handlePickDir()}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '7px',
                  padding: '0 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
              >
                <IconFolder size={14} /> Chọn thư mục…
              </button>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleSaveAndNavigate}
            style={{
              background: '#ffffff',
              color: '#0284c7',
              border: '1px solid #bae6fd',
              borderRadius: '7px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>👉 Mở phân hệ #07 Lập Giấy Làm Việc</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: '#ffffff',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '7px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleSave}
              style={{
                background: savedSuccess ? '#16a34a' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '7px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(2, 132, 199, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 120ms ease',
              }}
            >
              {savedSuccess ? <IconCheck size={14} /> : null}
              {savedSuccess ? 'Đã lưu!' : 'Lưu Hồ Sơ (ADD)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
