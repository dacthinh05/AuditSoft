$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $fullPath = (Get-Item "test_g100_debug.xlsx").FullName
    Write-Output "Opening filled G100 OpenXML file: $fullPath"
    $wb = $excel.Workbooks.Open($fullPath)
    Write-Output "OPENED_SUCCESSFULLY! Total sheets: $($wb.Sheets.Count)"
    $wb.Close($false)
} catch {
    Write-Output "EXCEL_OPEN_ERROR: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
