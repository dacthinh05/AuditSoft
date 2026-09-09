import { useState, useRef } from 'react'
import { useApp, runReconcileNow } from '../state/store'
import { PasteModal } from '../components/PasteModal'
import type { ColumnMapping, SourceKind } from '../../domain/types'
import {
  IconFolder,
  IconClipboard,
  IconFileSpreadsheet,
  IconCheck,
  IconArrowRight,
} from '../components/Icons'
import { extractDroppedFilePath, isExcelOrCsvPath } from '../lib/fileDrop'

const FIELDS: { key: keyof ColumnMapping; label: string; desc: string }[] = [
  { key: 'date', label: 'Ngày ghi sổ', desc: 'Ngày chứng từ' },
  { key: 'voucher', label: 'Số chứng từ', desc: 'Số phiếu / HĐ' },
  { key: 'description', label: 'Diễn giải', desc: 'Nội dung nghiệp vụ' },
  { key: 'debit', label: 'Tài khoản Nợ', desc: 'TK Nợ đối ứng' },
  { key: 'credit', label: 'Tài khoản Có', desc: 'TK Có đối ứng' },
  { key: 'amount', label: 'Số tiền phát sinh', desc: 'Giá trị phát sinh' },
]

function SourceCard({ kind }: { kind: SourceKind }): JSX.Element {
  const side = useApp((s) => (kind === 'BEFORE' ? s.before : s.after))
  const setMeta = useApp((s) => s.setMeta)
  const setCfg = useApp((s) => s.setCfg)
  const setMappingPatch = useApp((s) => s.setMappingPatch)
  const setPasted = useApp((s) => s.setPasted)
  const setError = useApp((s) => s.setError)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const sheet = side.meta?.sheets.find((x) => x.name === side.cfg?.sheetName)
  const mappingComplete =
    side.cfg != null && FIELDS.every((f) => side.cfg?.mapping[f.key] != null)

  const isLoaded = Boolean(side.pasted || side.meta)
  const isReady = Boolean(side.pasted || (side.cfg && mappingComplete))
  const isBefore = kind === 'BEFORE'

  async function loadFile(filePath: string): Promise<void> {
    if (typeof window.auditsoft === 'undefined') {
      setError('Không kết nối được hệ thống — vui lòng khởi động app qua 2-Chay-App.bat.')
      return
    }
    try {
      const meta = await window.auditsoft.inspectWorkbook(filePath)
      setMeta(kind, meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function pickFile(): Promise<void> {
    if (typeof window.auditsoft === 'undefined') {
      setError('Không kết nối được hệ thống — vui lòng khởi động app qua 2-Chay-App.bat.')
      return
    }
    try {
      const picked = await window.auditsoft.pickWorkbook()
      if (picked.canceled || !picked.filePath) return
      await loadFile(picked.filePath)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
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

    void loadFile(path)
  }
  function handleApplyPaste(dataOnly: unknown[][], hasHeader: boolean, headerRowIndex: number): void {
    const auto: ColumnMapping = { date: 0, voucher: 1, description: 2, debit: 3, credit: 4, amount: 5 }
    useApp.getState().setCfg(kind, {
      kind,
      filePath: '(clipboard)',
      sheetName: '(clipboard)',
      headerRow: hasHeader ? headerRowIndex + 2 : 1,
      mapping: auto,
    })
    setPasted(kind, dataOnly)
  }

  return (
    <div className={`studio-card ${isBefore ? 'theme-before' : 'theme-after'}`}>
      {/* ── Card Header ── */}
      <div className="studio-card-head">
        <div className="source-label-group">
          <span className={`source-indicator-pill ${isBefore ? 'pill-before' : 'pill-after'}`}>
            {isBefore ? 'NGUỒN ①' : 'NGUỒN ②'}
          </span>
          <div>
            <h3 className="source-heading">
              {isBefore ? 'Nhật ký chung TRƯỚC điều chỉnh' : 'Nhật ký chung SAU điều chỉnh'}
            </h3>
            <div className="source-subheading">
              {isBefore ? 'Dữ liệu kế toán ban đầu (trước kiểm toán / trước chốt kỳ)' : 'Dữ liệu kế toán đã qua điều chỉnh / bổ sung'}
            </div>
          </div>
        </div>

        <div className="source-status-badge">
          {isReady ? (
            <span className="status-tag tag-ready">
              <span className="status-dot-sm ready"></span> Sẵn sàng
            </span>
          ) : isLoaded ? (
            <span className="status-tag tag-incomplete">
              <span className="status-dot-sm warn"></span> Cần ghép cột
            </span>
          ) : (
            <span className="status-tag tag-empty">
              <span className="status-dot-sm empty"></span> Chưa nạp
            </span>
          )}
        </div>
      </div>

      {/* ── Action Dropzone ── */}
      <div
        className={`upload-dropzone ${isDragging ? 'is-dragover' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="dropzone-icon">
          <IconFileSpreadsheet size={32} />
        </div>

        {side.meta && side.cfg ? (
          <div className="loaded-source-panel" style={{ width: '100%' }}>
            <div className="file-summary-bar">
              <div className="file-info-left">
                <span className="file-badge-icon">📊</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                    {side.meta.filePath.split(/[/\\]/).pop()}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>
                    {sheet ? `${sheet.totalRows.toLocaleString('vi-VN')} dòng dữ liệu` : ''}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-action primary-upload"
                onClick={() => void pickFile()}
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                Đổi file khác
              </button>
            </div>

            {side.meta.sheets.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Sheet dữ liệu:</span>
                <select
                  style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                  value={side.cfg.sheetName}
                  onChange={(e) => {
                    const s = side.meta?.sheets.find((x) => x.name === e.target.value)
                    if (!s) return
                    setCfg(kind, {
                      kind,
                      filePath: side.meta?.filePath ?? '',
                      sheetName: s.name,
                      headerRow: s.suggestedHeaderRow,
                      mapping: {
                        date: s.suggestedMapping.date ?? 0,
                        voucher: s.suggestedMapping.voucher ?? 1,
                        description: s.suggestedMapping.description ?? 2,
                        debit: s.suggestedMapping.debit ?? 3,
                        credit: s.suggestedMapping.credit ?? 4,
                        amount: s.suggestedMapping.amount ?? 5,
                      },
                    })
                  }}
                >
                  {side.meta.sheets.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.totalRows.toLocaleString('vi-VN')} dòng)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="dropzone-text">
              <div className="dropzone-main-text">
                {isDragging
                  ? 'Thả file Excel NKC vào đây ngay…'
                  : isBefore
                    ? 'Kéo & thả hoặc Chọn file NKC TRƯỚC điều chỉnh (Nguồn ①)'
                    : 'Kéo & thả hoặc Chọn file NKC SAU điều chỉnh (Nguồn ②)'}
              </div>
              <div className="dropzone-sub-text">Hỗ trợ .xlsx, .xlsm, .csv · Tự động phát hiện dòng tiêu đề & ghép 6 cột TT200</div>
            </div>
            <div className="dropzone-actions">
              <button type="button" className="btn-action primary-upload" onClick={() => void pickFile()}>
                <IconFolder size={15} style={{ marginRight: 6, verticalAlign: '-1px' }} />
                <span>Chọn file Excel / CSV…</span>
              </button>

              <span className="or-divider">hoặc</span>

              <button type="button" className="btn-action paste-upload" onClick={() => setPasteOpen(true)}>
                <IconClipboard size={14} style={{ marginRight: 6, verticalAlign: '-1px' }} />
                <span>Dán Clipboard</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── 6-Field Column Mapping ── */}
      {side.cfg && sheet && (
        <div className="column-mapping-container">
          <div className="mapping-header-text">
            <span>Khớp 6 cột chuẩn mực TT200:</span>
            <span className="mapping-status-count">
              {sheet.confidence >= 80 ? '✓ Tự động nhận diện chính xác' : 'Vui lòng kiểm tra lại mapping'}
            </span>
          </div>

          <div className="mapping-cards-grid">
            {FIELDS.map((f) => {
              const currentIdx = side.cfg?.mapping[f.key]
              const isMapped = currentIdx != null
              return (
                <div key={f.key} className={`mapping-card ${isMapped ? 'is-mapped' : 'is-unmapped'}`}>
                  <div className="card-top-line">
                    <span className="field-name">{f.label}</span>
                    <span className={`status-indicator ${isMapped ? 'ok' : 'missing'}`}>
                      {isMapped ? '✓' : '!'}
                    </span>
                  </div>
                  <span className="field-desc">{f.desc}</span>
                  <select
                    className="mapping-select styled-select"
                    value={currentIdx != null ? String(currentIdx) : ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : Number(e.target.value)
                      setMappingPatch(kind, { [f.key]: v })
                    }}
                  >
                    <option value="">-- Chưa chọn --</option>
                    {sheet.headerLabels.map((lbl, idx) => (
                      <option key={idx} value={String(idx)}>
                        Cột {idx + 1}: {lbl || `(Cột ${idx + 1})`}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Paste Modal */}
      <PasteModal
        isOpen={pasteOpen}
        isBefore={isBefore}
        onClose={() => setPasteOpen(false)}
        onApply={handleApplyPaste}
      />
    </div>
  )
}

export function SetupPage(): JSX.Element {
  const before = useApp((s) => s.before)
  const after = useApp((s) => s.after)
  const running = useApp((s) => s.running)
  const progress = useApp((s) => s.progress)
  const excludeKetChuyen = useApp((s) => s.excludeKetChuyen)
  const toggleExcludeKetChuyen = useApp((s) => s.toggleExcludeKetChuyen)
  const ignoreDescription = useApp((s) => s.ignoreDescription)
  const toggleIgnoreDescription = useApp((s) => s.toggleIgnoreDescription)
  const accountLevel = useApp((s) => s.accountLevel)
  const setAccountLevel = useApp((s) => s.setAccountLevel)

  const beforeReady = Boolean(before.pasted || (before.cfg && FIELDS.every((f) => before.cfg?.mapping[f.key] != null)))
  const afterReady = Boolean(after.pasted || (after.cfg && FIELDS.every((f) => after.cfg?.mapping[f.key] != null)))
  const ready = beforeReady && afterReady

  // (Working Paper 12 GLV tam thoi an theo yeu cau)

  return (
    <div className="setup-studio-page">
      {/* ── Studio Hero ── */}
      <div className="studio-hero">
        <div className="hero-text-side">
          <h2>Đối chiếu 2 Nguồn Nhật ký chung (Trước vs Sau điều chỉnh)</h2>
          <p>
            So sánh tự động 2 bộ số NKC để tìm ra các bút toán điều chỉnh kiểm toán (AJE), phân loại chênh lệch theo chuẩn TT200 và tính toán bảng ảnh hưởng BCTC.
          </p>
        </div>
        <div className="hero-badges">
          <div className="hero-badge-pill">Xuất Working Paper B360</div>
        </div>
      </div>

      {/* ── 2 Source Cards Grid ── */}
      <div className="source-cards-grid">
        <SourceCard kind="BEFORE" />
        <SourceCard kind="AFTER" />
      </div>

      {/* ── Advanced Options Panel ── */}
      <div className="reconcile-options-panel">
        <div className="options-panel-head">
          <div className="options-title">
            <strong>Bộ lọc Khử lệch ảo & Khóa sổ (Khuyến nghị kiểm toán):</strong>
          </div>
        </div>

        <div className="options-panel-body">
          <label className={`option-checkbox-row ${excludeKetChuyen ? 'active' : ''}`}>
            <input type="checkbox" checked={excludeKetChuyen} onChange={toggleExcludeKetChuyen} />
            <div>
              <span className="opt-label"><strong>Loại trừ Bút toán Kết chuyển lãi/lỗ (TK 911)</strong></span>
              <span className="opt-desc">Khử các dòng kết chuyển doanh thu, chi phí cuối kỳ để tránh nhân đôi số tiền chênh lệch, chỉ tập trung vào nghiệp vụ thực tế.</span>
            </div>
          </label>

          <label className={`option-checkbox-row ${ignoreDescription ? 'active' : ''}`}>
            <input type="checkbox" checked={ignoreDescription} onChange={toggleIgnoreDescription} />
            <div>
              <span className="opt-label"><strong>Bỏ qua Diễn giải khi so khớp</strong></span>
              <span className="opt-desc">Khóa dò: Ngày + Số CT + Cặp TK. Khử 80% chênh lệch ảo do kế toán sửa câu chữ mô tả giữa 2 sổ.</span>
            </div>
          </label>

          <label className={`option-checkbox-row ${accountLevel === 'level1' ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={accountLevel === 'level1'}
              onChange={(e) => setAccountLevel(e.target.checked ? 'level1' : 'exact')}
            />
            <div>
              <span className="opt-label"><strong>Rút gọn về Tài khoản cấp 1 (3 chữ số đầu - VD: 642)</strong></span>
              <span className="opt-desc">Tránh báo lệch khi một bên ghi tài khoản 3 số (642) và một bên ghi chi tiết tiểu khoản (6421, 6428).</span>
            </div>
          </label>
        </div>
      </div>
      {/* ── Bottom Docked Run Bar ── */}
      <div className="run-dock-card" style={{ marginTop: 22 }}>
        <div className="run-dock-inner">
          <div className="run-dock-status">
            {ready ? (
              <div className="dock-status-ready">
                <span className="dock-icon-check"><IconCheck size={16} /></span>
                <div>
                  <div className="status-main">Cả 2 nguồn đã sẵn sàng đối chiếu</div>
                  <div className="status-sub">Bấm nút bên phải để bắt đầu thuật toán so khớp chênh lệch và lập bảng Working Paper B360</div>
                </div>
              </div>
            ) : (
              <div className="dock-status-pending">
                <div className="dock-icon-dot-box">
                  <span className="dock-icon-dot"></span>
                </div>
                <div>
                  <div className="status-main">Chưa hoàn tất thiết lập 2 nguồn dữ liệu</div>
                  <div className="status-sub">
                    {!beforeReady && !afterReady
                      ? 'Vui lòng nạp dữ liệu cho cả Nguồn ① và Nguồn ② để so khớp'
                      : !beforeReady
                        ? 'Cần hoàn tất ghép 6 cột cho Nguồn ①'
                        : 'Cần hoàn tất ghép 6 cột cho Nguồn ②'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            className="btn-launch-run"
            disabled={!ready || running}
            onClick={() => void runReconcileNow()}
          >
            {running ? (
              <span className="btn-launch-inner">
                <span className="spinner"></span> Đang xử lý đối chiếu…
              </span>
            ) : (
              <span className="btn-launch-inner">
                <IconArrowRight size={16} style={{ marginRight: 8, verticalAlign: '-2px' }} />
                <span>BẮT ĐẦU ĐỐI CHIẾU DỮ LIỆU</span>
              </span>
            )}
          </button>
        </div>

        {/* (Secondary Action 12 GLV tam thoi an theo yeu cau) */}

        {/* ── Live Progress Panel ── */}
        {running && progress && (
          <div className="live-progress-panel">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="progress-meta-row">
              <span className="progress-phase-label">
                <strong>{progress.phase}</strong>: Đã xử lý {progress.processed.toLocaleString('vi-VN')} dòng
              </span>
              <span className="progress-percent">{progress.percent}%</span>
              <button className="btn-cancel-run" onClick={() => void window.auditsoft.cancelReconcile()}>
                Dừng lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
