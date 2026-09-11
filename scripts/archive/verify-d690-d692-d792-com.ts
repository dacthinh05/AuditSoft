import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { extractAccountingContext, generateAllWorkingPapers } from '../src/domain/workingpaper/WorkingPaperGenerator'

async function main() {
  console.log('--- BẮT ĐẦU KIỂM THỬ XÁC MINH D690, D692, D792 QUA EXCEL COM ---')
  const nkcPath = path.resolve(process.cwd(), 'MAU NKC.xlsx')
  const templateDir = path.resolve(process.cwd(), 'GLV MAU')
  const outputDir = path.resolve(process.cwd(), 'out_verify_d692_d792')

  if (!fs.existsSync(nkcPath)) {
    console.error('Không tìm thấy file MAU NKC.xlsx')
    process.exit(1)
  }

  const ctx = await extractAccountingContext(nkcPath, {
    clientName: 'Công ty Cổ phần Thực Nghiệm Bắc Đẩu',
    fiscalYearEnd: '31/12/2024',
    auditorName: 'Nguyễn Đắc Thịnh',
  })

  console.log('Đang sinh hồ sơ GLV...')
  const summary = await generateAllWorkingPapers(templateDir, outputDir, ctx)
  console.log(`Đã sinh thành công ${summary.successCount}/${summary.totalPapers} file GLV!`)

  const psScript = `
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$outDir = "${outputDir.replace(/\\/g, '/')}"

try {
  $d600File = Get-ChildItem -Path $outDir -Filter "D600*.xlsx" | Select-Object -First 1
  if ($d600File) {
    $wb = $excel.Workbooks.Open($d600File.FullName)
    Write-Host "SUCCESS: Mo thanh cong D600 | Sheets:" $wb.Sheets.Count

    $ws690 = $wb.Sheets.Item("D 690")
    Write-Host "--- D 690 (ROW 32) ---"
    Write-Host "   Col A (Date):   " $ws690.Range('A32').Text
    Write-Host "   Col B (DocNo):  " $ws690.Range('B32').Text
    Write-Host "   Col C (Desc):   " $ws690.Range('C32').Text
    Write-Host "   Col D (TK No):  " $ws690.Range('D32').Text
    Write-Host "   Col E (TK Co):  " $ws690.Range('E32').Text
    Write-Host "   Col F (So PS):  " $ws690.Range('F32').Text
    Write-Host "   Col I (Chk):    " $ws690.Range('I32').Text

    $ws692 = $wb.Sheets.Item("D 692")
    Write-Host "--- D 692 (TK 242 12M MATRIX) ---"
    Write-Host "   Row 15 (DK 242): So KT:" $ws692.Range('B15').Text " | Bang PB:" $ws692.Range('D15').Text " | Diff:" $ws692.Range('E15').Text
    Write-Host "   Row 27 (CK 242): So KT:" $ws692.Range('B27').Text " | Bang PB:" $ws692.Range('D27').Text " | Diff:" $ws692.Range('E27').Text
    Write-Host "   Row 34 (Month 1): 627:" $ws692.Range('B34').Text " | 641:" $ws692.Range('C34').Text " | 642:" $ws692.Range('D34').Text " | Sum:" $ws692.Range('E34').Text " | Diff:" $ws692.Range('H34').Text
    Write-Host "   Row 46 (Full Year): 627:" $ws692.Range('B46').Text " | 641:" $ws692.Range('C46').Text " | 642:" $ws692.Range('D46').Text " | Sum:" $ws692.Range('E46').Text

    $wb.Close($false)
  }

  $d700File = Get-ChildItem -Path $outDir -Filter "D700*.xlsx" | Select-Object -First 1
  if ($d700File) {
    $wb = $excel.Workbooks.Open($d700File.FullName)
    Write-Host "SUCCESS: Mo thanh cong D700 | Sheets:" $wb.Sheets.Count

    $ws792 = $wb.Sheets.Item("D 792")
    Write-Host "--- D 792 (TK 214 12M MATRIX) ---"
    Write-Host "   Row 14 (DK 2111): So KT:" $ws792.Range('B14').Text " | Bang KH:" $ws792.Range('D14').Text " | Diff:" $ws792.Range('E14').Text
    Write-Host "   Row 31 (CK 2111): So KT:" $ws792.Range('B31').Text " | Bang KH:" $ws792.Range('D31').Text " | Diff:" $ws792.Range('E31').Text
    Write-Host "   Row 49 (Month 1): 627:" $ws792.Range('B49').Text " | 641:" $ws792.Range('C49').Text " | 642:" $ws792.Range('D49').Text " | Sum:" $ws792.Range('E49').Text " | Diff:" $ws792.Range('H49').Text
    Write-Host "   Row 61 (Full Year): 627:" $ws792.Range('B61').Text " | 641:" $ws792.Range('C61').Text " | 642:" $ws792.Range('D61').Text " | Sum:" $ws792.Range('E61').Text

    $wb.Close($false)
  }
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
} finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
`
  const psPath = path.join(outputDir, 'check_d692_d792.ps1')
  fs.writeFileSync(psPath, psScript, 'utf8')

  console.log('\n--- ĐANG MỞ FILE BẰNG MICROSOFT EXCEL THẬT QUA COM ---')
  const psResult = execSync(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, { encoding: 'utf8' })
  console.log(psResult)
}

main().catch(console.error)
