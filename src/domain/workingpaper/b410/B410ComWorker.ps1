param (
    [Parameter(Mandatory=$true)]
    [string]$MasterTemplatePath,
    
    [Parameter(Mandatory=$true)]
    [string]$SourceFilesCsv,
    
    [Parameter(Mandatory=$true)]
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"

function Normalize-AuditText([string]$text) {
    if ([string]::IsNullOrWhiteSpace($text)) { return $text }
    $normalized = $text.Normalize([System.Text.NormalizationForm]::FormC)
    $normalized = [regex]::Replace($normalized, '\s*([,;:])\s*', '$1 ')
    $normalized = [regex]::Replace($normalized, '(?<=[^\d\.\s])\.\s*', '. ')
    $normalized = [regex]::Replace($normalized, '[ \t]+', ' ')
    return $normalized.Trim()
}

function Extract-PerformerCleanName([string]$rawText, [string]$fileCreator) {
    $clean = ""
    if (-not [string]::IsNullOrWhiteSpace($rawText)) {
        # Strip prefixes like "Người thực hiện:", "Thực hiện:", "KTV:", "Người lập:"
        $clean = [regex]::Replace($rawText, '(?i)^[ \t\*\-:]*(ng.{1,4}i\s*th.{1,4}c\s*hi.{1,4}n|th.{1,4}c\s*hi.{1,4}n|ktv|ng.{1,4}i\s*l.{1,4}p)\s*[:\-]\s*', '')
        $clean = $clean.Trim()
    }

    if ([string]::IsNullOrWhiteSpace($clean) -or $clean.Length -lt 2) {
        if (-not [string]::IsNullOrWhiteSpace($fileCreator)) {
            $parts = $fileCreator.Split("-")
            $lastPart = $parts[$parts.Length - 1].Trim()
            if ($lastPart.Length -ge 2) {
                $clean = $lastPart
            } else {
                $clean = $fileCreator
            }
        }
    }
    return $clean.Trim()
}

function Find-B410MainSheet($wb) {
    if ($null -eq $wb -or $wb.Worksheets.Count -eq 0) { return $null }
    foreach ($ws in $wb.Worksheets) {
        if ($ws.Name -match '(?i)sai\s*s.{1,4}t|l.{1,4}u\s*.{1,4}') { return $ws }
    }
    foreach ($ws in $wb.Worksheets) {
        if ($ws.Name -match '(?i)B\s*410|B\.410') { return $ws }
    }
    foreach ($ws in $wb.Worksheets) {
        try {
            $rTxt = $ws.Cells.Item(8, 2).Text + " " + $ws.Cells.Item(9, 2).Text + " " + $ws.Cells.Item(11, 2).Text + " " + $ws.Cells.Item(8, 3).Text + " " + $ws.Cells.Item(9, 3).Text + " " + $ws.Cells.Item(11, 3).Text
            if ($rTxt -match '(?i)Gi.{1,2}y LV|GLV|Th.{1,4}c\s*tr.{1,4}ng') { return $ws }
        } catch {}
    }
    return $wb.Worksheets.Item(1)
}

Write-Host "Initializing Universal B410 COM Engine..."
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.ScreenUpdating = $false
$excel.EnableEvents = $false
$excel.AskToUpdateLinks = $false

$masterWb = $null

try {
    Write-Host "Opening Master Template..."
    $masterWb = $excel.Workbooks.Open($MasterTemplatePath, 0, $false)
    try { $excel.Calculation = -4135 } catch {} # xlCalculationManual
    $masterWs = Find-B410MainSheet $masterWb
    Write-Host "Detected Master main sheet: $($masterWs.Name)"
    foreach ($mn in $masterWb.Names) {
        try { $mn.Delete() } catch {}
    }
    
    # Row 11 headers (B: TT, C: Giấy LV, D:E: Thực trạng, F:H: Hướng xử lý, I: Ý kiến khách hàng) được giữ nguyên 100%

    $openSourceWorkbooks = [System.Collections.ArrayList]::new()

    # ── PHÁT HIỆN DÒNG TIÊU ĐỀ CỦA FILE MASTER & XÓA SẠCH DỮ LIỆU CŨ ──
    $masterHeaderRow = -1
    $masterLast = $masterWs.Cells.SpecialCells(11).Row
    for ($r = 6; $r -le [Math]::Min(14, $masterLast); $r++) {
        $rowTxt = ""
        for ($c = 1; $c -le 4; $c++) {
            $rowTxt += " " + $masterWs.Cells.Item($r, $c).Text.Trim()
        }
        if ($rowTxt -match '(?i)Th.{1,4}c\s*tr.{1,4}ng|H.{1,4}.{1,4}ng\s*x.{1,4}\s*l.{1,4}|Gi.{1,2}y LV|GLV') {
            $masterHeaderRow = $r
            break
        }
    }
    if ($masterHeaderRow -eq -1) { $masterHeaderRow = 11 }
    $masterDataStartRow = $masterHeaderRow + 1

    Write-Host "Master Template Header at Row $masterHeaderRow. Clearing old rows from $masterDataStartRow to $masterLast..."
    if ($masterLast -ge $masterDataStartRow) {
        $masterWs.Range("A${masterDataStartRow}:I${masterLast}").Clear() | Out-Null
    }

    $script:destRow = $masterDataStartRow
    $script:ttCounter = 1

    $filesList = $SourceFilesCsv -split '\|'
    foreach ($sourceFile in $filesList) {
        $sourceFile = $sourceFile.Trim()
        if ([string]::IsNullOrWhiteSpace($sourceFile)) { continue }
        Write-Host "Processing Source File: $sourceFile"
        
        try {
            $sourceWb = $excel.Workbooks.Open($sourceFile, 0, $true)
            $sourceWs = Find-B410MainSheet $sourceWb
            Write-Host "Detected Source main sheet: $($sourceWs.Name)"
            $fileCreator = [System.IO.Path]::GetFileNameWithoutExtension($sourceFile)
            $lastSourceRow = $sourceWs.Cells.SpecialCells(11).Row
            if ($lastSourceRow -lt 5) { continue }

            # ── 1. DYNAMIC HEADER & COLUMN DETECTION ──
            $headerRow = -1
            $codeCol = 3
            $descCol = 4

            for ($r = 7; $r -le [Math]::Min(12, $lastSourceRow); $r++) {
                $rowTxt = ""
                for ($c = 1; $c -le 4; $c++) {
                    $rowTxt += " " + $sourceWs.Cells.Item($r, $c).Text.Trim()
                }
                if ($rowTxt -match '(?i)Th.{1,4}c\s*tr.{1,4}ng|H.{1,4}.{1,4}ng\s*x.{1,4}\s*l.{1,4}') {
                    $headerRow = $r
                    if ($sourceWs.Cells.Item($r, 3).Text -match '(?i)Gi.{1,2}y LV|GLV|M.{1,2}') {
                        $codeCol = 3
                        $descCol = 4
                    } elseif ($sourceWs.Cells.Item($r, 2).Text -match '(?i)Gi.{1,2}y LV|GLV|M.{1,2}') {
                        $codeCol = 2
                        $descCol = 3
                    } else {
                        $codeCol = 1
                        $descCol = 2
                    }
                    break
                }
            }
            if ($headerRow -eq -1) { $headerRow = 8 }

            # ── 2. XÁC ĐỊNH DÒNG GLV ĐẦU TIÊN VÀ DÒNG CUỐI CỦA BẢNG ──
            $firstGLVRow = -1
            for ($r = $headerRow + 1; $r -le [Math]::Min($headerRow + 8, $lastSourceRow); $r++) {
                $cVal = $sourceWs.Cells.Item($r, [int]$codeCol).Text.Trim()
                $dVal = $sourceWs.Cells.Item($r, [int]$descCol).Text.Trim()
                if (-not [string]::IsNullOrWhiteSpace($cVal) -or -not [string]::IsNullOrWhiteSpace($dVal)) {
                    $firstGLVRow = $r
                    break
                }
            }
            if ($firstGLVRow -eq -1) { $firstGLVRow = $headerRow + 1 }

            $lastDataRow = $firstGLVRow
            for ($r = $lastSourceRow; $r -ge $firstGLVRow; $r--) {
                $rowText = ""
                for ($c = 1; $c -le 8; $c++) {
                    $rowText += $sourceWs.Cells.Item($r, $c).Text.Trim()
                }
                if (-not [string]::IsNullOrWhiteSpace($rowText)) {
                    $lastDataRow = $r
                    break
                }
            }

            $tableHeight = ($lastDataRow - $firstGLVRow + 1)
            Write-Host "  -> Fast Table Copy: Row $firstGLVRow to $lastDataRow ($tableHeight rows)"

            if ($tableHeight -gt 0) {
                # ── 3. COPY NGUYÊN KHỐI 1 LỆNH DUY NHẤT ──
                if ($codeCol -eq 3) {
                    $sourceWs.Range("C${firstGLVRow}:I${lastDataRow}").Copy($masterWs.Range("C$($script:destRow)")) | Out-Null
                } elseif ($codeCol -eq 2) {
                    $sourceWs.Range("B${firstGLVRow}:H${lastDataRow}").Copy($masterWs.Range("C$($script:destRow)")) | Out-Null
                } else {
                    $sourceWs.Range("A${firstGLVRow}:G${lastDataRow}").Copy($masterWs.Range("C$($script:destRow)")) | Out-Null
                }

                # ── 4. ĐỒNG BỘ CHIỀU CAO DÒNG (ROW HEIGHT) ĐỂ KHÔNG BAO GIỜ BỊ ĐÈ HÌNH ──
                for ($offset = 0; $offset -lt $tableHeight; $offset++) {
                    $srcR = $firstGLVRow + $offset
                    $dstR = $script:destRow + $offset
                    try {
                        $srcH = $sourceWs.Rows.Item($srcR).RowHeight
                        if ($srcH -gt 15) {
                            $masterWs.Rows.Item($dstR).RowHeight = $srcH
                        }
                    } catch {}
                }

                # ── 5. ĐẢM BẢO 4 CỘT CƠ BẢN: C (Giấy LV), D:E (Thực trạng - MERGE), F:H (Hướng xử lý - MERGE), I (Ý kiến KH) ──
                $masterWs.Range("B$($script:destRow):B$($script:destRow + $tableHeight - 1)").ClearContents() | Out-Null
                for ($r = $script:destRow; $r -lt ($script:destRow + $tableHeight); $r++) {
                    try {
                        if (-not $masterWs.Range("D$r").MergeCells) {
                            $masterWs.Range("D$r:E$r").Merge()
                        }
                    } catch {}
                    try {
                        if (-not $masterWs.Range("F$r").MergeCells) {
                            $masterWs.Range("F$r:H$r").Merge()
                        }
                    } catch {}

                    # Đánh số TT liên tục ở Cột B nếu dòng có mã GLV ở Cột C
                    $glvText = $masterWs.Cells.Item($r, 3).Text.Trim()
                    if ($glvText -match '^[A-Za-z0-9]' -and $glvText -notmatch '(?i)Ng.{1,4}i|Th.{1,4}c|T.{1,4}ng') {
                        $masterWs.Cells.Item($r, 2).Value2 = [string]$script:ttCounter
                        $masterWs.Cells.Item($r, 2).HorizontalAlignment = 3 # xlCenter
                        $script:ttCounter++
                    }
                }

                # Tăng dòng + 1 dòng trống ngăn cách
                $script:destRow += $tableHeight + 1
            }
            # ── 5. COPY ATTACHED EXTRA SHEETS (NẾU KHÔNG TRÙNG FILE MASTER) ──
            $isSameAsMaster = $false
            try {
                $isSameAsMaster = ([System.IO.Path]::GetFullPath($sourceFile) -ieq [System.IO.Path]::GetFullPath($MasterTemplatePath))
            } catch {}

            if (-not $isSameAsMaster) {
                foreach ($n in $sourceWb.Names) { try { $n.Delete() } catch {} }
                $fixedSheetCount = $sourceWb.Worksheets.Count
                for ($s = 1; $s -le $fixedSheetCount; $s++) {
                    $extraWs = $sourceWb.Worksheets.Item($s)
                    if ($extraWs.Name -ieq $sourceWs.Name) { continue } # Bỏ qua sheet chính đã gộp
                    $cleanPrefix = $fileCreator.Split("-")[0].Trim()
                    if ($cleanPrefix.Length -gt 10) { $cleanPrefix = $cleanPrefix.Substring(0, 10) }
                    $cleanName = ($cleanPrefix + "_" + $extraWs.Name) -replace '[\\/\?\*\[\]:]', ''
                    if ($cleanName.Length -gt 31) { $cleanName = $cleanName.Substring(0, 31) }

                    $alreadyExists = $false
                    foreach ($existingWs in $masterWb.Worksheets) {
                        if ($existingWs.Name -ieq $cleanName -or $existingWs.Name -ieq $extraWs.Name) {
                            $alreadyExists = $true
                            break
                        }
                    }
                    if ($alreadyExists) { continue }

                    try {
                        foreach ($sn in $extraWs.Names) { try { $sn.Delete() } catch {} }
                        $extraWs.Copy([Type]::Missing, $masterWb.Worksheets.Item($masterWb.Worksheets.Count)) | Out-Null
                        $newSheet = $masterWb.Worksheets.Item($masterWb.Worksheets.Count)
                        $newSheet.Name = $cleanName
                    } catch {}
                }
            }

        } catch {
            Write-Host "Warning: Skipped $sourceFile due to error: $($_.Exception.Message)"
        }
    }
    Write-Host "Optimizing Page Setup and Print Area..."
    $finalLastRow = $script:destRow - 1
    if ($finalLastRow -lt 12) { $finalLastRow = 12 }

    $ps = $masterWs.PageSetup
    $ps.Orientation = 2 # xlLandscape
    $ps.PaperSize = 9   # xlPaperA4
    $ps.PrintArea = "A1:I$finalLastRow"
    $ps.PrintTitleRows = "`$11:`$11"
    $ps.CenterHorizontally = $true
    $ps.Zoom = $false
    $ps.FitToPagesWide = 1
    $ps.FitToPagesTall = $false

    $masterWs.Range("A11:I$finalLastRow").WrapText = $true
    
    # Khôi phục tính toán tự động
    try {
        $excel.Calculation = -4105 # xlCalculationAutomatic
        $excel.Calculate()
    } catch {}

    # ── TỰ ĐỘNG CHUYỂN CÔNG THỨC CHỨA LINK NGOÀI THÀNH GIÁ TRỊ TĨNH ──
    Write-Host "Neutralizing external link formulas..."
    foreach ($ws in $masterWb.Worksheets) {
        try {
            $formulas = $ws.UsedRange.SpecialCells(3) # 3 = xlCellTypeFormulas
            if ($null -ne $formulas) {
                foreach ($cell in $formulas) {
                    try {
                        if ($cell.Formula -match '\[.*\]') {
                            $cell.Value2 = $cell.Value2
                        }
                    } catch {}
                }
            }
        } catch {}
    }

    # Xóa Defined Names có liên kết ngoài
    foreach ($n in $masterWb.Names) {
        try {
            if ($n.RefersTo -match '\[.*\]') {
                $n.Delete()
            }
        } catch {}
    }

    # Bẻ gãy toàn bộ liên kết ngoài còn lại
    Write-Host "Breaking all external workbook links..."
    try {
        $links = $masterWb.LinkSources(1) # 1 = xlExcelLinks
        if ($null -ne $links) {
            foreach ($link in $links) {
                try {
                    $masterWb.BreakLink($link, 1) # 1 = xlLinkTypeExcelLinks
                    Write-Host "Broken link: $link"
                } catch {}
            }
        }
        $masterWb.UpdateLinks = 2 # 2 = xlUpdateLinksNever
    } catch {}

    # ── SAVE AS MODERN EXCEL WORKBOOK (.xlsx - xlOpenXMLWorkbook = 51) ──
    Write-Host "Saving modern Excel (.xlsx) file to $OutputPath..."
    if (Test-Path $OutputPath) {
        Remove-Item $OutputPath -Force -ErrorAction SilentlyContinue
    }
    # xlOpenXMLWorkbook = 51 (chuẩn file .xlsx mới nhất)
    $masterWb.SaveAs($OutputPath, 51)
    Write-Host "Universal merge and layout optimization completed! Saved to $OutputPath"
} catch {
    Write-Host "Fatal Error during consolidation: $($_.Exception.Message)"
    Write-Host "Line: $($_.InvocationInfo.ScriptLineNumber)"
    Write-Host "Position: $($_.InvocationInfo.PositionMessage)"
    exit 1
} finally {
    # Bọc try/catch cho từng COM cleanup để không bao giờ bị crash process sau khi đã lưu file
    try {
        if ($null -ne $openSourceWorkbooks) {
            foreach ($wb in $openSourceWorkbooks) {
                try { if ($wb) { $wb.Close($false) } } catch {}
                try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) | Out-Null } catch {}
            }
        }
    } catch {}

    try {
        if ($masterWb) { $masterWb.Close($false) }
    } catch {}
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($masterWb) | Out-Null } catch {}

    try {
        if ($excel) { $excel.Quit() }
    } catch {}
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null } catch {}
}
