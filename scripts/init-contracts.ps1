# Initialize deployed contracts (run after deploy-testnet.ps1)
$ErrorActionPreference = "Stop"

$Network = if ($env:STELLAR_NETWORK) { $env:STELLAR_NETWORK } else { "testnet" }
$Identity = if ($env:DEPLOYER_IDENTITY) { $env:DEPLOYER_IDENTITY } else { "default" }

if (-not $env:ADMIN_ADDRESS) { throw "Set ADMIN_ADDRESS (your G... public key)" }
if (-not $env:USDC_ASSET_ID) { throw "Set USDC_ASSET_ID (testnet USDC contract id)" }
if (-not $env:SY_VAULT_ID) { throw "Set SY_VAULT_ID from deploy output" }
if (-not $env:PT_TOKEN_ID) { throw "Set PT_TOKEN_ID from deploy output" }
if (-not $env:YT_TOKEN_ID) { throw "Set YT_TOKEN_ID from deploy output" }
if (-not $env:MARKET_ID) { throw "Set MARKET_ID from deploy output" }

$MaturityOffset = if ($env:MATURITY_LEDGER_OFFSET) { $env:MATURITY_LEDGER_OFFSET } else { "10000" }
$RateBps = if ($env:RATE_BPS) { $env:RATE_BPS } else { "800" }

Write-Host "==> Init sy-vault"
stellar contract invoke --id $env:SY_VAULT_ID --network $Network --source $Identity `
  -- __constructor --admin $env:ADMIN_ADDRESS --asset $env:USDC_ASSET_ID --rate_bps $RateBps

Write-Host "==> Init pt-token"
stellar contract invoke --id $env:PT_TOKEN_ID --network $Network --source $Identity `
  -- __constructor --admin $env:ADMIN_ADDRESS --minter $env:MARKET_ID `
  --name "Principal Token" --symbol PT --decimals 7

Write-Host "==> Init yt-token"
stellar contract invoke --id $env:YT_TOKEN_ID --network $Network --source $Identity `
  -- __constructor --admin $env:ADMIN_ADDRESS --minter $env:MARKET_ID `
  --name "Yield Token" --symbol YT --decimals 7

$Current = stellar network fetch --network $Network ledger
$Maturity = [int]$Current + [int]$MaturityOffset

Write-Host "==> Init market (maturity ledger $Maturity)"
stellar contract invoke --id $env:MARKET_ID --network $Network --source $Identity `
  -- __constructor --admin $env:ADMIN_ADDRESS --sy_vault $env:SY_VAULT_ID `
  --pt_token $env:PT_TOKEN_ID --yt_token $env:YT_TOKEN_ID --maturity_ledger $Maturity

Write-Host "Done. Copy IDs to apps/web/.env.local"
