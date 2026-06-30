#!/usr/bin/env bash
# Initialize deployed contracts (run after deploy-testnet.sh)
set -eu

NETWORK="${STELLAR_NETWORK:-testnet}"
IDENTITY="${DEPLOYER_IDENTITY:-default}"
ADMIN="${ADMIN_ADDRESS:?set ADMIN_ADDRESS}"
ASSET="${USDC_ASSET_ID:?set USDC_ASSET_ID}"
MATURITY_OFFSET="${MATURITY_LEDGER_OFFSET:-10000}"

SY_VAULT="${SY_VAULT_ID:?set SY_VAULT_ID}"
PT="${PT_TOKEN_ID:?set PT_TOKEN_ID}"
YT="${YT_TOKEN_ID:?set YT_TOKEN_ID}"
MARKET="${MARKET_ID:?set MARKET_ID}"

RATE_BPS="${RATE_BPS:-800}"

echo "==> Init sy-vault"
stellar contract invoke --id "$SY_VAULT" --network "$NETWORK" --source "$IDENTITY" \
  -- __constructor --admin "$ADMIN" --asset "$ASSET" --rate_bps "$RATE_BPS"

echo "==> Init pt-token"
stellar contract invoke --id "$PT" --network "$NETWORK" --source "$IDENTITY" \
  -- __constructor --admin "$ADMIN" --minter "$MARKET" \
  --name '"Principal Token"' --symbol PT --decimals 7

echo "==> Init yt-token"
stellar contract invoke --id "$YT" --network "$NETWORK" --source "$IDENTITY" \
  -- __constructor --admin "$ADMIN" --minter "$MARKET" \
  --name '"Yield Token"' --symbol YT --decimals 7

CURRENT=$(stellar network fetch --network "$NETWORK" ledger)
MATURITY=$((CURRENT + MATURITY_OFFSET))

echo "==> Init market (maturity ledger $MATURITY)"
stellar contract invoke --id "$MARKET" --network "$NETWORK" --source "$IDENTITY" \
  -- __constructor --admin "$ADMIN" --sy_vault "$SY_VAULT" --pt_token "$PT" \
  --yt_token "$YT" --maturity_ledger "$MATURITY"

echo "Done. Copy IDs to apps/web/.env.local"
