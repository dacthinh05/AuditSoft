import { ModuleGateBanner } from '../ModuleGateBanner'
import { useEffect, useState } from 'react'
import { useApp } from '../../state/store'
import type { TaxCrossReconciliationResult } from '../../../domain/analytics/TaxCrossReconciler'
import { TaxCrossReconciler } from '../../../domain/analytics/TaxCrossReconciler'
import { dtoToEntries } from './analyticsMappers'
import { TaxAnalyticsTab } from './TaxAnalyticsTab'

export function TaxStatsPage(): JSX.Element {
  const beforeCfg = useApp((s) => s.before.cfg)
  const afterCfg = useApp((s) => s.after.cfg)
  const glSnapshot = useApp((s) => s.glSnapshot)
  const setGlSnapshot = useApp((s) => s.setGlSnapshot)
  const taxData = useApp((s) => s.taxData)
  const setTaxData = useApp((s) => s.setTaxData)

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [reconResult, setReconResult] = useState<TaxCrossReconciliationResult | null>(null)

  const filePath = beforeCfg?.filePath || afterCfg?.filePath || ''
  const sheetName = beforeCfg?.sheetName || afterCfg?.sheetName
  const hasGl =
    glSnapshot != null &&
    glSnapshot.filePath === filePath &&
    (!sheetName || !glSnapshot.sheetName || glSnapshot.sheetName === sheetName) &&
    glSnapshot.journals.length > 0

  // Nạp snapshot Sổ NKC để đối chiếu chéo (chạy lại khi filePath hoặc sheetName thay đổi)
  useEffect(() => {
    if (!filePath || filePath === '(clipboard)' || !window.auditsoft?.auditAnalyze) return
    if (glSnapshot && glSnapshot.filePath === filePath && (!sheetName || glSnapshot.sheetName === sheetName)) return
    let cancelled = false
    async function loadGlSnapshot(): Promise<void> {
      setIsLoading(true)
      setLoadingMsg('Đang đọc Sổ NKC để đối chiếu chéo với tờ khai thuế...')
      try {
        const res = await window.auditsoft.auditAnalyze({ filePath, sheetName })
        if (cancelled) return
        setGlSnapshot({ filePath, sheetName, journals: res.journals || [] })
      } catch (err) {
        if (!cancelled) {
          // Không chặn luồng thuế: thiếu NKC thì trang vẫn thống kê tờ khai ở degraded mode
          setError(
            `Không đọc được Sổ NKC (${err instanceof Error ? err.message : String(err)}). Trang vẫn thống kê tờ khai thuế, cột đối chiếu 511/334 hiển thị '-'.`,
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadGlSnapshot()
    return () => {
      cancelled = true
    }
  }, [filePath, sheetName])
  // Tính lại đối chiếu mỗi khi tờ khai hoặc snapshot NKC thay đổi
  useEffect(() => {
    if (!taxData) {
      setReconResult(null)
      return
    }
    const entries = glSnapshot && glSnapshot.filePath === filePath ? dtoToEntries(glSnapshot.journals) : []
    setReconResult(TaxCrossReconciler.reconcile(entries, taxData.vatDeclarations, taxData.pitDeclarations))
  }, [taxData, glSnapshot, filePath])

  async function handleTaxFilesSelected(filePaths: string[]): Promise<void> {
    if (!window.auditsoft?.importTaxXmlFiles) return

    setIsLoading(true)
    setLoadingMsg(`Đang đọc ${filePaths.length} tệp tờ khai thuế...`)
    setError(null)

    try {
      const ingested = await window.auditsoft.importTaxXmlFiles(filePaths)
      setTaxData(ingested)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

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

  return (
    <div
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        height: '100%',
        overflowY: 'auto',
        background: '#f8fafc',
      }}
    >
      <ModuleGateBanner requirement="BEFORE" moduleName="Thống kê thuế" />
      {/* ── Header Banner ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #0d9488',
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
              Thống Kê Thuế GTGT/TNCN & Đối Chiếu Sổ NKC
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#f0fdfa',
                color: '#0f766e',
                border: '1px solid #99f6e4',
              }}
            >
              Đối Chiếu Thuế
            </span>
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
            Thống kê tờ khai 01/GTGT, 05/KK-TNCN, 05/QTT-TNCN theo kỳ và đối chiếu chéo doanh thu TK 511 cùng chi phí lương TK 334.
          </div>
        </div>

        {filePath ? (
          <span
            style={{
              fontSize: '12px',
              background: hasGl ? '#ecfdf5' : '#fffbeb',
              color: hasGl ? '#047857' : '#b45309',
              padding: '5px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              border: `1px solid ${hasGl ? '#a7f3d0' : '#fde68a'}`,
            }}
          >
            {hasGl ? `Sổ NKC: ${filePath.split(/\\|\//).pop()}` : 'Chưa có dữ liệu Sổ NKC'}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void handlePickAccountingFile()}
            style={{
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: '0 1px 2px rgba(13, 148, 136, 0.25)',
            }}
          >
            Nạp Sổ NKC để đối chiếu
          </button>
        )}
      </div>

      {/* ── Degraded mode: chưa có NKC ── */}
      {!hasGl && !isLoading && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span>
            Chưa có dữ liệu Sổ NKC — trang vẫn thống kê đầy đủ tờ khai thuế, các cột đối chiếu Doanh thu 511 / Lương 334 hiển
            thị dấu &apos;-&apos;. Nạp Sổ NKC để bật đối chiếu chéo.
          </span>
          <button
            type="button"
            onClick={() => void handlePickAccountingFile()}
            style={{
              background: '#ffffff',
              color: '#0d9488',
              border: '1px solid #0d9488',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '12.5px',
              whiteSpace: 'nowrap',
            }}
          >
            Nạp Sổ NKC
          </button>
        </div>
      )}

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
          {error}
        </div>
      )}

      <TaxAnalyticsTab
        taxData={taxData}
        reconResult={reconResult}
        onFilesSelected={handleTaxFilesSelected}
        isLoading={isLoading}
        hasGlData={hasGl}
      />
      {isLoading && loadingMsg && (
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>{loadingMsg}</div>
      )}
    </div>
  )
}
