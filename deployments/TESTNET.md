# Testnet deployment (2026-06-30)

Stellar CLI identities (secrets in `~/.config/stellar/identity/`):

| Alias | Public key | Role |
|-------|------------|------|
| `yieldstream-deployer` | `GBTQDYRHLQGVWLPTC4H7NHSCSXLMC2Z7SFDM3NR52JTPW6O373GQUDQU` | Deploy + admin |
| `yieldstream-user` | `GD7XY7GX4DQAHVFJFEHFPTNU227UVL42S3Q6KH67AN5QOMGZMDUYUGFG` | Test wallet (10k USDC minted) |
| `yieldstream-usdc-issuer` | `GDJ7BKYQOP2TKEC5YVWPZRMLSR3NTEOLAZAUVVAE3ZB3BUJAT56TKQOJ` | Test USDC issuer |

## Contracts

| | Contract ID |
|---|-------------|
| USDC (SAC) | `CBG5KUNJANZUUZ6ODHQ3O2RHQ6WYQLIGOFZZNTEVCUJEKVZ2OQIOLOFC` |
| SY Vault | `CDYDL57HJKWHHFSICODHFTULNAPISJAQCITTDNZ6AQYXZKX6FTV4NY3U` |
| PT Token | `CDVW6GYSK4PQDT6TLDO5YVT7SGUH6CXW2MKL3FUKTVPEXMPBDMUDZ7A4` |
| YT Token | `CBTRDER523K34BTKRKRWS7666TLQGAT4G2CKBEWPNAWZDKKJI7FWRQOS` |
| Market | `CCSXQJXXJIJY6I5J776P4QW3NDF2YSSVPOKNQM7Y3MKFZMQHU6XIVOOY` |

- **Maturity ledger:** `3373149` (~10k ledgers from deploy)
- **Market minter** set on PT + YT

## UI

```bash
cd apps/web && npm run dev
```

Import `yieldstream-user` into Freighter (testnet) or use deployer. `.env.local` is pre-filled.

## Explorer

- [Market on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CCSXQJXXJIJY6I5J776P4QW3NDF2YSSVPOKNQM7Y3MKFZMQHU6XIVOOY)
