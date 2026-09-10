import fs from 'node:fs'
import path from 'node:path'

/**
 * Ranh giới đọc file cho IPC (SEC-H4) — pure, không phụ thuộc Electron nên test được trực tiếp.
 * Renderer chỉ được đọc file audit đúng định dạng, tồn tại, là file thường và trong giới hạn dung lượng.
 */

const MAX_AUDIT_FILE_BYTES = 200 * 1024 * 1024

const WORKBOOK_EXTS = ['.xlsx', '.xlsm', '.xls', '.csv']
const XML_EXTS = ['.xml']
const ARCHIVE_EXTS = ['.xml', '.zip']

export type AuditFileKind = 'workbook' | 'xml' | 'archive'

function allowedExts(kind: AuditFileKind): string[] {
  if (kind === 'xml') return XML_EXTS
  if (kind === 'archive') return ARCHIVE_EXTS
  return WORKBOOK_EXTS
}

/** Trả về absolute path sau khi qua gate; throw kèm message tiếng Việt khi từ chối. */
export function assertAuditFileReadable(filePath: unknown, kind: AuditFileKind): string {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new Error('Đường dẫn file không hợp lệ.')
  }
  const abs = path.resolve(filePath.trim())
  const ext = path.extname(abs).toLowerCase()
  const allowed = allowedExts(kind)
  if (!allowed.includes(ext)) {
    throw new Error(
      `Định dạng file không được phép (${ext || 'không đuôi'}). Chỉ nhận: ${allowed.join(', ')}.`,
    )
  }
  let st: fs.Stats
  try {
    st = fs.statSync(abs)
  } catch {
    throw new Error('Không tìm thấy file trên đĩa.')
  }
  if (!st.isFile()) {
    throw new Error('Đường dẫn không phải file dữ liệu.')
  }
  if (st.size > MAX_AUDIT_FILE_BYTES) {
    throw new Error('File vượt quá 200MB — hãy chia nhỏ trước khi nạp.')
  }
  return abs
}

/** Custom path cho detectLocalHtkk: phải là thư mục tồn tại (bỏ trống = quét mặc định). */
export function assertAuditDirectory(dirPath: unknown): string | undefined {
  if (dirPath == null || (typeof dirPath === 'string' && dirPath.trim() === '')) return undefined
  if (typeof dirPath !== 'string') throw new Error('Đường dẫn thư mục không hợp lệ.')
  const abs = path.resolve(dirPath.trim())
  let st: fs.Stats
  try {
    st = fs.statSync(abs)
  } catch {
    throw new Error('Không tìm thấy thư mục đã chỉ định.')
  }
  if (!st.isDirectory()) throw new Error('Đường dẫn phải là thư mục.')
  return abs
}
