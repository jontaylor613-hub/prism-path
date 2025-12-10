# Directory Flattening Script
# Moves all contents from prism-path/prism-path/ to root, overwriting conflicts

Write-Host "=== Directory Flattening Script ===" -ForegroundColor Cyan
Write-Host ""

$sourcePath = "prism-path\prism-path"
$rootPath = "."

# Check if the nested directory exists
if (-not (Test-Path $sourcePath)) {
    Write-Host "WARNING: Source directory '$sourcePath' does not exist!" -ForegroundColor Yellow
    Write-Host "Checking for alternative path 'prism-path'..." -ForegroundColor Yellow
    
    if (Test-Path "prism-path") {
        Write-Host "Found 'prism-path' directory. Using that as source instead." -ForegroundColor Green
        $sourcePath = "prism-path"
    } else {
        Write-Host "ERROR: Neither '$sourcePath' nor 'prism-path' found. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Source directory: $sourcePath" -ForegroundColor Green
Write-Host "Target directory: $rootPath" -ForegroundColor Green
Write-Host ""

# Get all items in the source directory
$items = Get-ChildItem -Path $sourcePath -Force

if ($items.Count -eq 0) {
    Write-Host "Source directory is empty. Nothing to move." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($items.Count) items to move:" -ForegroundColor Cyan
$items | ForEach-Object { Write-Host "  - $($_.Name)" }

Write-Host ""
Write-Host "Starting move operation (this will overwrite existing files)..." -ForegroundColor Yellow
Write-Host ""

# Move each item to the root, overwriting if it exists
$movedCount = 0
$errorCount = 0

foreach ($item in $items) {
    $targetPath = Join-Path $rootPath $item.Name
    
    try {
        # Remove target if it exists (for overwrite)
        if (Test-Path $targetPath) {
            Write-Host "Overwriting: $($item.Name)" -ForegroundColor Yellow
            Remove-Item -Path $targetPath -Recurse -Force -ErrorAction Stop
        } else {
            Write-Host "Moving: $($item.Name)" -ForegroundColor Green
        }
        
        # Move the item
        Move-Item -Path $item.FullName -Destination $targetPath -Force -ErrorAction Stop
        $movedCount++
    }
    catch {
        Write-Host "ERROR moving $($item.Name): $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "=== Move Operation Complete ===" -ForegroundColor Cyan
Write-Host "Successfully moved: $movedCount items" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "Errors encountered: $errorCount items" -ForegroundColor Red
}

# Cleanup: Remove empty source directory (but not if it's just 'prism-path' without nesting)
if ($sourcePath -eq "prism-path\prism-path") {
    Write-Host ""
    Write-Host "Checking if source directory is empty..." -ForegroundColor Cyan
    
    $remainingItems = Get-ChildItem -Path $sourcePath -Force -ErrorAction SilentlyContinue
    if ($null -eq $remainingItems -or $remainingItems.Count -eq 0) {
        Write-Host "Removing empty directory: $sourcePath" -ForegroundColor Yellow
        Remove-Item -Path $sourcePath -Force -ErrorAction SilentlyContinue
        Write-Host "Directory removed." -ForegroundColor Green
    } else {
        Write-Host "WARNING: Source directory still contains items. Not removing." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Verification ===" -ForegroundColor Cyan

# Verify key files
$keyFiles = @("src\App.jsx", "package.json", "vite.config.js", "tailwind.config.js")

foreach ($file in $keyFiles) {
    if (Test-Path $file) {
        Write-Host "✓ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing: $file" -ForegroundColor Red
    }
}

# Check for Parent Portal import in App.jsx
if (Test-Path "src\App.jsx") {
    $appContent = Get-Content "src\App.jsx" -Raw
    if ($appContent -match "ParentDashboard|ParentPortal") {
        Write-Host "✓ App.jsx contains Parent Portal reference" -ForegroundColor Green
    } else {
        Write-Host "⚠ App.jsx does not contain Parent Portal reference" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Script Complete ===" -ForegroundColor Cyan

