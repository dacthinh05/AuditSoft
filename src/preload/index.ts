import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type {
  AuditBridgeApi,
  AuditAnalyzeRequest,
  AuditExportRequest,
  AnalysisResult,
  ExportRunRequest,
  ExportResultPayload,
  PickFileResult,
  ReconcileRunRequest,
} from '../shared/ipc'
import type { UpdateProgress } from '../shared/types/update'
import type { ProgressMessage, ReconcileResult } from '../domain/types'

/** Chuẩn kênh IPC phải khớp với shared/ipc.ts (IPC).
 *  Nhúng trực tiếp tại đây vì preload chạy trong sandbox — KHÔNG được require file khác. */
const CHANNELS = {
  pickWorkbook: 'auditsoft/pickWorkbook',
  inspectWorkbook: 'auditsoft/inspectWorkbook',
  runReconcile: 'auditsoft/runReconcile',
  cancelReconcile: 'auditsoft/cancelReconcile',
  exportReport: 'auditsoft/exportReport',
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
  consolidateB410: 'auditsoft/consolidateB410',
  downloadB410Template: 'auditsoft/downloadB410Template',
  detectLocalHtkk: 'auditsoft/detectLocalHtkk',
  readHtkkFile: 'auditsoft/readHtkkFile',
  downloadAndInstallUpdate: 'auditsoft/downloadAndInstallUpdate',
  updateProgress: 'auditsoft:updateProgress',
  importTaxXmlFiles: 'auditsoft/importTaxXmlFiles',
  pickTaxFiles: 'auditsoft/pickTaxFiles',
} as const

const api: AuditBridgeApi = {
  pickWorkbook: (): Promise<PickFileResult> => ipcRenderer.invoke(CHANNELS.pickWorkbook),
  inspectWorkbook: (filePath: string) => ipcRenderer.invoke(CHANNELS.inspectWorkbook, filePath),
  runReconcile: (req: ReconcileRunRequest): Promise<ReconcileResult> => ipcRenderer.invoke(CHANNELS.runReconcile, req),
  cancelReconcile: () => ipcRenderer.invoke(CHANNELS.cancelReconcile),
  exportReport: (req: ExportRunRequest): Promise<ExportResultPayload> => ipcRenderer.invoke(CHANNELS.exportReport, req),
  onProgress: (cb: (p: ProgressMessage) => void) => {
    const listener = (_e: unknown, p: ProgressMessage): void => cb(p)
    ipcRenderer.on(CHANNELS.progress, listener as never)
    return () => ipcRenderer.removeListener(CHANNELS.progress, listener as never)
  },
  auditAnalyze: (req: AuditAnalyzeRequest): Promise<AnalysisResult> => ipcRenderer.invoke(CHANNELS.auditAnalyze, req),
  auditExport: (req: AuditExportRequest): Promise<ExportResultPayload> => ipcRenderer.invoke(CHANNELS.auditExport, req),
  generateWorkingPapers: (req) => ipcRenderer.invoke(CHANNELS.generateWorkingPapers, req),
  pickDirectory: () => ipcRenderer.invoke(CHANNELS.pickDirectory),
  openPath: (targetPath: string) => ipcRenderer.invoke(CHANNELS.openPath, targetPath),
  showItemInFolder: (targetPath: string) => ipcRenderer.invoke(CHANNELS.showItemInFolder, targetPath),
  readWorkbookRows: (filePath: string, sheetName: string) => ipcRenderer.invoke(CHANNELS.readWorkbookRows, filePath, sheetName),
  checkUpdate: (customUrl?: string) => ipcRenderer.invoke(CHANNELS.checkUpdate, customUrl),
  openExternalUrl: (url: string) => ipcRenderer.invoke(CHANNELS.openExternalUrl, url),
  downloadAndInstallUpdate: (downloadUrl: string) => ipcRenderer.invoke(CHANNELS.downloadAndInstallUpdate, downloadUrl),
  onUpdateProgress: (cb: (p: UpdateProgress) => void) => {
    const listener = (_e: unknown, p: UpdateProgress): void => cb(p)
    ipcRenderer.on(CHANNELS.updateProgress, listener as never)
    return () => ipcRenderer.removeListener(CHANNELS.updateProgress, listener as never)
  },
  consolidateB410: (req) => ipcRenderer.invoke(CHANNELS.consolidateB410, req),
  downloadB410Template: () => ipcRenderer.invoke(CHANNELS.downloadB410Template),
  detectLocalHtkk: (customPath?: string) => ipcRenderer.invoke(CHANNELS.detectLocalHtkk, customPath),
  readHtkkFile: (filePath: string) => ipcRenderer.invoke(CHANNELS.readHtkkFile, filePath),
  importTaxXmlFiles: (filePaths: string[]) => ipcRenderer.invoke(CHANNELS.importTaxXmlFiles, filePaths),
  pickTaxFiles: () => ipcRenderer.invoke(CHANNELS.pickTaxFiles),
  getPathForFile: (file: File): string => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file)
      }
    } catch {
      // ignore
    }
    if ('path' in file && typeof file.path === 'string') {
      return file.path
    }
    return ''
  },
  testDbConnection: (config) => ipcRenderer.invoke('db:test-connection', config),
  previewDbSample: (config, limit) => ipcRenderer.invoke('db:preview-sample', config, limit),
  fetchDbEntries: (config) => ipcRenderer.invoke('db:fetch-entries', config),
  onDbProgress: (cb) => {
    const listener = (_e: unknown, data: { fetched: number }): void => cb(data)
    ipcRenderer.on('db:fetch-progress', listener as never)
    return () => ipcRenderer.removeListener('db:fetch-progress', listener as never)
  },
}

contextBridge.exposeInMainWorld('auditsoft', api)
