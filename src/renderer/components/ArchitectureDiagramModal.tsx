import { useState, useMemo } from 'react'
import { IconX } from './Icons'

interface DiagramNodeInfo {
  id: string
  label: string
  role: string
  stage: string
  desc: string
  inputs: string[]
  outputs: string[]
  accentColor: string
}

const NODES_METADATA: Record<string, DiagramNodeInfo> = {
  mod_reconcile: {
    id: 'mod_reconcile',
    label: '#02 Đối Chiếu 2 Sổ NKC',
    role: 'Phân Hệ Xử Lý & Đối Chiếu',
    stage: '1. Tiếp Nhận & Đối Chiếu Sổ Sách',
    desc: 'So khớp đối chiếu tự động 2 sổ Nhật ký chung (Trước vs Sau kiểm toán / Kế toán vs Thuế), phân loại chênh lệch từng dòng bút toán, số tiền và ngày tháng.',
    inputs: ['Sổ NKC Trước kiểm toán (Excel / Clipboard / CSDL)', 'Sổ NKC Sau kiểm toán', 'Bảng Cân đối phát sinh (CĐPS)'],
    outputs: ['Danh sách bút toán chênh lệch trọng yếu đưa vào bốc mẫu (#03)', 'Bút toán điều chỉnh đề xuất AJE (#01)'],
    accentColor: '#2563eb',
  },
  mod_analytics: {
    id: 'mod_analytics',
    label: '#05 Phân Tích Cơ Bản & Rủi Ro',
    role: 'Phân Hệ Thủ Tục Phân Tích VSA 520',
    stage: '1. Tiếp Nhận & Đối Chiếu Sổ Sách',
    desc: 'Phân tích biến động doanh thu & chi phí 12 tháng, tìm kiếm tháng đột biến, phân tích Pareto Top khách hàng & nhà cung cấp trọng yếu.',
    inputs: ['Dữ liệu sổ NKC đã chuẩn hóa', 'Tờ khai thuế XML đối chiếu chéo (#04)'],
    outputs: ['Cảnh báo tháng rủi ro chuyển sang bốc mẫu (#03)', 'Chỉ tiêu điều chỉnh tăng thuế B4'],
    accentColor: '#0284c7',
  },
  mod_etax: {
    id: 'mod_etax',
    label: '#04 Chuyển Đổi Tờ Khai eTax',
    role: 'Phân Hệ Hỗ Trợ Thuế Điện Tử',
    stage: '1. Tiếp Nhận & Đối Chiếu Sổ Sách',
    desc: 'Tự động nâng cấp phiên bản tờ khai Quyết toán TNDN (Mẫu 03/TNDN) và toàn bộ phụ lục từ Thông tư cũ lên Thông tư 80/2021 (XML 2.9.4 / HTKK 5.6.2).',
    inputs: ['Tệp XML tờ khai thuế gốc cũ (TT 151 / TT 80 bản cũ)'],
    outputs: ['Tệp XML TT 80 chuẩn hợp lệ iTaxViewer', 'Số liệu đối chiếu chéo sang phân tích thuế (#05)'],
    accentColor: '#ea580c',
  },
  mod_sampling: {
    id: 'mod_sampling',
    label: '#03 Chọn Mẫu VSA 530',
    role: 'Phân Hệ Chuẩn Mực Bốc Mẫu',
    stage: '2. Bốc Mẫu Chuẩn Mực VSA 530',
    desc: 'Lọc sạch bút toán kết chuyển (TK 911), bốc mẫu phần tử trọng yếu (Key items), bước nhảy số học MUS kết hợp tự chọn mẫu đặc biệt từ cảnh báo rủi ro.',
    inputs: ['Sổ NKC đã lọc kết chuyển', 'Bút toán chênh lệch từ Đối chiếu (#02)', 'Cảnh báo tháng & đối tác rủi ro từ Phân tích (#05)'],
    outputs: ['Danh sách mẫu kiểm toán chi tiết', 'Biên bản phát hiện sai sót kiểm toán chuyển sang B410 (#01)'],
    accentColor: '#7c3aed',
  },
  mod_b410: {
    id: 'mod_b410',
    label: '#01 Tổng Hợp B410 Master',
    role: 'Phân Hệ Tổng Hợp Sai Sót',
    stage: '3. Báo Cáo & Tổng Hợp Hồ Sơ',
    desc: 'Hợp nhất tự động toàn bộ file B410 chi tiết của KTV thành file Master B410 duy nhất, tự động co giãn dòng, căn chỉnh và bảo toàn nguyên vẹn 100% định dạng.',
    inputs: ['Sai sót phát hiện từ kiểm tra mẫu (#03)', 'Bút toán điều chỉnh đề xuất AJE (#02)', 'File B410 chi tiết của từng trợ lý KTV'],
    outputs: ['File Excel B410 Master trình Chủ nhiệm kiểm toán', 'Đồng bộ số liệu sang Giấy làm việc (#06)'],
    accentColor: '#059669',
  },
  mod_wp: {
    id: 'mod_wp',
    label: '#06 Lập 12 Giấy Làm Việc',
    role: 'Hồ Sơ Giấy Làm Việc VACPA',
    stage: '3. Báo Cáo & Tổng Hợp Hồ Sơ',
    desc: 'Tự động trích xuất số liệu từ Sổ Cái và NKC để sinh trọn bộ 12 Giấy làm việc kiểm toán mẫu chuẩn VACPA (A110, B410, C/D/E/F/G-series).',
    inputs: ['Bảng tổng hợp B410 Master (#01)', 'Sổ Cái & CĐPS chuẩn hóa'],
    outputs: ['Bộ hồ sơ kiểm toán mẫu VACPA hoàn chỉnh sẵn sàng lưu trữ'],
    accentColor: '#0284c7',
  },
}

const DEFAULT_CHAPTER = {
  id: 'all',
  title: 'Toàn Bộ Chu Trình Kiểm Toán',
  narrative: 'Quy trình 3 trụ cột khép kín: Tiếp nhận & Đối chiếu -> Bốc mẫu VSA 530 -> Báo cáo B410 Master & Giấy làm việc.',
  nodes: Object.keys(NODES_METADATA),
}

const CHAPTERS = [
  DEFAULT_CHAPTER,
  {
    id: 'chap-1',
    title: '1. Tiếp Nhận & Đối Chiếu',
    narrative: 'Nạp dữ liệu vào các phân hệ #02 (Đối chiếu NKC), #05 (Phân tích biến động & đối tác) và #04 (Nâng cấp tờ khai thuế XML).',
    nodes: ['mod_reconcile', 'mod_analytics', 'mod_etax'],
  },
  {
    id: 'chap-2',
    title: '2. Bốc Mẫu VSA 530',
    narrative: 'Trung tâm bốc mẫu (#03) tiếp nhận các bút toán chênh lệch từ #02 và cảnh báo rủi ro từ #05 để phân tầng bốc mẫu chính xác.',
    nodes: ['mod_sampling'],
  },
  {
    id: 'chap-3',
    title: '3. Báo Cáo & Hồ Sơ B410',
    narrative: 'Tổng hợp toàn bộ sai sót vào bảng B410 Master (#01) và tự động sinh bộ 12 Giấy làm việc chuẩn mẫu VACPA (#06).',
    nodes: ['mod_b410', 'mod_wp'],
  },
]

export function ArchitectureDiagramModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}): JSX.Element | null {
  const [selectedChapter, setSelectedChapter] = useState('all')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const activeChapter = useMemo(() => {
    return CHAPTERS.find((c) => c.id === selectedChapter) || DEFAULT_CHAPTER
  }, [selectedChapter])

  const selectedNodeInfo = useMemo(() => {
    if (!selectedNodeId) return null
    return NODES_METADATA[selectedNodeId] || null
  }, [selectedNodeId])

  if (!isOpen) return null

  return (
    <div
      className="diagram-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="diagram-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="diagram-modal-header">
          <div className="diagram-header-left">
            <div className="diagram-header-icon-box">
              <span>🗺️</span>
            </div>
            <div>
              <div className="diagram-header-tag">ARCHIFY 3-TIER PIPELINE · SIGNAL-FLOW</div>
              <h2 className="diagram-header-title">
                Sơ Đồ Luồng Nghiệp Vụ &amp; Dữ Liệu Các Phân Hệ AuditSoft
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="diagram-modal-close"
            onClick={onClose}
            title="Đóng sơ đồ (Esc)"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* ── Chapter Bar ── */}
        <div className="diagram-chapters-bar">
          <span className="diagram-chapters-label">CHU TRÌNH KIỂM TOÁN:</span>
          <div className="diagram-chapters-list">
            {CHAPTERS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                className={`diagram-chapter-pill ${selectedChapter === ch.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedChapter(ch.id)
                  setSelectedNodeId(null)
                }}
              >
                {ch.title}
              </button>
            ))}
          </div>
        </div>

        {/* ── Narrative Subtitle ── */}
        <div className="diagram-narrative-banner">
          <span className="narrative-bullet">💡</span>
          <span>{activeChapter.narrative}</span>
        </div>

        {/* ── Main Diagram Viewer ── */}
        <div className="diagram-viewer-wrap">
          <div className="diagram-svg-container">
            <svg
              className="ak-diagram-svg signal-flow-active"
              viewBox="0 0 1080 480"
              width="100%"
              height="auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <style>{`
                  .ak-stage rect { fill: #0f172a; stroke: #1e293b; }
                  .ak-stage text { fill: #94a3b8; font-weight: 700; font-size: 11px; letter-spacing: 0.04em; }
                  .ak-edge path { fill: none !important; stroke: #0ea5e9; stroke-width: 2; opacity: 0.85; transition: all 180ms ease; }
                  .ak-edge-label rect { fill: #090e1a; stroke: #1e293b; stroke-width: 1; }
                  .ak-edge-label text { fill: #38bdf8; font-size: 9px; font-weight: 600; font-family: system-ui, sans-serif; }
                  .ak-node { cursor: pointer; transition: transform 140ms ease; }
                  .ak-node rect { fill: #0c1527; stroke: #334155; stroke-width: 1.5; transition: all 140ms ease; }
                  .ak-node text.title { fill: #f8fafc; font-size: 12px; font-weight: 700; }
                  .ak-node text.sub { fill: #64748b; font-size: 9.5px; font-weight: 600; }
                  .ak-node:hover rect, .ak-node.is-focused rect { stroke: #38bdf8; stroke-width: 2; fill: #132238; filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.45)); }
                  .ak-node.is-dimmed { opacity: 0.22; }
                  .ak-edge.is-dimmed { opacity: 0.1; }
                  .ak-edge.is-highlighted path { stroke: #38bdf8; stroke-width: 3; opacity: 1; filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.8)); }
                `}</style>
                <marker
                  id="ak-arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#0ea5e9" />
                </marker>
              </defs>

              {/* ── Stages (3 Cột Rộng Rãi) ── */}
              {/* Cột 1 */}
              <g className="ak-stage">
                <rect x="40" y="55" width="280" height="395" rx="12" strokeDasharray="4 2" />
                <text x="180" y="80" textAnchor="middle">1. TIẾP NHẬN &amp; ĐỐI CHIẾU SỔ SÁCH</text>
              </g>

              {/* Cột 2 */}
              <g className="ak-stage">
                <rect x="400" y="55" width="280" height="395" rx="12" strokeDasharray="4 2" />
                <text x="540" y="80" textAnchor="middle">2. BỐC MẪU CHUẨN MỰC VSA 530</text>
              </g>

              {/* Cột 3 */}
              <g className="ak-stage">
                <rect x="760" y="55" width="280" height="395" rx="12" strokeDasharray="4 2" />
                <text x="900" y="80" textAnchor="middle">3. BÁO CÁO &amp; TỔNG HỢP HỒ SƠ</text>
              </g>

              {/* ── Edges & Badges (5 Dòng Chảy Thẳng Mạch Lạc) ── */}

              {/* 1. mod_reconcile -> mod_sampling */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_reconcile' && selectedNodeId !== 'mod_sampling' ? 'is-dimmed' : ''}`}>
                <path d="M 295 130 C 350 130, 360 215, 425 215" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(360, 155)">
                  <rect x="-55" y="-9" width="110" height="18" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Bút toán chênh lệch</text>
                </g>
              </g>

              {/* 2. mod_analytics -> mod_sampling */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_analytics' && selectedNodeId !== 'mod_sampling' ? 'is-dimmed' : ''}`}>
                <path d="M 295 235 L 425 235" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(360, 222)">
                  <rect x="-65" y="-9" width="130" height="18" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Tháng &amp; đối tác rủi ro cao</text>
                </g>
              </g>

              {/* 3. mod_etax -> mod_analytics */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_etax' && selectedNodeId !== 'mod_analytics' ? 'is-dimmed' : ''}`}>
                <path d="M 180 310 L 180 268" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(180, 288)">
                  <rect x="-50" y="-9" width="100" height="18" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Đối chiếu số liệu thuế</text>
                </g>
              </g>

              {/* 4. mod_sampling -> mod_b410 */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_sampling' && selectedNodeId !== 'mod_b410' ? 'is-dimmed' : ''}`}>
                <path d="M 655 215 C 715 215, 725 155, 785 155" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(720, 172)">
                  <rect x="-60" y="-9" width="120" height="18" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Mẫu kiểm toán &amp; Sai sót</text>
                </g>
              </g>

              {/* 5. mod_b410 -> mod_wp */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_b410' && selectedNodeId !== 'mod_wp' ? 'is-dimmed' : ''}`}>
                <path d="M 900 188 L 900 252" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(900, 220)">
                  <rect x="-65" y="-9" width="130" height="18" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Đồng bộ vào hồ sơ VACPA</text>
                </g>
              </g>

              {/* ── Nodes (Đúng 6 Module Cốt Lõi, Rộng 230px, Đọc Rất Rõ) ── */}
              {Object.entries(NODES_METADATA).map(([nodeId, info]) => {
                const isFocused = selectedNodeId === nodeId
                const isChapterMatch = activeChapter.nodes.includes(nodeId)
                const isDimmed = !isChapterMatch && !isFocused

                let rx = 65
                let ry = 100
                let rw = 230
                let rh = 58

                if (nodeId === 'mod_reconcile') { rx = 65; ry = 100; rw = 230; rh = 58 }
                else if (nodeId === 'mod_analytics') { rx = 65; ry = 205; rw = 230; rh = 58 }
                else if (nodeId === 'mod_etax') { rx = 65; ry = 310; rw = 230; rh = 58 }
                else if (nodeId === 'mod_sampling') { rx = 425; ry = 188; rw = 230; rh = 76 }
                else if (nodeId === 'mod_b410') { rx = 785; ry = 126; rw = 230; rh = 62 }
                else if (nodeId === 'mod_wp') { rx = 785; ry = 254; rw = 230; rh = 62 }

                return (
                  <g
                    key={nodeId}
                    className={`ak-node ${isFocused ? 'is-focused' : ''} ${isDimmed ? 'is-dimmed' : ''}`}
                    onClick={() => setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId)}
                  >
                    <rect x={rx} y={ry} width={rw} height={rh} rx="10" />
                    <text
                      x={rx + rw / 2}
                      y={ry + (nodeId === 'mod_sampling' ? 32 : 25)}
                      className="title"
                      textAnchor="middle"
                    >
                      {info.label}
                    </text>
                    <text
                      x={rx + rw / 2}
                      y={ry + (nodeId === 'mod_sampling' ? 52 : 44)}
                      className="sub"
                      textAnchor="middle"
                    >
                      {info.role}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* ── Node Detail Sidebar / Drawer ── */}
          {selectedNodeInfo ? (
            <div className="diagram-detail-panel">
              <div className="diagram-detail-head">
                <span
                  className="diagram-node-tag"
                  style={{ color: selectedNodeInfo.accentColor }}
                >
                  {selectedNodeInfo.stage}
                </span>
                <h4 className="diagram-node-title">{selectedNodeInfo.label}</h4>
                <div className="diagram-node-role">{selectedNodeInfo.role}</div>
              </div>

              <div className="diagram-detail-body">
                <p className="diagram-node-desc">{selectedNodeInfo.desc}</p>

                <div className="diagram-section">
                  <div className="diagram-section-label">DỮ LIỆU NẠP VÀO (INPUTS):</div>
                  <ul className="diagram-list">
                    {selectedNodeInfo.inputs.map((inp, idx) => (
                      <li key={idx}>• {inp}</li>
                    ))}
                  </ul>
                </div>

                <div className="diagram-section">
                  <div className="diagram-section-label">DỮ LIỆU CHUYỂN TIẾP (OUTPUTS):</div>
                  <ul className="diagram-list">
                    {selectedNodeInfo.outputs.map((out, idx) => (
                      <li key={idx}>➔ {out}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                className="diagram-clear-btn"
                onClick={() => setSelectedNodeId(null)}
              >
                Bỏ chọn phân hệ
              </button>
            </div>
          ) : (
            <div className="diagram-instruction-panel">
              <div className="instruction-icon">🧭</div>
              <div className="instruction-title">Khám Phá Luồng Nghiệp Vụ</div>
              <p className="instruction-text">
                Nhấp chuột vào bất kỳ phân hệ nào trên sơ đồ 3 trụ cột để xem chi tiết vai trò, nguồn dữ liệu đầu vào và luồng chuyển tiếp số liệu.
              </p>
              <div className="instruction-shortcuts">
                <div className="shortcut-row">
                  <kbd>1-3</kbd> Chọn nhanh từng giai đoạn
                </div>
                <div className="shortcut-row">
                  <kbd>Click</kbd> Xem thông tin phân hệ
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="diagram-modal-footer">
          <div className="diagram-footer-note">
            <span>Archify v2.16.0 · Thiết kế 3 Trụ Cột Tinh Giản · Khớp 1-1 với 6 Phân Hệ Trang Chủ</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-close-diagram"
            onClick={onClose}
          >
            Đóng sơ đồ
          </button>
        </div>
      </div>
    </div>
  )
}
