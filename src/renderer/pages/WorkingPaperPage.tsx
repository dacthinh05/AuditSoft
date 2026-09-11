import { useState, useRef, useEffect } from 'react'
import { useApp } from '../state/store'
import { useTrialExport } from '../../shared/license'
import {
  IconFolder,
  IconCheck,
  IconAlert,
  IconFileSpreadsheet,
  IconLayers,
  IconDownload,
} from '../components/Icons'
import { extractDroppedFilePath, isExcelOrCsvPath } from '../lib/fileDrop'
import { AjeDerivationEngine } from '../../domain/workingpaper/AjeDerivationEngine'

export function WorkingPaperPage(): JSX.Element {
  const engagement = useApp((s) => s.engagement)
  const setEngagement = useApp((s) => s.setEngagement)
  const storeSourcePath = useApp((s) => s.workingPaperSourcePath)
  const beforeFilePath = useApp((s) => s.before.meta?.filePath || s.before.cfg?.filePath || null)
  const result = useApp((s) => s.result)

  const [sourcePath, setSourcePath] = useState<string>('')
  const [clientName, setClientName] = useState<string>(engagement.clientName || 'Công ty Cổ phần May Mặc Gia Công Test')
  const [fiscalYearEnd, setFiscalYearEnd] = useState<string>(engagement.fiscalYearEnd || '31/12/2026')
  const [auditPeriod1, setAuditPeriod1] = useState<string>(engagement.auditPeriod1 || '01/01 - 30/06/2026')
  const [auditPeriod2, setAuditPeriod2] = useState<string>(engagement.auditPeriod2 || '01/07 - 31/12/2026')
  const [auditorName, setAuditorName] = useState<string>(engagement.auditorName || 'Đắc Thịnh')
  const [auditFirmName, setAuditFirmName] = useState<string>(engagement.auditFirmName || 'Công ty TNHH Kiểm toán BẮC ĐẨU')
  const [companyShortName, setCompanyShortName] = useState<string>(engagement.companyShortName || '')
  const [auditRound, setAuditRound] = useState<'D1' | 'D2' | 'FY'>(engagement.auditRound || 'D2')
  const [outputDir, setOutputDir] = useState<string>(engagement.outputDir || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const genResult = useApp((s) => s.workingPaperGenResult)
  const setGenResult = useApp((s) => s.setWorkingPaperGenResult)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const isAutoLoadedFromBefore = Boolean(beforeFilePath && sourcePath === beforeFilePath)

  // Đồng bộ từ engagementSlice khi store thay đổi
  useEffect(() => {
    if (engagement.clientName) setClientName(engagement.clientName)
    if (engagement.fiscalYearEnd) setFiscalYearEnd(engagement.fiscalYearEnd)
    if (engagement.auditPeriod1) setAuditPeriod1(engagement.auditPeriod1)
    if (engagement.auditPeriod2) setAuditPeriod2(engagement.auditPeriod2)
    if (engagement.auditorName) setAuditorName(engagement.auditorName)
    if (engagement.auditFirmName) setAuditFirmName(engagement.auditFirmName)
    if (engagement.companyShortName !== undefined) setCompanyShortName(engagement.companyShortName)
    if (engagement.auditRound) setAuditRound(engagement.auditRound as never)
    if (engagement.outputDir) setOutputDir(engagement.outputDir)
  }, [engagement])

  // Tự động nạp file: ưu tiên storeSourcePath, fallback về NKC Trước Điều Chỉnh (Nguồn ①)
  useEffect(() => {
    const candidatePath = storeSourcePath || beforeFilePath
    if (candidatePath && (!sourcePath || candidatePath !== sourcePath)) {
      handleLoadPath(candidatePath)
    }
  }, [storeSourcePath, beforeFilePath])

  async function handlePickFile(): Promise<string | null> {
    if (!window.auditsoft) {
      setError('Vui lòng chạy ứng dụng thông qua Electron.')
      return null
    }
    setError(null)
    try {
      const picked = await window.auditsoft.pickWorkbook()
      if (picked.canceled || !picked.filePath) return null
      handleLoadPath(picked.filePath)
      return picked.filePath
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return null
    }
  }

  function handleLoadPath(filePath: string): void {
    setSourcePath(filePath)
    const baseName = filePath.split(/[/\\]/).pop() ?? ''
    
    // 1. Tách năm
    const yrMatch = baseName.match(/\b(20\d{2})\b/)
    const yr = yrMatch ? yrMatch[0] : (baseName.includes('2026') ? '2026' : baseName.includes('2025') ? '2025' : '')

    // 2. Tách đợt kiểm toán (D1 hoặc D2)
    let detectedRound: 'D1' | 'D2' | 'FY' = 'D2'
    if (/\b(D1|Dot\s*1|Interim)\b/i.test(baseName)) {
      detectedRound = 'D1'
    } else if (/\b(D2|Dot\s*2|Final)\b/i.test(baseName)) {
      detectedRound = 'D2'
    }

    // 3. Tách tên công ty rút gọn (chuỗi đứng trước năm hoặc trước dấu '-' hoặc trước D1/D2)
    // Ví dụ: "LONG RICH 2025 - D2 - sau dc.xlsx" -> "LONG RICH"
    let detectedCompany = ''
    if (yr) {
      const beforeYear = baseName.split(yr)[0]?.trim() || ''
      detectedCompany = beforeYear.replace(/[-_]+$/, '').trim()
    }
    if (!detectedCompany) {
      const beforeDash = baseName.split('-')[0]?.trim() || ''
      detectedCompany = beforeDash
    }
    if (/^(mau|nkc|so cai|data|test)$/i.test(detectedCompany)) {
      detectedCompany = ''
    }

    if (detectedCompany) {
      setCompanyShortName(detectedCompany)
    }
    setAuditRound(detectedRound)

    const patch: Record<string, unknown> = {
      auditRound: detectedRound,
    }
    if (detectedCompany) {
      patch.companyShortName = detectedCompany
    }

    if (yr) {
      const newFiscal = `31/12/${yr}`
      const newP1 = `01/01 - 30/06/${yr}`
      const newP2 = `01/07 - 31/12/${yr}`
      setFiscalYearEnd(newFiscal)
      setAuditPeriod1(newP1)
      setAuditPeriod2(newP2)
      patch.fiscalYearEnd = newFiscal
      patch.auditPeriod1 = newP1
      patch.auditPeriod2 = newP2
    }
    setEngagement(patch as never)
  }

  function handleFiscalYearChange(val: string): void {
    setFiscalYearEnd(val)
    const yrMatch = val.match(/\d{4}/)
    if (yrMatch) {
      const yr = yrMatch[0]
      const newP1 = `01/01 - 30/06/${yr}`
      const newP2 = `01/07 - 31/12/${yr}`
      setAuditPeriod1(newP1)
      setAuditPeriod2(newP2)
      setEngagement({
        fiscalYearEnd: val,
        auditPeriod1: newP1,
        auditPeriod2: newP2,
      })
    } else {
      setEngagement({ fiscalYearEnd: val })
    }
  }

  function handleDragEnter(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }

  function handleDragOver(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file) return
    const path = extractDroppedFilePath(file)
    if (!path) {
      setError('Không thể nhận diện đường dẫn file kéo thả. Vui lòng bấm chọn file trực tiếp.')
      return
    }

    if (!isExcelOrCsvPath(path) && !isExcelOrCsvPath(file.name)) {
      setError('Vui lòng kéo thả file Excel (.xlsx, .xlsm, .xls) hoặc CSV hợp lệ.')
      return
    }

    setError(null)
    handleLoadPath(path)
  }
  async function handlePickOutputDir(): Promise<void> {
    if (!window.auditsoft) return
    try {
      const picked = await window.auditsoft.pickDirectory()
      if (picked.canceled || !picked.filePath) return
      setOutputDir(picked.filePath)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleGenerate(): Promise<void> {
    const trialCheck = useTrialExport()
    if (!trialCheck.allowed) {
      setError(trialCheck.message)
      useApp.getState().setLicenseModalOpen(true)
      useApp.getState().refreshTrialStatus()
      return
    }

    let activePath = sourcePath
    if (!activePath) {
      const picked = await handlePickFile()
      if (!picked) return
      activePath = picked
    }

    if (!window.auditsoft) {
      setError('Không tìm thấy kết nối ứng dụng Electron.')
      return
    }

    setLoading(true)
    setError(null)
    setGenResult(null)
    try {
      let ajes: unknown[] | undefined
      if (result?.diffRows && result.diffRows.length > 0) {
        ajes = AjeDerivationEngine.deriveAjesFromDiffRows(result.diffRows)
      }

      const res = await window.auditsoft.generateWorkingPapers({
        sourcePath: activePath,
        outputDir: outputDir.trim() || undefined,
        engagement: {
          clientName: clientName.trim() || 'Doanh Nghiệp Kiểm Toán',
          companyShortName: companyShortName.trim() || undefined,
          auditRound: auditRound || 'D2',
          fiscalYearEnd: fiscalYearEnd.trim() || '31/12/2026',
          auditPeriod1: auditPeriod1.trim() || '01/01 - 30/06/2026',
          auditPeriod2: auditPeriod2.trim() || '01/07 - 31/12/2026',
          auditorName: auditorName.trim() || 'Đắc Thịnh',
          auditFirmName: auditFirmName.trim() || 'Công ty TNHH Kiểm toán BẮC ĐẨU',
        },
        taxVatDeclarations: useApp.getState().taxData?.vatDeclarations,
        taxPitDeclarations: useApp.getState().taxData?.pitDeclarations,
        adjustingEntries: ajes,
      })
      setGenResult(res)
      useApp.getState().refreshTrialStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenFolder(folderPath: string): Promise<void> {
    if (!window.auditsoft) return
    try {
      await window.auditsoft.openPath(folderPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 28px 80px' }}>
      {/* ── SaaS Hero Header ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 6, marginBottom: 8, letterSpacing: '0.02em' }}>
            CHẾ ĐỘ KIỂM TOÁN TỰ ĐỘNG HÓA VSA 530
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Tự động lập & Điền trọn bộ 12 Giấy làm việc (GLV) Mẫu
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            Chỉ cần nạp <strong>1 file Excel kế toán duy nhất</strong> (chứa sheet <code>NKC</code> & <code>CDFS</code> như <code>MAU NKC.xlsx</code>). Hệ thống tự động tính mức trọng yếu, bốc mẫu phát sinh theo chuẩn VSA 530, kiểm tra Cutoff 31/12 và điền trực tiếp vào 15 file Excel chuẩn mực của công ty.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6 }}>
            ✓ Tự bốc mẫu VSA 530 (Key + Risk + MUS)
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6 }}>
            ✓ Điền 15 File Excel GLV giữ nguyên công thức
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <IconAlert size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{ background: 'transparent', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Main SaaS Bento Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Left Card: Clean File Upload */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                BƯỚC 1
              </span>
              <h3 style={{ margin: '6px 0 2px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Nạp File Excel Kế Toán
              </h3>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Hỗ trợ file .xlsx, .xlsm chứa sổ Nhật ký chung & Bảng CĐSPS
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {isAutoLoadedFromBefore && (
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="File được tự động nhận diện từ NKC Trước điều chỉnh (Nguồn ①)"
                >
                  ⚡ NKC Trước điều chỉnh (Nguồn ①)
                </span>
              )}
              {sourcePath && (
                <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <IconCheck size={12} /> Đã sẵn sàng
                </span>
              )}
            </div>
          </div>

          <div
            onClick={() => void handlePickFile()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              flex: 1,
              background: isDragging ? '#eff6ff' : sourcePath ? '#f0fdf4' : '#f8fafc',
              border: isDragging ? '2px dashed #2563eb' : sourcePath ? '2px solid #22c55e' : '2px dashed #cbd5e1',
              borderRadius: 12,
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 140ms ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 180,
              boxShadow: isDragging ? '0 0 0 4px rgba(37, 99, 235, 0.15)' : 'none',
            }}
          >
            <div style={{ marginBottom: 12, color: sourcePath ? '#16a34a' : '#2563eb' }}>
              <IconFileSpreadsheet size={44} />
            </div>

            {sourcePath ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', wordBreak: 'break-all' }}>
                  {sourcePath.split(/[/\\]/).pop()}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, wordBreak: 'break-all', maxWidth: 450 }}>
                  {sourcePath}
                </div>
                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handlePickFile()
                    }}
                    style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6 }}
                  >
                    Đổi file khác
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                  Nhấp vào đây để chọn file Excel kế toán
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                  (Ví dụ: <code>MAU NKC.xlsx</code> trong thư mục dự án)
                </div>
                <div style={{ marginTop: 14 }}>
                  <span
                    style={{
                      background: '#2563eb',
                      color: '#fff',
                      padding: '8px 18px',
                      borderRadius: 7,
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <IconFolder size={15} /> Chọn file từ máy tính…
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Engagement Profile Form */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
              BƯỚC 2
            </span>
            <h3 style={{ margin: '6px 0 2px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Thông Tin Hồ Sơ Kiểm Toán (ADD)
            </h3>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              Tự động điền vào tiêu đề tất cả 15 file phần hành
            </div>

            {/* Preview Strings */}
            {(() => {
              const previewCompany = companyShortName.trim() || clientName.trim() || 'DoanhNghiep'
              const previewRound = (auditRound === 'D1' || auditRound === 'D2') ? auditRound : ''
              const previewYear = fiscalYearEnd.match(/\d{4}/)?.[0] || '2026'
              const previewMiddle = [previewCompany, previewRound, previewYear].filter(Boolean).join(' ')
              const auditorParts = auditorName.trim().split(/\s+/)
              const previewAuditor = auditorParts[auditorParts.length - 1] || 'KTV'
              const previewFileName = `D100 - Tien - ${previewMiddle} - ${previewAuditor}.xlsx`
              const previewFolder = `HoSoKiemToan_${previewCompany.replace(/[\\/:*?"<>|]/g, '_')}${previewRound ? '_' + previewRound : ''}_${previewYear}`

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Tên Khách hàng / Doanh nghiệp (Pháp lý đầy đủ in trên GLV):
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value)
                        setEngagement({ clientName: e.target.value })
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                      placeholder="Công ty TNHH ABC"
                    />
                  </div>

                  {/* Hàng mới: Tên công ty khi lưu file + Chọn đợt kiểm toán */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>
                      🏷️ Tên công ty khi lưu file:
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      value={companyShortName}
                      onChange={(e) => {
                        setCompanyShortName(e.target.value)
                        setEngagement({ companyShortName: e.target.value })
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1.5px solid #93c5fd', background: '#f8faff', fontSize: 13, fontWeight: 700, color: '#1e3a8a' }}
                      placeholder="Ví dụ: LONG RICH"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>
                      🎯 Chọn đợt kiểm toán:
                    </label>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px', border: '1px solid #cbd5e1', height: '37px', boxSizing: 'border-box' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAuditRound('D1')
                          setEngagement({ auditRound: 'D1' })
                        }}
                        style={{
                          flex: 1,
                          background: auditRound === 'D1' ? '#ffffff' : 'transparent',
                          color: auditRound === 'D1' ? '#1d4ed8' : '#64748b',
                          fontWeight: auditRound === 'D1' ? 700 : 500,
                          boxShadow: auditRound === 'D1' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        D1 (Đợt 1)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuditRound('D2')
                          setEngagement({ auditRound: 'D2' })
                        }}
                        style={{
                          flex: 1,
                          background: auditRound === 'D2' ? '#ffffff' : 'transparent',
                          color: auditRound === 'D2' ? '#1d4ed8' : '#64748b',
                          fontWeight: auditRound === 'D2' ? 700 : 500,
                          boxShadow: auditRound === 'D2' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        D2 (Đợt 2)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuditRound('FY')
                          setEngagement({ auditRound: 'FY' })
                        }}
                        style={{
                          flex: 1,
                          background: auditRound === 'FY' ? '#ffffff' : 'transparent',
                          color: auditRound === 'FY' ? '#1d4ed8' : '#64748b',
                          fontWeight: auditRound === 'FY' ? 700 : 500,
                          boxShadow: auditRound === 'FY' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Cả năm
                      </button>
                    </div>
                  </div>

                  {/* Thanh Live Preview thời gian thực */}
                  <div style={{ gridColumn: '1 / -1', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '11.5px', color: '#1e40af' }}>
                    <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>👁️ Xem trước tên file lưu:</span>
                    <span style={{ fontFamily: 'Consolas, monospace', fontWeight: 700, color: '#1d4ed8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {previewFileName}
                    </span>
                  </div>
                </div>
              )
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Niên độ khóa sổ:
                </label>
                <input
                  type="text"
                  className="input-text"
                  value={fiscalYearEnd}
                  onChange={(e) => handleFiscalYearChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  placeholder="31/12/2026"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  KTV thực hiện:
                </label>
                <input
                  type="text"
                  className="input-text"
                  value={auditorName}
                  onChange={(e) => {
                    setAuditorName(e.target.value)
                    setEngagement({ auditorName: e.target.value })
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  placeholder="Đắc Thịnh"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Đợt 1 (Interim / Giữa kỳ):
                </label>
                <input
                  type="text"
                  className="input-text"
                  value={auditPeriod1}
                  onChange={(e) => {
                    setAuditPeriod1(e.target.value)
                    setEngagement({ auditPeriod1: e.target.value })
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  placeholder="01/01 - 30/06/2026"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Đợt 2 (Final / Cuối kỳ):
                </label>
                <input
                  type="text"
                  className="input-text"
                  value={auditPeriod2}
                  onChange={(e) => {
                    setAuditPeriod2(e.target.value)
                    setEngagement({ auditPeriod2: e.target.value })
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  placeholder="01/07 - 31/12/2026"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Tên Công ty Kiểm toán:
                </label>
                <input
                  type="text"
                  className="input-text"
                  value={auditFirmName}
                  onChange={(e) => {
                    setAuditFirmName(e.target.value)
                    setEngagement({ auditFirmName: e.target.value })
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  placeholder="Công ty TNHH Kiểm toán BẮC ĐẨU"
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Thư mục lưu kết quả:
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  className="input-text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                  placeholder={(() => {
                    const previewCompany = (companyShortName.trim() || clientName.trim() || 'DoanhNghiep').replace(/[\\/:*?"<>|]/g, '_')
                    const previewRound = (auditRound === 'D1' || auditRound === 'D2') ? `_${auditRound}` : ''
                    const previewYear = fiscalYearEnd.match(/\d{4}/)?.[0] || '2026'
                    return `Tự tạo thư mục HoSoKiemToan_${previewCompany}${previewRound}_${previewYear}`
                  })()}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void handlePickOutputDir()}
                  style={{ padding: '7px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                >
                  <IconFolder size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Primary Hero CTA Button ── */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGenerate()}
          style={{
            padding: '14px 32px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 8,
            background: loading ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            border: '1px solid transparent',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.01em',
            transition: 'all 150ms ease',
          }}
        >
          {loading ? (
            <>
              <span className="pulse-dot" style={{ background: '#fff' }}></span> Đang bốc mẫu VSA 530 & tự động điền 12 Giấy làm việc…
            </>
          ) : (
            <>
              <IconLayers size={18} /> Bốc mẫu VSA 530 & Xuất trọn bộ 15 file Excel GLV
            </>
          )}
        </button>
      </div>

      {/* ── Live 12 Working Papers Results Grid ── */}
      {genResult && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #bbf7d0',
            padding: 24,
            boxShadow: '0 8px 30px rgba(22, 163, 74, 0.1)',
            marginTop: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 800, fontSize: 17 }}>
                <IconCheck size={22} /> ĐÃ TẠO THÀNH CÔNG TRỌN BỘ {genResult.successfulFiles} / {genResult.totalFilesProcessed} FILE GIẤY LÀM VIỆC
              </div>
              <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
                Đã lưu tại: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{genResult.outputDirectory}</code>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleOpenFolder(genResult.outputDirectory)}
              style={{
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 700,
                background: '#16a34a',
                color: '#fff',
                borderRadius: 8,
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
              }}
            >
              <IconFolder size={18} /> Mở thư mục chứa {genResult.totalFilesProcessed || 15} File Excel
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: 12 }}>
            {genResult.results.map((res, idx) => (
              <div
                key={idx}
                style={{
                  border: res.success ? '1px solid #dcfce7' : '1px solid #fecaca',
                  background: res.success ? '#f0fdf4' : '#fef2f2',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconFileSpreadsheet size={16} color={res.success ? '#16a34a' : '#dc2626'} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {res.fileName}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3 }}>
                    {res.success ? (
                      <>
                        Đã điền <strong>{res.itemsFilledCount}</strong> chỉ tiêu · Sheet: <em>{res.sheetsUpdated.join(', ')}</em>
                      </>
                    ) : (
                      <span style={{ color: '#dc2626' }}>{res.error}</span>
                    )}
                  </div>
                </div>

                {res.success && (
                  <button
                    type="button"
                    onClick={() => void handleOpenFolder(`${genResult.outputDirectory}/${res.fileName}`)}
                    title="Mở file này bằng Excel"
                    style={{
                      marginLeft: 8,
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#0f172a',
                    }}
                  >
                    <IconDownload size={12} /> Mở
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
