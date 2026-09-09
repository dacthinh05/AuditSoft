import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import type { B410ParsedFile } from './B410Types'
import { parseB410File } from './B410Parser'
import { normalizeAndGroupIssues } from './B410Normalizer'
import { renderMasterB410 } from './B410Renderer'

export interface ConsolidateResult {
  success: boolean
  message: string
  outputPath?: string
}

/**
 * Chuyển đổi file .xls sang file tạm .xlsx nếu cần (chỉ gọi COM 1 lần duy nhất cho thao tác SaveAs)
 */
async function convertXlsToXlsxViaCom(xlsPath: string, outXlsxPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const psScript = `
      $excel = New-Object -ComObject Excel.Application
      $excel.Visible = $false
      $excel.DisplayAlerts = $false
      $excel.AskToUpdateLinks = $false
      try {
        $wb = $excel.Workbooks.Open('${xlsPath.replace(/'/g, "''")}', 0, $true)
        $wb.SaveAs('${outXlsxPath.replace(/'/g, "''")}', 51)
        $wb.Close($false)
      } finally {
        $excel.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
      }
    `
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], {
      windowsVerbatimArguments: false,
    })

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(outXlsxPath)) {
        resolve()
      } else {
        reject(new Error(`Không thể chuyển đổi file .xls: ${xlsPath}`))
      }
    })
  })
}

async function convertXlsFilesIfNeeded(files: string[]): Promise<{ resolvedFiles: string[]; tempFilesToClean: string[] }> {
  const resolvedFiles: string[] = []
  const tempFilesToClean: string[] = []

  for (const f of files) {
    if (f.toLowerCase().endsWith('.xls')) {
      const tempXlsx = path.resolve(path.dirname(f), `~conv_${Date.now()}_${path.basename(f, '.xls')}.xlsx`)
      await convertXlsToXlsxViaCom(f, tempXlsx)
      resolvedFiles.push(tempXlsx)
      tempFilesToClean.push(tempXlsx)
    } else {
      resolvedFiles.push(f)
    }
  }

  return { resolvedFiles, tempFilesToClean }
}

export class B410Consolidator {
  /**
   * Tổng hợp B410 bằng Pure TypeScript Engine (Parse -> Normalize -> Render)
   */
  public static async consolidate(
    masterTemplatePath: string,
    sourceFiles: string[],
    outputPath: string
  ): Promise<ConsolidateResult> {
    const startTime = Date.now()
    const validSourceFiles = sourceFiles.filter(f => !path.basename(f).startsWith('~$'))
    let tempFiles: string[] = []

    try {
      if (!validSourceFiles || validSourceFiles.length === 0) {
        throw new Error('Vui lòng chọn ít nhất 1 file B410 để tổng hợp.')
      }

      // 1. Chuyển đổi file .xls thành .xlsx nếu người dùng nạp file đời cũ
      const convSources = await convertXlsFilesIfNeeded(validSourceFiles)
      tempFiles = convSources.tempFilesToClean
      const resolvedSourceFiles = convSources.resolvedFiles

      let resolvedMaster = masterTemplatePath
      if (masterTemplatePath && masterTemplatePath.toLowerCase().endsWith('.xls')) {
        const convMaster = await convertXlsFilesIfNeeded([masterTemplatePath])
        resolvedMaster = convMaster.resolvedFiles[0] || masterTemplatePath
        tempFiles.push(...convMaster.tempFilesToClean)
      }

      // 2. PARSE: Đọc và bóc tách dữ liệu từ từng file nguồn
      const parsedFiles: B410ParsedFile[] = []
      for (const filePath of resolvedSourceFiles) {
        const parsed = await parseB410File(filePath)
        parsedFiles.push(parsed)
      }

      // 3. NORMALIZE: Chuẩn hóa mã GLV, gom nhóm KTV, tính RowHeight chống đè hình
      const { normalizedIssues, warnings, duplicatesDetected } = normalizeAndGroupIssues(parsedFiles)

      // 4. RENDER: Ghi vào file Master Template theo cấu trúc chuẩn
      const report = await renderMasterB410({
        masterTemplatePath: resolvedMaster,
        outputPath,
        normalizedIssues,
        parsedFiles,
        warnings,
        duplicatesDetected,
        startTimeMs: startTime,
      })

      return {
        success: true,
        message: `Đã tổng hợp thành công ${report.totalIssues} lưu ý từ ${report.totalFiles} file trong ${(report.executionTimeMs / 1000).toFixed(1)}s!`,
        outputPath,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        message: `Lỗi khi tổng hợp B410: ${msg}`,
      }
    } finally {
      // Dọn dẹp các file tạm .xlsx đã sinh ra từ .xls
      for (const tFile of tempFiles) {
        try {
          fs.rmSync(tFile, { force: true })
        } catch {}
      }
    }
  }
}
