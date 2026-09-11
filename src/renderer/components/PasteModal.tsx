import { useState, useMemo, useEffect } from 'react'
import { parseClipboardTable } from '../../shared/paste'
import { IconClipboard, IconX, IconCheck, IconFileSpreadsheet } from './Icons'

interface PasteModalProps {
  isOpen: boolean
  isBefore?: boolean
  initialText?: string
  onClose: () => void
  onApply: (dataOnly: unknown[][], hasHeader: boolean, headerRowIndex: number, fullMatrix: unknown[][]) => void
}

export function PasteModal({
  isOpen,
  isBefore = true,
  initialText = '',
  onClose,
  onApply,
}: PasteModalProps): JSX.Element | null {
  const [pasteText, setPasteText] = useState(initialText)
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview')

  useEffect(() => {
    if (isOpen) {
      setPasteText(initialText)
      setViewMode(initialText.trim() ? 'preview' : 'raw')
    }
  }, [isOpen, initialText])

  const parsed = useMemo(() => parseClipboardTable(pasteText), [pasteText])
  const hasHeader = parsed.headerRowIndex >= 0
  const dataRows = useMemo(() => {
    if (parsed.matrix.length === 0) return []
    return hasHeader ? parsed.matrix.slice(parsed.headerRowIndex + 1) : parsed.matrix
  }, [parsed, hasHeader])

  const previewRows = useMemo(() => dataRows.slice(0, 10), [dataRows])

  if (!isOpen) return null

  async function handlePasteFromClipboard(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setPasteText(text)
        setViewMode('preview')
      }
    } catch {
      // Fallback: user can use Ctrl+V in textarea
      setViewMode('raw')
    }
  }

  function handleConfirm(): void {
    if (dataRows.length === 0) return
    onApply(dataRows, hasHeader, parsed.headerRowIndex, parsed.matrix)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box paste-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* ── Modal Head ── */}
        <div className="modal-head">
          <div className="modal-title-group">
            <div className={`modal-title-badge ${isBefore ? 'before' : 'after'}`}>
              <IconClipboard size={16} />
            </div>
            <div>
              <div className="modal-title">
                Dán dữ liệu NKC ({isBefore ? 'TRƯỚC điều chỉnh' : 'SAU điều chỉnh'})
              </div>
              <div className="modal-subtitle">
                Sao chép 6 cột từ Excel và dán trực tiếp vào hệ thống
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Đóng">
            <IconX size={16} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="modal-body">
          {/* ── 6-Column Standard Format Pill Bar ── */}
          <div className="paste-format-guide">
            <div className="guide-label">Cấu trúc 6 cột chuẩn:</div>
            <div className="guide-pills">
              <span className="guide-pill"><span className="col-num">1</span> Ngày ghi sổ</span>
              <span className="guide-pill"><span className="col-num">2</span> Số CT</span>
              <span className="guide-pill"><span className="col-num">3</span> Diễn giải</span>
              <span className="guide-pill"><span className="col-num">4</span> TK Nợ</span>
              <span className="guide-pill"><span className="col-num">5</span> TK Có</span>
              <span className="guide-pill"><span className="col-num">6</span> Số tiền</span>
            </div>
          </div>

          {/* ── Main Content Area ── */}
          {pasteText.trim() === '' ? (
            <div className="paste-dropzone" onClick={() => void handlePasteFromClipboard()}>
              <div className="paste-dropzone-inner">
                <div className="paste-icon-circle">
                  <IconClipboard size={28} />
                </div>
                <div className="paste-main-text">
                  Nhấn <kbd>Ctrl + V</kbd> hoặc bấm vào đây để dán dữ liệu
                </div>
                <div className="paste-sub-text">
                  Dữ liệu từ Excel tự động được phân tích và chuẩn hóa sang bảng đối chiếu
                </div>
                <button
                  type="button"
                  className="btn-paste-clipboard"
                  onClick={(e) => {
                    e.stopPropagation()
                    void handlePasteFromClipboard()
                  }}
                >
                  <IconFileSpreadsheet size={15} style={{ marginRight: 6 }} />
                  Đọc từ bộ nhớ tạm Clipboard
                </button>
              </div>
            </div>
          ) : (
            <div className="paste-result-panel">
              {/* ── Result Toolbar ── */}
              <div className="paste-result-toolbar">
                <div className="paste-status-chip ok">
                  <IconCheck size={14} style={{ marginRight: 5, verticalAlign: '-1px' }} />
                  <strong>{dataRows.length.toLocaleString('vi-VN')}</strong> dòng dữ liệu hợp lệ
                  {hasHeader && <span className="header-detected-tag">· Đã nhận diện dòng tiêu đề</span>}
                </div>

                <div className="paste-toolbar-actions">
                  <div className="segmented-toggle-sm">
                    <button
                      className={`seg-btn-sm ${viewMode === 'preview' ? 'active' : ''}`}
                      onClick={() => setViewMode('preview')}
                    >
                      Bảng xem trước
                    </button>
                    <button
                      className={`seg-btn-sm ${viewMode === 'raw' ? 'active' : ''}`}
                      onClick={() => setViewMode('raw')}
                    >
                      Dữ liệu thô
                    </button>
                  </div>
                  <button
                    className="btn-clear-paste"
                    onClick={() => {
                      setPasteText('')
                      setViewMode('raw')
                    }}
                    title="Xóa để dán lại"
                  >
                    Dán lại
                  </button>
                </div>
              </div>

              {/* ── Table Preview or Raw Text ── */}
              {viewMode === 'preview' ? (
                <div className="paste-table-container">
                  <table className="paste-preview-table">
                    <thead>
                      <tr>
                        <th style={{ width: 42 }}>#</th>
                        <th style={{ width: 95 }}>Ngày ghi sổ</th>
                        <th style={{ width: 110 }}>Số chứng từ</th>
                        <th>Diễn giải nghiệp vụ</th>
                        <th style={{ width: 75 }}>TK Nợ</th>
                        <th style={{ width: 75 }}>TK Có</th>
                        <th style={{ width: 130 }} className="text-right">Số tiền PS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx}>
                          <td className="center text-muted">{idx + 1}</td>
                          <td className="center">{String(row[0] ?? '')}</td>
                          <td className="bold">{String(row[1] ?? '')}</td>
                          <td className="desc-cell" title={String(row[2] ?? '')}>{String(row[2] ?? '')}</td>
                          <td className="center mono bold">{String(row[3] ?? '')}</td>
                          <td className="center mono bold">{String(row[4] ?? '')}</td>
                          <td className="text-right num bold">{String(row[5] ?? '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dataRows.length > 10 && (
                    <div className="paste-more-rows-footer">
                      ... và <strong>{(dataRows.length - 10).toLocaleString('vi-VN')}</strong> dòng khác đã sẵn sàng nạp.
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  rows={11}
                  className="modal-paste-area"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Dán dữ liệu dạng bảng phân tách bằng Tab (TSV) từ Excel..."
                  autoFocus
                />
              )}
            </div>
          )}
        </div>

        {/* ── Modal Foot ── */}
        <div className="modal-foot">
          <div className="modal-foot-left">
            <span className="foot-hint">Hỗ trợ định dạng số tiền có dấu chấm hoặc phẩy</span>
          </div>
          <div className="modal-foot-right">
            <button className="btn-modal secondary" onClick={onClose}>
              Hủy bỏ
            </button>
            <button
              className="btn-modal primary"
              disabled={dataRows.length === 0}
              onClick={handleConfirm}
            >
              <IconCheck size={14} style={{ marginRight: 6, verticalAlign: '-1px' }} />
              Nạp {dataRows.length > 0 ? `${dataRows.length.toLocaleString('vi-VN')} dòng dữ liệu` : 'dữ liệu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
