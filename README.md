# GOVRES — Government Reserve & Settlement Ledger

**A programmable reserve ledger for gold-backed and cocoa-receipt-backed digital instruments, designed for the Bank of Ghana.**

---

## Overview

GOVRES digitizes Ghana's commodity reserves (gold and cocoa) into programmable, asset-backed settlement instruments:

- **GBDC** — Gold-Backed Digital Credit (backed by 10% gold reserve allocation from BoG vaults)
- **CRDN** — Cocoa Receipt Digitization Note (1:1 backed by Cocobod warehouse receipts)

The system provides a sovereign, non-blockchain permissioned ledger for government expenditure settlement, farmer payments, contractor disbursements, and diaspora investment — with a bridge to Ghana's eCedi CBDC.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Layer 3 — Financial Access                 │
│  React Portals: BoG, Banks, Farmers,        │
│  Contractors, Agencies, Diaspora            │
├─────────────────────────────────────────────┤
│  Layer 2 — Reserve Ledger                   │
│  Permissioned ledger, GBDC/CRDN lifecycle,  │
│  settlement engine, compliance checks       │
├─────────────────────────────────────────────┤
│  Layer 1 — Asset Attestation (Oracle)       │
│  Gold vault IoT, Cocobod warehouse sensors, │
│  GoldBod royalty feeds, crypto attestation   │
└─────────────────────────────────────────────┘
```

## Packages

| Package | Description |
|---------|-------------|
| `@govres/shared` | Type definitions, constants, regulatory references |
| `@govres/ledger` | Permissioned ledger engine (blocks, Merkle trees, validation) |
| `@govres/oracle` | Oracle layer (gold vault, cocoa warehouse, GoldBod royalty) |
| `@govres/api` | Express REST API (auth, routes, middleware, DB schema) |
| `@govres/web` | React frontend (8 portal pages) |
| `@govres/simulation` | Simulation suite (cocoa flow, contractor payments, stress test) |
| `@govres/security` | Encryption, audit trails, regulatory compliance engine |

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate

# Seed initial data (organizations, accounts, genesis block)
npm run db:seed

# Start API server (port 4000)
npm run dev:api

# Start web frontend (port 3000)
npm run dev:web
```

### Docker

```bash
docker-compose up -d
```

## Frontend Portals

| Portal | Route | Role |
|--------|-------|------|
| Public Dashboard | `/` | Public |
| Login | `/login` | All |
| BoG Dashboard | `/bog` | BOG_ADMIN |
| Bank Dashboard | `/bank` | BANK_ADMIN |
| Farmer Portal | `/farmer` | FARMER |
| Contractor Portal | `/contractor` | CONTRACTOR |
| Agency Portal | `/agency` | GOV_AGENCY |
| Diaspora Portal | `/diaspora` | DIASPORA_INVESTOR |

## API Endpoints

| Route Group | Base Path | Auth Required |
|-------------|-----------|---------------|
| Auth | `/api/v1/auth` | No |
| Dashboard (public) | `/api/v1/dashboard` | No |
| Ledger | `/api/v1/ledger` | Yes |
| GBDC | `/api/v1/gbdc` | Yes |
| CRDN | `/api/v1/crdn` | Yes |
| Oracle | `/api/v1/oracle` | Yes |
| Settlement | `/api/v1/settlement` | Yes |
| Projects | `/api/v1/projects` | Yes |
| CBDC (eCedi) | `/api/v1/cbdc` | Yes |

## Regulatory Compliance

GOVRES is designed to comply with:

- **Bank of Ghana Act, 2002 (Act 612)** — Central bank mandate
- **Payment Systems & Services Act, 2019 (Act 987)** — Payment rails
- **Anti-Money Laundering Act, 2020 (Act 1044)** — AML/CTR/STR
- **Data Protection Act, 2012 (Act 843)** — PII handling
- **Virtual Asset Service Providers Act, 2025** — Digital asset regulation
- **Cocoa Industry Regulation (PNDC Law 81, 1984)** — Cocobod operations
- **Minerals & Mining Act, 2006 (Act 703)** — Gold royalty (5%)

## Simulation

Run end-to-end simulations:

```bash
# Full simulation suite
npm run simulate

# Individual simulations
npm run simulate:cocoa         # Cocoa season flow
npm run simulate:contractor    # Government contractor payments
npm run simulate:stress        # Ledger stress test
```

## Key Financial Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Gold reserve allocation | 10% of BoG holdings | Whitepaper §4.1 |
| Money multiplier | 2.5× | BoG monetary policy |
| Cocoa producer price | GH¢2,070/bag (64kg) | Cocobod 2024/2025 |
| Annual gold royalty rate | 5% | Act 703 |
| Annual cocoa receipts value | ~GH¢44.95B | Cocobod |
| Oracle attestation validity | 24 hours | System config |
| Block interval | 5 seconds | Ledger config |

---

**GOVRES** — Sovereign commodity-backed digital settlement for Ghana.

Built by Northlands Systems.
