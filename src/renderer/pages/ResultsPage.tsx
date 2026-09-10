import { useMemo, useState } from 'react'
import { useApp, type TabKey } from '../state/store'
import { useTrialExport } from '../../shared/license'
import { formatDateISO, formatMoney, formatMoneySigned, formatNumber } from '../lib/format'
import { applyMainFilter } from '../../domain/pipeline/mainReport'
import type { DiffRow } from '../../domain/types'
import { AuditDataProfilerBar } from '../components/DataProfiler/AuditDataProfilerBar'
import { profileDiffRows, extractMonthAndDay, TIER_THRESHOLDS } from '../../domain/profiling/dataProfiler'
import { moneyFromJSON } from '../../domain/money'
import {
  IconOverview,
  IconSearch,
  IconLayers,
  IconFileText,
  IconPackage,
  IconAlert,
  IconCheck,
  IconDownload,
  IconFileSpreadsheet,
} from '../components/Icons'
import { VirtualTable, type VirtualColumn } from '../components/VirtualTable'
function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows
    .map((r) => r.map((c) => (/[",\n;]/.test(c) ? `"${c.replaceAll('"', '""')}"` : c)).join(';'))
    .join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function StatCard({
  label,
  value,
  tone,
  subtext,
}: {
  label: string
  value: string
  tone?: 'pos' | 'neg' | 'neutral' | 'warn'
  subtext?: string
}): JSX.Element {
  return (
    <div className={`stat-card ${tone ?? 'neutral'}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
      </div>
      <div className="stat-card-value">{value}</div>
      {subtext && <div className="stat-card-subtext">{subtext}</div>}
    </div>
  )
}

function OverviewTab(): JSX.Element {
  const result = useApp((s) => s.result)!
  const excludeKetChuyen = useApp((s) => s.excludeKetChuyen)
  const filtered = useMemo(() => applyMainFilter(result.diffRows, { excludeKetChuyen }), [result, excludeKetChuyen])
  const s = result.summary
  const isNeg = s.totalDifference.startsWith('-')
  const conclusion = isNeg ? 'Sau ĐC GIẢM tiền' : 'Sau ĐC TĂNG tiền'

  return (
    <div className="tab-pane">
      <div className="pane-header">
        <div>
          <h3>Tổng quan kết quả đối chiếu</h3>
          <p className="muted">
            Tổng hợp dữ liệu so khớp giữa 2 nguồn NKC Trước ({s.lineCountBefore.toLocaleString('vi-VN')} dòng) và NKC Sau ({s.lineCountAfter.toLocaleString('vi-VN')} dòng).
          </p>
        </div>
        <div className="runtime-badge">
          Hoàn tất trong {((result.finishedAt - result.startedAt) / 1000).toFixed(1)}s · Khớp tuyệt đối: {result.matchedEqualCount.toLocaleString('vi-VN')} dòng
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Tổng NKC Trước ĐC"
          value={formatMoney(s.totalBefore)}
          subtext={`${s.lineCountBefore.toLocaleString('vi-VN')} dòng chứng từ`}
        />
        <StatCard
          label="Tổng NKC Sau ĐC"
          value={formatMoney(s.totalAfter)}
          subtext={`${s.lineCountAfter.toLocaleString('vi-VN')} dòng chứng từ`}
        />
        <StatCard
          label={`Tổng Chênh lệch (${conclusion})`}
          value={formatMoneySigned(s.totalDifference)}
          tone={isNeg ? 'neg' : 'pos'}
          subtext={isNeg ? 'Tổng giá trị sau điều chỉnh bị giảm' : 'Tổng giá trị sau điều chỉnh tăng'}
        />
        <StatCard
          label="Dòng chênh lệch phát hiện"
          value={s.diffLineCount.toLocaleString('vi-VN')}
          tone="warn"
          subtext={`Chi tiết sau lọc 911: ${filtered.length.toLocaleString('vi-VN')} dòng`}
        />
      </div>
      <div className="stats-breakdown-card">
        <h4>Chi tiết phân loại chênh lệch:</h4>
        <div className="breakdown-grid">
          <div className="breakdown-item pos">
            <div className="breakdown-badge ok">Thêm sau ĐC</div>
            <div className="breakdown-num">+{s.addedCount.toLocaleString('vi-VN')}</div>
            <div className="breakdown-desc">Bút toán mới chỉ có ở NKC Sau</div>
          </div>
          <div className="breakdown-item neg">
            <div className="breakdown-badge warn2">Xóa sau ĐC</div>
            <div className="breakdown-num">−{s.removedCount.toLocaleString('vi-VN')}</div>
            <div className="breakdown-desc">Bút toán đã bị hủy ở NKC Sau</div>
          </div>
          <div className="breakdown-item warn">
            <div className="breakdown-badge warn">Đổi số tiền</div>
            <div className="breakdown-num">~{s.changedCount.toLocaleString('vi-VN')}</div>
            <div className="breakdown-desc">Cùng số CT nhưng số tiền khác</div>
          </div>
          <div className="breakdown-item neutral">
            <div className="breakdown-badge neutral">Tổng CL sau lọc</div>
            <div className="breakdown-num">{formatMoneySigned(s.filteredTotalDifference)}</div>
            <div className="breakdown-desc">Sau khi trừ các dòng kết chuyển 911</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailTab(): JSX.Element {
  const result = useApp((s) => s.result)!
  const excludeKetChuyen = useApp((s) => s.excludeKetChuyen)
  const query = useApp((s) => s.detailQuery)
  const profilerMonth = useApp((s) => s.profilerMonth)
  const profilerTier = useApp((s) => s.profilerTier)

  const rowsAll = useMemo(() => applyMainFilter(result.diffRows, { excludeKetChuyen }), [result, excludeKetChuyen])
  const rows = useMemo(() => {
    const q = query.trim().toUpperCase()
    let base = rowsAll

    // Lọc theo Tháng / Cutoff 31/12 từ Profiler
    if (profilerMonth !== null) {
      if (profilerMonth === 13) {
        base = base.filter((r) => {
          const { month, day } = extractMonthAndDay(r.dateISO, r.dateDisplay)
          return month === 12 && day === 31
        })
      } else {
        base = base.filter((r) => {
          const { month } = extractMonthAndDay(r.dateISO, r.dateDisplay)
          return month === profilerMonth
        })
      }
    }

    // Lọc theo Tầng giá trị (Tier) từ Profiler
    if (profilerTier !== null) {
      base = base.filter((r) => {
        let rawAmt = 0n
        try {
          const amtAfter = moneyFromJSON(r.amountAfter).raw
          const amtBefore = moneyFromJSON(r.amountBefore).raw
          const diffAmt = moneyFromJSON(r.difference).raw
          const absAfter = amtAfter < 0n ? -amtAfter : amtAfter
          const absBefore = amtBefore < 0n ? -amtBefore : amtBefore
          const absDiff = diffAmt < 0n ? -diffAmt : diffAmt
          rawAmt = absAfter > absBefore ? absAfter : absBefore
          if (rawAmt === 0n) rawAmt = absDiff
        } catch {
          rawAmt = 0n
        }

        if (profilerTier === 'LOW') return rawAmt < TIER_THRESHOLDS.LOW_MAX
        if (profilerTier === 'MEDIUM') return rawAmt >= TIER_THRESHOLDS.LOW_MAX && rawAmt < TIER_THRESHOLDS.MED_MAX
        if (profilerTier === 'HIGH') return rawAmt >= TIER_THRESHOLDS.MED_MAX && rawAmt < TIER_THRESHOLDS.HIGH_MAX
        if (profilerTier === 'KEY_ITEM') return rawAmt >= TIER_THRESHOLDS.HIGH_MAX
        return true
      })
    }

    const sorted = [...base].sort((a, b) => {
      if (a.note !== b.note) return a.note < b.note ? -1 : 1
      const da = a.dateISO ?? '9999'
      const db = b.dateISO ?? '9999'
      if (da !== db) return da < db ? -1 : 1
      return a.stt - b.stt
    })
    if (q === '') return sorted
    return sorted.filter(
      (r) =>
        r.voucher.toUpperCase().includes(q) ||
        r.description.includes(q) ||
        r.debit.includes(q) ||
        r.credit.includes(q),
    )
  }, [rowsAll, query, profilerMonth, profilerTier])
  const columns: VirtualColumn<DiffRow>[] = [
    { key: 'stt', label: 'STT', width: 50, align: 'center', render: (r) => r.stt },
    {
      key: 'nguon',
      label: 'Nguồn',
      width: 120,
      render: (r) => (
        <span className={`badge ${r.kind === 'ADDED_AFTER' ? 'ok' : r.kind === 'REMOVED_AFTER' ? 'warn2' : 'warn'}`}>
          {r.kind === 'ADDED_AFTER' ? '+ Thêm sau ĐC' : r.kind === 'REMOVED_AFTER' ? '− Xóa sau ĐC' : '~ Đổi số tiền'}
        </span>
      ),
    },
    { key: 'dateDisplay', label: 'Ngày CT', width: 95, align: 'center', render: (r) => formatDateISO(r.dateISO, r.loiNgay ? r.loiNgayText : '') },
    { key: 'voucher', label: 'Số chứng từ', width: 115, render: (r) => <strong>{r.voucher}</strong> },
    { key: 'description', label: 'Diễn giải / Nội dung', width: 320 },
    { key: 'debit', label: 'TK Nợ', width: 80, align: 'center', render: (r) => <span className="mono bold">{r.debit}</span> },
    { key: 'credit', label: 'TK Có', width: 80, align: 'center', render: (r) => <span className="mono bold">{r.credit}</span> },
    { key: 'amountAfter', label: 'Sau điều chỉnh', width: 125, align: 'right', render: (r) => formatMoney(r.amountAfter) },
    { key: 'amountBefore', label: 'Trước điều chỉnh', width: 125, align: 'right', render: (r) => formatMoney(r.amountBefore) },
    { key: 'difference', label: 'Chênh lệch', width: 120, align: 'right', render: (r) => <span className={r.difference.includes('-') ? 'text-neg' : 'text-pos'}>{formatMoneySigned(r.difference)}</span> },
    { key: 'note', label: 'Nhận xét nguyên nhân', width: 260 },
    { key: 'priority', label: 'Ưu tiên xử lý', width: 160 },
  ]

  return (
    <div className="tab-pane">
      <div className="toolbar-card">
        <div className="toolbar-search">
          <span className="search-icon"><IconSearch size={14} /></span>
          <input
            placeholder="Tìm nhanh theo Số CT, diễn giải, tài khoản Nợ/Có…"
            value={query}
            onChange={(e) => useApp.getState().setDetailQuery(e.target.value)}
            className="search-input"
          />
          {query && (
            <button className="clear-search-btn" onClick={() => useApp.getState().setDetailQuery('')}>
              ✕
            </button>
          )}
        </div>
        <div className="toolbar-stats">
          <span className="count-pill">
            Hiển thị <strong>{rows.length.toLocaleString('vi-VN')}</strong> / {rowsAll.length.toLocaleString('vi-VN')} dòng
          </span>
          <button
            className="btn secondary small export-csv-btn"
            onClick={() =>
              downloadCsv('chi-tiet-chenh-lech.csv', [
                ['STT', 'Nguồn', 'Ngày', 'Số chứng từ', 'Diễn giải', 'TK Nợ', 'TK Có', 'Sau điều chỉnh', 'Trước điều chỉnh', 'Chênh lệch', 'Nhận xét'],
                ...rows.map((r) => [
                  String(r.stt),
                  r.kind,
                  formatDateISO(r.dateISO),
                  r.voucher,
                  r.description,
                  r.debit,
                  r.credit,
                  formatMoney(r.amountAfter),
                  formatMoney(r.amountBefore),
                  formatMoney(r.difference),
                  r.note,
                ]),
              ])
            }
          >
            <IconDownload size={13} style={{ marginRight: 5, verticalAlign: '-1px' }} /> Xuất CSV
          </button>
        </div>
      </div>

      <VirtualTable
        rows={rows}
        columns={columns}
        height={500}
        rowClassName={(r) =>
          r.kind === 'ADDED_AFTER' ? 'row-added' : r.kind === 'REMOVED_AFTER' ? 'row-removed' : 'row-changed'
        }
      />

      <div className="legend-bar">
        <span className="legend-title">Ghi chú:</span>
        <span className="chip added"><span className="legend-dot added"></span> Thêm sau ĐC (Bút toán mới)</span>
        <span className="chip removed"><span className="legend-dot removed"></span> Xóa sau ĐC (Bút toán đã hủy)</span>
        <span className="chip changed"><span className="legend-dot changed"></span> Đổi số tiền (Sai lệch giá trị)</span>
      </div>
    </div>
  )
}

function GroupsTab(): JSX.Element {
  const result = useApp((s) => s.result)!
  const g = result.entryTypeSummary
  return (
    <div className="tab-pane">
      <div className="stats-grid compact">
        <StatCard label="Dòng chi tiết sau lọc" value={g.filteredLineCount.toLocaleString('vi-VN')} />
        <StatCard label="Số loại bút toán sau gom" value={g.groupCount.toLocaleString('vi-VN')} tone="pos" />
        <StatCard label="Số dòng đã gom bớt" value={g.collapsedLines.toLocaleString('vi-VN')} />
        <StatCard label="Tổng Sau ĐC" value={formatMoney(g.totalAfter)} />
        <StatCard label="Tổng Trước ĐC" value={formatMoney(g.totalBefore)} />
        <StatCard label="Tổng Chênh lệch" value={formatMoneySigned(g.totalDifference)} tone="neg" />
      </div>

      <VirtualTable
        rows={result.groups}
        height={480}
        columns={[
          { key: 'stt', label: 'STT', width: 48, align: 'center' },
          {
            key: 'phanHanh',
            label: 'Phần hành kiểm toán',
            width: 200,
            render: (x) => <strong>{`${String(x.phanHanhId).padStart(2, '0')} - ${x.phanHanhName}`}</strong>,
          },
          { key: 'key', label: 'Nhóm TK (Nợ|Có)', width: 140, render: (x) => <span className="mono bold">{x.key}</span> },
          { key: 'sources', label: 'Nguồn', width: 160, render: (x) => x.sources.join(', ') },
          { key: 'detailCount', label: 'Số dòng', width: 75, align: 'right' },
          { key: 'distinctVoucherCount', label: 'Số CT', width: 75, align: 'right' },
          { key: 'repVoucher', label: 'CT đại diện', width: 115 },
          { key: 'repDescription', label: 'Diễn giải đại diện', width: 280 },
          { key: 'sumAfter', label: 'Tổng Sau ĐC', width: 130, align: 'right', render: (x) => formatMoney(x.sumAfter) },
          { key: 'sumBefore', label: 'Tổng Trước ĐC', width: 130, align: 'right', render: (x) => formatMoney(x.sumBefore) },
          { key: 'sumDifference', label: 'Chênh lệch', width: 125, align: 'right', render: (x) => <span className={x.sumDifference.includes('-') ? 'text-neg' : 'text-pos'}>{formatMoneySigned(x.sumDifference)}</span> },
          { key: 'note', label: 'Nhận xét', width: 200 },
        ]}
      />
    </div>
  )
}

function InventoryTab(): JSX.Element {
  const result = useApp((s) => s.result)!
  return (
    <div className="tab-pane">
      <div className="pane-header">
        <div>
          <h3>Bảng tổng hợp điều chỉnh tồn kho (TK 152 – 158)</h3>
          <p className="muted">Chi tiết các biến động nhập / xuất / điều chỉnh số dư nguyên vật liệu, thành phẩm, hàng hóa.</p>
        </div>
      </div>

      <div className="styled-table-card">
        <table className="styled-table">
          <thead>
            <tr>
              <th style={{ width: 140 }}>Nhóm Tài khoản</th>
              <th className="num">Ghi Nợ tăng (+)</th>
              <th className="num">Ghi Có giảm (−)</th>
              <th className="num">Net biến động</th>
              <th className="num">Tổng gộp |Chênh lệch|</th>
            </tr>
          </thead>
          <tbody>
            {result.inventory.map((r) => (
              <tr key={r.group} className={r.isTotal ? 'total-row' : undefined}>
                <td><strong>{r.group}</strong></td>
                <td className="num">{formatMoney(r.ghiNo)}</td>
                <td className="num">{formatMoney(r.ghiCo)}</td>
                <td className="num bold">{formatMoneySigned(r.net)}</td>
                <td className="num">{formatMoney(r.gross)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ErrorsTab(): JSX.Element {
  const result = useApp((s) => s.result)!
  return (
    <div className="tab-pane">
      <div className="pane-header">
        <div>
          <h3>Dòng dữ liệu lỗi / Bị loại khỏi phân tích</h3>
          <p className="muted">Các dòng chứng từ có ngày không hợp lệ, số tiền bằng 0, hoặc thiếu thông tin cần thiết.</p>
        </div>
      </div>

      <VirtualTable
        rows={result.errors}
        height={520}
        columns={[
          { key: 'source', label: 'Nguồn', width: 130, render: (x) => (x.source === 'BEFORE' ? '① Trước ĐC' : '② Sau ĐC') },
          { key: 'rowIndex', label: 'Dòng file', width: 90, align: 'right', render: (x) => `#${x.rowIndex}` },
          { key: 'displayDate', label: 'Ngày CT', width: 100 },
          { key: 'voucher', label: 'Số chứng từ', width: 120 },
          { key: 'description', label: 'Diễn giải', width: 320 },
          { key: 'debit', label: 'TK Nợ', width: 80, align: 'center', render: (x) => <span className="mono">{x.debit}</span> },
          { key: 'credit', label: 'TK Có', width: 80, align: 'center', render: (x) => <span className="mono">{x.credit}</span> },
          { key: 'errors', label: 'Mô tả lỗi', width: 380, render: (x) => <span className="error-text">{x.errors.join('; ')}</span> },
        ]}
      />
    </div>
  )
}

function WorkingPaperTab(): JSX.Element {
  const bctc = useApp((s) => s.result)!.bctc
  const t = bctc.totals
  const [showAggregated, setShowAggregated] = useState(true)

  const lines = showAggregated ? bctc.workingPaperLines : (bctc.detailedWorkingPaperLines ?? bctc.workingPaperLines)

  return (
    <div className="tab-pane wp-tab-pane">
      {/* ── Balance Check Stats ── */}
      <div className="wp-check-grid">
        <div className="wp-check-card">
          <div className="check-label">Tài sản (TS) Biến động</div>
          <div className="check-values">
            <span className="ts-pos">Tăng: {t.tongTaiSanTang.toLocaleString('vi-VN')}</span>
            <span className="ts-sep">/</span>
            <span className="ts-neg">Giảm: {t.tongTaiSanGiam.toLocaleString('vi-VN')}</span>
          </div>
        </div>

        <div className="wp-check-card">
          <div className="check-label">Nguồn vốn (NV) Biến động</div>
          <div className="check-values">
            <span className="nv-pos">Tăng: {t.tongNguonVonTang.toLocaleString('vi-VN')}</span>
            <span className="nv-sep">/</span>
            <span className="nv-neg">Giảm: {t.tongNguonVonGiam.toLocaleString('vi-VN')}</span>
          </div>
        </div>

        <div className={`wp-check-card ${t.canDoiToanBang ? 'balanced' : 'unbalanced'}`}>
          <div className="check-label">Cân đối CĐKT (ΔTS − ΔNV)</div>
          <div className="check-main-val">
            {t.canDoiToanBang ? (
              <span className="balanced-label"><IconCheck size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> CÂN ĐỐI (0)</span>
            ) : (
              <span className="unbalanced-label">LỆCH {t.chenhLechCanDoi.toLocaleString('vi-VN')}</span>
            )}
          </div>
        </div>

        <div className="wp-check-card">
          <div className="check-label">Ảnh hưởng LN thuần (KQKD)</div>
          <div className={`check-main-val ${t.anhHuongLoiNhuanThuan >= 0 ? 'text-pos' : 'text-neg'}`}>
            {(t.anhHuongLoiNhuanThuan >= 0 ? '+' : '') + t.anhHuongLoiNhuanThuan.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>

      {/* ── View Toggle Bar (Cộng gộp vs Chi tiết) ── */}
      <div className="wp-view-toggle-bar">
        <div className="wp-toggle-left">
          <label className="view-mode-toggle">
            <input
              type="checkbox"
              checked={showAggregated}
              onChange={(e) => setShowAggregated(e.target.checked)}
            />
            <span className="toggle-switch-slider"></span>
            <span className="toggle-text">
              <strong>Cộng gộp bút toán theo nhóm Cặp TK & Chỉ tiêu</strong> (Chuẩn Working Paper kiểm toán)
            </span>
          </label>
        </div>
        <div className="wp-toggle-right">
          <span className="row-counter-badge">
            {showAggregated
              ? `Đã cộng gộp thành ${lines.filter((l) => l.isFirstLineOfEntry).length} bút toán tổng hợp`
              : `Hiển thị chi tiết ${lines.filter((l) => l.isFirstLineOfEntry).length} bút toán`}
          </span>
        </div>
      </div>

      {/* ── Working Paper Table ── */}
      <div className="wp-table-scroll-container">
        <table className="wp-audit-table">
          <thead>
            <tr className="wp-row-1">
              <th rowSpan={3} className="th-stt">TT</th>
              <th rowSpan={3} className="th-glv">Tham chiếu<br />giấy làm việc</th>
              <th rowSpan={3} className="th-desc">NỘI DUNG</th>
              <th rowSpan={3} className="th-tk">TK NỢ</th>
              <th rowSpan={3} className="th-tk">TK CÓ</th>
              <th rowSpan={3} className="th-amount">SỐ PS</th>
              <th colSpan={5} className="th-cdkt-main">ẢNH HƯỞNG CĐKT</th>
              <th colSpan={3} className="th-kqkd-main">ẢNH HƯỞNG KQKD</th>
            </tr>
            <tr className="wp-row-2">
              <th rowSpan={2} className="th-sub-item th-cdkt-item">Chỉ tiêu</th>
              <th colSpan={2} className="th-ts-group">Tài sản</th>
              <th colSpan={2} className="th-nv-group">Nguồn vốn</th>
              <th rowSpan={2} className="th-sub-item th-kqkd-item">Chỉ tiêu</th>
              <th colSpan={2} className="th-kqkd-group">Biến động</th>
            </tr>
            <tr className="wp-row-3">
              <th className="th-sub-col ts-col">Tăng</th>
              <th className="th-sub-col ts-col">Giảm</th>
              <th className="th-sub-col nv-col">Tăng</th>
              <th className="th-sub-col nv-col">Giảm</th>
              <th className="th-sub-col kqkd-col">Tăng</th>
              <th className="th-sub-col kqkd-col">Giảm</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={14} className="wp-empty-cell">
                  Không có bút toán điều chỉnh nào phát sinh trong kỳ đối chiếu này.
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => (
                <tr key={idx} className={line.isFirstLineOfEntry ? 'wp-entry-first' : 'wp-entry-sub'}>
                  <td className="center stt-cell">{line.stt}</td>
                  <td className="center glv-cell">{line.glv}</td>
                  <td className="left desc-cell">{line.noiDung}</td>
                  <td className="center mono tk-cell">{line.tkNo}</td>
                  <td className="center mono tk-cell">{line.tkCo}</td>
                  <td className="num bold amount-cell">{line.soPS != null ? formatNumber(line.soPS) : ''}</td>

                  <td className="left item-cell">{line.cdktChiTieu}</td>
                  <td className="num">{formatNumber(line.tsTang)}</td>
                  <td className="num">{formatNumber(line.tsGiam)}</td>
                  <td className="num">{formatNumber(line.nvTang)}</td>
                  <td className="num">{formatNumber(line.nvGiam)}</td>

                  <td className="left item-cell kqkd-item">{line.kqkdChiTieu}</td>
                  <td className="num">{formatNumber(line.kqkdTang)}</td>
                  <td className="num">{formatNumber(line.kqkdGiam)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TABS: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: 'overview', label: 'Tổng quan', icon: <IconOverview size={15} /> },
  { key: 'detail', label: 'Chi tiết chênh lệch', icon: <IconSearch size={15} /> },
  { key: 'groups', label: 'Loại bút toán', icon: <IconLayers size={15} /> },
  { key: 'bctc', label: 'Bút toán điều chỉnh (B360)', icon: <IconFileText size={15} /> },
  { key: 'inventory', label: 'Tồn kho (152–158)', icon: <IconPackage size={15} /> },
  { key: 'errors', label: 'Lỗi dữ liệu', icon: <IconAlert size={15} /> },
]

export function ResultsPage(): JSX.Element {
  const result = useApp((s) => s.result)!
  const tab = useApp((s) => s.tab)
  const setTab = useApp((s) => s.setTab)
  const [_error, setError] = useState<string | null>(null)
  const [_running, setRunning] = useState(false)
  const excludeKetChuyen = useApp((s) => s.excludeKetChuyen)
  const toggle = useApp((s) => s.toggleExcludeKetChuyen)
  const profilerMonth = useApp((s) => s.profilerMonth)
  const profilerTier = useApp((s) => s.profilerTier)
  const profilerOpen = useApp((s) => s.profilerOpen)

  const profileSummary = useMemo(() => {
    if (!result) return null
    return profileDiffRows(result.diffRows)
  }, [result])

  async function exportXlsx(): Promise<void> {
    if (typeof window.auditsoft === 'undefined') {
      setError('Không kết nối được hệ thống — vui lòng khởi động app qua 2-Chay-App.bat.')
      return
    }

    const trialCheck = useTrialExport()
    if (!trialCheck.allowed) {
      setError(trialCheck.message)
      useApp.getState().setLicenseModalOpen(true)
      useApp.getState().refreshTrialStatus()
      return
    }

    try {
      setRunning(true)
      const d = new Date()
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      const res = await window.auditsoft.exportReport({
        suggestedName: `DoiChieu-NKC-${stamp}.xlsx`,
        excludeKetChuyen,
        result,
      })
      if (!res.ok) {
        setError('Đã hủy xuất file.')
      } else {
        setError(null)
      }
      useApp.getState().refreshTrialStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="page results-page">
      {/* ── Top Action & Filter Header ── */}
      <div className="results-top-header">
        <label className="filter-toggle">
          <input type="checkbox" checked={excludeKetChuyen} onChange={toggle} />
          <span className="toggle-label">Loại các bút toán có diễn giải chứa <strong>“KẾT CHUYỂN”</strong></span>
        </label>

        <div className="header-action-group">
          <button
            className="btn btn-switch-source"
            onClick={() => useApp.getState().setView('setup')}
            title="Quay lại màn hình chọn nguồn để đổi file hoặc chỉnh mapping"
          >
            Đổi nguồn NKC
          </button>
          <button
            className="btn btn-new-reconcile"
            onClick={() => useApp.getState().resetAll()}
            title="Xóa dữ liệu hiện tại để đối chiếu cặp NKC mới hoàn toàn"
          >
            Nạp cặp NKC mới
          </button>
          <button
            className="btn export-btn"
            disabled={useApp.getState().running}
            onClick={() => void exportXlsx()}
          >
            <IconFileSpreadsheet size={15} style={{ marginRight: 6, verticalAlign: '-2px' }} />
            Xuất Báo Cáo Excel (8 sheet)
          </button>
        </div>
      </div>
      {/* ── Visual Data Profiler & Risk Analyzer (Power Query Style) ── */}
      {profileSummary && (
        <AuditDataProfilerBar
          summary={profileSummary}
          selectedMonth={profilerMonth}
          selectedTier={profilerTier}
          onSelectMonth={(m) => {
            useApp.getState().setProfilerMonth(m)
            if (tab !== 'detail') setTab('detail')
          }}
          onSelectTier={(t) => {
            useApp.getState().setProfilerTier(t)
            if (tab !== 'detail') setTab('detail')
          }}
          onClearFilters={() => useApp.getState().clearProfilerFilter()}
          isOpen={profilerOpen}
          onToggleOpen={() => useApp.getState().setProfilerOpen(!profilerOpen)}
        />
      )}


      {/* ── Modern Navigation Tabs ── */}
      <div className="results-tabs">
        {TABS.map((t) => {
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <span className="tab-icon">{t.icon}</span>
              <span className="tab-text">{t.label}</span>
              {t.key === 'detail' && (
                <span className="tab-badge">{result.diffRows.length.toLocaleString('vi-VN')}</span>
              )}
              {t.key === 'errors' && result.errors.length > 0 && (
                <span className="tab-badge error">{result.errors.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Active Tab Content ── */}
      <div className="tab-content-area">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'detail' && <DetailTab />}
        {tab === 'groups' && <GroupsTab />}
        {tab === 'bctc' && <WorkingPaperTab />}
        {tab === 'inventory' && <InventoryTab />}
        {tab === 'errors' && <ErrorsTab />}
      </div>
    </div>
  )
}
