import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import {
  extractAccountingContext,
  generateAllWorkingPapers,
} from '../src/domain/workingpaper/WorkingPaperGenerator'
import type { EngagementInfo } from '../src/domain/workingpaper/types'

async function main() {
  const sourceWorkbook = path.resolve('MAU NKC.xlsx')
  const templateDir = path.resolve('GLV MAU')
  const outputDir = path.resolve('output_verify_all_12')

  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true })
  }
  fs.mkdirSync(outputDir, { recursive: true })

  const engagement: EngagementInfo = {
    clientName: 'Công ty Cổ phần May Mặc Gia Công Test',
    fiscalYearEnd: '31/12/2026',
    auditPeriod1: '01/01 - 30/06/2026',
    auditPeriod2: '01/07 - 31/12/2026',
    auditorName: 'Nguyễn Đắc Thịnh',
    auditFirmName: 'Công ty TNHH Kiểm toán BẮC ĐẨU',
  }

  console.log('1. Extracting accounting context from MAU NKC.xlsx...')
  const ctx = await extractAccountingContext(sourceWorkbook, engagement)
  console.log(' - CDFS accounts count:', ctx.cdfsAccounts.size)
  console.log(' - NKC transactions count:', ctx.nkcTransactions.length)

  console.log('2. Generating all 12 working papers with OpenXmlPackageEditor...')
  const summary = await generateAllWorkingPapers(templateDir, outputDir, ctx)
  console.log(` - Successfully generated ${summary.successfulFiles} / ${summary.totalFilesProcessed} files!`)

  // 3. Automated Microsoft Excel COM Verification
  console.log('3. Running Microsoft Excel COM Verification on all 12 generated files...')

  // Make sure no hung EXCEL.EXE processes
  try {
    execSync('taskkill /F /IM EXCEL.EXE', { stdio: 'ignore' })
  } catch {}

  const psScript = `
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false

    $outDir = (Resolve-Path '${outputDir.replace(/'/g, "''")}').Path
    $files = Get-ChildItem -Path $outDir -Filter '*.xlsx'
    
    Write-Host "Found $($files.Count) generated working papers."
    $passCount = 0
    $failCount = 0

    foreach ($f in $files) {
      $p = $f.FullName
      try {
        $wb = $excel.Workbooks.Open($p, 0, $true)
        $sheetCount = $wb.Sheets.Count
        $clientName = ""
        try {
          $addSheet = $wb.Sheets.Item("ADD")
          $clientName = $addSheet.Range("J2").Text
          if (-not $clientName) {
            $clientName = $addSheet.Range("A1").Text
          }
        } catch {}
        
        Write-Host " [PASS] $($f.Name) | Sheets: $sheetCount | Client: $clientName"
        $wb.Close($false)
        $passCount++
      } catch {
        Write-Host " [FAIL] $($f.Name) | Error: $($_.Exception.Message)"
        $failCount++
      }
    }

    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    Write-Host "========================================="
    Write-Host "EXCEL VERIFICATION SUMMARY: $passCount PASS, $failCount FAIL"
  `

  const psFile = path.resolve('temp_run_verify_all.ps1')
  fs.writeFileSync(psFile, psScript, 'utf8')

  try {
    const psOut = execSync('powershell -NoProfile -ExecutionPolicy Bypass -File temp_run_verify_all.ps1', {
      encoding: 'utf8',
    })
    console.log(psOut)
  } finally {
    try {
      fs.rmSync(psFile, { force: true })
    } catch {}
  }
}

main().catch(console.error)
