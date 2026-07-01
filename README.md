# YieldStream

**Model A — upfront monthly yield** on Stellar Soroban. Deposit USDC, **lock principal** until maturity, and receive **this month's yield paid immediately** (90% user / 10% treasury). Subsequent months are claimed via `pay_monthly_yield` when due.

**Status: Model A contracts ready** — requires **redeploy** on testnet (see Quick start). Previous testnet deployment used accrual-based `claim_yield` + merge; Model A replaces that with hard lock + upfront payout.

---

## Model A (current)

| Step | On-chain action | User experience |
|------|-----------------|-----------------|
| 1 | `deposit_and_lock(usdc)` | Deposit + lock principal; **first month yield paid upfront** |
| 2 | Wait ~1 month (`MONTH_LEDGERS`) | — |
| 3 | `pay_monthly_yield()` | Next month's yield paid early (90/10 split) |
| 4 | Maturity + `redeem_pt()` | Principal returned as SY/USDC |

**Hard lock rules:**
- `merge` is **disabled** (always reverts `HardLocked`)
- PT/YT **transfers disabled** after init
- Yield cap enforced on-chain so total upfront payouts cannot exceed expected term yield

**Keeper:** set `MONTHLY_PAYOUT_ENABLED=true` and `MONTHLY_PAYOUT_USERS=G...,G...` for admin batch payouts.

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
| **market** | `deposit_and_lock`, strip, **upfront monthly yield**, `pay_monthly_yield`, redeem PT at maturity; **merge disabled** |
| **pt-token** | Principal token; transfers lockable; redeemable after maturity |
| **yt-token** | Yield rights token; transfers lockable |

### Off-chain services

| Service | Role |
|---------|------|
| **apps/web** | Next.js app — landing page + `/treasury` wallet flows via Freighter |
| **services/keeper** | Polls ledger, extends TTL, sweeps maturity; hooks for Blend + OwlPay |

### Contract invariants (Model A)

- `deposit_and_lock(n)` → lock `n` PT + `n` YT + pay month-1 yield upfront
- `merge` → always `HardLocked`
- `pay_monthly_yield` → pays monthly gross × (1 − fee_bps) to user when due
- Post-maturity: `redeem_pt` returns principal; YT burned with PT

---

## Testnet deployment

Network: **Stellar testnet** · Deployed: **2026-07-01** (Model A) · Maturity ledger: **3390165**

Canonical addresses are in [`deployments/testnet.json`](deployments/testnet.json). Summary:

| Contract | ID |
|----------|-----|
| USDC (SAC) | `CBG5KUNJANZUUZ6ODHQ3O2RHQ6WYQLIGOFZZNTEVCUJEKVZ2OQIOLOFC` |
| SY Vault | `CDP6IPENVGPMBWB3FKSBUKTKUZM55AXVL4TEQFKAYRDIHX2PZ5T6GXZO` |
| PT Token | `CA64K5JEUCX6XJACSLDS425TWBJCSG3C5JM25NJNAVY5N4LBGSFX6IK3` |
| YT Token | `CBU4OGVNYHXOCSNFEHVCQ4YP644KFKWA2QWHNYNLVNSZ5JACXTE7VSGM` |
| Market | `CB5YBEVT4L4KSOWFRIVPWQQZS4RKXFWL4YDYKHMRON3E6Y2IGGGKFYWD` |

Test identities and explorer links: [`deployments/TESTNET.md`](deployments/TESTNET.md)

- [Market on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CB5YBEVT4L4KSOWFRIVPWQQZS4RKXFWL4YDYKHMRON3E6Y2IGGGKFYWD)

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

## E2E flow (testnet, Model A)

1. Fund wallet with XLM (Friendbot) + testnet USDC
2. **Redeploy** contracts + run `init-contracts` (treasury + fee_bps + disable PT/YT transfers)
3. **Deposit & lock** USDC → receive **upfront month-1 yield** in wallet
4. Advance ~1 month (or wait) → **Claim monthly yield**
5. At maturity → keeper `sweep_matured` → **Redeem PT** for principal

---

## License

MIT
