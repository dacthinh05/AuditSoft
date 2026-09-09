import React, { useState, useRef } from 'react'
import { PersistentTemplateStore } from '../../../domain/etax/PersistentTemplateStore'

interface Qtt03DropZoneProps {
  mode: 'auto' | 'custom'
  onModeChange: (mode: 'auto' | 'custom') => void
  onFilesSelected: (oldXml: string, templateXml?: string, oldName?: string) => void
  onTemplateSaved?: () => void
  isLoading?: boolean
}

export const Qtt03DropZone: React.FC<Qtt03DropZoneProps> = ({
  mode,
  onModeChange,
  onFilesSelected,
  onTemplateSaved,
  isLoading = false,
}) => {
  const [savedAsDefault, setSavedAsDefault] = useState(false)
  const [oldFile, setOldFile] = useState<{ name: string; content: string } | null>(null)
  const [templateFile, setTemplateFile] = useState<{ name: string; content: string } | null>(null)
  const [dragOverOld, setDragOverOld] = useState(false)
  const [dragOverTemplate, setDragOverTemplate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const oldInputRef = useRef<HTMLInputElement>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)

  const handleReadXml = (file: File, isOld: boolean) => {
    setError(null)
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError(`Tệp "${file.name}" không phải là định dạng XML.`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = (e.target?.result as string) || ''
      if (!content.includes('<') || (!content.includes('HSoThueDTu') && !content.includes('HSoKhaiThue'))) {
        setError(`Tệp "${file.name}" không có cấu trúc tờ khai thuế điện tử XML hợp lệ.`)
        return
      }

      if (isOld) {
        setOldFile({ name: file.name, content })
        if (mode === 'auto') {
          onFilesSelected(content, undefined, file.name)
        } else if (templateFile) {
          onFilesSelected(content, templateFile.content, file.name)
        }
      } else {
        setTemplateFile({ name: file.name, content })
        if (oldFile) {
          onFilesSelected(oldFile.content, content, oldFile.name)
        }
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleReset = () => {
    setOldFile(null)
    setTemplateFile(null)
    setSavedAsDefault(false)
    setError(null)
  }

  const handleSaveAsDefault = () => {
    if (!templateFile) return
    PersistentTemplateStore.saveTemplate(templateFile.content, templateFile.name)
    setSavedAsDefault(true)
    if (onTemplateSaved) onTemplateSaved()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Thanh chọn chế độ làm việc */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => {
              onModeChange('auto')
              if (oldFile) onFilesSelected(oldFile.content, undefined, oldFile.name)
            }}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              background: mode === 'auto' ? '#ffffff' : 'transparent',
              color: mode === 'auto' ? '#1e293b' : '#64748b',
              boxShadow: mode === 'auto' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            Chế độ tự động (1 tệp cũ)
          </button>
          <button
            type="button"
            onClick={() => {
              onModeChange('custom')
              if (oldFile && templateFile) onFilesSelected(oldFile.content, templateFile.content, oldFile.name)
            }}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              background: mode === 'custom' ? '#ffffff' : 'transparent',
              color: mode === 'custom' ? '#1e293b' : '#64748b',
              boxShadow: mode === 'custom' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            Chế độ dùng tệp mẫu (2 tệp: Cũ + Mẫu mới)
          </button>
        </div>

        {oldFile && (
          <button
            type="button"
            onClick={handleReset}
            style={{
              fontSize: '12px',
              padding: '4px 10px',
              color: '#64748b',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Chọn lại tệp khác
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Khung thả tệp */}
      <div style={{ display: 'grid', gridTemplateColumns: mode === 'auto' ? '1fr' : '1fr 1fr', gap: '16px' }}>
        {/* Khung 1: Tệp cũ */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOverOld(true) }}
          onDragLeave={() => setDragOverOld(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOverOld(false)
            if (e.dataTransfer.files[0]) handleReadXml(e.dataTransfer.files[0], true)
          }}
          onClick={() => oldInputRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragOverOld ? '#2563eb' : oldFile ? '#10b981' : '#cbd5e1'}`,
            borderRadius: '10px',
            padding: '28px 20px',
            textAlign: 'center',
            background: dragOverOld ? '#eff6ff' : oldFile ? '#f0fdf4' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <input
            ref={oldInputRef}
            type="file"
            accept=".xml"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) handleReadXml(e.target.files[0], true)
            }}
          />
          {oldFile ? (
            <div>
              <div style={{ fontWeight: 700, color: '#047857', fontSize: '13px', fontFamily: 'monospace' }}>{oldFile.name}</div>
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Đã tải dữ liệu tờ khai gốc thành công</div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                {mode === 'auto' ? 'Kéo thả tệp XML tờ khai 03/TNDN vào đây' : 'Bước 1: Kéo thả tệp XML tờ khai cũ'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Hoặc nhấp để chọn tệp .xml từ máy tính
              </div>
            </div>
          )}
        </div>

        {/* Khung 2: Tệp mẫu (chỉ hiện ở Chế độ 2) */}
        {mode === 'custom' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOverTemplate(true) }}
            onDragLeave={() => setDragOverTemplate(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOverTemplate(false)
              if (e.dataTransfer.files[0]) handleReadXml(e.dataTransfer.files[0], false)
            }}
            onClick={() => templateInputRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragOverTemplate ? '#2563eb' : templateFile ? '#10b981' : '#cbd5e1'}`,
              borderRadius: '10px',
              padding: '28px 20px',
              textAlign: 'center',
              background: dragOverTemplate ? '#eff6ff' : templateFile ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <input
              ref={templateInputRef}
              type="file"
              accept=".xml"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) handleReadXml(e.target.files[0], false)
              }}
            />
            {templateFile ? (
              <div>
                <div style={{ fontWeight: 700, color: '#047857', fontSize: '13px', fontFamily: 'monospace' }}>{templateFile.name}</div>
                <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Đã tải tệp mẫu mới thành công</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSaveAsDefault()
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border: '1px solid #059669',
                    background: savedAsDefault ? '#ecfdf5' : '#ffffff',
                    color: savedAsDefault ? '#047857' : '#059669',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {savedAsDefault ? 'Đã lưu làm khuôn mẫu mặc định' : 'Lưu tệp này làm khuôn mẫu mặc định'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                  Bước 2: Kéo thả tệp XML mẫu mới
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Tệp XML mẫu xuất từ HTKK phiên bản mới nhất
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '10px', color: '#2563eb', fontWeight: 500, fontSize: '12px' }}>
          Đang phân tích cấu trúc và chuyển đổi dữ liệu...
        </div>
      )}
    </div>
  )
}
