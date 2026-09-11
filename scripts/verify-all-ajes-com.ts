import path from 'path'
import fs from 'fs'
import ExcelJS from 'exceljs'
import { execSync } from 'child_process'
import { extractAccountingContext, generateAllWorkingPapers } from '../src/domain/workingpaper/WorkingPaperGenerator'
import type { AdjustingJournalEntry } from '../src/domain/workingpaper/types'

async function main() {
  console.log('--- BẮT ĐẦU KIỂM THỬ THỰC TẾ GLV & AJE VỚI EXCEL COM ---')
  const nkcPath = path.resolve(process.cwd(), 'MAU NKC.xlsx')
  const templateDir = path.resolve(process.cwd(), 'GLV MAU')
  const outputDir = path.resolve(process.cwd(), 'out_verify_wp_all')

  if (!fs.existsSync(nkcPath)) {
    console.error('Không tìm thấy file MAU NKC.xlsx')
    process.exit(1)
  }
  const ctx = await extractAccountingContext(nkcPath, {
    clientName: 'Công ty Cổ phần Thực Nghiệm Bắc Đẩu',
    fiscalYearEnd: '31/12/2024',
    auditorName: 'Nguyễn Đắc Thịnh',
  })

  // Thêm mock AJE để kiểm tra cả luồng có AJE và không AJE
  const mockAjes: AdjustingJournalEntry[] = [
    {
      stt: 1,
      glvRef: 'D341.1',
      noiDung: 'Trích thêm dự phòng nợ phải thu khó đòi khách hàng quá hạn',
      tkNo: '642',
      tkCo: '2293',
      soTien: 150000000,
      chiTieuCdkt: 'Dự phòng nợ phải thu khó đòi',
    },
    {
      stt: 2,
      glvRef: 'E241.1',
      noiDung: 'Điều chỉnh phân loại nợ phải trả người bán ngắn hạn sang dài hạn',
      tkNo: '331',
      tkCo: '331.DH',
      soTien: 200000000,
      chiTieuCdkt: 'Phải trả người bán dài hạn',
    },
  ]
  ctx.adjustingEntries = mockAjes

  console.log('Đang sinh toàn bộ 15 hồ sơ GLV...')
  const summary = await generateAllWorkingPapers(templateDir, outputDir, ctx)
  console.log(`Đã sinh thành công ${summary.successCount}/${summary.totalPapers} file GLV!`)

  // Kiểm tra bằng PowerShell Microsoft Excel COM
  const psScript = `
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$filesToCheck = @(
  "D300*.xlsx",
  "E200*.xlsx",
  "A - B - H*.xlsx",
  "G100*.xlsx",
  "E400*.xlsx"
)

$outDir = "${outputDir.replace(/\\/g, '/')}"

foreach ($pat in $filesToCheck) {
  $found = Get-ChildItem -Path $outDir -Filter $pat | Select-Object -First 1
  if ($found) {
    try {
      $wb = $excel.Workbooks.Open($found.FullName)
      Write-Host "SUCCESS: Opened $($found.Name) | Sheets: $($wb.Sheets.Count)"
      
      # Kiểm tra sheet cụ thể nếu là D300
      if ($found.Name -like "D300*") {
        $wsD390 = $wb.Sheets.Item("D 390")
        $c23 = $wsD390.Range("C23").Text
        $b27 = $wsD390.Range("B27").Text
        Write-Host "   D390 -> Row 23 Sum: $c23 | Conclusion B27: $b27"
        
        $wsD341 = $wb.Sheets.Item("D 341")
        $d341_c14 = $wsD341.Range("C14").Text
        Write-Host "   D341 -> AJE Content C14: $d341_c14"
      }
      
      # Kiểm tra sheet cụ thể nếu là E200
      if ($found.Name -like "E200*") {
        $wsE290 = $wb.Sheets.Item("E290")
        $c27 = $wsE290.Range("C27").Text
        $a30 = $wsE290.Range("A30").Text
        Write-Host "   E290 -> Row 27 Sum: $c27 | Conclusion A30: $a30"
        
        $wsE241 = $wb.Sheets.Item("E241")
        $e241_c14 = $wsE241.Range("C14").Text
        Write-Host "   E241 -> AJE Content C14: $e241_c14"
      }

      # Kiểm tra Master ABH
      if ($found.Name -like "A - B - H*") {
        $wsDc = $wb.Sheets.Item("CHITIETDC")
        $c4 = $wsDc.Range("C4").Text
        $f4 = $wsDc.Range("F4").Text
        Write-Host "   CHITIETDC -> C4: $c4 | F4 Amount: $f4"
      }

      $wb.Close($false)
    } catch {
      Write-Host "ERROR opening $($found.Name): $($_.Exception.Message)"
    }
  } else {
    Write-Host "WARNING: Not found pattern $pat"
  }
}

$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
`
  const psPath = path.join(outputDir, 'check_com.ps1')
  fs.writeFileSync(psPath, psScript, 'utf8')

  console.log('\n--- ĐANG MỞ FILE BẰNG MICROSOFT EXCEL THẬT QUA COM ---')
  const psResult = execSync(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, { encoding: 'utf8' })
  console.log(psResult)
}

main().catch(console.error)
