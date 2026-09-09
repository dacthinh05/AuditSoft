/**
 * Tiện ích hỗ trợ kéo thả file Excel NKC trong Electron/Renderer.
 */

export function extractDroppedFilePath(file: File): string | null {
  if (!file) return null

  if (typeof window.auditsoft?.getPathForFile === 'function') {
    try {
      const p = window.auditsoft.getPathForFile(file)
      if (p && typeof p === 'string' && p.trim().length > 0) {
        return p
      }
    } catch {
      // Bỏ qua lỗi và thử fallback
    }
  }

  if ('path' in file && typeof file.path === 'string' && file.path.trim().length > 0) {
    return file.path
  }

  return null
}

export function isExcelOrCsvPath(pathOrName: string): boolean {
  return /\.(xlsx|xlsm|xls|csv)$/i.test(pathOrName.trim())
}
