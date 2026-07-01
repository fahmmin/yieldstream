# Fund a testnet wallet with USDC for YieldStream
# Usage: .\scripts\fund-testnet-user.ps1 -Address GDKC... 
param(
  [Parameter(Mandatory = $true)]
  [string]$Address,

  [string]$Network = "testnet",
  [string]$UsdcId = "CBG5KUNJANZUUZ6ODHQ3O2RHQ6WYQLIGOFZZNTEVCUJEKVZ2OQIOLOFC",
  [string]$IssuerIdentity = "yieldstream-usdc-issuer",
  [string]$Amount = "10000000000"
)

$ErrorActionPreference = "Stop"

Write-Host "==> Minting $Amount stroops USDC to $Address"
Write-Host "    (Recipient must have USDC trustline — use the app 'Enable testnet USDC' button first)"

stellar contract invoke `
  --id $UsdcId `
  --network $Network `
  --source $IssuerIdentity `
  -- mint --to $Address --amount $Amount

Write-Host "Done."
