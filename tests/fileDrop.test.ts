import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { extractDroppedFilePath, isExcelOrCsvPath } from '../src/renderer/lib/fileDrop'

describe('fileDrop utility', () => {
  describe('isExcelOrCsvPath', () => {
    it('nhận diện đúng các đuôi file Excel và CSV hợp lệ', () => {
      expect(isExcelOrCsvPath('MAU NKC.xlsx')).toBe(true)
      expect(isExcelOrCsvPath('C:\\Data\\NKC_2025.xlsm')).toBe(true)
      expect(isExcelOrCsvPath('D:/Desktop/so_cai.xls')).toBe(true)
      expect(isExcelOrCsvPath('data.csv')).toBe(true)
      expect(isExcelOrCsvPath('FILE_HOA_DON.XLSX')).toBe(true)
      expect(isExcelOrCsvPath('file.CSV')).toBe(true)
    })

    it('từ chối các định dạng không phải bảng tính Excel/CSV', () => {
      expect(isExcelOrCsvPath('report.pdf')).toBe(false)
      expect(isExcelOrCsvPath('document.docx')).toBe(false)
      expect(isExcelOrCsvPath('script.js')).toBe(false)
      expect(isExcelOrCsvPath('image.png')).toBe(false)
      expect(isExcelOrCsvPath('')).toBe(false)
    })
  })

  describe('extractDroppedFilePath', () => {
    beforeEach(() => {
      if (typeof globalThis.window === 'undefined') {
        globalThis.window = {} as never
      }
    })

    afterEach(() => {
      if (globalThis.window) {
        delete (globalThis.window as unknown as { auditsoft?: unknown }).auditsoft
      }
    })

    it('trích xuất file path qua window.auditsoft.getPathForFile khi có', () => {
      globalThis.window.auditsoft = {
        getPathForFile: () => 'D:\\Desktop\\AuditSoft\\MAU NKC.xlsx',
      } as never

      const dummyFile = { name: 'MAU NKC.xlsx' } as File
      const path = extractDroppedFilePath(dummyFile)
      expect(path).toBe('D:\\Desktop\\AuditSoft\\MAU NKC.xlsx')
    })

    it('fallback sang file.path nếu getPathForFile không khả dụng', () => {
      delete (globalThis.window as unknown as { auditsoft?: unknown }).auditsoft

      const dummyFile = {
        name: 'MAU NKC.xlsx',
        path: 'C:\\Users\\User\\Documents\\MAU NKC.xlsx',
      } as unknown as File

      const path = extractDroppedFilePath(dummyFile)
      expect(path).toBe('C:\\Users\\User\\Documents\\MAU NKC.xlsx')
    })

    it('trả về null nếu file không tồn tại hoặc không có đường dẫn', () => {
      delete (globalThis.window as unknown as { auditsoft?: unknown }).auditsoft
      expect(extractDroppedFilePath(null as unknown as File)).toBeNull()

      const fileWithoutPath = { name: 'test.xlsx' } as File
      expect(extractDroppedFilePath(fileWithoutPath)).toBeNull()
    })
  })
})
