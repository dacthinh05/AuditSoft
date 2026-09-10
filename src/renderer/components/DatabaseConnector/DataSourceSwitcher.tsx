import React from 'react'
import { useApp } from '../../state/store'

export const DataSourceSwitcher: React.FC = () => {
  const dataSourceType = useApp((s) => s.dataSourceType)
  const setDataSourceType = useApp((s) => s.setDataSourceType)
  const setDbModalOpen = useApp((s) => s.setDbModalOpen)

  return (
    <div className="data-source-switcher" role="tablist" aria-label="Chọn nguồn dữ liệu đối chiếu">
      <button
        type="button"
        role="tab"
        aria-selected={dataSourceType === 'excel'}
        onClick={() => setDataSourceType('excel')}
        className={`source-switch-btn ${dataSourceType === 'excel' ? 'active' : ''}`}
      >
        <span className="switch-btn-icon" aria-hidden="true">📁</span>
        <span className="switch-btn-text">File Excel <span className="switch-btn-sub">(.xlsx, .csv)</span></span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={dataSourceType === 'database'}
        onClick={() => {
          setDataSourceType('database')
          setDbModalOpen(true)
        }}
        className={`source-switch-btn ${dataSourceType === 'database' ? 'active' : ''}`}
      >
        <span className="switch-btn-icon" aria-hidden="true">🗄️</span>
        <span className="switch-btn-text">Kết nối CSDL <span className="switch-btn-sub">(MISA / FAST)</span></span>
      </button>
    </div>
  )
}
