# Run Hardhat tests using x64 Node.js on ARM64 Windows
# This script is needed because Hardhat v2's native binaries don't support Windows ARM64 yet.
# It uses the x64 Node.js installation via Windows' built-in x64 emulation layer.

$x64NodePath = "$env:TEMP\node-x64\node-v22.19.0-win-x64"

if (-not (Test-Path $x64NodePath)) {
    Write-Host "x64 Node.js not found. Downloading..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v22.19.0/node-v22.19.0-win-x64.zip" -OutFile "$env:TEMP\node-x64.zip" -UseBasicParsing
    Expand-Archive -Path "$env:TEMP\node-x64.zip" -DestinationPath "$env:TEMP\node-x64" -Force
    Write-Host "x64 Node.js downloaded and extracted." -ForegroundColor Green
}

# Prepend x64 Node to PATH for this session
$env:Path = "$x64NodePath;$env:Path"

Write-Host "Running Hardhat under x64 Node.js (emulated)..." -ForegroundColor Cyan
Write-Host "Node arch: $(node -e 'console.log(process.arch)')" -ForegroundColor DarkGray

# Run the Hardhat command passed as arguments, or default to 'test'
$args_str = if ($args.Count -gt 0) { $args -join " " } else { "test" }
npx hardhat $args_str
