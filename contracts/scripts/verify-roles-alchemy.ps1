# PolyLance Role Verification Script (using Alchemy CLI)
# This script audits the most critical security roles on the FreelanceEscrow contract.

$ESCROW_ADDRESS = "0x38c76A767d45Fc390160449948aF80569E2C4217"
$CHECK_ADDRESS = "0xe60228795A55152862d854B5E0573934f0Ff0516" # Replace with Adapter or Admin address

$BRIDGE_ROLE = "0x52ba824bfabc2bcfcdf7f0edbb486ebb05e1836c90e78047efeb949990f72e5f"
$MANAGER_ROLE = "0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08"
$ARBITRATOR_ROLE = "0x16ceee8289685dd2a02b9c8ae81d2df373176ce53519e6284e2a2950d6546ffa"
$DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"

if (-not $env:ALCHEMY_API_KEY) {
    Write-Host "ERROR: ALCHEMY_API_KEY environment variable not found." -ForegroundColor Red
    Write-Host "Please set it with: `$env:ALCHEMY_API_KEY = 'your-key-here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "--- PolyLance Security Audit (Alchemy CLI) ---" -ForegroundColor Cyan
Write-Host "Escrow: $ESCROW_ADDRESS"
Write-Host "Target: $CHECK_ADDRESS"
Write-Host ""

# Function to test role using Alchemy CLI
function Test-PolyLanceRole {
    param($RoleHash, $RoleName)
    Write-Host "Testing $RoleName..." -NoNewline
    $result = npx @alchemy/cli evm contract read $ESCROW_ADDRESS "hasRole(bytes32,address)" --args "[\`"$RoleHash\`",\`"$CHECK_ADDRESS\`"]" --network polygon-amoy --json | ConvertFrom-Json
    if ($result -eq $true) {
        Write-Host " [GRANTED]" -ForegroundColor Green
    } else {
        Write-Host " [DENIED]" -ForegroundColor Red
    }
}

Test-PolyLanceRole -RoleHash $DEFAULT_ADMIN_ROLE -RoleName "DEFAULT_ADMIN_ROLE"
Test-PolyLanceRole -RoleHash $BRIDGE_ROLE -RoleName "BRIDGE_ROLE (Adapter)"
Test-PolyLanceRole -RoleHash $MANAGER_ROLE -RoleName "MANAGER_ROLE"
Test-PolyLanceRole -RoleHash $ARBITRATOR_ROLE -RoleName "ARBITRATOR_ROLE"

Write-Host ""
Write-Host "Audit Complete." -ForegroundColor Cyan
