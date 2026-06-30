# YieldStream

Automated yield-stripping on Stellar Soroban (testnet MVP).

Deposit USDC into a fixed-rate **SY vault**, **strip** into **PT** (principal) + **YT** (yield rights), **claim** yield, **merge** back, or **redeem PT** at maturity.

## Repo layout

```
yieldstream/          ← isolated git root
├── contracts/        sy-vault, market, pt-token, yt-token
├── apps/web/         Next.js treasury UI + Freighter
├── services/keeper/  TTL + maturity sweep + blend/anchor hooks
└── scripts/          deploy + init
```

## Prerequisites

- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) 26+
- Rust + `wasm32v1-none` target
- **Windows:** Visual Studio Build Tools (MSVC linker) for `cargo build`
- Node.js 20+
- Freighter wallet (testnet)

## Quick start

### 1. Build contracts

```bash
cd yieldstream
stellar contract build
cargo test   # unit tests (requires MSVC on Windows)
```

### 2. Deploy testnet

```bash
# Fund deployer: stellar keys fund default --network testnet
bash scripts/deploy-testnet.sh
# Set env vars from output, then:
bash scripts/init-contracts.sh
```

### 3. Web UI

```bash
cp apps/web/.env.local.example apps/web/.env.local
# paste contract IDs
cd apps/web && npm install && npm run dev
```

Open http://localhost:3000 — connect Freighter (testnet).

### 4. Keeper (optional)

```bash
cp services/keeper/.env.example services/keeper/.env
cd services/keeper && npm install && npm run dev
```

## E2E flow (testnet)

1. Fund wallet with XLM (Friendbot) + testnet USDC
2. **Deposit** USDC → SY shares
3. **Strip** SY → PT + YT
4. Wait / advance ledgers → **Claim** yield on YT
5. **Merge** PT+YT → SY (before maturity)
6. Or wait for maturity → keeper `sweep_matured` → **Redeem PT**

## Phases

| Phase | Status |
|-------|--------|
| 0–4 | SY vault, market, UI, keeper |
| 5 | Blend adapter — see `contracts/blend-adapter/README.md` |
| 6 | OwlPay anchor — set `HARBOR_API_KEY`, `ANCHOR_ROUTING_ENABLED=true` |

## Contract invariants

- `strip(n)` → `n` PT + `n` YT
- `merge(n)` → `n` SY
- Post-maturity: PT redeems 1:1; YT cannot claim

## License

MIT
