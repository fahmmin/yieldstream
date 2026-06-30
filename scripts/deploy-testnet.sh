#!/usr/bin/env bash
# Deploy YieldStream contracts to Stellar testnet
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NETWORK="${STELLAR_NETWORK:-testnet}"
IDENTITY="${DEPLOYER_IDENTITY:-default}"

echo "==> Building contracts"
stellar contract build

echo "==> Deploying sy-vault"
SY_VAULT=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/sy_vault.wasm \
  --network "$NETWORK" \
  --source "$IDENTITY" \
  --alias sy-vault)

echo "==> Deploying pt-token"
PT=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/pt_token.wasm \
  --network "$NETWORK" \
  --source "$IDENTITY" \
  --alias pt-token)

echo "==> Deploying yt-token"
YT=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/yt_token.wasm \
  --network "$NETWORK" \
  --source "$IDENTITY" \
  --alias yt-token)

echo "==> Deploying market"
MARKET=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/market.wasm \
  --network "$NETWORK" \
  --source "$IDENTITY" \
  --alias market)

echo "Deployed:"
echo "  SY_VAULT=$SY_VAULT"
echo "  PT_TOKEN=$PT"
echo "  YT_TOKEN=$YT"
echo "  MARKET=$MARKET"
echo ""
echo "Run scripts/init-contracts.sh next to call constructors."
