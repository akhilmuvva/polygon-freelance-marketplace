# Cleanup script for polygon-freelance-marketplace repository
# This script removes unwanted files and directories

Write-Host "=== Repository Cleanup Script ===" -ForegroundColor Cyan
Write-Host ""

$itemsToRemove = @()

# 1. node_modules directories
Write-Host "Checking for node_modules directories..." -ForegroundColor Yellow
$nodeModules = @(
    ".\backend\node_modules",
    ".\contracts\node_modules",
    ".\frontend\node_modules",
    ".\subgraph\node_modules"
)
foreach ($dir in $nodeModules) {
    if (Test-Path $dir) {
        $itemsToRemove += $dir
    }
}

# 2. Build artifacts
Write-Host "Checking for build artifacts..." -ForegroundColor Yellow
$buildArtifacts = @(
    ".\contracts\cache",
    ".\PolyToken_compData.json",
    ".\subgraph\build"
)
foreach ($item in $buildArtifacts) {
    if (Test-Path $item) {
        $itemsToRemove += $item
    }
}

# 3. Log files (excluding those in node_modules)
Write-Host "Checking for log files..." -ForegroundColor Yellow
$logFiles = @(
    ".\frontend\build_error_2.log",
    ".\frontend\build_error.log",
    ".\frontend\build.log",
    ".\contracts\compliance_test_v5.log",
    ".\contracts\compliance_test_v4.log",
    ".\contracts\compliance_test_v3.log",
    ".\contracts\compliance_test_v2.log",
    ".\contracts\compliance_test.log"
)
foreach ($log in $logFiles) {
    if (Test-Path $log) {
        $itemsToRemove += $log
    }
}

# 4. env_usage.txt (appears to be temporary documentation)
if (Test-Path ".\env_usage.txt") {
    $itemsToRemove += ".\env_usage.txt"
}

# Display what will be removed
Write-Host ""
Write-Host "=== Items to be removed ===" -ForegroundColor Cyan
if ($itemsToRemove.Count -eq 0) {
    Write-Host "No unwanted files found!" -ForegroundColor Green
    exit 0
}

foreach ($item in $itemsToRemove) {
    if (Test-Path $item -PathType Container) {
        $size = (Get-ChildItem $item -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        $sizeStr = if ($size) { " (~{0:N2} MB)" -f ($size / 1MB) } else { "" }
        Write-Host "  [DIR]  $item$sizeStr" -ForegroundColor Yellow
    } else {
        $size = (Get-Item $item -ErrorAction SilentlyContinue).Length
        $sizeStr = if ($size) { " ({0:N2} MB)" -f ($size / 1MB) } else { "" }
        Write-Host "  [FILE] $item$sizeStr" -ForegroundColor Magenta
    }
}

Write-Host ""
$confirmation = Read-Host "Do you want to remove these items? (yes/no)"

if ($confirmation -eq "yes") {
    Write-Host ""
    Write-Host "=== Removing items ===" -ForegroundColor Cyan
    
    foreach ($item in $itemsToRemove) {
        try {
            if (Test-Path $item) {
                Remove-Item -Path $item -Recurse -Force -ErrorAction Stop
                Write-Host "  ✓ Removed: $item" -ForegroundColor Green
            }
        } catch {
            Write-Host "  ✗ Failed to remove: $item - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "=== Cleanup Complete ===" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Cleanup cancelled." -ForegroundColor Yellow
}
