# Icon Removal Script
# This PowerShell script removes all emoji icons from student portal HTML files

$files = @(
    "applications.html",
    "ielts-materials.html",
    "profile.html",
    "invoices.html",
    "universities.html",
    "ielts-courses.html",
    "documents.html",
    "notifications.html"
)

$basePath = "d:\ilham-backend\public\student"

foreach ($file in $files) {
    $filePath = Join-Path $basePath $file
    $content = Get-Content $filePath -Raw -Encoding UTF8
    
    # Remove all sidebar icons (emoji spans)
    $content = $content -replace '<span class="sidebar-icon">[^<]+</span>\r?\n\s*', ''
    
    # Remove emojis from page titles
    $content = $content -replace '(<h1 class="page-title">)[^<]*?(</h1>)', {
        $match = $args[0]
        $text = $match.Groups[0].Value
        # Remove emojis but keep the text
        $text -replace '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]', ''
    }
    
    Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Processed: $file"
}

Write-Host "Done! All emoji icons removed."
