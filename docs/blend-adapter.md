# Blend adapter (Phase 5)

Placeholder for DeFindex / Blend variable-yield SY vault adapter.

## Testnet setup

1. Faucet: https://testnet.blend.capital
2. BlendUSDC: `CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU`
3. Deploy `blend-adapter` contract (future) that wraps Blend supply position as SY shares
4. Set `BLEND_ADAPTER_ENABLED=true` in keeper `.env`

## Integration

Replace fixed-rate `sy-vault` accrual with adapter that reads Blend pool `total_assets` on each deposit/withdraw. PT/YT market contract unchanged.
