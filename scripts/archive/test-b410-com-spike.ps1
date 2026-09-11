$ErrorActionPreference = "Stop"

# Constants
$sourceFile1 = "D:\Desktop\Project\5. AuditSoft\B410\B410 - XCEL WOOD (TL - 31.10.2025) - Gia Cuong.xlsx"
$sourceFile2 = "D:\Desktop\Project\5. AuditSoft\B410\B 410 - Tong hop luu y kiem toan  - Regent 2025.xls"
$outputFile = "D:\Desktop\Project\5. AuditSoft\B410\Spike_Master_B410.xlsx"

Write-Host "Initializing Excel COM Object..."
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$masterWb = $null
$sourceWb1 = $null
$sourceWb2 = $null

try {
    # 1. Create a dummy Master workbook
    Write-Host "Creating Master Workbook..."
    $masterWb = $excel.Workbooks.Add()
    $masterWs = $masterWb.Worksheets.Item(1)
    $masterWs.Name = "Master_B410"
    
    # 2. Test reading XLSX and copying a block
    Write-Host "Opening Source 1 ($sourceFile1)..."
    $sourceWb1 = $excel.Workbooks.Open($sourceFile1, 0, $true) # ReadOnly
    $sourceWs1 = $sourceWb1.Worksheets.Item(1)
    
    Write-Host "Copying block (rows 12 to 20) from Source 1 to Master..."
    $sourceRange = $sourceWs1.Range("A12:G20")
    $destRange = $masterWs.Range("A12")
    $sourceRange.Copy($destRange) | Out-Null
    
    # Check if shapes within this range were copied automatically.
    # If not, we'll manually copy them.
    Write-Host "Checking for shapes in Source 1..."
    foreach ($shape in $sourceWs1.Shapes) {
        $row = $shape.TopLeftCell.Row
        if ($row -ge 12 -and $row -le 20) {
            Write-Host "Found shape in range at row $row. Attempting manual copy if needed..."
            # In Excel, if shape is set to move/size with cells, it copies automatically.
            # We can also explicitly copy:
            $shape.Copy() | Out-Null
            # Paste it relative to the destination
            $pasteRow = $destRange.Row + ($row - 12)
            $masterWs.Paste($masterWs.Range("A$pasteRow")) | Out-Null
        }
    }

    # 3. Test Worksheet.Copy for attached sheets
    Write-Host "Testing Worksheet.Copy for attached sheets..."
    if ($sourceWb1.Worksheets.Count -gt 1) {
        $extraWs = $sourceWb1.Worksheets.Item(2)
        Write-Host "Copying sheet: $($extraWs.Name)"
        $extraWs.Copy([Type]::Missing, $masterWb.Worksheets.Item($masterWb.Worksheets.Count)) | Out-Null
        $newSheet = $masterWb.Worksheets.Item($masterWb.Worksheets.Count)
        $newSheet.Name = "GiaCuong_Bke01" # Simulating renaming
    }
    
    # 4. Test error handling on a locked/password file (simulated by passing bad path or corrupt file)
    Write-Host "Testing error handling on invalid file..."
    try {
        $badWb = $excel.Workbooks.Open("D:\Desktop\Project\5. AuditSoft\B410\NonExistentFile.xls")
    } catch {
        Write-Host "Successfully caught error for invalid file: $($_.Exception.Message)"
    }

    # 5. Save the Master Workbook
    if (Test-Path $outputFile) {
        Remove-Item $outputFile -Force
    }
    Write-Host "Saving Master Workbook to $outputFile..."
    $masterWb.SaveAs($outputFile, 51) # 51 = xlOpenXMLWorkbook (.xlsx)
    Write-Host "Spike completed successfully!"

} catch {
    Write-Host "ERROR occurred during Spike:"
    Write-Host $_.Exception.Message
} finally {
    Write-Host "Cleaning up COM objects..."
    if ($sourceWb1) { $sourceWb1.Close($false) }
    if ($sourceWb2) { $sourceWb2.Close($false) }
    if ($masterWb) { $masterWb.Close($false) }
    
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    Write-Host "COM Objects released."
}
