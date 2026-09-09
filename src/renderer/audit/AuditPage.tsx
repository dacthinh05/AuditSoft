import { useMemo, useState } from 'react'
import type { AnalysisResult, AuditFinding, JournalRowDTO } from '../../shared/types/analytics'
import { analyzeExpenseVariance } from '../../shared/utils/expenseVariance'
import { VirtualTable } from '../components/VirtualTable'
import {
  IconSearch,
  IconFolder,
  IconAlert,
  IconOverview,
  IconFileSpreadsheet,
} from '../components/Icons'

type Tab = 'risks' | 'journals' | 'accounts' | 'pairs' | 'monthly' | 'recon' | 'kqkd' | 'chiphi'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'risks', label: 'Rủi ro phát hiện', icon: '🎯' },
  { key: 'journals', label: 'Bút toán kiểm toán', icon: '📋' },
  { key: 'accounts', label: 'Bảng Tài khoản', icon: '🏛' },
  { key: 'pairs', label: 'Cặp TK đối ứng', icon: '🔄' },
  { key: 'monthly', label: 'Biến động 12 Tháng', icon: '📅' },
  { key: 'recon', label: 'Đối chiếu Sổ cái & CDFS', icon: '⚖' },
  { key: 'kqkd', label: 'Báo cáo KQKD', icon: '📈' },
  { key: 'chiphi', label: 'Biến động chi phí', icon: '📉' },
]

const LEVEL_CLASS: Record<string, string> = {
  CRITICAL: 'au-badge-crit',
  HIGH: 'au-badge-high',
  MEDIUM: 'au-badge-med',
  LOW: 'au-badge-low',
  INFO: 'au-badge-info',
}

const LEVEL_VN: Record<string, string> = {
  CRITICAL: 'Nghiêm trọng',
  HIGH: 'Rủi ro Cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
  INFO: 'Thông tin',
}

function fmtVnd(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '-'
  return Math.round(v).toLocaleString('vi-VN')
}

function fmtPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '-'
  return `${(v * 100).toFixed(1).replace('.', ',')}%`
}

interface Props {
  bridge: NonNullable<Window['auditsoft']>
}

export function AuditPage({ bridge }: Props): JSX.Element {
  const [filePath, setFilePath] = useState('')
  const [om, setOm] = useState('1000000000')
  const [pm, setPm] = useState('750000000')
  const [ctt, setCtt] = useState('50000000')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [tab, setTab] = useState<Tab>('risks')
  const [activeFinding, setActiveFinding] = useState<AuditFinding | null>(null)
  const [focusIds, setFocusIds] = useState<Set<string> | null>(null)
  const [query, setQuery] = useState('')

  async function pickAndAnalyze(): Promise<void> {
    setError(null)
    try {
      const picked = await bridge.pickWorkbook()
      if (picked.canceled || !picked.filePath) return
      setFilePath(picked.filePath)
      setRunning(true)
      const res = await bridge.auditAnalyze({
        filePath: picked.filePath,
        overall: Number(om) || undefined,
        performance: Number(pm) || undefined,
        clearlyTrivial: Number(ctt) || undefined,
        fiscalYear: Number(year) || undefined,
      })
      setResult(res)
      setActiveFinding(res.findings[0] ?? null)
      setTab('risks')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  async function exportReport(): Promise<void> {
    if (!filePath) return
    try {
      const res = await bridge.auditExport({
        filePath,
        overall: Number(om) || undefined,
        performance: Number(pm) || undefined,
        clearlyTrivial: Number(ctt) || undefined,
        fiscalYear: Number(year) || undefined,
      })
      if (res.ok) setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const counts = useMemo(() => {
    const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 }
    for (const f of result?.findings ?? []) c[f.riskLevel]++
    return c
  }, [result])

  const journalsFiltered = useMemo(() => {
    let rows: JournalRowDTO[] = result?.journals ?? []
    if (focusIds) rows = rows.filter((j) => focusIds.has(j.id))
    const q = query.trim().toUpperCase()
    if (q !== '') {
      rows = rows.filter(
        (j) =>
          j.doc?.toUpperCase().includes(q) ||
          j.desc.toUpperCase().includes(q) ||
          j.debit.includes(q) ||
          j.credit.includes(q),
      )
    }
    return rows
  }, [result, focusIds, query])

  function showEvidence(f: AuditFinding): void {
    if (!f.evidence.journalEntryIds?.length) return
    setFocusIds(new Set(f.evidence.journalEntryIds))
    setQuery('')
    setTab('journals')
  }

  return (
    <div className="page au-page-container">
      {/* ── Top Control & Setup Card ── */}
      <div className="au-control-panel">
        <div className="au-control-head">
          <div className="au-title-group">
            <div className="au-icon-badge">
              <IconOverview size={20} />
            </div>
            <div>
              <h2 className="au-title">Phân tích Rủi ro & Soát xét Hồ sơ Kiểm toán</h2>
              <p className="au-subtitle">
                Quét tự động Sổ cái, Bảng Cân đối phát sinh (CDFS), KQKD theo chuẩn kiểm toán VSA 240 / 315 / 520
              </p>
            </div>
          </div>

          <div className="au-head-actions">
            <button
              className="btn btn-au-primary"
              disabled={running}
              onClick={() => void pickAndAnalyze()}
            >
              <IconFolder size={15} style={{ marginRight: 6 }} />
              {running ? 'Đang phân tích dữ liệu…' : '1. Chọn Workbook & Phân tích'}
            </button>
            <button
              className="btn btn-au-export"
              disabled={!result || running}
              onClick={() => void exportReport()}
            >
              <IconFileSpreadsheet size={15} style={{ marginRight: 6 }} />
              Xuất Báo cáo Excel (8 Sheet)
            </button>
          </div>
        </div>

        {/* Parameter Inputs Grid */}
        <div className="au-params-grid">
          <div className="au-param-card">
            <label className="param-label" title="Mức sai sót trọng yếu cho toàn bộ BCTC">
              Mức trọng yếu tổng thể (OM):
            </label>
            <input
              type="number"
              className="styled-input param-input"
              value={om}
              onChange={(e) => setOm(e.target.value)}
            />
            <span className="param-hint">{(Number(om) || 0).toLocaleString('vi-VN')} VNĐ</span>
          </div>

          <div className="au-param-card">
            <label className="param-label" title="Ngưỡng kiểm tra chi tiết (thường 50-75% OM)">
              Mức trọng yếu thực hiện (PM):
            </label>
            <input
              type="number"
              className="styled-input param-input"
              value={pm}
              onChange={(e) => setPm(e.target.value)}
            />
            <span className="param-hint">{(Number(pm) || 0).toLocaleString('vi-VN')} VNĐ</span>
          </div>

          <div className="au-param-card">
            <label className="param-label" title="Ngưỡng sai sót có thể bỏ qua">
              Ngưỡng sai sót bỏ qua (CTT):
            </label>
            <input
              type="number"
              className="styled-input param-input"
              value={ctt}
              onChange={(e) => setCtt(e.target.value)}
            />
            <span className="param-hint">{(Number(ctt) || 0).toLocaleString('vi-VN')} VNĐ</span>
          </div>

          <div className="au-param-card">
            <label className="param-label" title="Năm tài chính của hồ sơ đang phân tích">
              Năm tài chính:
            </label>
            <input
              type="number"
              className="styled-input param-input"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <span className="param-hint">Niên độ {year}</span>
          </div>
        </div>

        {filePath && (
          <div className="au-loaded-file-bar">
            <span className="file-tag">Workbook đang chọn:</span>
            <span className="file-name">{filePath}</span>
          </div>
        )}
      </div>

      {/* Global Error */}
      {error != null && (
        <div className="au-error-banner">
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State when no workbook loaded */}
      {result == null && error == null && !running && (
        <div className="au-empty-state-card" onClick={() => void pickAndAnalyze()}>
          <div className="empty-state-inner">
            <div className="empty-icon-circle">
              <IconFolder size={32} />
            </div>
            <div className="empty-title">Chưa có dữ liệu phân tích rủi ro</div>
            <p className="empty-desc">
              Bấm nút <strong>“1. Chọn Workbook & Phân tích”</strong> để nạp file Excel kiểm toán (chứa sheet CDFS, Sổ cái NKC, KQKD). Hệ thống sẽ tự động quét rủi ro gian lận, phát hiện bút toán bất thường và đối chiếu cân đối số phát sinh.
            </p>
            <button type="button" className="btn btn-au-primary" style={{ marginTop: 8 }}>
              Chọn file Excel ngay…
            </button>
          </div>
        </div>
      )}

      {/* Main Analysis Results */}
      {result != null && (
        <div className="au-results-container">
          {/* KPI Summary Cards Grid */}
          <div className="au-kpi-grid">
            <div className="au-kpi-card">
              <div className="kpi-label">Hồ sơ file</div>
              <div className="kpi-val file-val" title={result.fileName}>{result.fileName}</div>
              <div className="kpi-sub">Chất lượng: <strong>{result.quality?.score ?? '-'}%</strong></div>
            </div>

            <div className="au-kpi-card">
              <div className="kpi-label">Tổng bút toán NKC</div>
              <div className="kpi-val">{fmtVnd(result.journalsTotal)}</div>
              <div className="kpi-sub">{result.journals.length.toLocaleString('vi-VN')} dòng chứng từ</div>
            </div>

            <div className={`au-kpi-card ${result.balanced ? 'kpi-balanced' : 'kpi-unbalanced'}`}>
              <div className="kpi-label">Cân đối Sổ cái & CDFS</div>
              <div className="kpi-val">
                {result.balanced ? '✓ CÂN ĐỐI' : '⚠ LỆCH'}
              </div>
              <div className="kpi-sub">{result.balanced ? 'Khớp tuyệt đối' : 'Phát hiện chênh lệch'}</div>
            </div>

            <div className="au-kpi-card kpi-crit">
              <div className="kpi-label">Nghiêm trọng</div>
              <div className="kpi-val">{counts.CRITICAL}</div>
              <div className="kpi-sub">Cần giải trình ngay</div>
            </div>

            <div className="au-kpi-card kpi-high">
              <div className="kpi-label">Rủi ro Cao</div>
              <div className="kpi-val">{counts.HIGH}</div>
              <div className="kpi-sub">Trọng yếu VSA 315</div>
            </div>

            <div className="au-kpi-card kpi-med">
              <div className="kpi-label">Trung bình</div>
              <div className="kpi-val">{counts.MEDIUM}</div>
              <div className="kpi-sub">Cần xem chứng từ</div>
            </div>

            <div className="au-kpi-card kpi-low">
              <div className="kpi-label">Thấp / Thông tin</div>
              <div className="kpi-val">{counts.LOW + counts.INFO}</div>
              <div className="kpi-sub">Lưu ý hồ sơ</div>
            </div>
          </div>

          {result.needsReview.length > 0 && (
            <div className="au-review-notice">
              <IconAlert size={15} />
              <span>Cần xem lại cách nhận diện sheet: {result.needsReview.map((n) => n.sheetName).join(', ')}</span>
            </div>
          )}

          {/* Sub Navigation Tabs */}
          <div className="au-tabs-bar">
            {TABS.map((t) => {
              const isActive = tab === t.key
              return (
                <button
                  key={t.key}
                  className={`au-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  <span className="tab-icon-mini">{t.icon}</span>
                  <span className="tab-label-text">{t.label}</span>
                  {t.key === 'risks' && result.findings.length > 0 && (
                    <span className="au-tab-badge crit">{result.findings.length}</span>
                  )}
                  {t.key === 'journals' && (
                    <span className="au-tab-badge">{journalsFiltered.length.toLocaleString('vi-VN')}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Active Tab Pane Content */}
          <div className="au-tab-content">
            {/* Tab 1: Risks - Split View */}
            {tab === 'risks' && (
              <div className="au-split-view">
                <div className="au-findings-list">
                  <VirtualTable
                    rows={result.findings}
                    height={520}
                    rowClassName={(f) => (activeFinding?.id === f.id ? 'au-finding-active-row' : '')}
                    onRowClick={(f) => setActiveFinding(f)}
                    columns={[
                      {
                        key: 'riskLevel',
                        label: 'Mức độ',
                        width: 105,
                        render: (f) => (
                          <span className={`au-badge ${LEVEL_CLASS[f.riskLevel]}`}>
                            {LEVEL_VN[f.riskLevel] ?? f.riskLevel}
                          </span>
                        ),
                      },
                      { key: 'title', label: 'Rủi ro phát hiện', width: 320, render: (f) => <strong>{f.title}</strong> },
                      { key: 'category', label: 'Khu vực', width: 130 },
                      { key: 'score', label: 'Điểm', width: 60, align: 'right' },
                      {
                        key: '_ev',
                        label: 'Bằng chứng',
                        width: 100,
                        render: (f) =>
                          f.evidence.journalEntryIds?.length
                            ? `${f.evidence.journalEntryIds.length} bút toán`
                            : f.evidence.accounts?.join(',') ?? '-',
                      },
                    ]}
                  />
                </div>

                {/* Right: Detailed Finding Inspection Card */}
                <div className="au-finding-detail-card">
                  {activeFinding ? (
                    <div className="finding-detail-inner">
                      <div className="finding-head-row">
                        <span className={`au-badge-lg ${LEVEL_CLASS[activeFinding.riskLevel]}`}>
                          {LEVEL_VN[activeFinding.riskLevel]} (Điểm: {activeFinding.score})
                        </span>
                        <span className="finding-cat-tag">{activeFinding.category}</span>
                      </div>

                      <h3 className="finding-title">{activeFinding.title}</h3>

                      <div className="finding-section">
                        <div className="section-label">Quan sát & Dấu hiệu thực tế:</div>
                        <div className="section-content">{activeFinding.observation}</div>
                      </div>

                      {activeFinding.currentValue != null && (
                        <div className="finding-section values-row">
                          <div><strong>Kỳ này:</strong> {activeFinding.currentValue}</div>
                          {activeFinding.priorValue != null && (
                            <div><strong>Kỳ trước:</strong> {activeFinding.priorValue}</div>
                          )}
                        </div>
                      )}

                      <div className="finding-section">
                        <div className="section-label">Hàm ý rủi ro kiểm toán:</div>
                        <div className="section-content implication">{activeFinding.auditImplication}</div>
                      </div>

                      <div className="finding-section">
                        <div className="section-label">Vì sao bị hệ thống gắn cờ?</div>
                        <ul className="finding-reasons-list">
                          {activeFinding.explanation.map((e, i) => (
                            <li key={i}>
                              <strong>{e.label}:</strong> {e.value}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="finding-section">
                        <div className="section-label">Thủ tục kiểm toán đề xuất:</div>
                        <ul className="finding-procedures-list">
                          {activeFinding.recommendedProcedures.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      {activeFinding.evidence.journalEntryIds?.length ? (
                        <button
                          type="button"
                          className="btn-show-evidence"
                          onClick={() => showEvidence(activeFinding)}
                        >
                          <IconSearch size={14} style={{ marginRight: 6 }} />
                          Xem {activeFinding.evidence.journalEntryIds.length} bút toán bằng chứng →
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="empty-finding-prompt">
                      Chọn một rủi ro ở danh sách bên trái để xem chi tiết bằng chứng và thủ tục đề xuất.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Journals */}
            {tab === 'journals' && (
              <div className="au-tab-pane">
                <div className="toolbar-card">
                  <div className="toolbar-search">
                    <span className="search-icon"><IconSearch size={14} /></span>
                    <input
                      placeholder="Tìm theo Số CT, diễn giải, tài khoản Nợ/Có…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="search-input"
                    />
                    {query && (
                      <button className="clear-search-btn" onClick={() => setQuery('')}>✕</button>
                    )}
                  </div>
                  <div className="toolbar-stats">
                    {focusIds && (
                      <button className="btn small secondary" onClick={() => setFocusIds(null)}>
                        Bỏ lọc bằng chứng ({focusIds.size})
                      </button>
                    )}
                    <span className="count-pill">
                      Hiển thị <strong>{fmtVnd(journalsFiltered.length)}</strong> dòng
                      {result.journalsCapped ? ' (đã giới hạn)' : ''}
                    </span>
                  </div>
                </div>

                <VirtualTable
                  rows={journalsFiltered}
                  height={520}
                  columns={[
                    { key: 'date', label: 'Ngày CT', width: 95, align: 'center', render: (j) => j.date ?? '-' },
                    { key: 'doc', label: 'Số CT', width: 120, render: (j) => <strong>{j.doc ?? '-'}</strong> },
                    { key: 'desc', label: 'Diễn giải nghiệp vụ', width: 340 },
                    { key: 'debit', label: 'TK Nợ', width: 85, align: 'center', render: (j) => <span className="mono bold">{j.debit}</span> },
                    { key: 'credit', label: 'TK Có', width: 85, align: 'center', render: (j) => <span className="mono bold">{j.credit}</span> },
                    { key: 'amount', label: 'Số tiền', width: 135, align: 'right', render: (j) => <span className="bold">{fmtVnd(j.amount)}</span> },
                    {
                      key: 'issues',
                      label: 'Cảnh báo rủi ro',
                      width: 180,
                      render: (j) =>
                        j.issues.length > 0 ? (
                          <span className="au-issue-tag">{j.issues.join('; ')}</span>
                        ) : (
                          '-'
                        ),
                    },
                  ]}
                />
              </div>
            )}

            {/* Tab 3: Accounts */}
            {tab === 'accounts' && (
              <div className="au-tab-pane">
                <VirtualTable
                  rows={result.accounts}
                  height={540}
                  columns={[
                    { key: 'account', label: 'Mã TK', width: 110, render: (a) => <span className="mono bold">{a.account}</span> },
                    { key: 'name', label: 'Tên Tài khoản', width: 260 },
                    { key: 'debit', label: 'Tổng Phát sinh Nợ', width: 150, align: 'right', render: (a) => fmtVnd(a.debit) },
                    { key: 'credit', label: 'Tổng Phát sinh Có', width: 150, align: 'right', render: (a) => fmtVnd(a.credit) },
                    { key: 'count', label: 'Số bút toán', width: 100, align: 'right' },
                  ]}
                />
              </div>
            )}

            {/* Tab 4: Pairs */}
            {tab === 'pairs' && (
              <div className="au-tab-pane">
                <VirtualTable
                  rows={result.pairs}
                  height={540}
                  columns={[
                    { key: 'pair', label: 'Cặp đối ứng Nợ › Có (cấp 1)', width: 200, render: (p) => <span className="mono bold">{`${p.debit} › ${p.credit}`}</span> },
                    { key: 'count', label: 'Số lượng bút toán', width: 120, align: 'right' },
                    { key: 'total', label: 'Tổng giá trị phát sinh', width: 180, align: 'right', render: (p) => <span className="bold">{fmtVnd(p.total)}</span> },
                  ]}
                />
              </div>
            )}

            {/* Tab 5: Monthly */}
            {tab === 'monthly' && (
              <div className="au-tab-pane">
                <div className="au-styled-table-card">
                  <table className="au-styled-table">
                    <thead>
                      <tr>
                        <th>Nhóm nghiệp vụ</th>
                        {Array.from({ length: 12 }, (_, i) => (
                          <th key={i} className="num">Tháng {i + 1}</th>
                        ))}
                        <th className="num">Tỷ lệ Max tháng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.monthly.map((g) => (
                        <tr key={g.group}>
                          <td><strong>{g.group}</strong></td>
                          {Array.from({ length: 12 }, (_, i) => {
                            const b = g.buckets.find((x) => x.month === i + 1)
                            const v = (b?.debit ?? 0) + (b?.credit ?? 0)
                            return (
                              <td key={i} className="num">
                                {v === 0 ? '-' : fmtVnd(Math.round(v / 1_000_000)) + ' tr'}
                              </td>
                            )
                          })}
                          <td className="num bold">{g.maxMonthShare == null ? '-' : fmtPct(g.maxMonthShare)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 6: Reconciliation */}
            {tab === 'recon' && (
              <div className="au-tab-pane">
                <VirtualTable
                  rows={result.reconciliation}
                  height={540}
                  rowClassName={(r) => (r.status === 'ERROR' ? 'row-removed' : r.status === 'WARNING' ? 'row-changed' : '')}
                  columns={[
                    { key: 'account', label: 'Mã TK', width: 110, render: (r) => <span className="mono bold">{r.account}</span> },
                    { key: 'name', label: 'Tên Tài khoản', width: 220 },
                    { key: 'glDebit', label: 'Sổ Cái Nợ (GL)', width: 135, align: 'right', render: (r) => fmtVnd(r.glDebit) },
                    { key: 'glCredit', label: 'Sổ Cái Có (GL)', width: 135, align: 'right', render: (r) => fmtVnd(r.glCredit) },
                    { key: 'tbDebit', label: 'CDFS Nợ (TB)', width: 135, align: 'right', render: (r) => fmtVnd(r.tbDebit) },
                    { key: 'tbCredit', label: 'CDFS Có (TB)', width: 135, align: 'right', render: (r) => fmtVnd(r.tbCredit) },
                    {
                      key: 'status',
                      label: 'Kết luận',
                      width: 105,
                      render: (r) => (
                        <span className={`au-status-pill ${r.status === 'PASS' ? 'ok' : r.status === 'ERROR' ? 'err' : 'warn'}`}>
                          {r.status === 'PASS' ? '✓ Khớp' : r.status === 'ERROR' ? '✗ Lệch' : '⚠ Cảnh báo'}
                        </span>
                      ),
                    },
                    { key: 'note', label: 'Ghi chú đối chiếu', width: 260 },
                  ]}
                />
              </div>
            )}

            {/* Tab 7: KQKD */}
            {tab === 'kqkd' && (
              <div className="au-tab-pane">
                {result.kqkd ? (
                  <div className="au-kqkd-grid">
                    <div className="kqkd-table-box">
                      <VirtualTable
                        rows={result.kqkd.lines}
                        height={460}
                        columns={[
                          { key: 'maSo', label: 'Mã số', width: 65, align: 'center', render: (l) => <span className="mono bold">{l.maSo}</span> },
                          { key: 'chiTieu', label: 'Chỉ tiêu KQKD', width: 300 },
                          { key: 'current', label: 'Năm nay', width: 140, align: 'right', render: (l) => fmtVnd(l.current) },
                          { key: 'prior', label: 'Năm trước', width: 140, align: 'right', render: (l) => fmtVnd(l.prior) },
                          { key: 'change', label: 'Biến động (±)', width: 130, align: 'right', render: (l) => <span className="bold">{fmtVnd(l.change)}</span> },
                          { key: 'pctChange', label: '% Tăng giảm', width: 95, align: 'right', render: (l) => fmtPct(l.pctChange) },
                        ]}
                      />
                    </div>
                    <div className="kqkd-metrics-card">
                      <h4 className="card-title">Chỉ số tài chính chủ yếu</h4>
                      <table className="au-metrics-table">
                        <thead>
                          <tr><th>Chỉ số</th><th className="num">Năm nay</th><th className="num">Năm trước</th></tr>
                        </thead>
                        <tbody>
                          {result.kqkd.metrics.map((m) => (
                            <tr key={m.label}>
                              <td>{m.label}</td>
                              <td className="num bold">{m.current || '-'}</td>
                              <td className="num">{m.prior || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="au-empty-box">Không có dữ liệu sheet KQKD trong workbook.</div>
                )}
              </div>
            )}

            {/* Tab 8: Expense Variance */}
            {tab === 'chiphi' && (
              <div className="au-tab-pane">
                <ExpenseVarianceTab result={result} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ExpenseVarianceTab({ result }: { result: AnalysisResult }): JSX.Element {
  if (!result.kqkd) {
    return <div className="au-empty-box">Cần workbook có sheet KQKD (số liệu 2 năm) để phân tích biến động chi phí.</div>
  }
  const v = analyzeExpenseVariance(result.kqkd.lines)
  const pct = (x: number | null | undefined): string => {
    if (x == null || !Number.isFinite(x)) return '-'
    const s = (x * 100).toFixed(1).replace('.', ',')
    return `${x > 0 ? '+' : ''}${s}%`
  }
  return (
    <div className="expense-variance-container">
      <div className="variance-header">
        <h3>Phân tích Biến động Chi phí (Năm nay so với Năm trước)</h3>
        <p className="muted">Đánh giá các khoản mục chi phí có biến động lớn bất thường cần mở rộng mẫu kiểm tra.</p>
      </div>

      <div className="variance-cards-grid">
        {v.rows.map((it) => (
          <div key={it.maSo} className="variance-item-card">
            <div className="variance-item-head">
              <span className="item-name">{it.chiTieu}</span>
              <span className={`variance-tag ${(it.change ?? 0) > 0 ? 'up' : 'down'}`}>
                {pct(it.pctChange)}
              </span>
            </div>
            <div className="variance-values">
              <div>Nay: <strong>{fmtVnd(it.current)}</strong></div>
              <div>Trước: <strong>{fmtVnd(it.prior)}</strong></div>
              <div>CL: <strong>{fmtVnd(it.change)}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
