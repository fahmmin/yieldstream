# YieldStream

Automated yield-stripping on Stellar Soroban. Deposit USDC into a **Standardized Yield (SY) vault**, **strip** into **PT** (principal) + **YT** (yield rights), **claim** yield, **merge** back, or **redeem PT** at maturity.

**Status: MVP live on Stellar testnet** (deployed 2026-06-30). We are shipping in measured milestones with the Stellar Builder Team rather than rushing to mainnet.

---

## Stellar Builder program

Selected teams define custom milestones with the Stellar Builder Team. Funding and ecosystem support track execution quality and progress — not a fixed challenge prize.

| Milestone | Status | Notes |
|-----------|--------|-------|
| **MVP completion** | Done | Core contracts, treasury UI, keeper service |
| **Testnet launch** | Done | Contracts deployed and wired to the web app (see below) |
| **Mainnet deployment** | Planned | After audits, keeper hardening, and real yield adapter |
| **User growth targets** | Planned | Treasury onboarding, docs, and testnet feedback loops |
| **Revenue milestones** | Planned | Fee model and treasury analytics |
| **Ecosystem integrations** | Planned | Blend/DeFindex SY adapter, OwlPay anchor off-ramp |

We are not optimizing for speed over correctness. The testnet MVP proves the full strip → claim → merge/redeem loop end-to-end; later milestones add real yield sources, production ops, and ecosystem hooks.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         User (Freighter, testnet)                       │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   apps/web (Next.js)      │
                    │   Landing + Treasury UI   │
                    │   deposit · strip · claim │
                    │   merge · redeem PT       │
                    └─────────────┬─────────────┘
                                  │ Soroban RPC
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
   │  SY Vault   │◄────────│   Market    │────────►│  PT / YT    │
   │  (USDC in,  │  shares │  strip/merge│  mint/  │  tokens     │
   │   accrual)  │         │  claim/redeem│  burn  │             │
   └──────┬──────┘         └─────────────┘         └─────────────┘
          │
          ▼
   ┌─────────────┐
   │ USDC (SAC)  │
   └─────────────┘

   ┌─────────────────────────────────────────────────────────────┐
   │  services/keeper (optional, off-chain)                      │
   │  · contract TTL extension                                 │
   │  · maturity sweep (`sweep_matured`)                         │
   │  · Phase 5: Blend adapter sync (planned)                    │
   │  · Phase 6: OwlPay Harbor yield off-ramp (planned)          │
   └─────────────────────────────────────────────────────────────┘
```

### Smart contracts (Soroban)

| Contract | Role |
|----------|------|
| **sy-vault** | Holds USDC; mints/burns SY shares; fixed-rate accrual (MVP) |
| **market** | Strip SY → PT+YT, merge, claim yield on YT, redeem PT at maturity |
| **pt-token** | Principal token; 1:1 with stripped SY; redeemable after maturity |
| **yt-token** | Yield token; accrues claimable yield until maturity |

### Off-chain services

| Service | Role |
|---------|------|
| **apps/web** | Next.js app — landing page + `/treasury` wallet flows via Freighter |
| **services/keeper** | Polls ledger, extends TTL, sweeps maturity; hooks for Blend + OwlPay |

### Contract invariants

- `strip(n)` → `n` PT + `n` YT
- `merge(n)` → `n` SY (before maturity)
- Post-maturity: PT redeems 1:1 USDC; YT can no longer claim

---

## Testnet deployment

Network: **Stellar testnet** · Deployed: **2026-06-30** · Maturity ledger: **3373149**

Canonical addresses are in [`deployments/testnet.json`](deployments/testnet.json). Summary:

| Contract | ID |
|----------|-----|
| USDC (SAC) | `CBG5KUNJANZUUZ6ODHQ3O2RHQ6WYQLIGOFZZNTEVCUJEKVZ2OQIOLOFC` |
| SY Vault | `CDYDL57HJKWHHFSICODHFTULNAPISJAQCITTDNZ6AQYXZKX6FTV4NY3U` |
| PT Token | `CDVW6GYSK4PQDT6TLDO5YVT7SGUH6CXW2MKL3FUKTVPEXMPBDMUDZ7A4` |
| YT Token | `CBTRDER523K34BTKRKRWS7666TLQGAT4G2CKBEWPNAWZDKKJI7FWRQOS` |
| Market | `CCSXQJXXJIJY6I5J776P4QW3NDF2YSSVPOKNQM7Y3MKFZMQHU6XIVOOY` |

Test identities and explorer links: [`deployments/TESTNET.md`](deployments/TESTNET.md)

- [Market on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CCSXQJXXJIJY6I5J776P4QW3NDF2YSSVPOKNQM7Y3MKFZMQHU6XIVOOY)

Classic test asset: `USDC:GDJ7BKYQOP2TKEC5YVWPZRMLSR3NTEOLAZAUVVAE3ZB3BUJAT56TKQOJ`

---

## Roadmap (what comes after MVP)

| Phase | Focus | Status |
|-------|-------|--------|
| 0–4 | SY vault, market, PT/YT tokens, treasury UI, keeper | **Shipped (testnet)** |
| 5 | **Blend / DeFindex adapter** — variable-yield SY backed by Blend supply | Scaffolded; see [`docs/blend-adapter.md`](docs/blend-adapter.md) |
| 6 | **OwlPay Harbor anchor** — optional INR bank off-ramp after YT claim | Hook in keeper; requires `HARBOR_API_KEY` |
| 7 | Mainnet deploy, monitoring, and growth milestones | Planned with Stellar Builder Team |

Phase 5 keeps the **market contract unchanged**; only the SY vault accrual source switches from fixed-rate to a Blend pool adapter.

---

## Repo layout

```
yieldstream/
├── contracts/          sy-vault, market, pt-token, yt-token
├── apps/web/           Next.js landing + treasury UI (Freighter)
├── services/keeper/    TTL + maturity sweep + integration hooks
├── deployments/        testnet.json, TESTNET.md
├── docs/               integration notes (Blend adapter)
└── scripts/            deploy + init (PowerShell + bash)
```

---

## Quick start

### Prerequisites

- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) 26+
- Rust + `wasm32v1-none` target
- **Windows:** Visual Studio Build Tools (MSVC linker) for `cargo build`
- Node.js 20+
- Freighter wallet (testnet)

### 1. Build contracts

```bash
cd yieldstream
stellar contract build
cargo test   # unit tests (requires MSVC on Windows)
```

### 2. Use existing testnet deployment

The contracts above are already live. Skip redeploy unless you are developing contracts locally.

```bash
cp apps/web/.env.local.example apps/web/.env.local
# Contract IDs are pre-filled in deployments/testnet.json — copy into .env.local
cd apps/web && npm install && npm run dev
```

- Landing: http://localhost:3000
- Treasury: http://localhost:3000/treasury — connect Freighter (testnet)

Add TT Norms Pro font files to `apps/web/public/fonts/` (`tt-norms-pro-regular.woff2`, `tt-norms-pro-semibold.woff2`) for landing page typography.

### 3. Redeploy testnet (optional)

**PowerShell (Windows):**

```powershell
stellar keys fund default --network testnet
.\scripts\deploy-testnet.ps1
# Set $env:SY_VAULT_ID, $env:PT_TOKEN_ID, etc. from output, then:
.\scripts\init-contracts.ps1
```

**Git Bash / Linux:**

```bash
stellar keys fund default --network testnet
bash scripts/deploy-testnet.sh
bash scripts/init-contracts.sh
```

### 4. Keeper (optional)

```bash
cp services/keeper/.env.example services/keeper/.env
cd services/keeper && npm install && npm run dev
```

---

## E2E flow (testnet)

1. Fund wallet with XLM (Friendbot) + testnet USDC
2. **Deposit** USDC → SY shares
3. **Strip** SY → PT + YT
4. Wait / advance ledgers → **Claim** yield on YT
5. **Merge** PT+YT → SY (before maturity)
6. Or wait for maturity → keeper `sweep_matured` → **Redeem PT**

---

## License

MIT
