import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import type {
  WorkingPaperFillContext,
  SectionFillResult,
  CdfsAccountRow,
  NkcTransaction,
  EngagementInfo,
} from './types'
import { fillCashWorkingPaper } from './fillers/D100_CashFiller'
import { fillReceivableWorkingPaper } from './fillers/D300_ReceivableFiller'
import { fillInventoryWorkingPaper } from './fillers/D500_InventoryFiller'
import { fillPrepaidWorkingPaper } from './fillers/D600_PrepaidFiller'
import { fillFixedAssetWorkingPaper } from './fillers/D700_FixedAssetFiller'
import { fillBorrowingWorkingPaper } from './fillers/E100_BorrowingFiller'
import { fillPayableWorkingPaper } from './fillers/E200_PayableFiller'
import { fillTaxWorkingPaper } from './fillers/E300_TaxFiller'
import { fillPayrollWorkingPaper } from './fillers/E400_PayrollFiller'
import { fillEquityWorkingPaper } from './fillers/F100_EquityFiller'
import { fillRevenueWorkingPaper } from './fillers/G100_RevenueFiller'
import { fillExpenseWorkingPaper } from './fillers/G200_ExpenseFiller'
import { fillAbhMasterWorkingPaper } from './fillers/ABH_MasterFiller'
import { fillLeadsheetWorkingPaper } from './fillers/LeadsheetFiller'
import { fillInvestmentWorkingPaper } from './fillers/D200_InvestmentFiller'
import { OpenXmlPackageEditor } from './openxml/OpenXmlPackageEditor'
import { normalizeForKey } from '../clean'

/**
 * Tìm sheet NKC theo tên linh hoạt:
 * 1. Bắt đầu bằng 'NKC' (ví dụ: 'NKC', 'NKC_TrcDC', 'NKC SAU DC', 'NKC-2025'...)
 * 2. Tên chứa 'NHAT KY CHUNG' hoặc là 'GL'
 * 3. Fallback về sheet đầu tiên nếu không khớp tên nào
 */
export function findNkcSheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
  const cleanNames = wb.worksheets.map((ws) => ({
    ws,
    clean: normalizeForKey(ws.name).replace(/[\s_\-.]/g, ''),
  }))

  // Ưu tiên 1: Tên bắt đầu bằng NKC (NKC, NKCTRCDC, NKCSAUDC...)
  const nkcPrefix = cleanNames.find((x) => x.clean.startsWith('NKC'))
  if (nkcPrefix) return nkcPrefix.ws

  // Ưu tiên 2: Tên chứa NHATKYCHUNG hoặc là GL
  const nhatKyChung = cleanNames.find((x) => x.clean.includes('NHATKYCHUNG') || x.clean === 'GL')
  if (nhatKyChung) return nhatKyChung.ws

  // Fallback: sheet đầu tiên
  return wb.worksheets[0]
}
/**
 * Tìm sheet CDFS theo tên linh hoạt:
 * CDFS, CDPS, CDSPS, BCDSPS, CanDoiPhatSinh, TrialBalance, Bang CĐSPS...
 */
export function findCdfsSheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
  const cleanNames = wb.worksheets.map((ws) => ({
    ws,
    clean: normalizeForKey(ws.name).replace(/[\s_\-.]/g, ''),
  }))

  const match = cleanNames.find((x) =>
    x.clean.includes('CDFS') ||
    x.clean.includes('CDPS') ||
    x.clean.includes('CDSPS') ||
    x.clean.includes('BCDSPS') ||
    x.clean.includes('CANDOIPHATSINH') ||
    x.clean.includes('TRIALBALANCE') ||
    x.clean.includes('CANDOI') ||
    x.clean.includes('BANGCD'),
  )
  return match?.ws
}

function cellScalar(val: ExcelJS.CellValue): unknown {
  if (val == null) return null
  if (typeof val === 'object') {
    if ('result' in val) return (val as { result: unknown }).result
    if ('text' in val) return (val as { text: string }).text
  }
  return val
}

/** Tìm cột đầu tiên có header text chứa một trong các keyword (case-insensitive, đã bỏ dấu). */
function findColByKeyword(row: ExcelJS.Row, keywords: string[]): number | null {
  for (let c = 1; c <= Math.min(25, row.cellCount); c++) {
    const txt = String(cellScalar(row.getCell(c).value) ?? '').trim().toLowerCase()
    if (keywords.some((k) => txt.includes(k))) return c
  }
  return null
}

/**
 * Suy tháng (1-12) từ giá trị ngày khi dòng không có cột tháng.
 * Nhận DD/MM/YYYY, serial Excel, hoặc Date.
 */
function deriveMonthFromDate(dateVal: unknown, dateStr: string): number {
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    const m = dateVal.getMonth() + 1
    if (m >= 1 && m <= 12) return m
  }
  if (typeof dateVal === 'number' && dateVal > 20000 && dateVal < 80000) {
    const d = new Date(Math.round((dateVal - 25569) * 86400 * 1000))
    const m = d.getUTCMonth() + 1
    if (m >= 1 && m <= 12) return m
  }
  const m = `${String(dateVal ?? '')} ${dateStr || ''}`.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (m) {
    const mo = Number(m[2])
    if (mo >= 1 && mo <= 12) return mo
  }
  return 1
}

/**
 * Trích xuất toàn bộ dữ liệu CDFS và NKC từ file Excel kế toán
 */
export async function extractAccountingContext(
  sourceWorkbookPath: string,
  engagement: EngagementInfo,
): Promise<WorkingPaperFillContext> {
  const wbSource = new ExcelJS.Workbook()
  await wbSource.xlsx.readFile(sourceWorkbookPath)

  const cdfsMap = new Map<string, CdfsAccountRow>()
  const wsCDFS = findCdfsSheet(wbSource)
  if (wsCDFS) {
    // Tìm header row và map cột động (tối đa 6 hàng đầu)
    let headerRowIdx = 3
    let colMatk: number | null = null
    let colTentk: number | null = null
    let colSdndk: number | null = null
    let colSdcdk: number | null = null
    let colPsno: number | null = null
    let colPsco: number | null = null
    let colNock: number | null = null
    let colCock: number | null = null

    for (let r = 1; r <= Math.min(6, wsCDFS.rowCount); r++) {
      const hRow = wsCDFS.getRow(r)
      const candidate = findColByKeyword(hRow, ['matk', 'mã tk', 'số hiệu', 'tài khoản'])
      if (candidate != null) {
        headerRowIdx = r
        colMatk = candidate
        colTentk = findColByKeyword(hRow, ['tên tk', 'tên tài khoản', 'diễn giải', 'account name'])
        colSdndk = findColByKeyword(hRow, ['dư nợ đầu', 'nợ đầu kỳ', 'sdndk', 'opening debit'])
        colSdcdk = findColByKeyword(hRow, ['dư có đầu', 'có đầu kỳ', 'sdcdk', 'opening credit'])
        colPsno = findColByKeyword(hRow, ['ps nợ', 'phát sinh nợ', 'nợ phát sinh', 'debit turnover'])
        colPsco = findColByKeyword(hRow, ['ps có', 'phát sinh có', 'có phát sinh', 'credit turnover'])
        colNock = findColByKeyword(hRow, ['nợ cuối', 'dư nợ ck', 'nợ ck', 'closing debit'])
        colCock = findColByKeyword(hRow, ['có cuối', 'dư có ck', 'có ck', 'closing credit'])
        break
      }
    }

    // Fallback về offset cố định nếu header detection thất bại
    const gc = (detected: number | null, fallback: number): number => detected ?? fallback

    wsCDFS.eachRow((row, r) => {
      if (r <= headerRowIdx) return
      const matkCol = gc(colMatk, 2)
      // Fallback matk: thử cột được detect, rồi cột kề bên trái
      const matk = String(cellScalar(row.getCell(matkCol).value) || (matkCol > 1 ? cellScalar(row.getCell(matkCol - 1).value) : null) || '').trim()
      const tentk = String(cellScalar(row.getCell(gc(colTentk, matkCol + 1)).value) || '').trim()
      const sdndk = Number(cellScalar(row.getCell(gc(colSdndk, 4)).value) || 0)
      const sdcdk = Number(cellScalar(row.getCell(gc(colSdcdk, 5)).value) || 0)
      const psno = Number(cellScalar(row.getCell(gc(colPsno, 6)).value) || 0)
      const psco = Number(cellScalar(row.getCell(gc(colPsco, 7)).value) || 0)
      const nock = Number(cellScalar(row.getCell(gc(colNock, 8)).value) || 0)
      const cock = Number(cellScalar(row.getCell(gc(colCock, 9)).value) || 0)

      if (matk && matk.length >= 3 && !isNaN(Number(matk.slice(0, 3)))) {
        cdfsMap.set(matk, { matk, tentk, sdndk, sdcdk, psno, psco, nock, cock })
      }
    })
  }

  const nkcTransactions: NkcTransaction[] = []
  const wsNKC = findNkcSheet(wbSource)

  if (wsNKC) {
    // Tìm hàng tiêu đề động
    let headerRowIdx = 2
    let colDate = 2
    let colDoc = 3
    let colDesc = 4
    let colDebit = 5
    let colCredit = 6
    let colAmount = 7
    let colRate = 8
    let colUsd = 9
    let colCust = 10
    let colMonth = 0 // 0 = không có cột tháng → suy từ ngày chứng từ

    for (let r = 1; r <= Math.min(5, wsNKC.rowCount); r++) {
      const row = wsNKC.getRow(r)
      let foundCols = 0
      for (let c = 1; c <= Math.min(15, row.cellCount); c++) {
        const hText = String(cellScalar(row.getCell(c).value) || '').trim().toLowerCase()
        if (/ngày|date/i.test(hText)) { colDate = c; foundCols++ }
        else if (/chứng từ|số ct|so ct|voucher/i.test(hText)) { colDoc = c; foundCols++ }
        else if (/nội dung|diễn giải|dien giai|desc/i.test(hText)) { colDesc = c; foundCols++ }
        else if (/tk nợ|nợ|debit/i.test(hText)) { colDebit = c; foundCols++ }
        else if (/tk có|có|credit/i.test(hText)) { colCredit = c; foundCols++ }
        else if (/số tiền|thành tiền|tiền|amount/i.test(hText)) { colAmount = c; foundCols++ }
        else if (/tỷ giá|ty gia|rate/i.test(hText)) { colRate = c }
        else if (/usd|ngoại tệ|ngoai te/i.test(hText)) { colUsd = c }
        else if (/mã kh|mã đt|khách hàng|cust/i.test(hText)) { colCust = c }
        else if (/tháng|thang|month/i.test(hText)) { colMonth = c }
      }
      if (foundCols >= 4) {
        headerRowIdx = r
        break
      }
    }

    wsNKC.eachRow((row, r) => {
      if (r > headerRowIdx) {
        const dateVal = cellScalar(row.getCell(colDate).value)
        const docNo = String(cellScalar(row.getCell(colDoc).value) || '')
        const desc = String(cellScalar(row.getCell(colDesc).value) || '')
        const debit = String(cellScalar(row.getCell(colDebit).value) || '').trim()
        const credit = String(cellScalar(row.getCell(colCredit).value) || '').trim()
        const amount = Number(cellScalar(row.getCell(colAmount).value) || 0)
        const exchangeRate = colRate ? Number(cellScalar(row.getCell(colRate).value) || 0) : undefined
        const usdAmount = colUsd ? Number(cellScalar(row.getCell(colUsd).value) || 0) : undefined
        const custId = colCust ? String(cellScalar(row.getCell(colCust).value) || '') : ''
        const rawMonth = colMonth > 0 ? Number(cellScalar(row.getCell(colMonth).value)) : NaN

        if (debit || credit || amount > 0) {
          nkcTransactions.push({
            rowNum: r,
            dateStr: String(dateVal ?? ''),
            dateVal: typeof dateVal === 'string' || typeof dateVal === 'number' || dateVal instanceof Date ? dateVal : null,
            docNo,
            desc,
            debit,
            credit,
            amount,
            exchangeRate: exchangeRate && exchangeRate > 0 ? exchangeRate : undefined,
            usdAmount: usdAmount && usdAmount > 0 ? usdAmount : undefined,
            custId,
            month: !isNaN(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : deriveMonthFromDate(dateVal, String(dateVal ?? '')),
          })
        }
      }
    })
  }

  // Không có sheet CDFS (file chỉ có NKC): tổng hợp bảng cân đối phát sinh
  // từ chính bút toán NKC để các lead schedule vẫn có số tổng.
  if (cdfsMap.size === 0 && nkcTransactions.length > 0) {
    const acc = (code: string): CdfsAccountRow => {
      let row = cdfsMap.get(code)
      if (!row) {
        row = { matk: code, tentk: '', sdndk: 0, sdcdk: 0, psno: 0, psco: 0, nock: 0, cock: 0 }
        cdfsMap.set(code, row)
      }
      return row
    }
    for (const t of nkcTransactions) {
      if (t.amount <= 0) continue
      for (const code of [t.debit, t.credit]) {
        if (!code) continue
        acc(code).psno += code === t.debit ? t.amount : 0
        acc(code).psco += code === t.credit ? t.amount : 0
        // Roll-up lên TK tổng 3 số để lead schedule (632/641/642...) đọc được
        if (code.length > 3) {
          const parent = code.slice(0, 3)
          acc(parent).psno += code === t.debit ? t.amount : 0
          acc(parent).psco += code === t.credit ? t.amount : 0
        }
      }
    }
    for (const row of cdfsMap.values()) {
      row.nock = row.psno
      row.cock = row.psco
    }
  }

  return {
    engagement,
    cdfsAccounts: cdfsMap,
    nkcTransactions,
  }
}

export interface WorkingPaperFillSummary {
  totalPapers: number
  successCount: number
  failedCount: number
  totalFilesProcessed: number
  successfulFiles: number
  failedFiles: number
  results: SectionFillResult[]
  outputDirectory: string
}
/**
 * Tự động điền 12 mẫu Giấy làm việc kiểm toán
 */
export function generateOutputFileName(code: string, fallback: string, ctx: WorkingPaperFillContext): string {
  const shortNames: Record<string, string> = {
    'A - B - H': 'Master',
    'Leadsheet': 'Leadsheet',
    'D100': 'Tien',
    'D200': 'Dau tu',
    'D300': 'Phai thu',
    'D500': 'HTK',
    'D600': 'Phan bo',
    'D700': 'Tai san',
    'E100': 'Vay',
    'E200': 'Phai tra',
    'E300': 'Thue',
    'E400': 'Luong',
    'F100': 'Von',
    'G100': 'Doanh thu',
    'G200': 'Chi phi',
  }
  
  // Mẫu chuẩn: D100 - Tien - LONG RICH D1 2026 - Thinh.xlsx
  const name = shortNames[code] || code
  
  const yearMatch = ctx.engagement.fiscalYearEnd.match(/\d{4}/)
  const year = yearMatch ? yearMatch[0] : ''
  
  // Tên công ty khi lưu file: ưu tiên companyShortName, fallback về clientName
  const company = (ctx.engagement.companyShortName?.trim() || ctx.engagement.clientName.trim())
  
  // Đợt kiểm toán (D1 / D2 / Cả năm)
  const round = (ctx.engagement.auditRound === 'D1' || ctx.engagement.auditRound === 'D2') ? ctx.engagement.auditRound : ''
  
  // Ghép định danh: [Tên công ty] [Đợt] [Năm]
  const middleParts = [company, round, year].filter(Boolean)
  const middle = middleParts.join(' ')
  
  // Lấy tên người thực hiện (từ cuối cùng)
  const auditorParts = ctx.engagement.auditorName.trim().split(/\s+/)
  const auditorShort = auditorParts[auditorParts.length - 1] || 'KTV'
  
  const ext = path.extname(fallback) || '.xlsx'
  
  if (code.startsWith('A - B - H')) {
    return `A - B - H - Master - ${middle} - ${auditorShort}${ext}`
  }
  if (code === 'Leadsheet') {
    return `Leadsheet - ${middle} - ${auditorShort}${ext}`
  }

  return `${code} - ${name} - ${middle} - ${auditorShort}${ext}`
}

export async function generateAllWorkingPapers(
  templateDir: string,
  outputDir: string,
  ctx: WorkingPaperFillContext,
): Promise<WorkingPaperFillSummary> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  const runners: {
    code: string
    fallbackName: string
    fn: (wb: ExcelJS.Workbook, ctx: WorkingPaperFillContext) => SectionFillResult
  }[] = [
    { code: 'A - B - H', fallbackName: 'A - B - H - Mau 2025 - Thinh.xlsx', fn: fillAbhMasterWorkingPaper as never },
    { code: 'Leadsheet', fallbackName: 'Leadsheet - 2025 - Dac Thinh.xlsx', fn: fillLeadsheetWorkingPaper as never },
    { code: 'D100', fallbackName: 'D100 - Tien - Mau 2024 - Thinh.xlsx', fn: fillCashWorkingPaper },
    { code: 'D200', fallbackName: 'D200 - Dau tu - ABC 2020.xlsx', fn: fillInvestmentWorkingPaper as never },
    { code: 'D300', fallbackName: 'D300 - Phai thu - Mau 2025 - Thinh.xlsx', fn: fillReceivableWorkingPaper },
    { code: 'D500', fallbackName: 'D500 - HTK - Mau 2024 - Thinh.xlsx', fn: fillInventoryWorkingPaper },
    { code: 'D600', fallbackName: 'D600 - Phan bo - Mau 2024 - Thinh.xlsx', fn: fillPrepaidWorkingPaper },
    { code: 'D700', fallbackName: 'D700 - Tai san - Mau 2024 - Thinh.xlsx', fn: fillFixedAssetWorkingPaper },
    { code: 'E100', fallbackName: 'E100 - Vay - Mau 2024 - Thinh.xlsx', fn: fillBorrowingWorkingPaper },
    { code: 'E200', fallbackName: 'E200 - Phai tra - Mau 2024 - Thinh.xlsx', fn: fillPayableWorkingPaper },
    { code: 'E300', fallbackName: 'E300 - Thue - Mau 2024 - Thinh.xlsx', fn: fillTaxWorkingPaper },
    { code: 'E400', fallbackName: 'E400 - Luong - Mau 2025 - Thinh.xlsx', fn: fillPayrollWorkingPaper },
    { code: 'F100', fallbackName: 'F100 - Von - Mau 2024 - Thinh.xlsx', fn: fillEquityWorkingPaper },
    { code: 'G100', fallbackName: 'G100 - Doanh thu - Mau 2025- Thinh.xlsx', fn: fillRevenueWorkingPaper as never },
    { code: 'G200', fallbackName: 'G200 - 300 - 400 -  Mau 2025 - Thinh.xlsx', fn: fillExpenseWorkingPaper },
  ]

  const results: SectionFillResult[] = []
  const availableFiles = fs.existsSync(templateDir) ? fs.readdirSync(templateDir) : []

  for (const runner of runners) {
    const matchedFile =
      availableFiles.find((f) => f.startsWith(runner.code) && f.endsWith('.xlsx')) || runner.fallbackName
    const templatePath = path.join(templateDir, matchedFile)
    
    const finalFileName = generateOutputFileName(runner.code, runner.fallbackName, ctx)
    const outputPath = path.join(outputDir, finalFileName)
    
    // Override runner fn result filename if it's set there, we just capture and rename later if needed, but 
    // the runner.fn does not control outputPath.

    try {
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Không tìm thấy file mẫu: ${matchedFile}`)
      }
      const editor = OpenXmlPackageEditor.load(templatePath)
      const res = runner.fn(editor as never, ctx)
      editor.save(outputPath)
      
      // Cập nhật lại tên file theo tên mới đã sinh ra
      res.fileName = finalFileName

      results.push(res)
    } catch (err) {
      results.push({
        fileName: matchedFile,
        success: false,
        sheetsUpdated: [],
        itemsFilledCount: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failedCount = results.filter((r) => !r.success).length

  return {
    totalPapers: results.length,
    successCount,
    failedCount,
    totalFilesProcessed: results.length,
    successfulFiles: successCount,
    failedFiles: failedCount,
    results,
    outputDirectory: outputDir,
  }
}
