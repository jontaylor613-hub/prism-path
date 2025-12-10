# Directory Flattening Commands

## Option 1: Run the Automated Script (Recommended)
```powershell
.\flatten_directory.ps1
```

## Option 2: Manual Step-by-Step Commands

### Step 1: Verify Source Directory Exists
```powershell
Test-Path "prism-path\prism-path"
```

### Step 2: Move Source Directory Contents to Root (Overwriting Conflicts)

**Move all files and folders:**
```powershell
# Get all items from source
$source = "prism-path\prism-path"
$items = Get-ChildItem -Path $source -Force

# Move each item to root, overwriting existing
foreach ($item in $items) {
    $target = Join-Path "." $item.Name
    if (Test-Path $target) {
        Remove-Item -Path $target -Recurse -Force
    }
    Move-Item -Path $item.FullName -Destination $target -Force
    Write-Host "Moved: $($item.Name)"
}
```

**Or move individual key items:**
```powershell
# Move src folder (overwrites existing)
Remove-Item -Path "src" -Recurse -Force -ErrorAction SilentlyContinue
Move-Item -Path "prism-path\prism-path\src" -Destination "src" -Force

# Move package.json
Remove-Item -Path "package.json" -Force -ErrorAction SilentlyContinue
Move-Item -Path "prism-path\prism-path\package.json" -Destination "package.json" -Force

# Move vite.config.js
Remove-Item -Path "vite.config.js" -Force -ErrorAction SilentlyContinue
Move-Item -Path "prism-path\prism-path\vite.config.js" -Destination "vite.config.js" -Force

# Move tailwind.config.js
Remove-Item -Path "tailwind.config.js" -Force -ErrorAction SilentlyContinue
Move-Item -Path "prism-path\prism-path\tailwind.config.js" -Destination "tailwind.config.js" -Force

# Move other directories/files as needed
Get-ChildItem -Path "prism-path\prism-path" -Force | ForEach-Object {
    $target = Join-Path "." $_.Name
    if (-not (Test-Path $target)) {
        Move-Item -Path $_.FullName -Destination $target -Force
    }
}
```

### Step 3: Cleanup - Remove Empty Inner Directory
```powershell
# Check if directory is empty
$remaining = Get-ChildItem -Path "prism-path\prism-path" -Force -ErrorAction SilentlyContinue
if ($null -eq $remaining -or $remaining.Count -eq 0) {
    Remove-Item -Path "prism-path\prism-path" -Force
    Write-Host "Removed empty directory"
} else {
    Write-Host "Directory still contains items: $($remaining.Count)"
}
```

### Step 4: Verification
```powershell
# Check for key files
Test-Path "src\App.jsx"
Test-Path "package.json"

# Check for Parent Portal import
Select-String -Path "src\App.jsx" -Pattern "ParentDashboard|ParentPortal"
```

## Alternative: If the source is actually "prism-path" (not nested)
```powershell
# Move from prism-path/ to root
$items = Get-ChildItem -Path "prism-path" -Force
foreach ($item in $items) {
    if ($item.Name -ne "prism-path") {  # Don't move nested directory into itself
        $target = Join-Path "." $item.Name
        if (Test-Path $target) {
            Remove-Item -Path $target -Recurse -Force
        }
        Move-Item -Path $item.FullName -Destination $target -Force
    }
}
```

