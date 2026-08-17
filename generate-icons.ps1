# PaperTranslator 图标生成脚本
Add-Type -AssemblyName System.Drawing

$outputDir = "D:\豆包\文献翻译器\paper-translator\icons"
$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # 渐变背景
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(79, 110, 247), [System.Drawing.Color]::FromArgb(108, 92, 231), 45)
    $g.FillRectangle($brush, $rect)

    # 圆角遮罩效果（画一个圆角矩形）
    $radius = [int]($size * 0.2)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $radius, $radius, 180, 90)
    $path.AddArc($size - $radius, 0, $radius, $radius, 270, 90)
    $path.AddArc($size - $radius, $size - $radius, $radius, $radius, 0, 90)
    $path.AddArc(0, $size - $radius, $radius, $radius, 90, 90)
    $path.CloseFigure()

    # 书本图标（白色简化书本）
    $bookColor = [System.Drawing.Color]::White
    $bookBrush = New-Object System.Drawing.SolidBrush($bookColor)
    $pen = New-Object System.Drawing.Pen($bookColor, [float]($size * 0.06))

    # 书的左页
    $leftX = [int]($size * 0.2)
    $rightX = [int]($size * 0.8)
    $topY = [int]($size * 0.25)
    $bottomY = [int]($size * 0.75)
    $midX = [int]($size * 0.5)

    # 左页
    $g.FillRectangle($bookBrush, $leftX, $topY, $midX - $leftX, $bottomY - $topY)
    # 右页
    $g.FillRectangle($bookBrush, $midX, $topY, $rightX - $midX, $bottomY - $topY)

    # 书脊（深色线）
    $spineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 200, 255))
    $g.FillRectangle($spineBrush, $midX - 1, $topY, 2, $bottomY - $topY)

    # 文字 "文" 或 "T"
    if ($size -ge 48) {
        $fontSize = [int]($size * 0.28)
        $font = New-Object System.Drawing.Font("Microsoft YaHei", $fontSize, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(79, 110, 247))
        $text = "译"
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
        $textRect = New-Object System.Drawing.RectangleF($leftX, $topY, $rightX - $leftX, $bottomY - $topY)
        $g.DrawString($text, $font, $textBrush, $textRect, $sf)
    }

    $bmp.Save("$outputDir\icon$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated icon${size}.png"
}

Write-Host "All icons generated successfully!"
