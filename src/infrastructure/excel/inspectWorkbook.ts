import { detectHeaderAndMapping } from './columnMapper'
import { readCsvMatrix, parseDelimited } from './csvTable'
import { scanWorkbook } from './readWorkbook'
import type { WorkbookMeta } from '../../shared/ipc'

/** Đọc metadata nguồn (xlsx/xlsm/csv): sheet, hàng tiêu đề gợi ý, nhãn cột,
 *  preview và mapping tự động cho màn hình thiết lập. */
export async function inspectWorkbookFile(filePath: string): Promise<WorkbookMeta> {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.csv')) {
    const text = await readCsvMatrix(filePath)
    return metaFromMatrix(filePath, [text])
  }
  const scan = await scanWorkbook(filePath)
  const matrices = scan.sheetNames.map((n) => scan.sheets.get(n)?.preview ?? [])
  return metaFromMatrix(filePath, matrices, scan.sheetNames)
}

function metaFromMatrix(filePath: string, matrices: unknown[][][], names?: string[]): WorkbookMeta {
  const sheets: WorkbookMeta['sheets'] = []
  matrices.forEach((matrix, idx) => {
    const name = names?.[idx] ?? (matrices.length === 1 ? 'CSV' : `Sheet${idx + 1}`)
    const detection = detectHeaderAndMapping(matrix)
    const labels =
      detection.headerRowIndex >= 0 ? (matrix[detection.headerRowIndex] ?? []).map((c) => String(c ?? '')) : []
    sheets.push({
      name,
      totalRows: matrix.length,
      suggestedHeaderRow: detection.headerRowIndex >= 0 ? detection.headerRowIndex + 1 : 1,
      headerLabels: labels,
      previewRows: matrix,
      suggestedMapping: detection.mapping,
      confidence: detection.confidence,
    })
  })
  return {
    filePath,
    sheetNames: sheets.map((s) => s.name),
    sheets,
  }
}

export { parseDelimited }
