import React, { useState, useCallback, useEffect } from 'react'
import { IconDownloadCloud } from '../Icons'
import { B410SuccessModal } from './B410SuccessModal'
import { useApp } from '../../state/store'
import { useTrialExport } from '../../../shared/license'
export interface FileStatus {
  path: string
  name: string
  status: 'pending' | 'processing' | 'success' | 'error'
  message?: string
}

export const B410DropZone: React.FC = () => {
  const [files, setFiles] = useState<FileStatus[]>([])
  const [masterTemplate, setMasterTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [report, setReport] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (isProcessing) return

    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter(f => (f.name.toLowerCase().endsWith('.xls') || f.name.toLowerCase().endsWith('.xlsx')) && !f.name.startsWith('~$'))
      .map(f => {
        let filePath = f.name
        if (window.auditsoft && typeof window.auditsoft.getPathForFile === 'function') {
          const resolved = window.auditsoft.getPathForFile(f)
          if (resolved) filePath = resolved
        } else if ('path' in f && typeof (f as unknown as { path?: string }).path === 'string') {
          filePath = (f as unknown as { path: string }).path
        }
        return {
          path: filePath,
          name: f.name,
          status: 'pending' as const
        }
      })

    if (droppedFiles.length > 0) {
      setFiles(prev => {
        const existingPaths = new Set(prev.map(p => p.path))
        const filtered = droppedFiles.filter(item => !existingPaths.has(item.path))
        return [...prev, ...filtered]
      })
    }
  }, [isProcessing])

  // Hỗ trợ dán file trực tiếp từ Clipboard (Ctrl + V)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (isProcessing || !e.clipboardData) return
      const pastedFiles = Array.from(e.clipboardData.files)
        .filter(f => (f.name.toLowerCase().endsWith('.xls') || f.name.toLowerCase().endsWith('.xlsx')) && !f.name.startsWith('~$'))
      if (pastedFiles.length > 0) {
        const newItems: FileStatus[] = pastedFiles.map(f => {
          let filePath = f.name
          if (window.auditsoft && typeof window.auditsoft.getPathForFile === 'function') {
            const resolved = window.auditsoft.getPathForFile(f)
            if (resolved) filePath = resolved
          } else if ('path' in f && typeof (f as unknown as { path?: string }).path === 'string') {
            filePath = (f as unknown as { path: string }).path
          }
          return {
            path: filePath,
            name: f.name,
            status: 'pending' as const,
          }
        })
        setFiles(prev => {
          const existingPaths = new Set(prev.map(p => p.path))
          const filtered = newItems.filter(item => !existingPaths.has(item.path))
          return [...prev, ...filtered]
        })
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [isProcessing])
  const handleSelectFiles = async () => {
    if (isProcessing || !window.auditsoft) return
    const res = await window.auditsoft.pickWorkbook()
    if (res && !res.canceled && typeof res.filePath === 'string') {
      const chosenPath: string = res.filePath
      setFiles(prev => {
        if (prev.some(f => f.path === chosenPath)) return prev
        const name = chosenPath.split(/[\\/]/).pop() || chosenPath
        return [...prev, { path: chosenPath, name, status: 'pending' }]
      })
    }
  }

  const handleSelectMasterTemplate = async () => {
    if (!window.auditsoft) return
    const res = await window.auditsoft.pickWorkbook()
    if (res && !res.canceled && res.filePath) {
      setMasterTemplate(res.filePath)
    }
  }
  const handleDropMasterTemplate = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (isProcessing) return

    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter(f => f.name.toLowerCase().endsWith('.xls') || f.name.toLowerCase().endsWith('.xlsx'))

    if (droppedFiles.length > 0 && droppedFiles[0]) {
      const f = droppedFiles[0]
      let filePath = f.name
      if (window.auditsoft && typeof window.auditsoft.getPathForFile === 'function') {
        const resolved = window.auditsoft.getPathForFile(f)
        if (resolved) filePath = resolved
      } else if ('path' in f && typeof (f as unknown as { path?: string }).path === 'string') {
        filePath = (f as unknown as { path: string }).path
      }
      setMasterTemplate(filePath)
    }
  }, [isProcessing])

  const handleSetAsMasterTemplate = (filePath: string) => {
    if (isProcessing) return
    if (masterTemplate === filePath) {
      setMasterTemplate('') // toggle off
    } else {
      setMasterTemplate(filePath)
      // Tự động đẩy file Trưởng Nhóm lên vị trí đầu tiên (Index 0)
      setFiles(prev => {
        const target = prev.find(f => f.path === filePath)
        if (!target) return prev
        const rest = prev.filter(f => f.path !== filePath)
        return [target, ...rest]
      })
    }
  }

  const _handleMoveUp = (index: number) => {
    if (index <= 0 || isProcessing) return
    setFiles(prev => {
      const newFiles = [...prev]
      const current = newFiles[index]
      const target = newFiles[index - 1]
      if (current && target) {
        newFiles[index - 1] = current
        newFiles[index] = target
      }
      return newFiles
    })
  }

  const _handleMoveDown = (index: number) => {
    if (index >= files.length - 1 || isProcessing) return
    setFiles(prev => {
      const newFiles = [...prev]
      const current = newFiles[index]
      const target = newFiles[index + 1]
      if (current && target) {
        newFiles[index + 1] = current
        newFiles[index] = target
      }
      return newFiles
    })
  }

  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    if (isProcessing) return
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleItemDragOver = (e: React.DragEvent) => {
    if (isProcessing || draggedIndex === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleItemDrop = (e: React.DragEvent, targetIndex: number) => {
    if (isProcessing || draggedIndex === null) return
    e.preventDefault()
    if (draggedIndex !== targetIndex) {
      setFiles(prev => {
        const newFiles = [...prev]
        const item = newFiles[draggedIndex]
        if (item) {
          newFiles.splice(draggedIndex, 1)
          newFiles.splice(targetIndex, 0, item)
        }
        return newFiles
      })
    }
    setDraggedIndex(null)
  }
  const handleRemoveFile = (index: number) => {
    if (isProcessing) return
    const target = files[index]
    if (target && target.path === masterTemplate) {
      setMasterTemplate('')
    }
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    if (isProcessing) return
    setFiles([])
    setReport(null)
  }

  const handleProcess = async () => {
    if (files.length === 0 || isProcessing) return

    const trialCheck = useTrialExport()
    if (!trialCheck.allowed) {
      useApp.getState().setError(trialCheck.message)
      useApp.getState().setLicenseModalOpen(true)
      useApp.getState().refreshTrialStatus()
      return
    }

    setIsProcessing(true)
    setReport(null)
    setFiles(files.map(f => ({ ...f, status: 'processing' })))

    try {
      if (!window.auditsoft?.consolidateB410) {
        throw new Error('Tính năng tổng hợp B410 chưa được hỗ trợ trên môi trường này.')
      }

      const filePaths = files.map(f => f.path)
      const res = await window.auditsoft.consolidateB410({
        masterTemplatePath: masterTemplate,
        sourceFiles: filePaths
      })

      if (res.success) {
        setFiles(files.map(f => ({ ...f, status: 'success', message: 'Đã gộp thành công' })))
        setReport(res)

        // Mở Custom Modal thông báo gộp thành công & hỏi mở file
        if (res.outputPath) {
          setIsSuccessModalOpen(true)
        }
        useApp.getState().refreshTrialStatus()
      } else {
        setFiles(files.map(f => ({ ...f, status: 'error', message: res.message || 'Thất bại' })))
        setReport(res)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setFiles(files.map(f => ({ ...f, status: 'error', message: msg })))
      setReport({ success: false, message: msg })
    } finally {
      setIsProcessing(false)
    }
  }
  const handleDownloadTemplate = async () => {
    if (isProcessing || !window.auditsoft?.downloadB410Template) return
    try {
      const res = await window.auditsoft.downloadB410Template()
      if (res.ok && res.outPath) {
        alert(`Đã tải biểu mẫu B410 chuẩn về thành công tại:\n${res.outPath}`)
      }
    } catch (err: unknown) {
      alert(`Lỗi khi tải biểu mẫu: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleOpenFile = async (p?: string) => {
    if (p && window.auditsoft?.openPath) {
      try {
        await window.auditsoft.openPath(p)
      } catch (err) {
        console.error('Lỗi khi mở file Excel:', err)
      }
    }
  }

  const handleOpenFolder = async (p?: string) => {
    if (!p) return
    try {
      if (window.auditsoft?.showItemInFolder) {
        await window.auditsoft.showItemInFolder(p)
      } else if (window.auditsoft?.openPath) {
        const folder = p.replace(/[\\/][^\\/]+$/, '')
        await window.auditsoft.openPath(folder)
      }
    } catch (err) {
      console.error('Lỗi khi mở thư mục chứa file:', err)
    }
  }

  return (
    <div className="b410-module-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Info Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
              Tổng Hợp B410 — Giấy Lưu Ý & Sai Sót Kiểm Toán
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => void handleDownloadTemplate()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#0f172a',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
              title="Tải file biểu mẫu B410 chuẩn (.xlsx) về máy để chỉnh sửa cấu trúc"
            >
              <IconDownloadCloud size={15} style={{ color: '#2563eb' }} />
              Tải Biểu Mẫu Chuẩn B410 (.xlsx)
            </button>
            <span style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
              Pure TypeScript Pipeline
            </span>
          </div>
        </div>

        {/* Master Template Selector Option */}
        {/* Master Template DropZone & Selector */}
        <div
          onDrop={handleDropMasterTemplate}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
          style={{
            marginTop: '20px',
            padding: '14px 18px',
            background: masterTemplate ? '#f0fdf4' : '#f8fafc',
            borderRadius: '10px',
            border: `2px dashed ${masterTemplate ? '#22c55e' : '#cbd5e1'}`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
            <span style={{ display: 'inline-flex', padding: '4px 8px', background: masterTemplate ? '#dcfce7' : '#e2e8f0', borderRadius: '6px', color: masterTemplate ? '#16a34a' : '#475569', fontSize: '11px', fontWeight: 700 }}>{masterTemplate ? 'FILE MẪU' : 'CHỌN MẪU'}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: masterTemplate ? '#15803d' : '#334155' }}>
                {masterTemplate ? 'Đang sử dụng File Mẫu của Trưởng nhóm:' : 'Kéo thả hoặc Chọn File Mẫu B410 Trưởng nhóm (Tùy chọn):'}
              </div>
              <div style={{ fontSize: '12px', color: masterTemplate ? '#166534' : '#64748b', wordBreak: 'break-all', marginTop: '2px' }}>
                {masterTemplate ? masterTemplate : 'Thả 1 file Excel mẫu vào đây, hoặc chọn trực tiếp bên dưới. (Nếu không chọn, sẽ tự dùng mẫu chuẩn B410 mặc định)'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {masterTemplate && (
              <button
                type="button"
                onClick={() => setMasterTemplate('')}
                style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
              >
                Dùng mẫu mặc định
              </button>
            )}
            <button
              type="button"
              onClick={handleSelectMasterTemplate}
              style={{ padding: '6px 14px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: '#1e293b' }}
            >
              {masterTemplate ? 'Đổi File Mẫu Khác' : 'Chọn File Mẫu'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: '2px dashed #94a3b8',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          background: isProcessing ? '#f8fafc' : '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
        onClick={handleSelectFiles}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄📥</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 6px 0' }}>
          Kéo & thả file B410 của các thành viên vào đây
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
          Hỗ trợ song song cả file Excel 97-2003 (.xls) và Excel mới (.xlsx)
        </p>
        <button
          type="button"
          style={{
            padding: '8px 20px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
          onClick={(e) => { e.stopPropagation(); handleSelectFiles() }}
        >
          Chọn file từ máy tính
        </button>
      </div>

      {/* File List Table */}
      {files.length > 0 && (
        <div style={{ marginTop: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Danh sách file cần gộp ({files.length})
            </h3>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isProcessing}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
            >
              Xóa tất cả
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {files.map((file, idx) => (
              <div
                key={idx}
                draggable={!isProcessing}
                onDragStart={(e) => handleItemDragStart(e, idx)}
                onDragOver={handleItemDragOver}
                onDrop={(e) => handleItemDrop(e, idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: masterTemplate === file.path ? '#f0fdf4' : draggedIndex === idx ? '#f1f5f9' : '#ffffff',
                  border: `1.5px solid ${masterTemplate === file.path ? '#4ade80' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  boxShadow: masterTemplate === file.path ? '0 1px 4px rgba(34, 197, 94, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                  cursor: !isProcessing ? 'grab' : 'default'
                }}
              >
                {/* Drag Grip Handle + Order Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
                  <span
                    style={{
                      fontSize: '16px',
                      color: '#94a3b8',
                      cursor: 'grab',
                      userSelect: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 4px',
                    }}
                    title="Bấm giữ và kéo thả để đổi thứ tự file"
                  >
                    ⠿
                  </span>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: masterTemplate === file.path ? '#22c55e' : '#e2e8f0',
                    color: masterTemplate === file.path ? '#ffffff' : '#475569',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'none',
                  }}>
                    {idx + 1}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
                  <span style={{ fontSize: '18px' }}>{masterTemplate === file.path ? '⭐' : file.name.endsWith('.xls') ? '📊' : '📑'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: masterTemplate === file.path ? '#166534' : '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{file.name}</span>
                      {masterTemplate === file.path && (
                        <span style={{ background: '#22c55e', color: '#ffffff', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          FILE MẪU MASTER
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{file.path}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {!isProcessing && (
                    <button
                      type="button"
                      onClick={() => handleSetAsMasterTemplate(file.path)}
                      style={{
                        padding: '4px 10px',
                        background: masterTemplate === file.path ? '#dcfce7' : '#ffffff',
                        border: `1px solid ${masterTemplate === file.path ? '#86efac' : '#cbd5e1'}`,
                        color: masterTemplate === file.path ? '#166534' : '#475569',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Dùng cấu trúc tiêu đề của file này làm chuẩn Master"
                    >
                      {masterTemplate === file.path ? '✓ Trưởng Nhóm' : 'Trưởng Nhóm'}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: file.status === 'success' ? '#dcfce7' : file.status === 'error' ? '#fee2e2' : file.status === 'processing' ? '#fef3c7' : '#f1f5f9',
                    color: file.status === 'success' ? '#166534' : file.status === 'error' ? '#991b1b' : file.status === 'processing' ? '#92400e' : '#475569'
                  }}>
                    {file.status === 'success' ? '✓ Đã gộp' : file.status === 'processing' ? '⏳ Đang xử lý...' : file.status === 'error' ? '✕ Lỗi' : 'Sẵn sàng'}
                  </span>
                  {!isProcessing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={handleProcess}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: isProcessing ? '#94a3b8' : '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isProcessing ? '⏳ Đang tổng hợp bằng Excel COM...' : '🚀 BẮT ĐẦU TỔNG HỢP B410 THÀNH 1 FILE MASTER'}
            </button>
          </div>
        </div>
      )}

      {/* Result Card */}
      {report && (
        <div style={{
          marginTop: '24px',
          padding: '20px',
          borderRadius: '12px',
          background: report.success ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${report.success ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: report.success ? '#166534' : '#991b1b', marginBottom: '4px' }}>
              {report.success ? '🎉 Tổng Hợp Thành Công!' : '⚠️ Có lỗi xảy ra trong quá trình tổng hợp'}
            </div>
            <div style={{ fontSize: '13px', color: report.success ? '#15803d' : '#b91c1c' }}>
              {report.message}
            </div>
            {report.outputPath && (
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px', wordBreak: 'break-all' }}>
                Đường dẫn file: <strong>{report.outputPath}</strong>
              </div>
            )}
          </div>

          {report.outputPath && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleOpenFolder(report.outputPath)}
                style={{
                  padding: '8px 14px',
                  background: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Mở thư mục
              </button>
              <button
                type="button"
                onClick={() => handleOpenFile(report.outputPath)}
                style={{
                  padding: '8px 16px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Mở file Excel Master
              </button>
            </div>
          )}
        </div>
      )}
      {/* Success Modal Popup */}
      <B410SuccessModal
        isOpen={isSuccessModalOpen}
        outputPath={report?.outputPath}
        message={report?.message}
        fileCount={files.length}
        onClose={() => setIsSuccessModalOpen(false)}
        onOpenFile={(p) => handleOpenFile(p)}
        onOpenFolder={(p) => handleOpenFolder(p)}
      />
    </div>
  )
}
export default B410DropZone
