import { useState, useMemo } from 'react'
import { IconX, IconSpark } from './Icons'

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
  src_nkc: {
    id: 'src_nkc',
    label: 'Sổ Nhật Ký Chung (NKC)',
    role: 'Nguồn Dữ Liệu Thô',
    stage: '1. Dữ Liệu Sổ Sách Đầu Vào',
    desc: 'File Excel hoặc dán clipboard sổ kế toán trước/sau kiểm toán chứa danh sách bút toán phát sinh trong kỳ.',
    inputs: ['Phần mềm kế toán doanh nghiệp (MISA, FAST, Bravo, SAP, Excel...)'],
    outputs: ['Đối chiếu NKC (#02)', 'Phân tích xu hướng (#05)', 'Tổng thể bốc mẫu VSA 530 (#03)'],
    accentColor: '#38bdf8',
  },
  src_cdfs: {
    id: 'src_cdfs',
    label: 'Bảng CĐPS / Sổ Cái',
    role: 'Nguồn Dữ Liệu Đối Ứng',
    stage: '1. Dữ Liệu Sổ Sách Đầu Vào',
    desc: 'Bảng cân đối phát sinh tài khoản dùng để đối chiếu số dư đầu kỳ, phát sinh Nợ/Có và số dư cuối kỳ.',
    inputs: ['File Excel Bảng Cân Đối Phát Sinh Tài Khoản'],
    outputs: ['Khung số dư đối chiếu kiểm toán (#02)'],
    accentColor: '#38bdf8',
  },
  src_etax: {
    id: 'src_etax',
    label: 'Tờ Khai Thuế eTax XML',
    role: 'Dữ Liệu Khai Thuế',
    stage: '1. Dữ Liệu Sổ Sách Đầu Vào',
    desc: 'File XML tờ khai Quyết toán TNDN (03/TNDN) hoặc GTGT (01/GTGT) kết xuất từ phần mềm HTKK hoặc Thuế điện tử.',
    inputs: ['Cổng Thuế điện tử thuedientu.gdt.gov.vn / HTKK'],
    outputs: ['Chuyển đổi tờ khai eTax TT 80 (#04)'],
    accentColor: '#ea580c',
  },
  src_b410_ktv: {
    id: 'src_b410_ktv',
    label: 'File B410 Chi Tiết Nhóm',
    role: 'Dữ Liệu Làm Việc Nhóm',
    stage: '1. Dữ Liệu Sổ Sách Đầu Vào',
    desc: 'Các file Excel B410 riêng lẻ do từng trợ lý kiểm toán lập cho từng phần hành (Tiền, Kho, Nợ phải thu, Chi phí...).',
    inputs: ['KTV phụ trách phần hành'],
    outputs: ['Tổng hợp B410 Master (#01)'],
    accentColor: '#10b981',
  },
  mod_reconcile: {
    id: 'mod_reconcile',
    label: '#02 Đối Chiếu 2 Sổ NKC',
    role: 'Phân Hệ Xử Lý & Đối Chiếu',
    stage: '2. Đối Chiếu & Rà Soát Rủi Ro',
    desc: 'Đối chiếu so khớp dữ liệu Trước vs Sau kiểm toán, bóc tách chênh lệch từng dòng bút toán, số tiền và ngày tháng.',
    inputs: ['Sổ NKC Trước kiểm toán', 'Sổ NKC Sau kiểm toán'],
    outputs: ['Danh sách chênh lệch', 'Bút toán đặc biệt đưa vào mẫu VSA 530 (#03)', 'Bút toán điều chỉnh đề xuất (#01)'],
    accentColor: '#2563eb',
  },
  mod_analytics: {
    id: 'mod_analytics',
    label: '#05 Phân Tích Cơ Bản & Rủi Ro',
    role: 'Phân Hệ Phân Tích Thủ Tục VSA 520',
    stage: '2. Đối Chiếu & Rà Soát Rủi Ro',
    desc: 'Phân tích biến động doanh thu/chi phí 12 tháng, tìm tháng đột biến và phân tích Pareto khách hàng/nhà cung cấp trọng yếu.',
    inputs: ['Sổ NKC chuẩn hóa'],
    outputs: ['Cảnh báo tháng rủi ro chuyển sang bốc mẫu (#03)', 'Chỉ tiêu điều chỉnh tăng thuế B4'],
    accentColor: '#0284c7',
  },
  mod_etax: {
    id: 'mod_etax',
    label: '#04 Chuyển Đổi Tờ Khai eTax',
    role: 'Phân Hệ Nâng Cấp Thuế',
    stage: '2. Đối Chiếu & Rà Soát Rủi Ro',
    desc: 'Nâng cấp tự động cấu trúc XML từ Thông tư cũ (TT 151) sang Thông tư 80 mới nhất (XML 2.9.4 / HTKK 5.6.2).',
    inputs: ['File XML Tờ khai cũ'],
    outputs: ['File XML chuẩn TT 80 tương thích 100% iTaxViewer'],
    accentColor: '#ea580c',
  },
  mod_sampling: {
    id: 'mod_sampling',
    label: '#03 Chọn Mẫu VSA 530',
    role: 'Phân Hệ Chuẩn Mực Bốc Mẫu',
    stage: '3. Bốc Mẫu Chuẩn Mực VSA 530',
    desc: 'Lọc sạch bút toán kết chuyển, tính toán cỡ mẫu theo rủi ro, tự động bốc mẫu Key items, bước nhảy MUS và duyệt chọn mẫu thủ công.',
    inputs: ['Sổ NKC đã lọc kết chuyển', 'Bút toán chênh lệch từ #02', 'Cảnh báo rủi ro từ #05'],
    outputs: ['Danh sách mẫu kiểm toán cần kiểm tra chứng từ gốc'],
    accentColor: '#7c3aed',
  },
  audit_testing: {
    id: 'audit_testing',
    label: 'Thực Hiện Kiểm Tra Mẫu',
    role: 'Thủ Tục Kiểm Tra Thực Địa',
    stage: '3. Bốc Mẫu Chuẩn Mực VSA 530',
    desc: 'Kiểm toán viên đối chiếu chứng từ gốc (Hóa đơn, phiếu thu, phiếu chi, hợp đồng...) theo danh sách mẫu được bốc.',
    inputs: ['Danh sách mẫu kiểm toán VSA 530'],
    outputs: ['Phát hiện các bút toán sai sót / vi phạm chuẩn mực'],
    accentColor: '#f59e0b',
  },
  mod_b410: {
    id: 'mod_b410',
    label: '#01 Tổng Hợp B410 Master',
    role: 'Phân Hệ Tổng Hợp Sai Sót',
    stage: '4. Hồ Sơ Báo Cáo & Giấy Làm Việc',
    desc: 'Hợp nhất tự động toàn bộ file B410 chi tiết của KTV thành file Master B410 chuẩn, giữ nguyên công thức và định dạng.',
    inputs: ['Sai sót phát hiện từ kiểm tra mẫu', 'File B410 của từng KTV', 'Bút toán điều chỉnh từ #02'],
    outputs: ['Bảng B410 Master trình Chủ nhiệm kiểm toán'],
    accentColor: '#059669',
  },
  mod_wp: {
    id: 'mod_wp',
    label: '#06 Lập 12 Giấy Làm Việc',
    role: 'Hồ Sơ Giấy Làm Việc VACPA',
    stage: '4. Hồ Sơ Báo Cáo & Giấy Làm Việc',
    desc: 'Tự động sinh bộ 12 Giấy làm việc kiểm toán mẫu (Working Papers A110, A710, C-series, E-series...).',
    inputs: ['Bảng B410 Master', 'Sổ Cái và CĐPS'],
    outputs: ['Bộ hồ sơ kiểm toán hoàn chỉnh'],
    accentColor: '#0284c7',
  },
  tax_risk: {
    id: 'tax_risk',
    label: 'Rà Soát Rủi Ro Thuế B4',
    role: 'Báo Cáo Rủi Ro Thuế TNDN',
    stage: '4. Hồ Sơ Báo Cáo & Giấy Làm Việc',
    desc: 'Rà soát chi tiền mặt >= 20 triệu, chi phí không có hóa đơn hợp lệ, lãi vay giao dịch liên kết.',
    inputs: ['Phân tích rủi ro từ #05', 'Bút toán NKC'],
    outputs: ['Bảng kê chỉ tiêu B4 điều chỉnh tăng thuế TNDN'],
    accentColor: '#d97706',
  },
}

const DEFAULT_CHAPTER = {
  id: 'all',
  title: 'Toàn Bộ Luồng Liên Kết',
  narrative: 'Toàn cảnh chu trình kiểm toán từ dữ liệu sổ sách thô đến tổng hợp B410 Master và bộ giấy làm việc.',
  nodes: Object.keys(NODES_METADATA),
}

const CHAPTERS = [
  DEFAULT_CHAPTER,
  {
    id: 'chap-1',
    title: '1. Nguồn Dữ Liệu Đầu Vào',
    narrative: 'KTV nạp Sổ Nhật Ký Chung, Bảng CĐPS, file Tờ khai Thuế XML và các file B410 chi tiết của nhóm kiểm toán.',
    nodes: ['src_nkc', 'src_cdfs', 'src_etax', 'src_b410_ktv'],
  },
  {
    id: 'chap-2',
    title: '2. Đối Chiếu & Rà Soát Rủi Ro',
    narrative: 'Phân hệ #02 đối chiếu tìm chênh lệch Trước vs Sau KT; #05 phân tích xu hướng 12 tháng; #04 chuyển đổi tờ khai XML TT 80.',
    nodes: ['mod_reconcile', 'mod_analytics', 'mod_etax'],
  },
  {
    id: 'chap-3',
    title: '3. Bốc Mẫu Chuẩn Mực VSA 530',
    narrative: 'Lọc sạch bút toán kết chuyển, bốc mẫu bước nhảy MUS, tự động bắt phần tử trọng yếu và nhận diện bút toán rủi ro cao.',
    nodes: ['mod_sampling', 'audit_testing'],
  },
  {
    id: 'chap-4',
    title: '4. B410 Master & Giấy Làm Việc',
    narrative: 'Toàn bộ sai sót kiểm tra chi tiết được tự động gộp vào file B410 Master (#01) và đồng bộ vào bộ 12 Giấy làm việc (#06).',
    nodes: ['mod_b410', 'mod_wp', 'tax_risk'],
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
              <IconSpark size={18} />
            </div>
            <div>
              <div className="diagram-header-tag">ARCHIFY SIGNAL-FLOW MAP</div>
              <h2 className="diagram-header-title">
                Sơ Đồ Luồng Dữ Liệu &amp; Liên Kết Các Phân Hệ AuditSoft
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="diagram-modal-close"
            onClick={onClose}
            title="Đóng (Esc)"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* ── Chapter Bar ── */}
        <div className="diagram-chapters-bar">
          <span className="diagram-chapters-label">CÁC GIAI ĐOẠN NGHIỆP VỤ:</span>
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
              viewBox="0 0 1140 520"
              width="100%"
              height="auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <style>{`
                  .ak-stage rect { fill: #0f172a; stroke: #1e293b; }
                  .ak-stage text { fill: #94a3b8; font-weight: 700; font-size: 11px; letter-spacing: 0.04em; }
                  .ak-edge path { fill: none !important; stroke: #0284c7; stroke-width: 1.8; opacity: 0.85; transition: all 180ms ease; }
                  .ak-edge-label rect { fill: #090e1a; stroke: #1e293b; stroke-width: 1; }
                  .ak-edge-label text { fill: #38bdf8; font-size: 8.5px; font-weight: 600; font-family: system-ui, sans-serif; }
                  .ak-node { cursor: pointer; transition: transform 140ms ease; }
                  .ak-node rect { fill: #0c1527; stroke: #334155; stroke-width: 1.5; transition: all 140ms ease; }
                  .ak-node text.title { fill: #f8fafc; font-size: 11px; font-weight: 700; }
                  .ak-node text.sub { fill: #64748b; font-size: 9px; font-weight: 600; }
                  .ak-node:hover rect, .ak-node.is-focused rect { stroke: #38bdf8; stroke-width: 2; fill: #132238; filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.45)); }
                  .ak-node.is-dimmed { opacity: 0.22; }
                  .ak-edge.is-dimmed { opacity: 0.1; }
                  .ak-edge.is-highlighted path { stroke: #38bdf8; stroke-width: 2.5; opacity: 1; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.8)); }
                `}</style>
                <marker
                  id="ak-arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#0284c7" />
                </marker>
              </defs>

              {/* Stages (4 Cột) */}
              <g className="ak-stage">
                <rect x="35" y="55" width="220" height="440" rx="10" strokeDasharray="4 2" />
                <text x="145" y="78" textAnchor="middle">1. DỮ LIỆU SỔ SÁCH ĐẦU VÀO</text>
              </g>
              <g className="ak-stage">
                <rect x="315" y="55" width="220" height="340" rx="10" strokeDasharray="4 2" />
                <text x="425" y="78" textAnchor="middle">2. ĐỐI CHIẾU &amp; RỦI RO</text>
              </g>
              <g className="ak-stage">
                <rect x="595" y="55" width="220" height="240" rx="10" strokeDasharray="4 2" />
                <text x="705" y="78" textAnchor="middle">3. BỐC MẪU VSA 530</text>
              </g>
              <g className="ak-stage">
                <rect x="875" y="55" width="230" height="440" rx="10" strokeDasharray="4 2" />
                <text x="990" y="78" textAnchor="middle">4. BÁO CÁO &amp; GIẤY LÀM VIỆC</text>
              </g>

              {/* Edges & Badges */}
              {/* 1. src_nkc -> mod_reconcile */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'src_nkc' && selectedNodeId !== 'mod_reconcile' ? 'is-dimmed' : ''}`}>
                <path d="M 235 114 L 335 114" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(285, 102)">
                  <rect x="-42" y="-8.5" width="84" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Dữ liệu 2 sổ NKC</text>
                </g>
              </g>

              {/* 2. src_cdfs -> mod_reconcile */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'src_cdfs' && selectedNodeId !== 'mod_reconcile' ? 'is-dimmed' : ''}`}>
                <path d="M 235 222 C 285 222, 285 130, 335 130" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(285, 160)">
                  <rect x="-40" y="-8.5" width="80" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Số dư đối chiếu</text>
                </g>
              </g>

              {/* 3. src_nkc -> mod_analytics */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'src_nkc' && selectedNodeId !== 'mod_analytics' ? 'is-dimmed' : ''}`}>
                <path d="M 235 130 C 285 130, 285 222, 335 222" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(285, 185)">
                  <rect x="-45" y="-8.5" width="90" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Bút toán 12 tháng</text>
                </g>
              </g>

              {/* 4. src_etax -> mod_etax */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'src_etax' && selectedNodeId !== 'mod_etax' ? 'is-dimmed' : ''}`}>
                <path d="M 235 322 L 335 322" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(285, 310)">
                  <rect x="-40" y="-8.5" width="80" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">XML gốc tờ khai</text>
                </g>
              </g>

              {/* 5. mod_reconcile -> mod_sampling */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_reconcile' && selectedNodeId !== 'mod_sampling' ? 'is-dimmed' : ''}`}>
                <path d="M 515 114 L 615 114" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(565, 102)">
                  <rect x="-50" y="-8.5" width="100" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Bút toán chênh lệch</text>
                </g>
              </g>

              {/* 6. mod_analytics -> mod_sampling */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_analytics' && selectedNodeId !== 'mod_sampling' ? 'is-dimmed' : ''}`}>
                <path d="M 515 214 C 565 214, 565 130, 615 130" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(565, 165)">
                  <rect x="-55" y="-8.5" width="110" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Tháng biến động rủi ro</text>
                </g>
              </g>

              {/* 7. mod_sampling -> audit_testing (Vertical Drop trong cùng Cột 3) */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_sampling' && selectedNodeId !== 'audit_testing' ? 'is-dimmed' : ''}`}>
                <path d="M 705 149 L 705 205" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(705, 177)">
                  <rect x="-60" y="-8.5" width="120" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Danh sách mẫu kiểm toán</text>
                </g>
              </g>

              {/* 8. audit_testing -> mod_b410 */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'audit_testing' && selectedNodeId !== 'mod_b410' ? 'is-dimmed' : ''}`}>
                <path d="M 795 232 C 845 232, 845 138, 895 138" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(845, 185)">
                  <rect x="-42" y="-8.5" width="84" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Sai sót phát hiện</text>
                </g>
              </g>

              {/* 9. mod_b410 -> mod_wp (Vertical Drop trong cùng Cột 4) */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_b410' && selectedNodeId !== 'mod_wp' ? 'is-dimmed' : ''}`}>
                <path d="M 985 159 L 985 215" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(985, 187)">
                  <rect x="-55" y="-8.5" width="110" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Đồng bộ hồ sơ VACPA</text>
                </g>
              </g>

              {/* 10. mod_analytics -> tax_risk */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_analytics' && selectedNodeId !== 'tax_risk' ? 'is-dimmed' : ''}`}>
                <path d="M 515 230 C 660 230, 720 352, 895 352" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(705, 300)">
                  <rect x="-45" y="-8.5" width="90" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Chỉ tiêu rủi ro B4</text>
                </g>
              </g>

              {/* 11. src_b410_ktv -> mod_b410 (Hành lang đáy mở) */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'src_b410_ktv' && selectedNodeId !== 'mod_b410' ? 'is-dimmed' : ''}`}>
                <path d="M 235 422 C 450 422, 550 465, 800 465 C 855 465, 875 220, 895 118" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(520, 465)">
                  <rect x="-58" y="-8.5" width="116" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">File B410 chi tiết KTV</text>
                </g>
              </g>

              {/* 12. mod_reconcile -> mod_b410 (Hành lang đỉnh vòm) */}
              <g className={`ak-edge ${selectedNodeId && selectedNodeId !== 'mod_reconcile' && selectedNodeId !== 'mod_b410' ? 'is-dimmed' : ''}`}>
                <path d="M 425 95 C 425 35, 985 35, 985 105" markerEnd="url(#ak-arrowhead)" fill="none" />
                <g className="ak-edge-label" transform="translate(705, 35)">
                  <rect x="-70" y="-8.5" width="140" height="17" rx="4" />
                  <text x="0" y="3.5" textAnchor="middle">Bút toán điều chỉnh đề xuất</text>
                </g>
              </g>

              {/* Nodes (12 Hộp mở rộng 180px) */}
              {Object.entries(NODES_METADATA).map(([nodeId, info]) => {
                const isFocused = selectedNodeId === nodeId
                const isChapterMatch = activeChapter.nodes.includes(nodeId)
                const isDimmed = !isChapterMatch && !isFocused

                let rx = 55
                let ry = 95
                if (nodeId === 'src_nkc') { rx = 55; ry = 95 }
                else if (nodeId === 'src_cdfs') { rx = 55; ry = 195 }
                else if (nodeId === 'src_etax') { rx = 55; ry = 295 }
                else if (nodeId === 'src_b410_ktv') { rx = 55; ry = 395 }
                else if (nodeId === 'mod_reconcile') { rx = 335; ry = 95 }
                else if (nodeId === 'mod_analytics') { rx = 335; ry = 195 }
                else if (nodeId === 'mod_etax') { rx = 335; ry = 295 }
                else if (nodeId === 'mod_sampling') { rx = 615; ry = 95 }
                else if (nodeId === 'audit_testing') { rx = 615; ry = 205 }
                else if (nodeId === 'mod_b410') { rx = 895; ry = 95 }
                else if (nodeId === 'mod_wp') { rx = 895; ry = 205 }
                else if (nodeId === 'tax_risk') { rx = 895; ry = 315 }

                return (
                  <g
                    key={nodeId}
                    className={`ak-node ${isFocused ? 'is-focused' : ''} ${isDimmed ? 'is-dimmed' : ''}`}
                    onClick={() => setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId)}
                  >
                    <rect x={rx} y={ry} width="180" height="54" rx="8" />
                    <text x={rx + 90} y={ry + 23} className="title" textAnchor="middle">
                      {info.label}
                    </text>
                    <text x={rx + 90} y={ry + 41} className="sub" textAnchor="middle">
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
                  <div className="diagram-section-label">DỮ LIỆU ĐẦU VÀO (INPUTS):</div>
                  <ul className="diagram-list">
                    {selectedNodeInfo.inputs.map((inp, idx) => (
                      <li key={idx}>• {inp}</li>
                    ))}
                  </ul>
                </div>

                <div className="diagram-section">
                  <div className="diagram-section-label">DỮ LIỆU ĐẦU RA / LIÊN KẾT (OUTPUTS):</div>
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
                Bỏ chọn phần tử
              </button>
            </div>
          ) : (
            <div className="diagram-instruction-panel">
              <div className="instruction-icon">🖱️</div>
              <div className="instruction-title">Tương Tác Khám Phá</div>
              <p className="instruction-text">
                Nhấp chuột vào bất kỳ hộp phân hệ nào trên sơ đồ để xem chi tiết vai trò, nguồn dữ liệu nạp vào và kết quả đầu ra chuyển tiếp.
              </p>
              <div className="instruction-shortcuts">
                <div className="shortcut-row">
                  <kbd>1-4</kbd> Chuyển đổi giai đoạn
                </div>
                <div className="shortcut-row">
                  <kbd>Click</kbd> Làm nổi bật đường truyền
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="diagram-modal-footer">
          <div className="diagram-footer-note">
            <span>Compiler: Archify v2.16.0 (Zero-Network Offline Verified) · Preset: Signal-Flow Animate</span>
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
