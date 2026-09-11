import { useState, useEffect } from 'react'
import { useApp } from '../../state/store'
import { IconX, IconCheck, IconAlert, IconClipboard, IconSparkles, IconEye, IconEyeOff, IconZap, IconBookOpen, IconLock } from '../Icons'

export function AiConfigModal(): JSX.Element | null {
  const isAiConfigModalOpen = useApp((s) => s.isAiConfigModalOpen)
  const setAiConfigModalOpen = useApp((s) => s.setAiConfigModalOpen)
  const savedKey = useApp((s) => s.apiKey)
  const setApiKey = useApp((s) => s.setApiKey)
  const clearApiKey = useApp((s) => s.clearApiKey)
  const selectedModel = useApp((s) => s.selectedModel)
  const setSelectedModel = useApp((s) => s.setSelectedModel)

  const [inputKey, setInputKey] = useState('')
  const [modelChoice, setModelChoice] = useState('gemini-2.5-flash')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  useEffect(() => {
    if (isAiConfigModalOpen) {
      setInputKey(savedKey)
      setModelChoice(selectedModel || 'gemini-2.5-flash')
      setTestResult(null)
      setShowKey(false)
    }
  }, [isAiConfigModalOpen, savedKey, selectedModel])

  if (!isAiConfigModalOpen) return null

  const handleClose = () => {
    setAiConfigModalOpen(false)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setInputKey(text.trim())
        setCopiedKey(true)
        setTimeout(() => setCopiedKey(false), 1500)
      }
    } catch {
      // ignore
    }
  }

  const handleTest = async () => {
    if (!inputKey.trim()) {
      setTestResult({ ok: false, message: 'Vui lòng nhập hoặc dán Gemini API Key trước khi kiểm tra.' })
      return
    }
    if (!window.auditsoft?.geminiTestConnection) {
      setTestResult({ ok: false, message: 'Không tìm thấy API bridge của ứng dụng.' })
      return
    }

    setTesting(true)
    setTestResult(null)
    try {
      const res = await window.auditsoft.geminiTestConnection(inputKey.trim(), modelChoice)
      setTestResult({ ok: res.success, message: res.message })
      if (res.success) {
        // Tự động lưu key nếu kiểm tra thành công
        setApiKey(inputKey.trim())
        setSelectedModel(modelChoice)
      }
    } catch (err) {
      setTestResult({ ok: false, message: `Lỗi: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    setApiKey(inputKey.trim())
    setSelectedModel(modelChoice)
    handleClose()
  }

  const handleClear = () => {
    setInputKey('')
    clearApiKey()
    setTestResult(null)
  }

  const handleOpenAiStudio = () => {
    if (window.auditsoft?.openExternalUrl) {
      void window.auditsoft.openExternalUrl('https://aistudio.google.com/app/apikey')
    } else {
      window.open('https://aistudio.google.com/app/apikey', '_blank')
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-box ai-config-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* ── Modal Header ── */}
        <div className="modal-head compact-head">
          <div className="modal-title-group">
            <div className="ai-modal-badge-icon"><IconSparkles size={16} /></div>
            <div>
              <div className="modal-title">Cấu hình Trợ lý Kiểm toán AI (Google Gemini 2.5)</div>
              <div className="modal-subtitle">
                Mô hình BYOK (Bring Your Own Key) · Miễn phí &amp; Bảo mật trực tiếp trên máy của bạn
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={handleClose} title="Đóng">
            <IconX size={16} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="modal-body ai-config-modal-body">
          {/* Section 1: Input API Key */}
          <div className="ai-field-group">
            <div className="ai-field-label-row">
              <label htmlFor="gemini-key-input" className="ai-field-label">
                Google Gemini API Key:
              </label>
              <div className="ai-label-actions">
                <button type="button" className="btn-ai-mini-action" onClick={handlePaste}>
                  <IconClipboard size={12} />
                  <span>{copiedKey ? 'Đã dán!' : 'Dán từ clipboard'}</span>
                </button>
                {inputKey && (
                  <button type="button" className="btn-ai-mini-action delete" onClick={handleClear}>
                    Xóa key
                  </button>
                )}
              </div>
            </div>

            <div className="ai-input-wrapper">
              <input
                id="gemini-key-input"
                type={showKey ? 'text' : 'password'}
                className="ai-key-input"
                placeholder="Dán API key dạng AIzaSy..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Ẩn key' : 'Hiện key'}
              >
                {showKey ? <IconEyeOff size={15} /> : <IconEye size={15} />}
              </button>
            </div>
          </div>

          {/* Section 2: Model Selector */}
          <div className="ai-field-group">
            <label className="ai-field-label">Chọn Phiên bản Model Gemini:</label>
            <div className="ai-model-grid">
              <label className={`ai-model-card ${modelChoice === 'gemini-2.5-flash' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gemini-model"
                  value="gemini-2.5-flash"
                  checked={modelChoice === 'gemini-2.5-flash'}
                  onChange={(e) => setModelChoice(e.target.value)}
                />
                <div className="model-info">
                  <div className="model-name">
                    <span>Gemini 2.5 Flash</span>
                    <span className="model-tag-recommended">MẶC ĐỊNH · KHUYẾN NGHỊ</span>
                  </div>
                  <div className="model-desc">
                    Thế hệ mới nhất từ Google. Tốc độ cực nhanh (1-3s), suy luận sắc bén, hạn mức miễn phí rộng rãi.
                  </div>
                </div>
              </label>

              <label className={`ai-model-card ${modelChoice === 'gemini-2.5-pro' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gemini-model"
                  value="gemini-2.5-pro"
                  checked={modelChoice === 'gemini-2.5-pro'}
                  onChange={(e) => setModelChoice(e.target.value)}
                />
                <div className="model-info">
                  <div className="model-name">
                    <span>Gemini 2.5 Pro</span>
                    <span className="model-tag-pro">SUY LUẬN CHUYÊN SÂU</span>
                  </div>
                  <div className="model-desc">
                    Khả năng suy luận báo cáo tài chính phức tạp, phân tích bối cảnh rộng, chi tiết từng chỉ số.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Test Connection Bar */}
          <div className="ai-test-connection-bar">
            <button
              type="button"
              className="btn-test-gemini"
              onClick={handleTest}
              disabled={testing || !inputKey.trim()}
            >
              <IconZap size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              <span>{testing ? 'Đang kiểm tra kết nối...' : 'Kiểm tra kết nối API'}</span>
            </button>

            {testResult && (
              <div className={`ai-test-badge ${testResult.ok ? 'success' : 'error'}`}>
                {testResult.ok ? <IconCheck size={13} /> : <IconAlert size={13} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Section 4: Tutorial Box */}
          <div className="ai-tutorial-box">
            <div className="ai-tutorial-head" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconBookOpen size={15} />
              <strong>Hướng dẫn lấy API Key miễn phí trong 1 phút:</strong>
            </div>
            <ol className="ai-tutorial-steps">
              <li>
                Bấm vào nút{' '}
                <button type="button" className="btn-open-studio" onClick={handleOpenAiStudio}>
                  Mở Google AI Studio ↗
                </button>{' '}
                và đăng nhập bằng tài khoản Google bất kỳ.
              </li>
              <li>
                Chọn <strong>&ldquo;Create API key&rdquo;</strong> $\rightarrow$ Chọn dự án mặc định hoặc tạo mới.
              </li>
              <li>
                Sao chép chuỗi mã API Key (bắt đầu bằng <code>AIzaSy...</code>) rồi dán vào ô bên trên.
              </li>
            </ol>
            <div className="ai-security-note" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <IconLock size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Cam kết bảo mật:</strong> API Key được lưu an toàn 100% trong bộ nhớ máy tính của bạn (Local Storage). AuditSoft tuyệt đối không gửi key hay dữ liệu sổ sách thô của bạn qua bất kỳ máy chủ trung gian nào.</span>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="modal-foot compact-foot">
          <div className="modal-foot-left">
            <span>AuditSoft · Trợ Lý Kiểm Toán AI Chuẩn VSA 520</span>
          </div>
          <div className="modal-foot-right" style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-modal secondary" onClick={handleClose}>
              Đóng
            </button>
            <button type="button" className="btn-modal primary" onClick={handleSave}>
              Lưu &amp; Áp Dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
