import React, { useState } from 'react'
import { useTrialExport } from '../../../shared/license'
import { useApp } from '../../state/store'
import { useEffect } from 'react'
import { HtkkLocalBanner } from './HtkkLocalBanner'
import { Qtt03DropZone } from './Qtt03DropZone'
import { Qtt03KpiCards } from './Qtt03KpiCards'
import { Qtt03ReconcileTabs } from './Qtt03ReconcileTabs'
import { Qtt03ExportModal } from './Qtt03ExportModal'
import { Qtt03Migrator, type MigrationResult } from '../../../domain/etax/Qtt03Migrator'
import { EtaxXmlParser } from '../../../domain/etax/EtaxXmlParser'
import { Qtt03Validator } from '../../../domain/etax/Qtt03Validator'
import type { Qtt03Document, Qtt03ReconcileSummary } from '../../../domain/etax/types'

export const Qtt03ConverterPage: React.FC = () => {
  const [mode, setMode] = useState<'auto' | 'custom'>('auto')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [bannerKey, setBannerKey] = useState(0)
  const [localAppVersion, setLocalAppVersion] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.auditsoft && typeof window.auditsoft.detectLocalHtkk === 'function') {
      void window.auditsoft.detectLocalHtkk().then((info) => {
        if (info.isInstalled && info.appVersion) {
          setLocalAppVersion(info.appVersion)
        }
      })
    }
  }, [])

  const [migratedResult, setMigratedResult] = useState<MigrationResult | null>(null)
  const [oldDoc, setOldDoc] = useState<Qtt03Document | null>(null)
  const [newDoc, setNewDoc] = useState<Qtt03Document | null>(null)
  const [summary, setSummary] = useState<Qtt03ReconcileSummary | null>(null)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const handleFilesSelected = (oldXml: string, templateXml?: string, _oldName?: string) => {
    try {
      setLoading(true)
      setError(null)

      // 1. Phân tích tờ khai cũ
      const parsedOld = EtaxXmlParser.parseQtt03(oldXml)
      setOldDoc(parsedOld)

      // 2. Chuyển đổi theo chế độ
      let result: MigrationResult
      if (mode === 'auto' || !templateXml) {
        result = Qtt03Migrator.migrateAuto(oldXml, { localAppVersion })
      } else {
        result = Qtt03Migrator.migrateWithCustomTemplate(oldXml, templateXml)
      }

      setMigratedResult(result)

      // 3. Phân tích tờ khai mới sau chuyển đổi
      const parsedNew = EtaxXmlParser.parseQtt03(result.migratedXml)
      setNewDoc(parsedNew)

      // 4. Đối chiếu kiểm định số liệu (Variance = 0)
      const reconcileReport = Qtt03Validator.validate(parsedOld, parsedNew)
      setSummary(reconcileReport)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Lỗi trong quá trình chuyển đổi: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setMigratedResult(null)
    setOldDoc(null)
    setNewDoc(null)
    setSummary(null)
    setError(null)
  }

  const exportFileName = oldDoc
    ? `03_TNDN_${oldDoc.generalInfo.kyKKhai.kyKKhaiDenNgay.slice(-4) || '2025'}_${oldDoc.generalInfo.mst || 'MST'}_TT80_Chuan.xml`
    : '03_TNDN_TT80_Chuan.xml'

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Tiêu đề trang */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Chuyển Đổi Tờ Khai Quyết Toán Thuế TNDN (Mẫu 03/TNDN)
            </h1>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
              Thông tư 80/2021/TT-BTC
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
            Tự động nâng cấp phiên bản tờ khai và toàn bộ các phụ lục đính kèm, khắc phục lỗi không hợp lệ cấu trúc XSD
          </div>
        </div>

        {summary && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Chuyển đổi tệp khác
            </button>
            <button
              type="button"
              onClick={() => {
                const trial = useTrialExport()
                if (!trial.allowed) {
                  setError(trial.message)
                  useApp.getState().setLicenseModalOpen(true)
                  useApp.getState().refreshTrialStatus()
                  return
                }
                useApp.getState().refreshTrialStatus()
                setExportModalOpen(true)
              }}
              style={{
                padding: '7px 18px',
                borderRadius: '6px',
                border: 'none',
                background: '#059669',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Xuất tệp XML TT80
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Thanh trạng thái HTKK trên máy và khuôn mẫu đang áp dụng */}
      <HtkkLocalBanner key={bannerKey} onTemplateChanged={() => setBannerKey((k) => k + 1)} />

      {/* Vùng nạp tệp */}
      {!summary && (
        <Qtt03DropZone
          mode={mode}
          onModeChange={setMode}
          onFilesSelected={handleFilesSelected}
          onTemplateSaved={() => setBannerKey((k) => k + 1)}
          isLoading={loading}
        />
      )}

      {/* Kết quả sau khi chuyển đổi và đối chiếu */}
      {summary && newDoc && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Thông tin KPI số liệu */}
          <Qtt03KpiCards document={newDoc} summary={summary} />

          {/* Các bước chuẩn hóa đã thực hiện */}
          {migratedResult && migratedResult.changesApplied.length > 0 && (
            <div style={{ background: '#f8fafc', padding: '10px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Chi tiết xử lý kỹ thuật:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {migratedResult.changesApplied.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Bảng đối chiếu các Sub-Tabs động (Tờ khai chính + Tất cả phụ lục) */}
          <Qtt03ReconcileTabs summary={summary} />

          {/* Hộp thoại xuất XML */}
          <Qtt03ExportModal
            isOpen={exportModalOpen}
            onClose={() => setExportModalOpen(false)}
            xmlContent={migratedResult?.migratedXml || ''}
            defaultFileName={exportFileName}
          />
        </div>
      )}
    </div>
  )
}
