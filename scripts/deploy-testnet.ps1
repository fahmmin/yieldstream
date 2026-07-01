# Deploy YieldStream Model A contracts to Stellar testnet (PowerShell)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$Network = if ($env:STELLAR_NETWORK) { $env:STELLAR_NETWORK } else { "testnet" }
$Identity = if ($env:DEPLOYER_IDENTITY) { $env:DEPLOYER_IDENTITY } else { "yieldstream-deployer" }
$Admin = if ($env:ADMIN_ADDRESS) { $env:ADMIN_ADDRESS } else { $Identity }
$Usdc = if ($env:USDC_ASSET_ID) { $env:USDC_ASSET_ID } else { "CBG5KUNJANZUUZ6ODHQ3O2RHQ6WYQLIGOFZZNTEVCUJEKVZ2OQIOLOFC" }
$RateBps = if ($env:RATE_BPS) { $env:RATE_BPS } else { "800" }
$MaturityOffset = if ($env:MATURITY_LEDGER_OFFSET) { $env:MATURITY_LEDGER_OFFSET } else { "10000" }
$Treasury = if ($env:TREASURY_ADDRESS) { $env:TREASURY_ADDRESS } else { $Admin }
$FeeBps = if ($env:FEE_BPS) { $env:FEE_BPS } else { "1000" }

Write-Host "==> Building contracts"
stellar contract build

Write-Host "==> Deploying sy-vault"
$SyVault = stellar contract deploy `
  --wasm target/wasm32v1-none/release/sy_vault.wasm `
  --network $Network `
  --source-account $Identity `
  --alias ys-sy-vault `
  -- --admin $Admin --asset $Usdc --rate_bps $RateBps

Write-Host "==> Deploying pt-token (temporary minter = admin)"
$Pt = stellar contract deploy `
  --wasm target/wasm32v1-none/release/pt_token.wasm `
  --network $Network `
  --source-account $Identity `
  --alias ys-pt-token `
  -- --admin $Admin --minter $Admin --name Principal --symbol PT --decimals 7

Write-Host "==> Deploying yt-token (temporary minter = admin)"
$Yt = stellar contract deploy `
  --wasm target/wasm32v1-none/release/yt_token.wasm `
  --network $Network `
  --source-account $Identity `
  --alias ys-yt-token `
  -- --admin $Admin --minter $Admin --name Yield --symbol YT --decimals 7

$LedgerJson = node -e "fetch('https://soroban-testnet.stellar.org',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getLatestLedger',params:{}})}).then(r=>r.json()).then(j=>process.stdout.write(String(j.result.sequence)))"
$Maturity = [int]$LedgerJson + [int]$MaturityOffset

Write-Host "==> Deploying market (maturity ledger $Maturity)"
$Market = stellar contract deploy `
  --wasm target/wasm32v1-none/release/market.wasm `
  --network $Network `
  --source-account $Identity `
  --alias ys-market `
  -- --admin $Admin --sy_vault $SyVault --pt_token $Pt --yt_token $Yt `
  --maturity_ledger $Maturity --treasury $Treasury --fee_bps $FeeBps

Write-Host "==> Set market as PT/YT minter + disable transfers"
stellar contract invoke --id $Pt --network $Network --source $Identity -- set_minter --minter $Market
stellar contract invoke --id $Yt --network $Network --source $Identity -- set_minter --minter $Market
stellar contract invoke --id $Pt --network $Network --source $Identity -- set_transfers_enabled --enabled false
stellar contract invoke --id $Yt --network $Network --source $Identity -- set_transfers_enabled --enabled false

Write-Host ""
Write-Host "Deployed (Model A):"
Write-Host "  SY_VAULT=$SyVault"
Write-Host "  PT_TOKEN=$Pt"
Write-Host "  YT_TOKEN=$Yt"
Write-Host "  MARKET=$Market"
Write-Host "  MATURITY_LEDGER=$Maturity"
Write-Host ""
Write-Host "Update apps/web/.env.local and deployments/testnet.json with these IDs."
