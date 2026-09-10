import { useState, type DragEvent } from 'react'

interface Props {
  onFilesSelected: (filePaths: string[]) => void
  disabled?: boolean
}

export function TaxDropZone({ onFilesSelected, disabled }: Props): JSX.Element {
  const [isDragOver, setIsDragOver] = useState(false)

  function handleDragOver(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragOver(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    const paths: string[] = []

    for (const f of files) {
      if (window.auditsoft?.getPathForFile) {
        const p = window.auditsoft.getPathForFile(f)
        if (p) paths.push(p)
      } else if ('path' in f && typeof (f as { path: string }).path === 'string') {
        paths.push((f as { path: string }).path)
      }
    }

    if (paths.length > 0) {
      onFilesSelected(paths)
    }
  }

  async function handlePickClick(): Promise<void> {
    if (disabled || !window.auditsoft?.pickTaxFiles) return
    try {
      const res = await window.auditsoft.pickTaxFiles()
      if (!res.canceled && res.filePaths.length > 0) {
        onFilesSelected(res.filePaths)
      }
    } catch (err) {
      console.warn('Lỗi khi chọn file:', err)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handlePickClick}
      style={{
        border: `2px dashed ${isDragOver ? '#0284c7' : '#93c5fd'}`,
        backgroundColor: isDragOver ? '#f0f9ff' : '#f8fafc',
        borderRadius: '12px',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div style={{ fontSize: '2.5rem', color: '#0284c7', marginBottom: '0.5rem' }}>📥</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
        Kéo thả nhiều file XML hoặc file ZIP tờ khai thuế vào đây
      </div>
      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
        Hỗ trợ: Tờ khai 01/GTGT (Tháng/Quý, Chính thức & Bổ sung), Tờ khai 05/KK-TNCN, 05/QTT-TNCN
      </div>
      <button
        type="button"
        disabled={disabled}
        style={{
          background: '#0284c7',
          color: '#ffffff',
          border: 'none',
          padding: '0.5rem 1.25rem',
          borderRadius: '6px',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '0.85rem',
          boxShadow: '0 1px 2px rgba(2, 132, 199, 0.2)',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#0369a1')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#0284c7')}
      >
        Hoặc bấm để duyệt tệp từ máy tính
      </button>
    </div>
  )
}
