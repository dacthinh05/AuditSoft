import crypto from 'node:crypto'
import type ExcelJS from 'exceljs'
import type { B410Image, B410ShapeFilterCriteria } from './B410Types'

export interface ShapeFilterResult {
  validImages: B410Image[]
  discardedCount: number
  discardReasons: { id: string; reason: string }[]
}

/**
 * Tạo chuỗi hash SHA256 cho buffer để chống trùng lặp ảnh
 */
export function hashImageBuffer(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex')
}
/**
 * Đọc kích thước tự nhiên của ảnh (Pixel -> Point) trực tiếp từ Buffer nhị phân
 */
export function getImageNaturalDimensions(buffer: Buffer, ext: string): { widthPt: number; heightPt: number } {
  try {
    const cleanExt = (ext || '').toLowerCase()
    if (cleanExt === 'png' && buffer.length >= 24) {
      const wPx = buffer.readUInt32BE(16)
      const hPx = buffer.readUInt32BE(20)
      if (wPx > 0 && hPx > 0 && wPx < 10000 && hPx < 10000) {
        return { widthPt: wPx * 0.75, heightPt: hPx * 0.75 }
      }
    }
    if (cleanExt === 'gif' && buffer.length >= 10) {
      const wPx = buffer.readUInt16LE(6)
      const hPx = buffer.readUInt16LE(8)
      if (wPx > 0 && hPx > 0) {
        return { widthPt: wPx * 0.75, heightPt: hPx * 0.75 }
      }
    }
    if ((cleanExt === 'jpeg' || cleanExt === 'jpg') && buffer.length >= 4) {
      let offset = 2
      while (offset < buffer.length - 8) {
        if (buffer[offset] === 0xff && (buffer[offset + 1] === 0xc0 || buffer[offset + 1] === 0xc2)) {
          const hPx = buffer.readUInt16BE(offset + 5)
          const wPx = buffer.readUInt16BE(offset + 7)
          if (wPx > 0 && hPx > 0) {
            return { widthPt: wPx * 0.75, heightPt: hPx * 0.75 }
          }
          break
        }
        offset++
      }
    }
  } catch {}
  return { widthPt: 300, heightPt: 100 }
}
/**
 * Lọc và chuẩn hóa các Shape / Ảnh trong worksheet theo tiêu chuẩn B410
 */
export function filterAndExtractShapes(
  ws: ExcelJS.Worksheet,
  wb: ExcelJS.Workbook,
  criteria: B410ShapeFilterCriteria
): ShapeFilterResult {
  const validImages: B410Image[] = []
  const discardReasons: { id: string; reason: string }[] = []
  const seenHashes = new Set<string>()

  const minDim = criteria.minDimensionPt ?? 2
  const rawImages = ws.getImages() || []

  for (let i = 0; i < rawImages.length; i++) {
    const rawImg = rawImages[i]
    if (!rawImg) continue

    const shapeId = `img_${rawImg.imageId}_${i}`

    // 1. Kiểm tra toạ độ neo (Range)
    if (!rawImg.range || !rawImg.range.tl) {
      discardReasons.push({ id: shapeId, reason: 'Shape không xác định được toạ độ neo (range.tl)' })
      continue
    }

    const tl = rawImg.range.tl
    const anchorRow = Math.floor(tl.row) + 1 // ExcelJS 0-indexed -> 1-indexed
    const _anchorCol = Math.floor(tl.col) + 1

    // 2. Kiểm tra vùng dữ liệu B410
    if (anchorRow < criteria.minDataRow || anchorRow > criteria.maxDataRow) {
      discardReasons.push({
        id: shapeId,
        reason: `Shape nằm ngoài vùng dữ liệu B410 (Hàng ${anchorRow}, yêu cầu ${criteria.minDataRow}..${criteria.maxDataRow})`,
      })
      continue
    }

    // 3. Kiểm tra hàng / cột có bị ẩn không
    try {
      const rowObj = ws.getRow(anchorRow)
      if (rowObj.hidden || (rowObj.height !== undefined && rowObj.height <= 0)) {
        discardReasons.push({ id: shapeId, reason: `Shape nằm trên hàng đang ẩn (Hàng ${anchorRow})` })
        continue
      }
    } catch {}

    // 4. Lấy dữ liệu Media từ Workbook
    let media: { buffer: Buffer; extension: string; type: string } | undefined
    try {
      const imgIdNum = typeof rawImg.imageId === 'number' ? rawImg.imageId : parseInt(String(rawImg.imageId), 10) || 0
      media = (wb.getImage(imgIdNum) as unknown) as { buffer: Buffer; extension: string; type: string }
    } catch {}
    if (!media || !media.buffer || media.buffer.length < 32) {
      discardReasons.push({ id: shapeId, reason: 'Shape không có dữ liệu hình ảnh hợp lệ (hoặc là OLE/Control rác)' })
      continue
    }

    // 5. Kiểm tra định dạng ảnh (chấp nhận PNG, JPEG, GIF, EMF, WMF)
    const ext = (media.extension || '').toLowerCase()
    const allowedExtensions: Record<string, boolean> = {
      png: true,
      jpeg: true,
      jpg: true,
      gif: true,
      emf: true,
      wmf: true,
    }
    if (!allowedExtensions[ext]) {
      discardReasons.push({ id: shapeId, reason: `Định dạng ảnh không hỗ trợ: ${ext}` })
      continue
    }
    // 6. Tính toán kích thước điểm ảnh chính xác (Pt) theo đúng file gốc
    let widthPt = 350
    let heightPt = 80

    const rWithExt = rawImg.range as unknown as { ext?: { width?: number; height?: number } }
    let centerRow = anchorRow

    if (rawImg.range.br) {
      const br = rawImg.range.br
      const rawRowDiff = br.row - tl.row
      const rawColDiff = br.col - tl.col

      // Loại bỏ shape rác có kích thước gần bằng 0 (gây lỗi repair và vỡ hình ảnh)
      if (rawRowDiff < 0.08 || rawColDiff < 0.08) {
        discardReasons.push({ id: shapeId, reason: `Shape rác có kích thước gần bằng 0 (rows: ${rawRowDiff.toFixed(4)}, cols: ${rawColDiff.toFixed(4)})` })
        continue
      }

      // Chiều cao chính xác theo file gốc
      if (tl.nativeRowOff !== undefined && br.nativeRowOff !== undefined && br.nativeRow === tl.nativeRow) {
        heightPt = Math.max(15, (br.nativeRowOff - tl.nativeRowOff) / 12700)
      } else {
        const rowObj = ws.getRow(anchorRow)
        const rH = rowObj.height || 18
        heightPt = Math.max(15, rawRowDiff * rH)
      }

      // Chiều rộng chính xác theo file gốc
      widthPt = Math.min(380, Math.max(80, rawColDiff * 190))
      centerRow = (tl.row + br.row) / 2 + 1
    } else if (rWithExt.ext && rWithExt.ext.width && rWithExt.ext.height) {
      widthPt = rWithExt.ext.width / 12700
      heightPt = rWithExt.ext.height / 12700
    } else {
      const natDims = getImageNaturalDimensions(media.buffer, ext)
      widthPt = natDims.widthPt
      heightPt = natDims.heightPt
    }

    // 7. Loại bỏ shape có kích thước rác <= 2pt
    if (widthPt <= minDim || heightPt <= minDim) {
      discardReasons.push({ id: shapeId, reason: `Kích thước shape quá nhỏ (${widthPt.toFixed(1)}x${heightPt.toFixed(1)} pt <= ${minDim}pt)` })
      continue
    }

    // 8. Chống trùng lặp ảnh (Deduplication)
    const hash = hashImageBuffer(media.buffer)
    if (seenHashes.has(hash)) {
      discardReasons.push({ id: shapeId, reason: 'Ảnh trùng lặp hoàn toàn với ảnh đã nhận diện' })
      continue
    }
    seenHashes.add(hash)
    validImages.push({
      id: shapeId,
      buffer: media.buffer,
      extension: (ext === 'jpg' ? 'jpeg' : ext) as 'png' | 'jpeg' | 'gif' | 'emf' | 'wmf',
      originalRow: centerRow,
      widthPt: Math.round(widthPt * 10) / 10,
      heightPt: Math.round(heightPt * 10) / 10,
    })
  }
  return {
    validImages,
    discardedCount: discardReasons.length,
    discardReasons,
  }
}
