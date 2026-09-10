import React from 'react'
import { useApp } from '../../state/store'

export const EngineStatusBadge: React.FC = () => {
  const engineType = useApp((s) => s.engineType)
  const stats = useApp((s) => s.engineStats)
  const isDuckDb = engineType === 'duckdb'

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
        isDuckDb
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
      }`}
      title={
        isDuckDb
          ? 'Động cơ DuckDB OLAP In-Process: Tối ưu phân tích cột và tăng tốc SQL gấp 30-50 lần.'
          : 'Động cơ In-Memory JS: Chế độ an toàn chuẩn.'
      }
    >
      <span className="text-sm">{isDuckDb ? '⚡' : '⚙️'}</span>
      <span>{isDuckDb ? 'DuckDB OLAP' : 'In-Memory JS'}</span>
      {stats && stats.totalRows > 0 && (
        <span className="opacity-80 font-mono text-[11px] ml-1 pl-1 border-l border-current">
          {stats.totalRows.toLocaleString('vi-VN')} dòng ({stats.loadTimeMs}ms)
        </span>
      )}
    </div>
  )
}
