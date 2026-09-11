Add-Type -AssemblyName System.Drawing

$buildDir = "D:\Desktop\AuditSoft\build"
$pngPath = Join-Path $buildDir "icon.png"
$icoPath = Join-Path $buildDir "icon.ico"

# Tạo Bitmap 256x256
$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Vẽ nền Squircle #0f172a
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 51, 65, 85), 6)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 56
$path.AddArc(12, 12, $radius, $radius, 180, 90)
$path.AddArc(244 - $radius, 12, $radius, $radius, 270, 90)
$path.AddArc(244 - $radius, 244 - $radius, $radius, $radius, 0, 90)
$path.AddArc(12, 244 - $radius, $radius, $radius, 90, 90)
$path.CloseFigure()

$g.FillPath($bgBrush, $path)
$g.DrawPath($borderPen, $path)

# Vẽ Trụ Nguồn 1 (Blue)
$p1Brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
$p1Rect = New-Object System.Drawing.Rectangle(70, 86, 44, 94)
$g.FillRectangle($p1Brush, $p1Rect)

# Vẽ Trụ Nguồn 2 (Emerald)
$p2Brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 5, 150, 105))
$p2Rect = New-Object System.Drawing.Rectangle(134, 112, 44, 68)
$g.FillRectangle($p2Brush, $p2Rect)

# Vẽ Dấu Checkmark Trắng
$checkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 16)
$checkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$checkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$checkPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$points = @(
  (New-Object System.Drawing.Point(82, 126)),
  (New-Object System.Drawing.Point(112, 156)),
  (New-Object System.Drawing.Point(176, 86))
)
$g.DrawLines($checkPen, $points)

# Vẽ Top dot
$dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
$g.FillEllipse($dotBrush, 118, 44, 20, 20)

$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Lưu ra ICO
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

$g.Dispose()
$bmp.Dispose()

Write-Host "Generated icon.png and icon.ico successfully!"
