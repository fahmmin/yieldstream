# Deploy YieldStream contracts to Stellar testnet (PowerShell)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$Network = if ($env:STELLAR_NETWORK) { $env:STELLAR_NETWORK } else { "testnet" }
$Identity = if ($env:DEPLOYER_IDENTITY) { $env:DEPLOYER_IDENTITY } else { "default" }

Write-Host "==> Building contracts"
stellar contract build

Write-Host "==> Deploying sy-vault"
$SyVault = stellar contract deploy `
  --wasm target/wasm32v1-none/release/sy_vault.wasm `
  --network $Network `
  --source $Identity `
  --alias sy-vault

Write-Host "==> Deploying pt-token"
$Pt = stellar contract deploy `
  --wasm target/wasm32v1-none/release/pt_token.wasm `
  --network $Network `
  --source $Identity `
  --alias pt-token

Write-Host "==> Deploying yt-token"
$Yt = stellar contract deploy `
  --wasm target/wasm32v1-none/release/yt_token.wasm `
  --network $Network `
  --source $Identity `
  --alias yt-token

Write-Host "==> Deploying market"
$Market = stellar contract deploy `
  --wasm target/wasm32v1-none/release/market.wasm `
  --network $Network `
  --source $Identity `
  --alias market

Write-Host ""
Write-Host "Deployed:"
Write-Host "  SY_VAULT=$SyVault"
Write-Host "  PT_TOKEN=$Pt"
Write-Host "  YT_TOKEN=$Yt"
Write-Host "  MARKET=$Market"
Write-Host ""
Write-Host "Set env vars then run: .\scripts\init-contracts.ps1"
