import { useMemo, useState, useRef } from 'react'
import { useApp } from '../state/store'
import {
  calculateBenchmarkTotals,
  computeMateriality,
  extractBenchmarkFromMultiSheets,
  recommendBenchmark,
  extractCellNumber,
  extractCellString,
  type BenchmarkTotals,
  type CdfsRowInput,
} from '../../domain/sampling/materialityCalculator'
import { filterBySection } from '../../domain/sampling/sectionFilter'
import { calculateAuditSamplingWp, type AuditSamplingWpResult, type SelectedWpSample } from '../../domain/sampling/auditSamplingWp'
import { buildSamplingWorkbook } from '../../domain/sampling/exportSamplingWp'
import { useTrialExport } from '../../shared/license'
import {
  AUDIT_SECTIONS,
  BENCHMARK_RANGES,
  DEFAULT_SAMPLING_CONFIG,
  type AuditSectionKey,
  type SampleableItem,
  type SamplingConfig,
} from '../../domain/sampling/types'
import { formatNumber } from '../lib/format'
import { VirtualTable, type VirtualColumn } from './VirtualTable'
import { standardizeSource } from '../../domain/pipeline/standardize'
import type { ColumnMapping } from '../../domain/types'
import { PasteModal } from './PasteModal'
import { IconSearch, IconFileSpreadsheet } from './Icons'
import { extractDroppedFilePath, isExcelOrCsvPath } from '../lib/fileDrop'
function fmtVnd(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v) || v === 0) return '0 đ'
  return `${Math.round(v).toLocaleString('vi-VN')} đ`
}

async function exportSamplingExcel(wp: AuditSamplingWpResult): Promise<void> {
  const trialCheck = useTrialExport()
  if (!trialCheck.allowed) {
    useApp.getState().setError(trialCheck.message)
    useApp.getState().setLicenseModalOpen(true)
    useApp.getState().refreshTrialStatus()
    return
  }

  const wb = buildSamplingWorkbook(wp)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `QuyTrinhChonMau-${wp.sectionName.replace(/\s+/g, '')}-VSA530.xlsx`
  a.click()
  URL.revokeObjectURL(url)
  useApp.getState().refreshTrialStatus()
}

function parseCdfsRows(rows: unknown[][]): CdfsRowInput[] {
  const result: CdfsRowInput[] = []
  let headerRow = 2
  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r] ?? []
    const rowStr = row.map((c) => extractCellString(c).toLowerCase()).join(' ')
    if (
      rowStr.includes('tài khoản') ||
      rowStr.includes('mã tk') ||
      rowStr.includes('matk') ||
      rowStr.includes('số hiệu') ||
      rowStr.includes('tên tk')
    ) {
      headerRow = r
      break
    }
  }

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? []
    const matk = extractCellString(row[1] ?? row[0]).replace(/[^0-9A-Za-z]/g, '')
    const tentk = extractCellString(row[2] ?? row[1])
    if (!matk || matk.length < 3 || isNaN(Number(matk.slice(0, 3)))) continue

    const sdndk = extractCellNumber(row[3] ?? row[2])
    const sdcdk = extractCellNumber(row[4] ?? row[3])
    const psno = extractCellNumber(row[5] ?? row[4])
    const psco = extractCellNumber(row[6] ?? row[5])
    const nock = extractCellNumber(row[7] ?? row[6]) || extractCellNumber(row[10])
    const cock = extractCellNumber(row[8] ?? row[7]) || extractCellNumber(row[11])

    result.push({ matk, tentk, sdndk, sdcdk, psno, psco, nock, cock })
  }
  return result
}

interface LoadedSourceInfo {
  name: string
  rowCount: number
  totalAmount: number
  detectedSheets?: {
    nkc?: string
    cdfs?: string
    kqkd?: string
    cdkt?: string
  }
}

export function SamplingTab(): JSX.Element {
  const result = useApp((s) => s.result)
  const beforeSource = useApp((s) => s.before)

  const [customItems, setCustomItems] = useState<SampleableItem[] | null>(null)
  const [loadedInfo, setLoadedInfo] = useState<LoadedSourceInfo | null>(null)
  const [loadedBenchmarks, setLoadedBenchmarks] = useState<BenchmarkTotals | null>(null)
  const [loading, setLoading] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const [config, setConfig] = useState<SamplingConfig>(DEFAULT_SAMPLING_CONFIG)
  const [strategyFilter, setStrategyFilter] = useState<'ALL' | 'KCM' | 'RISK' | 'STEP'>('ALL')
  const [filterQuery, setFilterQuery] = useState('')

  // 1. Chuẩn bị danh sách tổng thể từ nguồn đã chọn (Mặc định: NKC Trước kiểm toán)
  const populationItems = useMemo<SampleableItem[]>(() => {
    if (customItems && customItems.length > 0) return customItems

    if (result && result.beforeEntries && result.beforeEntries.length > 0) {
      return result.beforeEntries.map((e, idx) => {
        const rawAmt = Number(e.amountJSON.split('|')[1] ?? 0)
        return {
          id: `before-${idx + 1}`,
          rowIndex: e.rowIndex,
          displayDate: e.displayDate,
          voucher: e.voucher,
          description: e.description,
          debit: e.debit,
          credit: e.credit,
          amount: rawAmt,
        }
      })
    }
    return []
  }, [customItems, result])

  // Xử lý nạp dữ liệu từ đường dẫn file Excel (dùng chung cho cả Pick file và Kéo thả)
  async function loadWorkbookFile(filePath: string): Promise<void> {
    if (typeof window.auditsoft === 'undefined') {
      alert('Không kết nối được hệ thống — vui lòng khởi động app qua 2-Chay-App.bat.')
      return
    }
    setLoading(true)
    try {
      const meta = await window.auditsoft.inspectWorkbook(filePath)

      // Nhận diện các Sheet chủ chốt
      const nkcSheet =
        meta.sheets.find((s) => /^(nkc|nhật ký|nhat ky|journal|gl)$/i.test(s.name.trim())) ||
        meta.sheets.find((s) => /nkc|nhật ký|nhat ky|journal|gl/i.test(s.name)) ||
        meta.sheets[0]
      const cdfsSheet =
        meta.sheets.find((s) => /^(cdfs|cdps|cdsps|cân đối phát sinh|can doi phat sinh|trial balance)$/i.test(s.name.trim())) ||
        meta.sheets.find((s) => /cdfs|cdps|cdsps|cân đối phát sinh|can doi phat sinh|trial balance/i.test(s.name))
      const kqkdSheet =
        meta.sheets.find((s) => /^(kqkd|kết quả|ket qua|income)$/i.test(s.name.trim())) ||
        meta.sheets.find((s) => /kqkd|kết quả|ket qua|income/i.test(s.name))
      const cdktSheet =
        meta.sheets.find((s) => /^(cdkt|cân đối kế toán|can doi ke toan|balance sheet)$/i.test(s.name.trim())) ||
        meta.sheets.find((s) => /cdkt|cân đối kế toán|can doi ke toan|balance sheet/i.test(s.name))

      if (!nkcSheet) throw new Error('Không tìm thấy sheet nào trong file Excel.')

      // 1. Đọc sheet NKC chính
      const nkcRes = await window.auditsoft.readWorkbookRows(filePath, nkcSheet.name)
      const nkcRows = nkcRes.rows || []

      const mapping: ColumnMapping = {
        date: nkcSheet.suggestedMapping.date ?? 0,
        voucher: nkcSheet.suggestedMapping.voucher ?? 1,
        description: nkcSheet.suggestedMapping.description ?? 2,
        debit: nkcSheet.suggestedMapping.debit ?? 3,
        credit: nkcSheet.suggestedMapping.credit ?? 4,
        amount: nkcSheet.suggestedMapping.amount ?? 5,
      }

      const std = standardizeSource({
        rows: nkcRows,
        firstDataRowIndex: Math.max(0, nkcSheet.suggestedHeaderRow - 1),
        mapping,
      })

      const items: SampleableItem[] = std.entries.map((e, idx) => ({
        id: `custom-${idx + 1}`,
        rowIndex: e.rowIndex,
        displayDate: e.displayDate,
        voucher: e.voucher,
        description: e.description,
        debit: e.debit,
        credit: e.credit,
        amount: e.amount ? Number(e.amount.raw) / Math.pow(10, e.amount.scale) : 0,
      }))

      // 2. Đọc tuần tự các sheet phụ để tránh xung đột file stream
      let cdfsRowsRaw: unknown[][] | undefined = undefined
      if (cdfsSheet) {
        try {
          const res = await window.auditsoft.readWorkbookRows(filePath, cdfsSheet.name)
          cdfsRowsRaw = res.rows
        } catch (e) {
          console.warn('Lỗi đọc sheet CDFS:', e)
        }
      }

      let kqkdMatrix: unknown[][] | undefined = undefined
      if (kqkdSheet) {
        try {
          const res = await window.auditsoft.readWorkbookRows(filePath, kqkdSheet.name)
          kqkdMatrix = res.rows
        } catch (e) {
          console.warn('Lỗi đọc sheet KQKD:', e)
        }
      }

      let cdktMatrix: unknown[][] | undefined = undefined
      if (cdktSheet) {
        try {
          const res = await window.auditsoft.readWorkbookRows(filePath, cdktSheet.name)
          cdktMatrix = res.rows
        } catch (e) {
          console.warn('Lỗi đọc sheet CDKT:', e)
        }
      }

      // Trích xuất CDFS rows nếu có
      let cdfsParsed: CdfsRowInput[] | undefined = undefined
      if (cdfsRowsRaw) {
        cdfsParsed = parseCdfsRows(cdfsRowsRaw)
      }

      // Trích xuất Benchmark chuẩn từ 4 sheet
      const multiBenchmark = extractBenchmarkFromMultiSheets({
        cdfsRows: cdfsParsed,
        cdktMatrix,
        kqkdMatrix,
        nkcItems: items,
        sheetSources: {
          nkc: nkcSheet.name,
          cdfs: cdfsSheet?.name,
          kqkd: kqkdSheet?.name,
          cdkt: cdktSheet?.name,
        },
      })

      // Tự động đề xuất Benchmark theo VSA 320
      const rec = recommendBenchmark(multiBenchmark)
      setConfig((c) => ({
        ...c,
        benchmark: {
          ...c.benchmark,
          base: rec.recommendedBase,
          percentage: rec.recommendedPercentage,
        },
      }))

      // Cập nhật state
      setLoadedBenchmarks(multiBenchmark)
      setCustomItems(items)
      const total = items.reduce((s, x) => s + Math.abs(x.amount), 0)
      setLoadedInfo({
        name: `${filePath.split(/[\\/]/).pop()} (${nkcSheet.name})`,
        rowCount: items.length,
        totalAmount: total,
        detectedSheets: {
          nkc: nkcSheet.name,
          cdfs: cdfsSheet?.name,
          kqkd: kqkdSheet?.name,
          cdkt: cdktSheet?.name,
        },
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // Xử lý nạp file qua hộp thoại chọn file
  async function handlePickFile(): Promise<void> {
    if (typeof window.auditsoft === 'undefined') return
    try {
      const picked = await window.auditsoft.pickWorkbook()
      if (picked.canceled || !picked.filePath) return
      await loadWorkbookFile(picked.filePath)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  // Xử lý sự kiện Kéo thả file Excel NKC
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
      alert('Không thể nhận diện đường dẫn file kéo thả. Vui lòng sử dụng nút chọn file trực tiếp.')
      return
    }

    if (!isExcelOrCsvPath(path) && !isExcelOrCsvPath(file.name)) {
      alert('Vui lòng kéo thả file Excel (.xlsx, .xlsm, .xls) hoặc CSV kế toán.')
      return
    }

    void loadWorkbookFile(path)
  }
  // Xử lý dán dữ liệu từ Clipboard
  function handleApplyPaste(dataOnly: unknown[][]): void {
    if (dataOnly.length === 0) {
      alert('Không đọc được dữ liệu nào từ clipboard.')
      return
    }

    const auto: ColumnMapping = { date: 0, voucher: 1, description: 2, debit: 3, credit: 4, amount: 5 }
    const std = standardizeSource({
      rows: dataOnly,
      firstDataRowIndex: 0,
      mapping: auto,
    })

    const items: SampleableItem[] = std.entries.map((e, idx) => ({
      id: `paste-${idx + 1}`,
      rowIndex: e.rowIndex,
      displayDate: e.displayDate,
      voucher: e.voucher,
      description: e.description,
      debit: e.debit,
      credit: e.credit,
      amount: e.amount ? Number(e.amount.raw) / Math.pow(10, e.amount.scale) : 0,
    }))

    const total = items.reduce((s, x) => s + Math.abs(x.amount), 0)
    setCustomItems(items)
    setLoadedBenchmarks(null) // Fallback sang tính từ NKC
    setLoadedInfo({
      name: 'Dán từ Clipboard (Dữ liệu trực tiếp)',
      rowCount: items.length,
      totalAmount: total,
    })
    setPasteOpen(false)
  }

  // 2. Tính toán Benchmark totals
  const benchmarkTotals = useMemo<BenchmarkTotals>(() => {
    if (loadedBenchmarks) return loadedBenchmarks
    return calculateBenchmarkTotals(populationItems)
  }, [loadedBenchmarks, populationItems])

  // Gợi ý Benchmark theo chuẩn VSA 320
  const recommendation = useMemo(() => {
    return recommendBenchmark(benchmarkTotals)
  }, [benchmarkTotals])

  // 3. Tự động tính Mức trọng yếu theo Biểu mẫu B - A710 (VSA 320)
  const computedMat = useMemo(() => {
    return computeMateriality(config.benchmark, benchmarkTotals, config.overallMateriality)
  }, [config.benchmark, benchmarkTotals, config.overallMateriality])

  // 4. Lọc tổng thể theo phần hành kiểm toán
  const filteredSectionItems = useMemo(() => {
    return filterBySection(
      populationItems,
      config.section,
      config.customAccountPrefix,
      config.excludeKetChuyen,
    )
  }, [populationItems, config.section, config.customAccountPrefix, config.excludeKetChuyen])

  const activeSection = AUDIT_SECTIONS.find((x) => x.key === config.section)
  const sectionCode = config.section === 'CUSTOM'
    ? (config.customAccountPrefix || 'CUSTOM')
    : (activeSection?.prefixes[0] || 'ALL')

  // 5. Chạy thuật toán 10 bước tính cỡ mẫu chuẩn Working Paper
  const wpResult = useMemo<AuditSamplingWpResult>(() => {
    return calculateAuditSamplingWp({
      sectionName: activeSection?.label.replace(/^\d+\.\s*/, '') || 'Phần hành kiểm toán',
      accountCode: sectionCode,
      periodStr: '01/01 - 31/12/2025',
      items: filteredSectionItems,
      performanceMateriality: computedMat.performanceMateriality,
      itemMaterialityRatio: config.benchmark.pmRatio,
      assuranceLevel: config.confidenceLevel === 95 ? 'HIGH' : config.confidenceLevel === 90 ? 'MEDIUM' : 'LOW',
      clearlyTrivial: computedMat.clearlyTrivial,
    })
  }, [activeSection, sectionCode, filteredSectionItems, computedMat, config.benchmark.pmRatio, config.confidenceLevel])

  // 6. Lọc mẫu hiển thị theo phân loại và tìm kiếm
  const displayedSamples = useMemo(() => {
    let list = wpResult.samples

    if (strategyFilter === 'KCM') {
      list = wpResult.highValueSamples
    } else if (strategyFilter === 'RISK') {
      list = wpResult.riskSamples
    } else if (strategyFilter === 'STEP') {
      list = wpResult.stepJumpSamples
    }

    const q = filterQuery.trim().toUpperCase()
    if (!q) return list

    return list.filter(
      (it) =>
        it.voucher.toUpperCase().includes(q) ||
        it.description.toUpperCase().includes(q) ||
        it.debit.includes(q) ||
        it.credit.includes(q) ||
        it.categoryLabel.includes(q) ||
        it.riskNote.toUpperCase().includes(q),
    )
  }, [wpResult, strategyFilter, filterQuery])

  // 7. Cấu hình cột bảng ảo hóa danh sách mẫu
  const columns: VirtualColumn<SelectedWpSample>[] = [
    { key: 'stt', label: 'STT', width: 55, align: 'center', render: (r) => <strong>#{r.stt}</strong> },
    {
      key: 'categoryLabel',
      label: 'Phân tầng mẫu chọn',
      width: 175,
      render: (r) => {
        if (r.category === 'KCM_HIGH_VALUE') {
          return <span className="badge-stratum key-item">Lớn hơn KCM (Mục 5)</span>
        }
        if (r.category === 'SPECIFIC_RISK') {
          return <span className="badge-stratum risk-item">Mẫu đặc biệt (Mục 6)</span>
        }
        return <span className="badge-stratum mus-item">Bước nhảy (Mục 10)</span>
      },
    },
    {
      key: 'riskNote',
      label: 'Lý do / Căn cứ chọn mẫu',
      width: 220,
      render: (r) => <span className="risk-reason-tag" title={r.riskNote}>{r.riskNote}</span>,
    },
    { key: 'displayDate', label: 'Ngày CT', width: 90, align: 'center' },
    { key: 'voucher', label: 'Số CT / HĐ', width: 120, render: (r) => <strong>{r.voucher}</strong> },
    { key: 'description', label: 'Diễn giải / Nội dung chứng từ', width: 240 },
    { key: 'debit', label: 'TK Nợ', width: 65, align: 'center', render: (r) => <span className="mono bold">{r.debit}</span> },
    { key: 'credit', label: 'TK Có', width: 65, align: 'center', render: (r) => <span className="mono bold">{r.credit}</span> },
    { key: 'amount', label: 'Số tiền phát sinh (VND)', width: 135, align: 'right', render: (r) => <span className="bold">{formatNumber(r.amount)}</span> },
    {
      key: 'foreignAmount',
      label: 'Ngoại tệ (USD)',
      width: 115,
      align: 'right',
      render: (r) => (r.foreignAmount && r.foreignAmount > 0 ? `$${formatNumber(r.foreignAmount)}` : '-'),
    },
    {
      key: 'exchangeRate',
      label: 'Tỷ giá',
      width: 90,
      align: 'right',
      render: (r) => (r.exchangeRate && r.exchangeRate > 0 ? formatNumber(r.exchangeRate) : '-'),
    },
    { key: 'refNotes', label: 'Tham chiếu KTV', width: 160, render: () => <span className="muted italic">[Chờ đối chiếu]</span> },
  ]

  // Chưa nạp dữ liệu -> Hiển thị Dropzone độc lập sạch đẹp, không emoji
  if (populationItems.length === 0) {
    return (
      <div
        className="tab-pane empty-sampling-pane"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className={`empty-sampling-card standalone-sampling-hero ${isDragging ? 'is-dragover' : ''}`}>
          <div className="empty-icon">
            <IconFileSpreadsheet size={48} style={{ color: isDragging ? '#1d4ed8' : '#2563eb' }} />
          </div>
          <h2>Chọn Mẫu Kiểm Toán Độc Lập (VSA 530 & VSA 320)</h2>
          <p className="empty-desc">
            Nạp file Excel kế toán (chứa các sheet <strong>NKC</strong>, <strong>CDFS</strong>, <strong>KQKD</strong>, <strong>CDKT</strong>) để hệ thống tự động bốc tách toàn bộ số dư chuẩn và lấy mẫu kiểm tra chứng từ gốc theo đúng quy trình kiểm toán.
          </p>

          <div className={`sampling-dropzone-box ${isDragging ? 'is-dragover' : ''}`}>
            <div className="dropzone-text-highlight">
              {isDragging ? 'Thả file Excel NKC vào đây ngay…' : 'Kéo & thả file Excel NKC vào đây'}
            </div>
            <div className="dropzone-sub-hint">
              Hỗ trợ file .xlsx, .xlsm, .csv · Tự động nhận diện 4 Sheet kiểm toán
            </div>

            <div className="standalone-upload-box" style={{ marginTop: 14, marginBottom: 0 }}>
              <button
                className="btn btn-primary-nav upload-large-btn"
                disabled={loading}
                onClick={() => void handlePickFile()}
              >
                <IconFileSpreadsheet size={16} style={{ marginRight: 6 }} />
                {loading ? 'Đang đọc file Excel...' : 'Chọn file Excel từ máy tính…'}
              </button>
              <span className="or-tag">hoặc</span>
              <button
                className="btn btn-secondary-nav paste-large-btn"
                onClick={() => setPasteOpen(true)}
              >
                Dán dữ liệu từ Clipboard
              </button>
            </div>
          </div>

          {beforeSource.cfg && (
            <div className="quick-reuse-hint" style={{ marginTop: 18 }}>
              <span>Hoặc sử dụng lại nguồn NKC Trước ({beforeSource.cfg.sheetName}) đã thiết lập ở Bước 1: </span>
              <button
                className="btn btn-reuse-step1"
                onClick={() => {
                  if (result && result.beforeEntries) {
                    setLoadedInfo({
                      name: `Nguồn 1: ${beforeSource.cfg?.filePath.split(/[\\/]/).pop()} (${beforeSource.cfg?.sheetName})`,
                      rowCount: result.beforeEntries.length,
                      totalAmount: Number(result.before.totalAmount.split('|')[1] ?? 0),
                    })
                  } else {
                    useApp.getState().setView('setup')
                  }
                }}
              >
                Sử dụng Nguồn 1
              </button>
            </div>
          )}
        </div>

        <PasteModal
          isOpen={pasteOpen}
          isBefore={true}
          initialText=""
          onClose={() => setPasteOpen(false)}
          onApply={handleApplyPaste}
        />
      </div>
    )
  }

  const currentRange = BENCHMARK_RANGES[config.benchmark.base]
  const dSheets = loadedInfo?.detectedSheets

  return (
    <div
      className="tab-pane sampling-tab-pane"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Floating Drag Overlay khi kéo thả file đè lên trang đã nạp dữ liệu */}
      {isDragging && (
        <div className="sampling-drag-overlay">
          <div className="drag-overlay-card">
            <div className="drag-overlay-icon">
              <IconFileSpreadsheet size={48} />
            </div>
            <div className="drag-overlay-title">Thả file Excel NKC mới vào đây</div>
            <div className="drag-overlay-sub">
              Hệ thống sẽ tự động cập nhật tổng thể và bốc mẫu VSA 530 cho bộ số mới
            </div>
          </div>
        </div>
      )}

      {/* ── CARD 1: Trạng thái nguồn nạp & Nút Xuất Excel GLV ── */}
      <div className="sampling-source-status-card">
        <div className="source-status-left">
          <span className="status-gem">✓</span>
          <div>
            <div className="status-source-title">
              <strong>Sổ NKC Trước kiểm toán:</strong> {loadedInfo?.name || (result ? `Nguồn 1 (${result.before.filePath.split(/[\\/]/).pop()})` : 'Dữ liệu nạp trực tiếp')}
            </div>
            <div className="status-source-sub">
              Tổng thể: <strong>{populationItems.length.toLocaleString('vi-VN')} dòng chứng từ</strong>
              {dSheets && (
                <span className="sheet-detect-pills">
                  · Nhận diện 4 sheet chủ chốt: 
                  {dSheets.nkc && <span className="sheet-tag ok">NKC ({dSheets.nkc})</span>}
                  {dSheets.cdfs && <span className="sheet-tag ok">CDFS ({dSheets.cdfs})</span>}
                  {dSheets.kqkd && <span className="sheet-tag ok">KQKD ({dSheets.kqkd})</span>}
                  {dSheets.cdkt && <span className="sheet-tag ok">CDKT ({dSheets.cdkt})</span>}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="source-status-actions">
          <button
            className="btn btn-change-source"
            disabled={loading}
            onClick={() => void handlePickFile()}
            title="Kéo thả file vào bất kỳ đâu hoặc bấm để chọn file Excel NKC khác"
          >
            Kéo thả / Đổi file Excel…
          </button>
          <button
            className="btn btn-change-source"
            onClick={() => setPasteOpen(true)}
            title="Dán dữ liệu mới từ clipboard"
          >
            Dán lại
          </button>
          <button
            className="btn export-btn export-wp-excel-btn"
            onClick={() => void exportSamplingExcel(wpResult)}
            title="Xuất trọn bộ file Excel gồm Sheet Quy trình chọn mẫu 10 bước và Sheet Danh sách mẫu chọn"
          >
            <IconFileSpreadsheet size={15} style={{ marginRight: 6 }} />
            Xuất Excel Giấy làm việc Chọn Mẫu (VSA 530)
          </button>
        </div>
      </div>

      {/* ── CARD 2: Chọn Phần hành kiểm toán (Tập trung Doanh thu 511 & Tồn kho 151-158) ── */}
      <div className="sampling-section-card">
        <div className="section-card-header">
          <div className="sec-title-group">
            <div className="sec-main-title">Phần hành kiểm toán cần lấy mẫu (Audit Cycle):</div>
            <div className="sec-desc-text">{activeSection?.desc}</div>
          </div>
        </div>

        <div className="section-picker-controls">
          <div className="section-select-box">
            <select
              className="styled-section-dropdown"
              value={config.section}
              onChange={(e) => setConfig((c) => ({ ...c, section: e.target.value as AuditSectionKey }))}
            >
              {AUDIT_SECTIONS.map((sec) => (
                <option key={sec.key} value={sec.key}>
                  {sec.label}
                </option>
              ))}
            </select>
          </div>

          {config.section === 'CUSTOM' && (
            <div className="custom-input-box">
              <input
                className="styled-custom-input"
                placeholder="Nhập đầu TK (VD: 131, 642, 331...)"
                value={config.customAccountPrefix ?? ''}
                onChange={(e) => setConfig((c) => ({ ...c, customAccountPrefix: e.target.value }))}
              />
            </div>
          )}

          <div className="section-stats-pill">
            Tổng thể phần hành: <strong>{filteredSectionItems.length.toLocaleString('vi-VN')} dòng</strong> (Tổng tiền: <strong>{fmtVnd(wpResult.steps.totalAmount.numericValue)}</strong>)
          </div>

          <label className="checkbox-label group-voucher-toggle">
            <input
              type="checkbox"
              checked={config.groupByVoucher !== false}
              onChange={(e) => setConfig((c) => ({ ...c, groupByVoucher: e.target.checked }))}
            />
            <span><strong>Gom các dòng cùng Số chứng từ / Hóa đơn trước khi lấy mẫu</strong> (Khuyên dùng)</span>
          </label>
        </div>
      </div>

      {/* ── CARD 3: BIỂU MẪU B. XÁC ĐỊNH MỨC TRỌNG YẾU (A710 / VSA 320) ── */}
      <div className="sampling-benchmark-card">
        <div className="benchmark-card-header">
          <div className="bench-title-group">
            <div className="bench-main-title">B. Xác định Mức trọng yếu theo Benchmark (Mẫu biểu chuẩn A710 / VSA 320)</div>
            <div className="bench-desc-text">
              {loadedBenchmarks?.sourceType === 'WORKBOOK_4_SHEETS' || loadedBenchmarks?.sourceType === 'CDFS'
                ? 'Đã tự động bốc tách số liệu chuẩn xác từ 4 Sheet chủ chốt (NKC, CDFS, CDKT, KQKD).'
                : 'Chọn 1 trong 4 tiêu chí cơ sở để tự động tính Mức trọng yếu tổng thể (OM), Thực hiện (PM) và Ngưỡng bỏ qua (CTT).'}
            </div>
          </div>
        </div>

        {/* 4 Tiêu chí Benchmark Pills kèm Gợi ý Tự động theo VSA 320 */}
        <div className="benchmark-options-bar">
          <label className={`bench-option-pill ${config.benchmark.base === 'REVENUE' ? 'active' : ''}`}>
            <input
              type="radio"
              name="benchBase"
              checked={config.benchmark.base === 'REVENUE'}
              onChange={() =>
                setConfig((c) => ({
                  ...c,
                  benchmark: { ...c.benchmark, base: 'REVENUE', percentage: 1.0 },
                }))
              }
            />
            <div>
              <div className="bench-opt-name">
                Doanh thu bán hàng (TK 511)
                {recommendation.recommendedBase === 'REVENUE' && (
                  <span className="rec-badge-pill">Khuyên dùng (DN ổn định)</span>
                )}
              </div>
              <div className="bench-opt-val">{fmtVnd(benchmarkTotals.totalRevenue)} [0,5% - 3%]</div>
            </div>
          </label>

          <label className={`bench-option-pill ${config.benchmark.base === 'TOTAL_ASSETS' ? 'active' : ''}`}>
            <input
              type="radio"
              name="benchBase"
              checked={config.benchmark.base === 'TOTAL_ASSETS'}
              onChange={() =>
                setConfig((c) => ({
                  ...c,
                  benchmark: { ...c.benchmark, base: 'TOTAL_ASSETS', percentage: 1.0 },
                }))
              }
            />
            <div>
              <div className="bench-opt-name">
                Tổng tài sản (CĐKT / CĐSPS)
                {recommendation.recommendedBase === 'TOTAL_ASSETS' && (
                  <span className="rec-badge-pill">Khuyên dùng (Thâm dụng TS)</span>
                )}
              </div>
              <div className="bench-opt-val">{fmtVnd(benchmarkTotals.totalAssets)} [1% - 2%]</div>
            </div>
          </label>

          <label className={`bench-option-pill ${config.benchmark.base === 'PROFIT_BEFORE_TAX' ? 'active' : ''}`}>
            <input
              type="radio"
              name="benchBase"
              checked={config.benchmark.base === 'PROFIT_BEFORE_TAX'}
              onChange={() =>
                setConfig((c) => ({
                  ...c,
                  benchmark: { ...c.benchmark, base: 'PROFIT_BEFORE_TAX', percentage: 5.0 },
                }))
              }
            />
            <div>
              <div className="bench-opt-name">LN trước thuế (KQKD)</div>
              <div className="bench-opt-val">
                {fmtVnd(benchmarkTotals.profitBeforeTax)} [5% - 10%]
                {benchmarkTotals.actualProfitRaw != null && benchmarkTotals.actualProfitRaw < 0 && (
                  <span className="loss-tag-small"> (Lỗ: {fmtVnd(benchmarkTotals.actualProfitRaw)})</span>
                )}
              </div>
            </div>
          </label>

          <label className={`bench-option-pill ${config.benchmark.base === 'EQUITY' ? 'active' : ''}`}>
            <input
              type="radio"
              name="benchBase"
              checked={config.benchmark.base === 'EQUITY'}
              onChange={() =>
                setConfig((c) => ({
                  ...c,
                  benchmark: { ...c.benchmark, base: 'EQUITY', percentage: 2.0 },
                }))
              }
            />
            <div>
              <div className="bench-opt-name">
                Vốn đầu tư CSH (TK 411/412)
                {recommendation.recommendedBase === 'EQUITY' && (
                  <span className="rec-badge-pill">Khuyên dùng (DN mới/đầu tư)</span>
                )}
              </div>
              <div className="bench-opt-val">{fmtVnd(benchmarkTotals.totalEquity)} [1% - 5%]</div>
            </div>
          </label>

          <label className={`bench-option-pill ${config.benchmark.base === 'MANUAL' ? 'active' : ''}`}>
            <input
              type="radio"
              name="benchBase"
              checked={config.benchmark.base === 'MANUAL'}
              onChange={() =>
                setConfig((c) => ({
                  ...c,
                  benchmark: { ...c.benchmark, base: 'MANUAL', percentage: 1.0 },
                  overallMateriality: c.overallMateriality || 1_000_000_000,
                }))
              }
            />
            <div style={{ flex: 1 }}>
              <div className="bench-opt-name">Nhập thủ công OM</div>
              {config.benchmark.base === 'MANUAL' ? (
                <div className="manual-om-input-inline" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    className="styled-om-manual-input"
                    value={(config.overallMateriality ?? 1_000_000_000).toLocaleString('vi-VN')}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      const num = raw ? parseInt(raw, 10) : 0
                      setConfig((c) => ({ ...c, overallMateriality: num }))
                    }}
                    placeholder="Nhập số tiền OM..."
                  />
                  <span className="unit-tag">đ</span>
                </div>
              ) : (
                <div className="bench-opt-val">
                  {config.overallMateriality ? fmtVnd(config.overallMateriality) : 'Tùy chỉnh số tiền'}
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Cảnh báo khi chọn LNTT bị lỗ */}
        {computedMat.lossWarning && config.benchmark.base === 'PROFIT_BEFORE_TAX' && (
          <div className="a710-loss-callout">
            <span className="callout-icon">ℹ</span>
            <span>{computedMat.lossWarning}</span>
          </div>
        )}

        {/* Bảng Chi tiết Tính toán Mức trọng yếu chuẩn A710 */}
        <div className="a710-table-wrapper">
          <table className="a710-mat-table">
            <thead>
              <tr>
                <th style={{ width: '37%' }}>Chỉ tiêu xác định mức trọng yếu (A710)</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Mã</th>
                <th style={{ width: '25%', textAlign: 'right' }}>Giá trị thực tế</th>
                <th style={{ width: '30%' }}>Hướng dẫn & Khung tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Giá trị tiêu chí được lựa chọn ({computedMat.baseName})</td>
                <td className="center code-col">(a)</td>
                <td className="num bold">
                  {config.benchmark.base === 'MANUAL' ? (
                    <div className="table-manual-om-wrap">
                      <input
                        type="text"
                        className="table-styled-manual-input"
                        value={(config.overallMateriality ?? 1_000_000_000).toLocaleString('vi-VN')}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '')
                          const num = raw ? parseInt(raw, 10) : 0
                          setConfig((c) => ({ ...c, overallMateriality: num }))
                        }}
                      />
                      <span className="unit-tag">đ</span>
                    </div>
                  ) : (
                    fmtVnd(computedMat.baseAmount)
                  )}
                </td>
                <td className="guide-text">
                  {config.benchmark.base === 'MANUAL'
                    ? 'Nhập trực tiếp số tiền Mức trọng yếu do KTV phán đoán'
                    : loadedBenchmarks?.sourceType === 'WORKBOOK_4_SHEETS' || loadedBenchmarks?.sourceType === 'CDFS'
                      ? 'Tự động lấy từ 4 Sheet chủ chốt (NKC, CDFS, CDKT, KQKD)'
                      : 'Tính từ sổ kế toán trước kiểm toán'}
                </td>
              </tr>
              <tr>
                <td>Điều chỉnh ảnh hưởng của các biến động bất thường</td>
                <td className="center code-col">(b)</td>
                <td className="num">{fmtVnd(computedMat.abnormalAdjustment)}</td>
                <td className="guide-text">Biến động bất thường cần loại trừ (mặc định 0)</td>
              </tr>
              <tr className="subtotal-row">
                <td><strong>Giá trị tiêu chí được lựa chọn sau điều chỉnh</strong></td>
                <td className="center code-col">(c) = (a) - (b)</td>
                <td className="num bold">{fmtVnd(computedMat.adjustedBaseAmount)}</td>
                <td className="guide-text">= (a) - (b)</td>
              </tr>
              <tr>
                <td>
                  Tỷ lệ sử dụng để ước tính mức trọng yếu
                  <span className="hint-pill">{currentRange.label}</span>
                </td>
                <td className="center code-col">(d)</td>
                <td className="num">
                  <div className="rate-input-wrap">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="30"
                      value={config.benchmark.percentage}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          benchmark: { ...c.benchmark, percentage: Math.max(0.1, Number(e.target.value)) },
                        }))
                      }
                    />
                    <span>%</span>
                  </div>
                </td>
                <td className="guide-text">Khung chuẩn: {currentRange.label}</td>
              </tr>
              <tr className="highlight-om-row">
                <td><strong>MỨC TRỌNG YẾU TỔNG THỂ (OM)</strong></td>
                <td className="center code-col">{config.benchmark.base === 'MANUAL' ? '(e) = Thủ công' : '(e) = (c) * (d)'}</td>
                <td className="num bold om-val">
                  {config.benchmark.base === 'MANUAL' ? (
                    <div className="table-manual-om-wrap">
                      <input
                        type="text"
                        className="table-styled-manual-input"
                        value={(config.overallMateriality ?? 1_000_000_000).toLocaleString('vi-VN')}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '')
                          const num = raw ? parseInt(raw, 10) : 0
                          setConfig((c) => ({ ...c, overallMateriality: num }))
                        }}
                      />
                      <span className="unit-tag">đ</span>
                    </div>
                  ) : (
                    fmtVnd(computedMat.overallMateriality)
                  )}
                </td>
                <td className="guide-text">
                  {config.benchmark.base === 'MANUAL'
                    ? 'Mức trọng yếu tổng thể BCTC do KTV nhập thủ công'
                    : 'Mức trọng yếu toàn bộ BCTC'}
                </td>
              </tr>
              <tr>
                <td>Tỷ lệ % ước tính mức trọng yếu thực hiện (PM)</td>
                <td className="center code-col">(f)</td>
                <td className="num">
                  <div className="rate-input-wrap">
                    <input
                      type="number"
                      step="5"
                      min="50"
                      max="75"
                      value={Math.round(config.benchmark.pmRatio * 100)}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          benchmark: { ...c.benchmark, pmRatio: Math.min(0.75, Math.max(0.5, Number(e.target.value) / 100)) },
                        }))
                      }
                    />
                    <span>%</span>
                  </div>
                </td>
                <td className="guide-text">Khung quy định: [50% - 75%] theo VSA 320</td>
              </tr>
              <tr className="highlight-pm-row">
                <td><strong>MỨC TRỌNG YẾU THỰC HIỆN (PM / A710)</strong></td>
                <td className="center code-col">(g) = (e) * (f)</td>
                <td className="num bold pm-val">{fmtVnd(computedMat.performanceMateriality)}</td>
                <td className="guide-text">Ngưỡng kiểm tra 100% (Khoản mục &gt;= PM)</td>
              </tr>
              <tr>
                <td>Tỷ lệ % ngưỡng sai sót không đáng kể (CTT)</td>
                <td className="center code-col">(h)</td>
                <td className="num">
                  <div className="rate-input-wrap">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="10"
                      value={Math.round(config.benchmark.cttRatio * 100)}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          benchmark: { ...c.benchmark, cttRatio: Math.max(0.01, Number(e.target.value) / 100) },
                        }))
                      }
                    />
                    <span>%</span>
                  </div>
                </td>
                <td className="guide-text">Khung quy định: [0% - 4%] hoặc 5%</td>
              </tr>
              <tr className="highlight-ctt-row">
                <td><strong>NGƯỠNG SAI SÓT CÓ THỂ BỎ QUA (CTT)</strong></td>
                <td className="center code-col">(i) = (e) * (h)</td>
                <td className="num bold ctt-val">{fmtVnd(computedMat.clearlyTrivial)}</td>
                <td className="guide-text">Các khoản nhỏ &lt; CTT không cần kiểm tra chi tiết</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CARD 4: BẢNG 10 BƯỚC XÁC ĐỊNH CỠ MẪU & BƯỚC NHẢY ── */}
      <div className="wp-sampling-steps-card">
        <div className="wp-steps-header">
          <div className="wp-steps-title">
            <strong>1. Bảng xác định Cỡ mẫu & Bước nhảy (Quy trình chuẩn VSA 530 / A810)</strong>
          </div>
          <div className="wp-steps-meta">
            <span>Kỳ: <strong>{wpResult.periodStr}</strong></span> · 
            <span>Tài khoản: <strong>TK {wpResult.accountCode}</strong></span> · 
            <span>Mức đảm bảo: <strong>{wpResult.assuranceText} (R = {wpResult.riskFactor})</strong></span>
          </div>
        </div>

        <div className="wp-steps-table-wrapper">
          <table className="wp-10steps-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Chỉ tiêu tính toán cỡ mẫu</th>
                <th style={{ width: '25%', textAlign: 'right' }}>Giá trị tính toán</th>
                <th style={{ width: '30%' }}>Công thức & Hướng dẫn kiểm toán</th>
              </tr>
            </thead>
            <tbody>
              <tr className="highlight-row">
                <td><strong>{wpResult.steps.totalAmount.label}</strong></td>
                <td className="num-val bold">{fmtVnd(wpResult.steps.totalAmount.numericValue)}</td>
                <td className="note-text">{wpResult.steps.totalAmount.note}</td>
              </tr>
              <tr className="highlight-row">
                <td><strong>{wpResult.steps.pmDetailed.label}</strong></td>
                <td className="num-val bold">{fmtVnd(wpResult.steps.pmDetailed.numericValue)}</td>
                <td className="note-text">{wpResult.steps.pmDetailed.note}</td>
              </tr>
              <tr>
                <td className="indent-1"><em>{wpResult.steps.pmRatio.label}</em></td>
                <td className="num-val italic">{wpResult.steps.pmRatio.valueDisplay}</td>
                <td className="note-text">{wpResult.steps.pmRatio.note}</td>
              </tr>
              <tr>
                <td><strong>{wpResult.steps.pmItem.label}</strong></td>
                <td className="num-val bold">{fmtVnd(wpResult.steps.pmItem.numericValue)}</td>
                <td className="note-text"><code>{wpResult.steps.pmItem.formulaStr}</code></td>
              </tr>
              <tr>
                <td><strong>{wpResult.steps.riskFactor.label}</strong></td>
                <td className="num-val bold">{wpResult.steps.riskFactor.valueDisplay}</td>
                <td className="note-text">{wpResult.steps.riskFactor.note}</td>
              </tr>
              <tr className="highlight-kcm">
                <td><strong>{wpResult.steps.kcm.label}</strong></td>
                <td className="num-val bold kcm-val">{fmtVnd(wpResult.steps.kcm.numericValue)}</td>
                <td className="note-text"><code>{wpResult.steps.kcm.formulaStr}</code></td>
              </tr>
              <tr className="sub-header-row">
                <td><strong>{wpResult.steps.highValueItems.label}</strong></td>
                <td className="num-val">{fmtVnd(wpResult.steps.highValueItems.numericValue)}</td>
                <td className="note-text">{wpResult.steps.highValueItems.note}</td>
              </tr>
              <tr className="sub-count-row">
                <td className="indent-1">{wpResult.steps.highValueCount.label}</td>
                <td className="num-val green-count">{wpResult.steps.highValueCount.valueDisplay}</td>
                <td className="note-text">Kiểm tra 100% các nghiệp vụ lớn</td>
              </tr>
              <tr className="sub-header-row">
                <td><strong>{wpResult.steps.riskItems.label}</strong></td>
                <td className="num-val">{fmtVnd(wpResult.steps.riskItems.numericValue)}</td>
                <td className="note-text">{wpResult.steps.riskItems.note}</td>
              </tr>
              <tr className="sub-count-row">
                <td className="indent-1">{wpResult.steps.riskCount.label}</td>
                <td className="num-val green-count">{wpResult.steps.riskCount.valueDisplay}</td>
                <td className="note-text">Cuối kỳ 31/12, tròn số lớn, từ khóa nhạy cảm</td>
              </tr>
              <tr>
                <td><strong>{wpResult.steps.remainingSampleSize.label}</strong></td>
                <td className="num-val bold">{wpResult.steps.remainingSampleSize.valueDisplay}</td>
                <td className="note-text"><code>{wpResult.steps.remainingSampleSize.formulaStr}</code></td>
              </tr>
              <tr className="highlight-total">
                <td><strong>{wpResult.steps.totalSampleSize.label}</strong></td>
                <td className="num-val bold total-sample-val">{wpResult.steps.totalSampleSize.valueDisplay}</td>
                <td className="note-text"><strong>Tổng số mẫu cần kiểm tra thực địa</strong></td>
              </tr>
              <tr>
                <td><strong>{wpResult.steps.remainingTxCount.label}</strong></td>
                <td className="num-val">{wpResult.steps.remainingTxCount.valueDisplay}</td>
                <td className="note-text">{wpResult.steps.remainingTxCount.note}</td>
              </tr>
              <tr className="highlight-step">
                <td><strong>{wpResult.steps.stepJump.label}</strong></td>
                <td className="num-val bold step-val">{wpResult.steps.stepJump.valueDisplay} dòng</td>
                <td className="note-text"><code>{wpResult.steps.stepJump.formulaStr}</code> (Cứ {wpResult.steps.stepJump.numericValue} nghiệp vụ chọn 1 mẫu)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CARD 5: Bộ lọc Chiến lược Lấy mẫu & Danh sách mẫu chọn ── */}
      <div className="toolbar-card sampling-strategy-toolbar">
        <div className="strategy-filter-pills">
          <button
            className={`strat-btn ${strategyFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStrategyFilter('ALL')}
          >
            Tất cả mẫu ({wpResult.samples.length})
          </button>
          <button
            className={`strat-btn key ${strategyFilter === 'KCM' ? 'active' : ''}`}
            onClick={() => setStrategyFilter('KCM')}
          >
            Lớn hơn KCM ({wpResult.highValueSamples.length})
          </button>
          <button
            className={`strat-btn risk ${strategyFilter === 'RISK' ? 'active' : ''}`}
            onClick={() => setStrategyFilter('RISK')}
          >
            Phần tử đặc biệt ({wpResult.riskSamples.length})
          </button>
          <button
            className={`strat-btn mus ${strategyFilter === 'STEP' ? 'active' : ''}`}
            onClick={() => setStrategyFilter('STEP')}
          >
            Bước nhảy ({wpResult.stepJumpSamples.length})
          </button>
        </div>

        <div className="toolbar-search">
          <span className="search-icon"><IconSearch size={15} /></span>
          <input
            placeholder="Tìm theo Số CT, diễn giải, TK Nợ/Có, lý do chọn..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="search-input"
          />
          {filterQuery && (
            <button className="clear-search-btn" onClick={() => setFilterQuery('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Virtualized Table of Selected Samples ── */}
      <VirtualTable
        rows={displayedSamples}
        columns={columns}
        height={460}
        rowClassName={(r) =>
          r.category === 'KCM_HIGH_VALUE'
            ? 'sample-row-key'
            : r.category === 'SPECIFIC_RISK'
              ? 'sample-row-risk'
              : 'sample-row-mus'
        }
      />

      <PasteModal
        isOpen={pasteOpen}
        isBefore={true}
        initialText=""
        onClose={() => setPasteOpen(false)}
        onApply={handleApplyPaste}
      />
    </div>
  )
}
