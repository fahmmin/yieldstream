# Testnet deployment (2026-07-01) — Model A

Stellar CLI identities (secrets in `~/.config/stellar/identity/`):

| Alias | Public key | Role |
|-------|------------|------|
| `yieldstream-deployer` | `GBTQDYRHLQGVWLPTC4H7NHSCSXLMC2Z7SFDM3NR52JTPW6O373GQUDQU` | Deploy + admin + treasury |
| `yieldstream-user` | `GD7XY7GX4DQAHVFJFEHFPTNU227UVL42S3Q6KH67AN5QOMGZMDUYUGFG` | Test wallet |
| `yieldstream-usdc-issuer` | `GDJ7BKYQOP2TKEC5YVWPZRMLSR3NTEOLAZAUVVAE3ZB3BUJAT56TKQOJ` | Test USDC issuer |

## Contracts (Model A — upfront monthly yield)

| | Contract ID |
|---|-------------|
| USDC (SAC) | `CBG5KUNJANZUUZ6ODHQ3O2RHQ6WYQLIGOFZZNTEVCUJEKVZ2OQIOLOFC` |
| SY Vault | `CDP6IPENVGPMBWB3FKSBUKTKUZM55AXVL4TEQFKAYRDIHX2PZ5T6GXZO` |
| PT Token | `CA64K5JEUCX6XJACSLDS425TWBJCSG3C5JM25NJNAVY5N4LBGSFX6IK3` |
| YT Token | `CBU4OGVNYHXOCSNFEHVCQ4YP644KFKWA2QWHNYNLVNSZ5JACXTE7VSGM` |
| Market | `CB5YBEVT4L4KSOWFRIVPWQQZS4RKXFWL4YDYKHMRON3E6Y2IGGGKFYWD` |

- **Maturity ledger:** `3390165`
- **Fee:** 1000 bps (10% to treasury)
- **PT/YT transfers:** disabled (hard lock)
- **Market minter** set on PT + YT

## UI

```bash
cd apps/web && npm run dev
```

Import `yieldstream-user` into Freighter (testnet). `.env.local` is pre-filled.

## Explorer

- [Market on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CB5YBEVT4L4KSOWFRIVPWQQZS4RKXFWL4YDYKHMRON3E6Y2IGGGKFYWD)
- [SY Vault](https://lab.stellar.org/r/testnet/contract/CDP6IPENVGPMBWB3FKSBUKTKUZM55AXVL4TEQFKAYRDIHX2PZ5T6GXZO)

## Previous deployment (2026-06-30, legacy accrual model)

Superseded — do not use with current UI:

| Market (old) | `CCSXQJXXJIJY6I5J776P4QW3NDF2YSSVPOKNQM7Y3MKFZMQHU6XIVOOY` |
