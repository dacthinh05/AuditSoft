import { ModuleGateBanner } from '../ModuleGateBanner'
import { useEffect, useState, useRef } from 'react'
import { useApp } from '../../state/store'
import type { GlAnalyticsResult } from '../../../domain/analytics/types'
import { EbitdaCalculator } from '../../../domain/analytics/EbitdaCalculator'
import { RelatedPartyScanner } from '../../../domain/analytics/RelatedPartyScanner'
import { ConcentrationAnalyzer } from '../../../domain/analytics/ConcentrationAnalyzer'
import { Trend12MAnalyzer } from '../../../domain/analytics/Trend12MAnalyzer'
import { FinancialCorrelationEngine } from '../../../domain/analytics/FinancialCorrelationEngine'
import { analyzeJournal } from '../../../domain/analytics/ExpenseDetailAnalyzer'
import { dtoToEntries, dtoToKqkd } from './analyticsMappers'
import { GlAnalyticsTab } from './GlAnalyticsTab'

function extractDroppedFilePath(file: File): string | null {
  if (window.auditsoft?.getPathForFile) {
    const p = window.auditsoft.getPathForFile(file)
    if (p) return p
  }
  if ('path' in file && typeof (file as { path: string }).path === 'string') {
    return (file as { path: string }).path
  }
  return null
}

function isExcelOrCsvPath(nameOrPath: string): boolean {
  const lower = nameOrPath.toLowerCase()
  return (
    lower.endsWith('.xlsx') ||
    lower.endsWith('.xlsm') ||
    lower.endsWith('.xls') ||
    lower.endsWith('.csv')
  )
}

export function PreliminaryAnalyticsPage(): JSX.Element {
  const beforeCfg = useApp((s) => s.before.cfg)
  const afterCfg = useApp((s) => s.after.cfg)
  const setGlSnapshot = useApp((s) => s.setGlSnapshot)

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const [glResult, setGlResult] = useState<GlAnalyticsResult | null>(null)

  const filePath = beforeCfg?.filePath || afterCfg?.filePath || ''

  // 1. Phân tích sổ kế toán khi có file
  useEffect(() => {
    if (!filePath || !window.auditsoft?.auditAnalyze) return

    let cancelled = false
    async function runAnalysis(): Promise<void> {
      setIsLoading(true)
      setLoadingMsg('Đang đọc và phân tích sổ Nhật ký chung...')
      setError(null)

      try {
        const res = await window.auditsoft.auditAnalyze({
          filePath,
        })
        if (cancelled) return

        const entries = dtoToEntries(res.journals || [])
        const incomeStatement = dtoToKqkd(res.kqkd)

        // Chạy 5 engines phân tích
        const ebitda = EbitdaCalculator.calculate(entries, incomeStatement)
        const relatedParties = RelatedPartyScanner.scan(entries)
        const pareto = ConcentrationAnalyzer.analyze(entries)
        const trend12m = Trend12MAnalyzer.analyze(entries)
        const correlations = FinancialCorrelationEngine.analyze(entries, incomeStatement)
        const expenseDetail = analyzeJournal(entries)

        setGlResult({
          ebitda,
          relatedParties,
          pareto,
          trend12m,
          correlations,
          expenseDetail,
        })

        // Cache journals thô cho module Thuế đối chiếu chéo
        setGlSnapshot({ filePath, journals: res.journals || [] })
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void runAnalysis()
    return () => {
      cancelled = true
    }
  }, [filePath])

  // 3. Chọn file sổ kế toán nếu chưa nạp hoặc muốn đổi
  async function handlePickAccountingFile(): Promise<void> {
    if (!window.auditsoft?.pickWorkbook) return
    try {
      const picked = await window.auditsoft.pickWorkbook()
      if (picked.canceled || !picked.filePath) return
      const meta = await window.auditsoft.inspectWorkbook(picked.filePath)
      useApp.getState().setMeta('BEFORE', meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  // 4. Kéo thả file Excel trực tiếp vào màn hình
  function handleDragEnter(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current <= 0) {
      setIsDragging(false)
      dragCounter.current = 0
    }
  }

  function handleDragOver(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
  }

  async function handleDrop(e: React.DragEvent): Promise<void> {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file) return
    const droppedPath = extractDroppedFilePath(file)
    if (!droppedPath) {
      setError('Không thể nhận diện đường dẫn file kéo thả. Vui lòng sử dụng nút chọn file.')
      return
    }

    if (!isExcelOrCsvPath(droppedPath) && !isExcelOrCsvPath(file.name)) {
      setError('Vui lòng kéo thả file Excel (.xlsx, .xlsm, .xls) hoặc CSV kế toán.')
      return
    }

    if (!window.auditsoft?.inspectWorkbook) return
    try {
      setIsLoading(true)
      setLoadingMsg('Đang nạp file Excel kéo thả...')
      setError(null)
      const meta = await window.auditsoft.inspectWorkbook(droppedPath)
      useApp.getState().setMeta('BEFORE', meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(e) => void handleDrop(e)}
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        background: '#f8fafc',
      }}
    >
      <ModuleGateBanner requirement="BEFORE" moduleName="Phân tích cơ bản" />
      {/* Floating Drag Overlay khi kéo thả file đè lên trang */}
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(240, 249, 255, 0.96)',
            border: '3px dashed #0284c7',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            color: '#0284c7',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '2.5rem' }}>📥</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Thả file Excel Sổ NKC mới vào đây</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Hệ thống sẽ tự động cập nhật và phân tích lại số liệu</div>
        </div>
      )}

      {/* ── Header Banner (Card Trắng Chuẩn AuditSoft) ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #0284c7',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: 700 }}>
              Phân Tích Sổ NKC & Đồ Thị Tương Quan Tài Chính
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
              }}
            >
              Chuẩn Mực VSA 520
            </span>
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
            Bóc tách EBITDA 30% Lãi vay (NĐ 132/2020), Quét nghi ngờ Bên liên quan (VSA 550), Tỷ trọng Pareto, Ma trận 12 tháng & Đồ thị tương quan.
          </div>
        </div>

        {filePath ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '12px',
                background: '#ecfdf5',
                color: '#047857',
                padding: '5px 12px',
                borderRadius: '6px',
                fontWeight: 600,
                border: '1px solid #a7f3d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              Sổ NKC: {filePath.split(/\\|\//).pop()}
            </span>
            <button
              type="button"
              onClick={() => void handlePickAccountingFile()}
              style={{
                background: '#ffffff',
                color: '#0284c7',
                border: '1px solid #bae6fd',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f9ff'
                e.currentTarget.style.borderColor = '#0284c7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.borderColor = '#bae6fd'
              }}
              title="Bấm để chọn file Excel khác hoặc kéo thả trực tiếp file mới vào màn hình"
            >
              Đổi file Sổ NKC
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handlePickAccountingFile()}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: '0 1px 2px rgba(2, 132, 199, 0.25)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0369a1')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0284c7')}
          >
            Chọn hoặc Kéo thả file Sổ NKC vào đây
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#0284c7', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.4rem' }}>⏳ {loadingMsg}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Hệ thống đang xử lý dữ liệu kiểm toán...</div>
        </div>
      )}

      {/* Nội dung phân tích Sổ NKC */}
      <div>
          {glResult ? (
            <GlAnalyticsTab data={glResult} />
          ) : (
            !isLoading && (
              <div
                style={{
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  color: '#64748b',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📂</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Chưa có dữ liệu Sổ NKC
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
                  Vui lòng chọn file Excel sổ kế toán hoặc kéo thả trực tiếp file vào màn hình để tự động bóc tách EBITDA, quét giao dịch bên liên quan và phân tích biến động 12 tháng.
                </div>
                <button
                  type="button"
                  onClick={() => void handlePickAccountingFile()}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 22px',
                    borderRadius: '7px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#0369a1')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#0284c7')}
                >
                  Chọn file Excel kế toán
                </button>
              </div>
            )
          )}
        </div>
    </div>
  )
}
