import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import { extractAccountingContext, generateAllWorkingPapers } from '../domain/workingpaper/WorkingPaperGenerator'
import type { GenerateWorkingPapersRequest } from '../shared/ipc'
import path from 'node:path'
import { B410Consolidator } from '../domain/workingpaper/b410/B410Consolidator'
import { Worker } from 'node:worker_threads'
import { reconcileRequestSchema, exportRequestSchema, auditAnalyzeSchema, auditExportSchema } from '../shared/schemas'
import { inspectWorkbookFile } from '../infrastructure/excel/inspectWorkbook'
import { readSheetRows } from '../infrastructure/excel/readWorkbook'
import { IPC } from '../shared/ipc'
import { runFullAnalysis } from './AnalysisPipeline'
import { buildAuditWorkbook } from './export/AuditReportExporter'
import { buildTaxReconWorkbook } from './export/TaxReconExporter'
import type { TaxCrossReconciliationResult } from '../domain/analytics/TaxCrossReconciler'
import fs from 'node:fs'
import ExcelJS from 'exceljs'
import { checkForAppUpdates, downloadAndInstallUpdate } from './updater'
import { LocalHtkkScanner } from '../domain/etax/LocalHtkkScanner'
import { assertAuditDirectory, assertAuditFileReadable } from './ipcFileGuard'
import { LocalXmlIngestionEngine } from '../domain/etax/ingestion/LocalXmlIngestionEngine'

let mainWindow: BrowserWindow | null = null
let activeReconcileWorker: Worker | null = null
let activeExportWorker: Worker | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1150,
    minHeight: 660,
    show: false,
    title: 'AuditSoft — Hệ thống Trợ lý Kiểm toán Toàn diện',
    icon: path.join(__dirname, '../../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })

  Menu.setApplicationMenu(null)
  mainWindow.once('ready-to-show', () => mainWindow?.show())

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    void mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function terminateReconcileWorker(): void {
  if (activeReconcileWorker) {
    void activeReconcileWorker.terminate()
    activeReconcileWorker = null
  }
}

function terminateExportWorker(): void {
  if (activeExportWorker) {
    void activeExportWorker.terminate()
    activeExportWorker = null
  }
}

function spawnReconcileWorker(workerPath: string, workerData: unknown): Worker {
  terminateReconcileWorker()
  const worker = new Worker(workerPath, { workerData })
  activeReconcileWorker = worker
  return worker
}

function spawnExportWorker(workerPath: string, workerData: unknown): Worker {
  terminateExportWorker()
  const worker = new Worker(workerPath, { workerData })
  activeExportWorker = worker
  return worker
}

function resolveWorkerPath(workerRelativePath: string): string {
  const defaultPath = path.join(__dirname, workerRelativePath)
  const unpackedPath = defaultPath.replace(/\bapp\.asar\b/, 'app.asar.unpacked')
  if (fs.existsSync(unpackedPath)) {
    return unpackedPath
  }
  return defaultPath
}

function relayProgress(worker: Worker): void {
  worker.on('message', (msg: { type: string; payload?: unknown; message?: string }) => {
    if (msg.type === 'progress' && mainWindow) {
      mainWindow.webContents.send(IPC.progress, msg.payload)
    }
  })
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC.pickWorkbook, async () => {
    const win = mainWindow ?? undefined
    const result = await dialog.showOpenDialog(win as BrowserWindow, {
      title: 'Chọn file NKC (xlsx/xlsm)',
      filters: [{ name: 'Excel', extensions: ['xlsx', 'xlsm'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, filePath: null }
    }
    return { canceled: false, filePath: result.filePaths[0] ?? null }
  })

  ipcMain.handle(IPC.inspectWorkbook, async (_e, rawFilePath: unknown) => {
    const filePath = assertAuditFileReadable(zString(rawFilePath, 'filePath'), 'workbook')
    return inspectWorkbookFile(filePath)
  })

  ipcMain.handle(IPC.readWorkbookRows, async (_e, rawFilePath: unknown, rawSheetName: unknown) => {
    const filePath = assertAuditFileReadable(zString(rawFilePath, 'filePath'), 'workbook')
    const sheetName = zString(rawSheetName, 'sheetName')
    return readSheetRows(filePath, sheetName)
  })
  ipcMain.handle(IPC.runReconcile, async (_e, rawReq: unknown) => {
    const req = reconcileRequestSchema.parse(rawReq)

    const worker = spawnReconcileWorker(resolveWorkerPath('../workers/reconcile.worker.js'), { req })
    relayProgress(worker)

    return new Promise((resolve, reject) => {
      worker.on('message', (msg: { type: string; payload?: unknown; message?: string }) => {
        if (msg.type === 'done') resolve(msg.payload)
        else if (msg.type === 'error') reject(new Error(msg.message ?? 'Lỗi không xác định trong worker'))
      })
      worker.on('error', (err) => reject(err))
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker thoát bất thường (mã ${code})`))
        activeReconcileWorker = null
      })
    })
  })

  ipcMain.handle(IPC.cancelReconcile, () => {
    terminateReconcileWorker()
  })

  // ── Audit Analytics ──
  ipcMain.handle(IPC.auditAnalyze, async (_e, rawReq: unknown) => {
    const req = auditAnalyzeSchema.parse(rawReq)
    return runFullAnalysis(req)
  })

  ipcMain.handle(IPC.auditExport, async (_e, rawReq: unknown) => {
    const req = auditExportSchema.parse(rawReq)
    const win = mainWindow ?? undefined
    const suggested = req.suggestedName?.trim() || `Audit-Analytics-${req.fiscalYear ?? new Date().getFullYear()}.xlsx`
    const save = await dialog.showSaveDialog(win as BrowserWindow, {
      title: 'Xuất báo cáo Audit Analytics',
      defaultPath: suggested,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    })
    if (save.canceled || !save.filePath) return { ok: false, outPath: null }

    try {
      const analysis = await runFullAnalysis(req)
      const wb = buildAuditWorkbook(analysis)
      await wb.xlsx.writeFile(save.filePath)
      return { ok: true, outPath: save.filePath }
    } catch (err) {
      fs.rmSync(save.filePath, { force: true })
      throw err
    }
  })

  ipcMain.handle(IPC.exportReport, async (_e, rawReq: unknown) => {
    const parsed = exportRequestSchema.parse(rawReq)
    const win = mainWindow ?? undefined
    const suggested = typeof parsed.suggestedName === 'string' && parsed.suggestedName.trim() !== '' ? parsed.suggestedName : 'DoiChieu-NKC.xlsx'
    const save = await dialog.showSaveDialog(win as BrowserWindow, {
      title: 'Xuất báo cáo đối chiếu',
      defaultPath: suggested,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    })
    if (save.canceled || !save.filePath) {
      return { ok: false, outPath: null }
    }

    const req = { ...parsed, outPath: save.filePath }
    const worker = spawnExportWorker(resolveWorkerPath('../workers/export.worker.js'), req)
    relayProgress(worker)

    return new Promise((resolve, reject) => {
      worker.on('message', (msg: { type: string; payload?: unknown; message?: string }) => {
        if (msg.type === 'done') resolve({ ok: true, outPath: save.filePath })
        else if (msg.type === 'error') reject(new Error(msg.message ?? 'Lỗi xuất Excel'))
      })
      worker.on('error', (err) => reject(err))
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Export worker thoát bất thường (mã ${code})`))
        activeExportWorker = null
      })
    })
  })

  ipcMain.handle(IPC.exportTaxReport, async (_e, rawResult: unknown) => {
    const result = rawResult as TaxCrossReconciliationResult
    if (!result || !Array.isArray(result.vatRows)) throw new Error('Thiếu kết quả đối chiếu thuế')
    const win = mainWindow ?? undefined
    const save = await dialog.showSaveDialog(win as BrowserWindow, {
      title: 'Xuất bảng đối chiếu thuế',
      defaultPath: 'DoiChieu-Thue-GTGT-TNCN.xlsx',
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    })
    if (save.canceled || !save.filePath) {
      return { ok: false, outPath: null }
    }
    const wb = buildTaxReconWorkbook(result)
    await wb.xlsx.writeFile(save.filePath)
    return { ok: true, outPath: save.filePath }
  })

  // ── Working Paper Auto-Fill ──
  ipcMain.handle(IPC.pickDirectory, async () => {
    const win = mainWindow ?? undefined
    const result = await dialog.showOpenDialog(win as BrowserWindow, {
      title: 'Chọn thư mục lưu hồ sơ kiểm toán',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, filePath: null }
    }
    return { canceled: false, filePath: result.filePaths[0] ?? null }
  })

  ipcMain.handle(IPC.openPath, async (_e, rawPath: unknown) => {
    const p = zString(rawPath, 'targetPath')
    await shell.openPath(p)
  })
  ipcMain.handle(IPC.showItemInFolder, async (_e, rawPath: unknown) => {
  })

  ipcMain.handle(IPC.generateWorkingPapers, async (_e, rawReq: unknown) => {
    const req = rawReq as GenerateWorkingPapersRequest
    if (!req || !req.sourcePath) throw new Error('Vui lòng chọn file dữ liệu kế toán nguồn')
    if (!req.engagement) throw new Error('Thiếu thông tin hợp đồng kiểm toán (engagement)')
    if (!req.engagement.clientName?.trim()) throw new Error('Vui lòng nhập tên khách hàng kiểm toán')
    
    const templateDir = resolveTemplateDir(req.templateDir)
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Không tìm thấy thư mục template GLV MAU tại: ${templateDir}`)
    }

    const sanitizedClient = (req.engagement?.clientName || 'DoanhNghiep').replace(/[\\/:*?"<>|]/g, '_').trim()
    const year = (req.engagement?.fiscalYearEnd || '2026').slice(-4)
    const defaultOutDir = req.outputDir || path.resolve(path.dirname(req.sourcePath), `HoSoKiemToan_${sanitizedClient}_${year}`)

    const ctx = await extractAccountingContext(req.sourcePath, req.engagement)
    if (req.taxVatDeclarations && req.taxVatDeclarations.length > 0) {
      ctx.vatDeclarations = req.taxVatDeclarations
    }
    return generateAllWorkingPapers(templateDir, defaultOutDir, ctx)
  })

  // ── Auto-Update ──
  // SEC-H3: không tin URL manifest từ renderer — luôn dùng manifest chính thức.
  // Mirror nội bộ (nếu cần) đặt qua biến môi trường AUDITSOFT_UPDATE_URL.
  ipcMain.handle(IPC.checkUpdate, async () => {
    return checkForAppUpdates()
  })

  ipcMain.handle(IPC.openExternalUrl, async (_e, rawUrl: unknown) => {
    const url = zString(rawUrl, 'url')
    if (url.startsWith('http://') || url.startsWith('https://')) {
      await shell.openExternal(url)
    }
  })

  ipcMain.handle(IPC.downloadAndInstallUpdate, async (event, rawUrl: unknown) => {
    const url = zString(rawUrl, 'downloadUrl')
    return downloadAndInstallUpdate(url, (progress) => {
      if (!event.sender.isDestroyed()) {
        event.sender.send(IPC.updateProgress, progress)
      }
    })
  })

  ipcMain.handle(IPC.consolidateB410, async (_e, rawReq: unknown) => {
    const req = rawReq as { masterTemplatePath?: string; sourceFiles: string[]; outputPath?: string }
    if (!req || !Array.isArray(req.sourceFiles) || req.sourceFiles.length === 0) {
      throw new Error('Vui lòng chọn ít nhất 1 file B410 để tổng hợp.')
    }
    const template = resolveB410TemplatePath(req.masterTemplatePath)

    // Xác định thư mục lưu file: lưu ngay thư mục chứa file nguồn của người dùng
    let targetDir = ''
    if (req.sourceFiles[0] && fs.existsSync(path.dirname(req.sourceFiles[0]))) {
      targetDir = path.dirname(req.sourceFiles[0])
    } else {
      try {
        targetDir = app.getPath('desktop')
      } catch {
        targetDir = process.cwd()
      }
    }

    const outPath = req.outputPath && req.outputPath.trim() !== '' 
      ? req.outputPath 
      : path.join(targetDir, `B410_Master_Consolidated_${Date.now()}.xlsx`)

    // Đảm bảo thư mục đích luôn tồn tại trước khi ghi file
    try {
      fs.mkdirSync(path.dirname(outPath), { recursive: true })
    } catch {}

    return B410Consolidator.consolidate(template, req.sourceFiles, outPath)
  })

  ipcMain.handle(IPC.downloadB410Template, async () => {
    const win = mainWindow ?? undefined
    const defaultTemplate = resolveB410TemplatePath()
    const save = await dialog.showSaveDialog(win as BrowserWindow, {
      title: 'Tải Biểu Mẫu Chuẩn B410',
      defaultPath: 'B410_Mau_Chuan_Tong_Hop.xlsx',
      filters: [{ name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx'] }],
    })
    if (save.canceled || !save.filePath) {
      return { ok: false, outPath: null }
    }
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(defaultTemplate)
    const ws = wb.worksheets[0]
    if (ws) {
      for (let r = 12; r <= ws.rowCount; r++) {
        ws.getRow(r).values = []
      }
    }
    await wb.xlsx.writeFile(save.filePath)
    return { ok: true, outPath: save.filePath }
  })
  ipcMain.handle(IPC.detectLocalHtkk, async (_event, customPath?: string) => {
    return LocalHtkkScanner.detect(assertAuditDirectory(customPath))
  })
  ipcMain.handle(IPC.readHtkkFile, async (_event, filePath: string) => {
    return LocalHtkkScanner.readXmlFile(assertAuditFileReadable(filePath, 'xml'))
  })
  ipcMain.handle(IPC.importTaxXmlFiles, async (_event, filePaths: string[]) => {
    if (!Array.isArray(filePaths) || filePaths.length === 0) throw new Error('Chưa chọn file tờ khai.')
    return LocalXmlIngestionEngine.ingestFiles(filePaths.map((p) => assertAuditFileReadable(p, 'archive')))
  })
  ipcMain.handle(IPC.pickTaxFiles, async () => {
    if (!mainWindow) return { canceled: true, filePaths: [] }
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Chọn các tệp tờ khai thuế XML hoặc ZIP',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Tờ khai Thuế (XML, ZIP)', extensions: ['xml', 'zip'] },
        { name: 'Tất cả tệp', extensions: ['*'] },
      ],
    })
    return { canceled: res.canceled, filePaths: res.filePaths }
  })
}

function resolveB410TemplatePath(customPath?: string): string {
  if (customPath && customPath.trim() !== '' && fs.existsSync(customPath)) return customPath
  const candidates = [
    path.join(process.resourcesPath, 'B410', 'B410_Standard_Master_Template.xlsx'),
    path.resolve(process.cwd(), 'B410', 'B410_Standard_Master_Template.xlsx'),
    path.join(app.getAppPath(), 'B410', 'B410_Standard_Master_Template.xlsx'),
    path.join(__dirname, '../../B410', 'B410_Standard_Master_Template.xlsx'),
    path.join(path.dirname(process.execPath), 'B410', 'B410_Standard_Master_Template.xlsx'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return candidates[1]!
}

function resolveTemplateDir(customDir?: string): string {
  if (customDir && fs.existsSync(customDir)) return customDir
  const candidates = [
    path.join(process.resourcesPath, 'GLV MAU'),
    path.resolve(process.cwd(), 'GLV MAU'),
    path.join(app.getAppPath(), 'GLV MAU'),
    path.join(__dirname, '../../GLV MAU'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return path.resolve(process.cwd(), 'GLV MAU')
}

function zString(v: unknown, field: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Tham số ${field} phải là chuỗi không rỗng`)
  }
  return v
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  terminateReconcileWorker()
  terminateExportWorker()
  if (process.platform !== 'darwin') app.quit()
})
