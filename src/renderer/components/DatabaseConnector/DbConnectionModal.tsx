import React, { useState } from 'react'
import { useApp } from '../../state/store'
import type { ColumnMapping, SourceKind } from '../../../domain/types'
import { DbPreviewTable, type PreviewRow } from './DbPreviewTable'

/** Chuyển bản ghi CSDL thành dòng 6 cột TT200 cho pipeline đối chiếu (khớp auto mapping 0-5). */
function recordsToReconcileRows(records: PreviewRow[]): unknown[][] {
  return records.map((r) => [
    r.entryDate ?? '',
    r.docNo ?? '',
    r.description ?? '',
    r.debitAccount ?? '',
    r.creditAccount ?? '',
    String(r.amount ?? '0'),
  ])
}

export const DbConnectionModal: React.FC = () => {
  const isOpen = useApp((s) => s.dbModalOpen)
  const setOpen = useApp((s) => s.setDbModalOpen)
  const setEngineStats = useApp((s) => s.setEngineStats)

  const [host, setHost] = useState('127.0.0.1')
  const [port, setPort] = useState('1433')
  const [database, setDatabase] = useState('MISA_SME_2024')
  const [username, setUsername] = useState('sa')
  const [password, setPassword] = useState('')
  const [fiscalYear, setFiscalYear] = useState('2024')
  const [preset, setPreset] = useState<'MISA' | 'FAST' | 'BRAVO' | 'CUSTOM'>('MISA')
  const [targetSide, setTargetSide] = useState<SourceKind>('BEFORE')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [fetching, setFetching] = useState(false)
  const [fetchProgress, setFetchProgress] = useState(0)

  if (!isOpen) return null

  const makeConfig = () => ({
    type: 'sql_server' as const,
    preset,
    host,
    port: parseInt(port, 10) || 1433,
    database,
    username,
    password,
    fiscalYear: parseInt(fiscalYear, 10) || 2024,
    options: {
      trustServerCertificate: true,
    },
  })

  const handleTestConnection = async () => {
    if (!window.auditsoft?.testDbConnection) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await window.auditsoft.testDbConnection(makeConfig())
      setTestResult(res)
    } catch (err) {
      setTestResult({
        success: false,
        message: `Lỗi kết nối: ${(err as Error).message}`,
      })
    } finally {
      setTesting(false)
    }
  }

  const handlePreview = async () => {
    if (!window.auditsoft?.previewDbSample) return
    setPreviewing(true)
    try {
      const rows = (await window.auditsoft.previewDbSample(makeConfig(), 10)) as PreviewRow[]
      setPreviewRows(rows || [])
    } catch (err) {
      setTestResult({
        success: false,
        message: `Lỗi xem trước: ${(err as Error).message}`,
      })
    } finally {
      setPreviewing(false)
    }
  }

  const handleFetchData = async () => {
    if (!window.auditsoft?.fetchDbEntries) return
    setFetching(true)
    setFetchProgress(0)

    const startTime = Date.now()
    try {
      const records = (await window.auditsoft.fetchDbEntries(makeConfig())) as PreviewRow[]
      const loadTime = Date.now() - startTime

      let totalAmt = 0n
      for (const r of records) {
        totalAmt += BigInt(String(r.amount || '0'))
      }

      setEngineStats({
        totalRows: records.length,
        totalAmount: totalAmt,
        loadTimeMs: loadTime,
      })

      // Đấu nối vào nguồn đối chiếu: nạp dòng 6 cột + cfg auto-mapping
      const st = useApp.getState()
      st.setCfg(targetSide, {
        kind: targetSide,
        filePath: `db://${preset}/${database}`,
        sheetName: '(csdl)',
        headerRow: 1,
        mapping: { date: 0, voucher: 1, description: 2, debit: 3, credit: 4, amount: 5 } as ColumnMapping,
      })
      st.setPasted(targetSide, recordsToReconcileRows(records))

      setOpen(false)
    } catch (err) {
      setTestResult({
        success: false,
        message: `Lỗi tải dữ liệu: ${(err as Error).message}`,
      })
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/30 dark:from-slate-800/60 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
              🗄️
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kết Nối Cơ Sở Dữ Liệu Kế Toán Doanh Nghiệp
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trích xuất trực tiếp Sổ Nhật ký chung từ MISA SME/AMIS, FAST, BRAVO qua mạng LAN
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Preset Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Mẫu phần mềm kế toán (Preset trích xuất)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'MISA', label: 'MISA SME / AMIS', icon: '⚡' },
                { key: 'FAST', label: 'FAST Accounting', icon: '🚀' },
                { key: 'BRAVO', label: 'BRAVO 7 / 8', icon: '🏢' },
                { key: 'CUSTOM', label: 'Tùy chỉnh SQL Server', icon: '⚙️' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setPreset(p.key as typeof preset)
                    if (p.key === 'MISA') setDatabase('MISA_SME_2024')
                    if (p.key === 'FAST') setDatabase('FAST_DATA_2024')
                    if (p.key === 'BRAVO') setDatabase('BRAVO_2024')
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    preset === p.key
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="text-base mb-1">{p.icon}</div>
                  <div>{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Máy chủ (Host / IP)
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost hoặc 192.168.1.xxx"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Cổng (Port)</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="1433"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Năm tài chính</label>
              <input
                type="number"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Tên CSDL (Database)</label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="Tên CSDL"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Tài khoản (User)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sa"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Mật khẩu (Password)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Test Status Alert */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              <span>{testResult.success ? '✅' : '❌'}</span>
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}

          {/* Preview Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Xem trước dữ liệu chứng từ (10 dòng)
              </span>
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewing}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 transition-all text-xs"
              >
                {previewing ? 'Đang đọc...' : '🔍 Lấy mẫu 10 dòng'}
              </button>
            </div>
            <DbPreviewTable rows={previewRows} />
          </div>
        </div>

        {/* Target Side Picker */}
        <div className="px-6 pb-4 flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Nạp dữ liệu vào:</span>
          <button
            type="button"
            onClick={() => setTargetSide('BEFORE')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${targetSide === 'BEFORE' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
          >
            Nguồn ① — TRƯỚC điều chỉnh
          </button>
          <button
            type="button"
            onClick={() => setTargetSide('AFTER')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${targetSide === 'AFTER' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
          >
            Nguồn ② — SAU điều chỉnh
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-300 transition-all text-xs flex items-center gap-2"
          >
            {testing ? 'Đang kiểm tra...' : '🔌 Kiểm tra kết nối'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-xl hover:bg-slate-100 transition-all text-xs"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleFetchData}
              disabled={fetching}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 text-xs flex items-center gap-2"
            >
              {fetching ? `Đang nạp (${fetchProgress})...` : '📥 Nạp dữ liệu vào AuditSoft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
