import type { ProgressMessage, ReconcileResult, SourceConfig } from '../domain/types'
import type { AnalysisResult, AuditAnalyzeRequest, AuditExportRequest } from './types/analytics'
import type { IngestedTaxDeclarations } from './types/taxAnalytics'
import type { TaxCrossReconciliationResult } from '../domain/analytics/TaxCrossReconciler'
import type { VatDeclarationSnapshot, PitDeclarationSnapshot } from './types/taxAnalytics'
import type { AppUpdateInfo, UpdateProgress } from './types/update'

export type { AnalysisResult, AuditAnalyzeRequest, AuditExportRequest, AppUpdateInfo, UpdateProgress, IngestedTaxDeclarations }


export interface PickFileResult {
  canceled: boolean
  filePath: string | null
}

export interface ExportResultPayload {
  ok: boolean
  outPath: string | null
  error?: string
}

export interface ReconcileRunRequest {
  before: SourceConfig
  after: SourceConfig
  excludeKetChuyen: boolean
  ignoreDescription?: boolean
  accountLevel?: 'exact' | 'level1'
  /** Dữ liệu dán từ clipboard — ưu tiên hơn đọc file */
  beforeRows?: unknown[][]
  afterRows?: unknown[][]
}
export interface ExportRunRequest {
  /** Tên file gợi ý cho hộp thoại Save */
  suggestedName?: string
  /** Đường dẫn thật — do main gán sau hộp thoại Save trước khi gọi worker */
  outPath?: string
  excludeKetChuyen: boolean
  result: ReconcileResult
}
export interface ExportProfilerRequest {
  suggestedName?: string
  summary: unknown // ProfileSummary
  filteredRows?: unknown[] // DiffRow[]
  filterDesc?: string
}
export interface ExportExpenseByNatureRequest {
  report: unknown // ExpenseByNatureReport
  clientName?: string
  fiscalYear?: string
  suggestedName?: string
}

export interface WorkbookSheetMeta {
  name: string
  totalRows: number
  suggestedHeaderRow: number
  headerLabels: string[]
  previewRows: unknown[][]
  suggestedMapping: ColumnMappingLike
  confidence: number
}

export interface ColumnMappingLike {
  date: number | null
  voucher: number | null
  description: number | null
  debit: number | null
  credit: number | null
  amount: number | null
  partnerCode?: number | null
  partnerName?: number | null
  exchangeRate?: number | null
  foreignAmount?: number | null
}

export interface WorkbookMeta {
  filePath: string
  sheetNames: string[]
  sheets: WorkbookSheetMeta[]
}

/** API duy nhất mà preload exposing cho renderer — mọi I/O đi qua đây. */
export interface AuditBridgeApi {
  pickWorkbook(): Promise<PickFileResult>
  inspectWorkbook(filePath: string): Promise<WorkbookMeta>
  runReconcile(req: ReconcileRunRequest): Promise<ReconcileResult>
  cancelReconcile(): Promise<void>
  exportReport(req: ExportRunRequest): Promise<ExportResultPayload>
  exportTaxReport(result: TaxCrossReconciliationResult): Promise<ExportResultPayload>
  exportProfilerReport(req: ExportProfilerRequest): Promise<ExportResultPayload>
  exportExpenseByNature(req: ExportExpenseByNatureRequest): Promise<ExportResultPayload>
  onProgress(cb: (p: ProgressMessage) => void): () => void
  /** Audit Analytics */
  auditAnalyze(req: AuditAnalyzeRequest): Promise<AnalysisResult>
  auditExport(req: AuditExportRequest): Promise<ExportResultPayload>
  /** Working Paper Auto-Fill */
  generateWorkingPapers(req: GenerateWorkingPapersRequest): Promise<WorkingPaperGenerationResult>
  pickDirectory(): Promise<PickFileResult>
  openPath(targetPath: string): Promise<void>
  showItemInFolder(targetPath: string): Promise<void>
  readWorkbookRows(filePath: string, sheetName: string): Promise<{ rows: unknown[][]; totalRows: number }>
  getPathForFile?(file: File): string
  /** Auto-Update */
  checkUpdate(customUrl?: string): Promise<AppUpdateInfo>
  openExternalUrl(url: string): Promise<void>
  downloadAndInstallUpdate(downloadUrl: string): Promise<{ success: boolean; message: string }>
  onUpdateProgress?(callback: (progress: UpdateProgress) => void): () => void
  consolidateB410(req: { masterTemplatePath: string; sourceFiles: string[]; outputPath?: string }): Promise<{ success: boolean; message: string; outputPath?: string }>
  downloadB410Template(): Promise<{ ok: boolean; outPath: string | null }>
  detectLocalHtkk(customPath?: string): Promise<{
    isInstalled: boolean
    installPath?: string
    appVersion?: string
    recentFiles?: { mst: string; fileName: string; fullPath: string; modifiedAt: string }[]
    checkedPaths: string[]
  }>
  readHtkkFile(filePath: string): Promise<string | null>
  importTaxXmlFiles(filePaths: string[]): Promise<IngestedTaxDeclarations>
  pickTaxFiles(): Promise<{ canceled: boolean; filePaths: string[] }>
  geminiTestConnection(apiKey: string, model?: string): Promise<{ success: boolean; message: string }>
  geminiAnalyze(req: unknown): Promise<{ success: boolean; reviewText?: string; error?: string }>
  verifyLicenseKey(licenseKey: string, machineId: string): Promise<{ valid: boolean; message: string; payload?: unknown }>
  readClipboardText(): Promise<string>
}
export interface GenerateWorkingPapersRequest {
  sourcePath: string
  adjustedSourcePath?: string
  templateDir?: string
  outputDir?: string
  engagement: {
    clientName: string
    fiscalYearEnd: string
    auditPeriod1?: string
    auditPeriod2?: string
    auditorName: string
    reviewerName1?: string
    reviewerName2?: string
    auditFirmName?: string
  }
  /** Tờ khai GTGT đã nạp ở phân hệ Thuế — main điền vào GLV E300 (Sheet E 380) */
  taxVatDeclarations?: VatDeclarationSnapshot[]
  /** Tờ khai TNCN đã nạp ở phân hệ Thuế — main điền vào GLV E300 (Sheet E 381) */
  taxPitDeclarations?: PitDeclarationSnapshot[]
  interimWpDir?: string
  /** Danh sách các bút toán điều chỉnh kiểm toán (AJE) từ đối chiếu Nguồn 1 vs Nguồn 2 */
  adjustingEntries?: unknown[]
}

export interface WorkingPaperGenerationResult {
  outputDirectory: string
  totalFilesProcessed: number
  successfulFiles: number
  failedFiles: number
  results: {
    fileName: string
    success: boolean
    sheetsUpdated: string[]
    itemsFilledCount: number
    error?: string
  }[]
}

export const IPC = {
  pickWorkbook: 'auditsoft/pickWorkbook',
  inspectWorkbook: 'auditsoft/inspectWorkbook',
  runReconcile: 'auditsoft/runReconcile',
  cancelReconcile: 'auditsoft/cancelReconcile',
  exportReport: 'auditsoft/exportReport',
  exportTaxReport: 'auditsoft/exportTaxReport',
  exportProfilerReport: 'auditsoft/exportProfilerReport',
  exportExpenseByNature: 'auditsoft/exportExpenseByNature',
  progress: 'auditsoft:progress',
  auditAnalyze: 'auditsoft/auditAnalyze',
  auditExport: 'auditsoft/auditExport',
  generateWorkingPapers: 'auditsoft/generateWorkingPapers',
  pickDirectory: 'auditsoft/pickDirectory',
  openPath: 'auditsoft/openPath',
  showItemInFolder: 'auditsoft/showItemInFolder',
  readWorkbookRows: 'auditsoft/readWorkbookRows',
  checkUpdate: 'auditsoft/checkUpdate',
  openExternalUrl: 'auditsoft/openExternalUrl',
  downloadAndInstallUpdate: 'auditsoft/downloadAndInstallUpdate',
  updateProgress: 'auditsoft:updateProgress',
  consolidateB410: 'auditsoft/consolidateB410',
  downloadB410Template: 'auditsoft/downloadB410Template',
  detectLocalHtkk: 'auditsoft/detectLocalHtkk',
  readHtkkFile: 'auditsoft/readHtkkFile',
  importTaxXmlFiles: 'auditsoft/importTaxXmlFiles',
  pickTaxFiles: 'auditsoft/pickTaxFiles',
  geminiTestConnection: 'auditsoft/geminiTestConnection',
  geminiAnalyze: 'auditsoft/geminiAnalyze',
  verifyLicenseKey: 'auditsoft/verifyLicenseKey',
} as const

/** Channel strings dùng bởi preload (sandbox — không import được module khác). */
export const AUDIT_CHANNELS = {
  auditAnalyze: IPC.auditAnalyze,
  auditExport: IPC.auditExport,
  generateWorkingPapers: IPC.generateWorkingPapers,
  pickDirectory: IPC.pickDirectory,
  openPath: IPC.openPath,
  showItemInFolder: IPC.showItemInFolder,
  checkUpdate: IPC.checkUpdate,
  openExternalUrl: IPC.openExternalUrl,
  downloadAndInstallUpdate: IPC.downloadAndInstallUpdate,
  updateProgress: IPC.updateProgress,
  consolidateB410: IPC.consolidateB410,
  downloadB410Template: IPC.downloadB410Template,
} as const
