import { useState } from 'react'
import { useApp } from '../../state/store'
import type { GlAnalyticsResult } from '../../../domain/analytics/types'
import { moneyToNumber } from '../../../domain/money'
import { IconCheck, IconClipboard, IconAlert, IconSparkles, IconRefresh, IconLightbulb } from '../Icons'

interface Props {
  data: GlAnalyticsResult
  filePath?: string
}

function renderFormattedText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} style={{ color: '#0f172a', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

function renderMarkdownTable(block: string): React.ReactNode {
  const lines = block
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'))
  if (lines.length < 2) return null

  const firstLine = lines[0]
  if (!firstLine) return null
  const headerCells = firstLine
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

  const dataRows = lines
    .slice(2)
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim())
    )

  return (
    <div className="ai-table-responsive-wrapper">
      <table className="ai-markdown-table">
        <thead>
          <tr>
            {headerCells.map((h, i) => (
              <th key={i}>{renderFormattedText(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}>{renderFormattedText(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AiAuditAdvisorPanel({ data, filePath }: Props): JSX.Element {
  const apiKey = useApp((s) => s.apiKey)
  const selectedModel = useApp((s) => s.selectedModel)
  const isAnalyzing = useApp((s) => s.isAnalyzing)
  const setIsAnalyzing = useApp((s) => s.setIsAnalyzing)
  const cachedReview = useApp((s) => s.cachedReview)
  const setCachedReview = useApp((s) => s.setCachedReview)
  const setAiConfigModalOpen = useApp((s) => s.setAiConfigModalOpen)

  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [contextNote, setContextNote] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const handleRunAnalysis = async () => {
    if (!apiKey) {
      setAiConfigModalOpen(true)
      return
    }
    if (!window.auditsoft?.geminiAnalyze) {
      setErrorMsg('Không tìm thấy API bridge của ứng dụng.')
      return
    }

    setIsAnalyzing(true)
    setErrorMsg(null)

    try {
      // 1. Chuẩn bị số liệu tổng hợp (Aggregated Metrics)
      const ebitda = data.ebitda
      const trend = data.trend12m
      const expense = data.expenseDetail
      const correlations = data.correlations
      const revRow = trend?.rows.find((r) => r.key === 'REV_511')
      const cogsRow = trend?.rows.find((r) => r.key === 'COGS_632')

      const totalRevenue = revRow ? moneyToNumber(revRow.total) : 0
      const totalCogs = cogsRow ? moneyToNumber(cogsRow.total) : 0
      const grossProfit = totalRevenue - totalCogs
      const ebitdaVal = ebitda ? moneyToNumber(ebitda.ebitda) : 0
      const operatingProfit = ebitda ? moneyToNumber(ebitda.operatingProfit) : 0
      const ebitdaMarginPct = totalRevenue > 0 ? Number(((ebitdaVal / totalRevenue) * 100).toFixed(1)) : 0

      const yearFromPath = filePath?.match(/(20\d{2})/)?.[1]
      const clientFromPath = filePath
        ? filePath.split(/[/\\]/).pop()?.replace(/\.(xlsx|xlsm|xls|csv)$/i, '').replace(/[-_]/g, ' ')
        : 'DOANH_NGHIEP_KIEM_TOAN_A'

      // 2. Bảng 12 Tháng: Doanh thu, Giá vốn 632 và CPSX thực tế
      const cogsMatrixRows = correlations?.cogs12mMatrix?.rows
      const monthlyBreakdown =
        cogsMatrixRows && cogsMatrixRows.length > 0
          ? cogsMatrixRows.map((r) => {
              const revNum = moneyToNumber(r.revenue511)
              const cogsNum = moneyToNumber(r.totalCogs632)
              const margin = revNum > 0 ? Number((((revNum - cogsNum) / revNum) * 100).toFixed(1)) : 0
              return {
                month: r.month,
                revenue: revNum,
                cogs632: cogsNum,
                grossMarginPct: margin,
                productionCost: moneyToNumber(r.totalProductionCost),
                prodCostToRevPct: r.prodCostToRevenuePct,
                isLumpSumYearEnd: r.isLumpSumYearEnd,
                isAnomaly: correlations?.grossMargin.anomalousMonths?.includes(r.month),
                auditNote: r.auditFlag || undefined,
              }
            })
          : revRow
            ? revRow.months.map((mVal, idx) => {
                const mNum = idx + 1
                const revNum = moneyToNumber(mVal)
                const cogsNum = cogsRow?.months[idx] ? moneyToNumber(cogsRow.months[idx]) : 0
                const margin = revNum > 0 ? Number((((revNum - cogsNum) / revNum) * 100).toFixed(1)) : 0
                return {
                  month: mNum,
                  revenue: revNum,
                  cogs632: cogsNum,
                  grossMarginPct: margin,
                  isAnomaly: correlations?.grossMargin.anomalousMonths?.includes(mNum),
                }
              })
            : undefined

      // 3. Số liệu KQKD So Sánh YoY (B02)
      const kqkdYoY = data.kqkdYoY?.rows?.map((r) => ({
        chiTieu: r.chiTieu,
        current: r.current,
        prior: r.prior,
        diff: r.diff,
        pct: r.pct,
      }))

      // 4. Số liệu Rủi ro thuế & Điều chỉnh B4
      const cashTaxRisk = data.cashTaxRisk
        ? {
            totalCashOverThreshold: data.cashTaxRisk.totalRiskNumber,
            countCashOverThreshold: data.cashTaxRisk.singleItems?.length || 0,
            thresholdUsed: data.cashTaxRisk.thresholdUsed,
            penalty811Amount: data.cashTaxRisk.penaltyRiskNumber,
            noInvoiceAmount: data.cashTaxRisk.noInvoiceRiskNumber,
            estimatedB4Amount: data.cashTaxRisk.estimatedB4Number,
            estimatedTaxIncrease: data.cashTaxRisk.estimatedTaxPayableNumber,
            auditWarnings: [
              ...(data.cashTaxRisk.singleItems?.length ? [`Phát hiện ${data.cashTaxRisk.singleItems.length} khoản chi tiền mặt vượt ngưỡng.`] : []),
              ...(data.cashTaxRisk.splitClusters?.length ? [`Phát hiện ${data.cashTaxRisk.splitClusters.length} cụm phiếu chi chia nhỏ cùng ngày.`] : []),
            ],
          }
        : undefined

      // 5. Giao dịch Bên liên quan
      const relatedParties = data.relatedParties?.map((rp) => ({
        name: rp.partyName || rp.name || 'Bên liên quan',
        relationship: rp.relationshipType,
        amount: rp.totalAmount ? moneyToNumber(rp.totalAmount) : 0,
        accounts: rp.accounts,
        riskType: rp.riskLevel ? `Rủi ro ${rp.riskLevel}` : rp.description,
        auditWarning: rp.auditWarning,
      }))

      // 6. Rủi ro tập trung Pareto
      const paretoSummary = data.pareto
        ? {
            topCustomerName: data.pareto.topCustomers?.[0]?.name,
            topCustomerPct: data.pareto.customerConcentrationRatio1,
            top5CustomersPct: data.pareto.customerConcentrationRatio5,
            customerRiskWarning: data.pareto.customerRiskWarning,
            topSupplierName: data.pareto.topSuppliers?.[0]?.name,
            topSupplierPct: data.pareto.topSuppliers?.[0]?.percentage,
            top5SuppliersPct: data.pareto.supplierConcentrationRatio5,
            supplierRiskWarning: data.pareto.supplierRiskWarning,
          }
        : undefined

      const payload = {
        clientName: clientFromPath || 'DOANH_NGHIEP_KIEM_TOAN_A',
        fiscalYear: yearFromPath || `${new Date().getFullYear()}`,
        businessType: correlations?.cogs12mMatrix?.businessType,
        auditorContextNote: contextNote.trim() || undefined,
        ebitda: ebitda
          ? {
              revenue: totalRevenue,
              cogs: totalCogs,
              grossProfit,
              ebitda: ebitdaVal,
              operatingProfit,
              ebitdaMarginPct,
              netInterest: moneyToNumber(ebitda.netInterest),
              depreciation: moneyToNumber(ebitda.depreciation),
              interestToEbitdaRatio: ebitda.interestToEbitdaRatio,
              isOverCap: ebitda.isOverCap,
            }
          : undefined,
        trend12m: trend
          ? {
              totalRevenue,
              totalCogs,
              revenueByMonth: revRow ? revRow.months.map(moneyToNumber) : [],
              cogsByMonth: cogsRow ? cogsRow.months.map(moneyToNumber) : [],
              grossMarginByMonth: correlations?.grossMargin.points.map((p) => p.grossMarginPct) || [],
              anomalousMonths: correlations?.grossMargin.anomalousMonths || [],
            }
          : undefined,
        monthlyBreakdown,
        kqkdYoY,
        opex: expense
          ? {
              sellingExpense: expense.sell.totals.reduce((s, v) => s + v, 0),
              adminExpense: expense.admin.totals.reduce((s, v) => s + v, 0),
              opexRatioPct: correlations?.opexRatios.annualPcts.totalOpexRatioPct || 0,
              anomalousMonths: correlations?.grossMargin.anomalousMonths || [],
            }
          : undefined,
        cogsMatrix: correlations?.cogs12mMatrix
          ? {
              isLumpSumYearEnd: correlations.cogs12mMatrix.rows.some((r) => r.isLumpSumYearEnd),
              totalProductionCost: moneyToNumber(correlations.cogs12mMatrix.annualTotals.totalProductionCost),
              totalCogs632: moneyToNumber(correlations.cogs12mMatrix.annualTotals.totalCogs632),
              monthlyProductionCost: correlations.cogs12mMatrix.rows.map((r) => moneyToNumber(r.totalProductionCost)),
              monthlyCogs632: correlations.cogs12mMatrix.rows.map((r) => moneyToNumber(r.totalCogs632)),
              prodCostToRevenuePctByMonth: correlations.cogs12mMatrix.rows.map((r) => r.prodCostToRevenuePct),
              summaryWarnings: correlations.cogs12mMatrix.summaryWarnings,
            }
          : undefined,
        cashTaxRisk,
        relatedParties,
        pareto: paretoSummary,
        topRisks: [
          ...(correlations?.grossMargin.auditWarning ? [correlations.grossMargin.auditWarning] : []),
          ...(correlations?.cogs12mMatrix?.summaryWarnings || []),
          ...(data.pareto?.customerRiskWarning ? [data.pareto.customerRiskWarning] : []),
          ...(data.pareto?.supplierRiskWarning ? [data.pareto.supplierRiskWarning] : []),
          ...(data.relatedParties && data.relatedParties.length > 0 ? [`Phát hiện ${data.relatedParties.length} bên liên quan có giao dịch trọng yếu.`] : []),
          ...(trend?.warningNotes ? trend.warningNotes : []),
        ],
      }
      const res = await window.auditsoft.geminiAnalyze({
        apiKey,
        payload,
        model: selectedModel || 'gemini-2.5-flash',
      })

      if (res.success && res.reviewText) {
        setCachedReview(res.reviewText)
      } else {
        setErrorMsg(res.error || 'Không thể tạo nhận xét phân tích từ Gemini.')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopySection = async (sectionKey: 'ALL' | 'I' | 'II' | 'III' | 'IV') => {
    if (!cachedReview) return
    try {
      if (sectionKey === 'ALL') {
        await navigator.clipboard.writeText(cachedReview)
        setCopiedSection('ALL')
        setTimeout(() => setCopiedSection(null), 2000)
        return
      }

      const regex = new RegExp(`(###\\s+${sectionKey}\\.[\\s\\S]*?)(?=(?:###\\s+[I|V|X]+\\.)|$)`, 'i')
      const match = cachedReview.match(regex)
      if (match && match[1]) {
        await navigator.clipboard.writeText(match[1].trim())
        setCopiedSection(sectionKey)
        setTimeout(() => setCopiedSection(null), 2000)
      } else {
        await navigator.clipboard.writeText(cachedReview)
        setCopiedSection(sectionKey)
        setTimeout(() => setCopiedSection(null), 2000)
      }
    } catch {
      // ignore
    }
  }

  const handleCopy = () => handleCopySection('ALL')

  return (
    <div className="ai-advisor-container">
      {/* ── Header ── */}
      <div className="ai-advisor-head" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="ai-advisor-title-group">
          <span className="ai-head-sparkle"><IconSparkles size={18} /></span>
          <div>
            <h3 className="ai-advisor-title">Trợ Lý Phân Tích Kiểm Toán AI (Google Gemini 2.5)</h3>
            <div className="ai-advisor-subtitle">
              Phân tích chỉ số tài chính, mổ xẻ biến động 12M và tự động sinh bản thảo nhận xét VSA 520
            </div>
          </div>
        </div>

        <div className="ai-advisor-head-right" onClick={(e) => e.stopPropagation()}>
          {apiKey ? (
            <div className="ai-key-status-badge configured">
              <span className="ai-dot-indicator online" />
              <span>{selectedModel || 'gemini-2.5-flash'}</span>
              <button
                type="button"
                className="btn-ai-config-sm"
                onClick={() => setAiConfigModalOpen(true)}
                title="Thay đổi cấu hình hoặc API Key"
              >
                Cài đặt
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-ai-setup-prompt"
              onClick={() => setAiConfigModalOpen(true)}
            >
              <span>Chưa cấu hình Key — Bấm để thêm (Miễn phí)</span>
            </button>
          )}

          <button
            type="button"
            className="btn-ai-toggle-fold"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Thu gọn bảng AI' : 'Mở rộng bảng AI'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {isExpanded && (
        <div className="ai-advisor-body">
          {errorMsg && (
            <div className="ai-error-banner">
              <IconAlert size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STATE 1: ĐANG PHÂN TÍCH (ANALYZING / LOADING SKELETON) */}
          {isAnalyzing ? (
            <div className="ai-loading-card">
              <div className="ai-loading-progress-bar">
                <div className="ai-loading-progress-shimmer" />
              </div>
              <div className="ai-loading-content">
                <div className="ai-loading-head">
                  <div className="ai-loading-icon-pulse"><IconSparkles size={16} /></div>
                  <div>
                    <h4 className="ai-loading-title">Gemini 2.5 đang phân tích số liệu tài chính &amp; sổ NKC...</h4>
                    <p className="ai-loading-desc">
                      Đang đối chiếu các chỉ số theo Chuẩn mực Kiểm toán Việt Nam VSA 520 (Thủ tục phân tích)
                    </p>
                  </div>
                </div>

                <div className="ai-loading-steps">
                  <div className="ai-step-item active">
                    <span className="step-dot" />
                    <span>Mổ xẻ chỉ số EBITDA &amp; Khống chế lãi vay NĐ 132/2020</span>
                  </div>
                  <div className="ai-step-item active">
                    <span className="step-dot" />
                    <span>Rà soát Ma trận Giá vốn 12M, Bóc tách CPSX &amp; Rủi ro Cut-off dồn chi phí cuối năm</span>
                  </div>
                  <div className="ai-step-item active">
                    <span className="step-dot" />
                    <span>Đối chiếu chi phí 641/642 &amp; Khởi tạo nhận xét kiểm toán chuyên sâu</span>
                  </div>
                </div>

                {/* Skeleton placeholders */}
                <div className="ai-skeleton-paragraphs">
                  <div className="ai-skeleton-line w-full" />
                  <div className="ai-skeleton-line w-85" />
                  <div className="ai-skeleton-line w-70" />
                </div>
              </div>
            </div>
          ) : cachedReview ? (
            /* STATE 2: ĐÃ CÓ KẾT QUẢ PHÂN TÍCH (COMPLETED) */
            <>
              {/* Action Bar khi đã có kết quả */}
              <div className="ai-action-bar">
                <button
                  type="button"
                  className="btn-ai-run-analysis"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                >
                  <IconRefresh size={14} />
                  <span>Phân tích lại với Gemini 2.5</span>
                </button>

                <div className="ai-segment-copy-group">
                  <button
                    type="button"
                    className={`btn-ai-segment-copy ${copiedSection === 'ALL' ? 'copied' : ''}`}
                    onClick={() => handleCopySection('ALL')}
                    title="Sao chép toàn bộ bản thảo nhận xét"
                  >
                    {copiedSection === 'ALL' ? <IconCheck size={13} /> : <IconClipboard size={13} />}
                    <span>{copiedSection === 'ALL' ? 'Đã sao chép!' : 'Copy Toàn Bộ'}</span>
                  </button>

                  <button
                    type="button"
                    className={`btn-ai-segment-copy ${copiedSection === 'I' ? 'copied' : ''}`}
                    onClick={() => handleCopySection('I')}
                    title="Sao chép Phần I: Đánh giá Tổng quan BCTC (dán vào A710)"
                  >
                    {copiedSection === 'I' ? <IconCheck size={13} /> : <IconClipboard size={13} />}
                    <span>{copiedSection === 'I' ? 'Đã copy A710!' : 'Copy A710 (Tổng quan)'}</span>
                  </button>

                  <button
                    type="button"
                    className={`btn-ai-segment-copy ${copiedSection === 'II' ? 'copied' : ''}`}
                    onClick={() => handleCopySection('II')}
                    title="Sao chép Phần II: Phân tích Ma trận Giá vốn & Cut-off (dán vào G353)"
                  >
                    {copiedSection === 'II' ? <IconCheck size={13} /> : <IconClipboard size={13} />}
                    <span>{copiedSection === 'II' ? 'Đã copy G353!' : 'Copy G353 (Giá vốn)'}</span>
                  </button>

                  <button
                    type="button"
                    className={`btn-ai-segment-copy ${copiedSection === 'III' ? 'copied' : ''}`}
                    onClick={() => handleCopySection('III')}
                    title="Sao chép Phần III: Chi phí hoạt động & Rủi ro Thuế B4 (dán vào E300)"
                  >
                    {copiedSection === 'III' ? <IconCheck size={13} /> : <IconClipboard size={13} />}
                    <span>{copiedSection === 'III' ? 'Đã copy E300!' : 'Copy E300 (Thuế B4)'}</span>
                  </button>
                </div>
              </div>

              <div className="ai-review-content-card">
                <div className="ai-review-meta-bar">
                  <span>✓ Bản thảo nhận xét kiểm toán độc lập · Chuẩn mực VSA 520 (Thủ tục phân tích)</span>
                  <span className="ai-meta-tag">Model: {selectedModel || 'gemini-2.5-flash'}</span>
                </div>
                <div className="ai-review-markdown-body">
                  {cachedReview.split('\n\n').map((paragraph, idx) => {
                    const trimmed = paragraph.trim()
                    if (trimmed.startsWith('|') && trimmed.includes('\n|')) {
                      return <div key={idx}>{renderMarkdownTable(trimmed)}</div>
                    }
                    if (trimmed.startsWith('### ')) {
                      return (
                        <h4 key={idx} className="ai-section-heading">
                          {renderFormattedText(trimmed.replace(/^###\s*/, ''))}
                        </h4>
                      )
                    }
                    if (trimmed.startsWith('## ')) {
                      return (
                        <h3 key={idx} className="ai-main-heading">
                          {renderFormattedText(trimmed.replace(/^##\s*/, ''))}
                        </h3>
                      )
                    }
                    if (trimmed.startsWith('# ')) {
                      return (
                        <h3 key={idx} className="ai-main-heading">
                          {renderFormattedText(trimmed.replace(/^#\s*/, ''))}
                        </h3>
                      )
                    }
                    if (trimmed.startsWith('- ') || trimmed.startsWith('+ ') || trimmed.startsWith('* ')) {
                      return (
                        <ul key={idx} className="ai-bullet-list">
                          {trimmed.split('\n').map((line, lineIdx) => (
                            <li key={lineIdx}>{renderFormattedText(line.replace(/^[-+*]\s*/, ''))}</li>
                          ))}
                        </ul>
                      )
                    }
                    return (
                      <p key={idx} className="ai-paragraph">
                        {renderFormattedText(trimmed)}
                      </p>
                    )
                  })}
                </div>
                <div className="ai-review-foot-hint">
                  <IconLightbulb size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /><strong>Gợi ý:</strong> Sử dụng các nút <em>&ldquo;Copy A710&rdquo;</em>, <em>&ldquo;Copy G353&rdquo;</em> hoặc <em>&ldquo;Copy E300&rdquo;</em> ở trên để dán trực tiếp vào từng Giấy làm việc tương ứng.
                </div>
              </div>
            </>
          ) : (
            /* STATE 3: CHƯA PHÂN TÍCH (READY HERO) */
            <div className="ai-ready-hero-card">
              <div className="hero-left">
                <div className="hero-badge">
                  <span>Trợ lý Phân tích VSA 520</span>
                </div>
                <h4 className="hero-title">Sẵn sàng lập Bản thảo Nhận xét Kiểm toán Độc lập</h4>
                <p className="hero-desc">
                  Chỉ trong 3 giây, Gemini 2.5 sẽ tự động đối chiếu toàn bộ chỉ số EBITDA, ma trận 12 tháng (Doanh thu - Giá vốn 632 vs CPSX thực tế), so sánh YoY B02 và rủi ro thuế B4 để đưa ra nhận xét phản biện sắc bén chuẩn VSA 520.
                </p>
                <div className="hero-tags">
                  <span className="hero-tag">EBITDA &amp; NĐ 132</span>
                  <span className="hero-tag">Ma Trận 12M CPSX</span>
                  <span className="hero-tag">So Sánh YoY B02</span>
                  <span className="hero-tag">Rủi Ro Thuế B4</span>
                  <span className="hero-tag">Bên Liên Quan &amp; Pareto</span>
                </div>

                <div className="ai-context-note-box">
                  <label htmlFor="ai-context-note" className="ai-context-note-label">
                    Ghi chú bối cảnh kiểm toán (tùy chọn):
                  </label>
                  <input
                    id="ai-context-note"
                    type="text"
                    className="ai-context-note-input"
                    placeholder="Ví dụ: Doanh nghiệp mở thêm phân xưởng Q3, chi phí sắt thép NVL tăng mạnh..."
                    value={contextNote}
                    onChange={(e) => setContextNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="hero-right">
                <button
                  type="button"
                  className="btn-hero-launch"
                  onClick={handleRunAnalysis}
                >
                  <span className="btn-sparkle"><IconSparkles size={16} /></span>
                  <span>Tạo Nhận Xét Kiểm Toán (Gemini)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
