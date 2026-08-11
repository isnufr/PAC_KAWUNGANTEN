Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\src\PAC_KAWUNGANTEN\public\logo.png"
$img = [System.Drawing.Image]::FromFile($sourcePath)

$maxDimension = [Math]::Max($img.Width, $img.Height)

function CreateSquareIcon($size, $outputPath) {
    # Create square bitmap
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $bmp.SetResolution($img.HorizontalResolution, $img.VerticalResolution)
    
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Fill transparent background
    $graphics.Clear([System.Drawing.Color]::Transparent)
    
    # Calculate scale and position to fit image in the square (with some padding, e.g., 65% size)
    $paddingRatio = 0.65
    $scale = ($size * $paddingRatio) / $maxDimension
    
    $newWidth = [math]::Round($img.Width * $scale)
    $newHeight = [math]::Round($img.Height * $scale)
    
    $posX = [math]::Round(($size - $newWidth) / 2)
    $posY = [math]::Round(($size - $newHeight) / 2)
    
    # Draw image
    $graphics.DrawImage($img, $posX, $posY, $newWidth, $newHeight)
    
    # Save
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $bmp.Dispose()
    
    Write-Host "Created $outputPath"
}

CreateSquareIcon 192 "c:\src\PAC_KAWUNGANTEN\public\icon-192x192.png"
CreateSquareIcon 512 "c:\src\PAC_KAWUNGANTEN\public\icon-512x512.png"

$img.Dispose()
Write-Host "Done"
