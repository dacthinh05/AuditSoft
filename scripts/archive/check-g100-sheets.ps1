$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $fullPath = (Get-Item "test_g100_filled.xlsx").FullName
    Write-Output "Opening file: $fullPath"
    $wb = $excel.Workbooks.Open($fullPath)
    Write-Output "TOTAL_SHEETS: $($wb.Sheets.Count)"
    for ($i = 1; $i -le $wb.Sheets.Count; $i++) {
        $s = $wb.Sheets.Item($i)
        Write-Output "SHEET: $($s.Name)"
    }
    $wb.Close($false)
} catch {
    Write-Output "OPEN_ERROR: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
