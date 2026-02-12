 GOVRES User Operations Guide

A practical reference for every persona interacting with the Government Reserve & Settlement Ledger. Each section covers what the user sees, how they capture or submit data, and how their actions flow through the ledger, oracle, and reporting layers.



 1. System Orientation

| Layer | Purpose | What Users Need to Know |

| Asset Attestation (Oracle) | Feeds live data on gold vault balances, assay fingerprints, cocoa warehouse receipts, and GoldBod royalties. | All submissions must trace back to an attested asset entry; mismatched receipts are rejected automatically. |
| Reserve Ledger (BoG Core) | Issues and redeems `GBDC` and `CRDN`, enforces limits, tracks blocks every 5 seconds, and exposes audit trails. | Any payment request or redemption you submit lands here. Expect immutable history and automatic compliance checks. |
| Financial Access Layer (Portals & APIs) | Role-based portals (`/bog`, `/bank`, `/agency`, `/contractor`, `/farmer`, `/diaspora`) and public dashboards. | Your day-to-day work happens in these portals; behind the scenes they call the API at `/api/v1/*`. |

Shared interaction model:
1. Authenticate through the React portal (SSO/OAuth for institutions, OTP for MoMo users).
2. Input data via forms or CSV uploads; validations ensure data matches attested assets.
3. Submit; API writes to the ledger block and broadcasts event notifications.
4. Monitor dashboards; every portal has cards, tables, and alerts fed by `@tanstack/react-query` polling the API.



 2. Bank of Ghana / Treasury Users (`/bog`)

- Primary objectives: Manage reserve-backed liquidity, green-light issuances, monitor compliance.
- Access steps: Hardware token + SSO, then choose "Treasury Desk" workspace.
- Daily workflow:
  1. Review live reserve widgets (gold mg, cocoa MT, royalty accrual) on the landing dashboard.
  2. Open Issuance Console → select instrument (`GBDC` for contractors, `CRDN` bridge for farmers) → input target amount.
  3. System auto-populates maximum allowable issuance based on oracle feeds; adjust within limits.
  4. Approve with dual authorization; ledger block is minted and banks receive notifications under `/api/v1/gbdc`.
- Data capture: Issuance forms accept manual entry or bulk CSV import for scheduled releases; metadata (purpose, ministry, expiry) is mandatory for audit.
- Making meaning: Drill-down tables show issuance vs reserve ratios, AML flags, and cash flow impact. Export PDF for ministerial briefings.



 3. Government Agencies & Ministries (`/agency`)

- Objectives: Submit project budgets, observe disbursement status, upload compliance artifacts.
- Workflow:
  1. Start from Projects tab → "Create Project" wizard (budget lines, milestones, supplier list).
  2. Upload supporting documents (BoQ, contract award) via secure file drop; hashes are stored in ledger metadata.
  3. Track status cards: `Submitted → BoG Review → Issuance → Bank Disbursement → Completion`.
  4. When milestones are met, upload completion certificates; triggers release of next tranche automatically.
- Data inputs: Structured forms with dropdowns for regions, sectors, and supplier IDs (synced from verified contractor registry). CSV import available for bulk project entries.
- Insights: Portal overlays ledger data with execution KPIs (budget vs actual, time-to-pay) and flags stalled projects for follow-up.



 4. Commercial Banks (`/bank`)

- Objectives: Receive GBDC/CRDN liquidity, credit downstream accounts, manage redemption queues.
- Workflow:
  1. Login via bank SSO → choose `Treasury` or `Operations` view.
  2. Inbound Queue: Displays BoG issuances awaiting acceptance; operators assign them to internal GL accounts.
  3. Contractor Payments: Select incoming GBDC lot → map to contractor list (JSON upload or portal form) → trigger credit instructions. API: `/api/v1/settlement/disburse`.
  4. Farmer Redemptions: CRDN redemption requests arrive with receipt IDs; validate and settle to MoMo or bank account.
  5. Reporting: Download XML/CSV for core banking ingestion; reconciliation view matches ledger balances with bank GL balances.
- Data capture: Bulk uploads (.csv or .json) for disbursement batches; manual overrides require supervisor PIN.
- Insights: Liquidity dashboard graphs show reserve coverage, utilization, and pending AML cases sourced from `@govres/security` services.



 5. Contractors & Suppliers (`/contractor`)

- Objectives: See awarded budgets, receive GBDC tranches, convert to cedi, pay subcontractors.
- Workflow:
  1. Login via secure email OTP + biometric confirmation (optional WebAuthn).
  2. Project Timeline: Lists BoG-approved tranches; clicking an item opens the ledger transaction with details.
  3. Accept funds → choose destination (bank account, supplier payment, retain as GBDC for future purchases).
  4. Upload invoices or proof-of-work; once validated by agency/BoG, next tranche unlocks.
- Data capture: Form fields for invoice metadata, GPS-tagged site photos, and supplier payment breakdowns. Mobile upload optimized for low bandwidth.
- Insights: Cash flow chart illustrates planned vs received funds; compliance tab shows outstanding documentation requirements.



 6. Farmers & Licensed Buying Companies (`/farmer`)

- Objectives: Receive CRDN immediately at cocoa delivery, convert to cash or savings, track receipts.
- Workflow:
  1. Field agent scans cocoa delivery QR or enters receipt ID; portal fetches weight and quality from oracle feed.
  2. System issues CRDN tokens to farmer wallet; SMS confirms amount and reference number.
  3. Farmer can: hold CRDN, swap to GBDC (for better rates), or cash out to MoMo/bank.
  4. Historical tab stores deliveries, payment timelines, and moisture/quality scores.
- Data capture: Mobile form auto-fills location and LBC ID; weight and quality data come from IoT scales. Manual corrections require supervisor PIN and reason code.
- Insights: Farmers view price trends and cumulative earnings; LBC managers get aggregation stats to plan logistics.



 7. Diaspora Investors (`/diaspora`)

- Objectives: Subscribe to Gold or Cocoa Yield Notes, monitor performance, receive payouts.
- Workflow:
  1. KYC via passport + proof of address; once approved, access the investment marketplace.
  2. Select note type → review reserve backing snapshot → commit funds via bank transfer or card (processed through partnering custodian).
  3. Dashboard shows note allocation, coupon schedule, and reserve metrics backing the note.
  4. Payouts route to chosen account; statements downloadable in PDF/CSV.
- Data capture: Subscription forms collect amount, tenor, currency, and beneficiary details. All entries cross-check with sanction screening service.
- Insights: Visuals highlight share of reserves supporting each note and expected yield curves; alerts notify if reserve coverage dips below policy threshold.



 8. Public Dashboard (`/`)

- Purpose: Provide transparent metrics to citizens, media, and markets.
- Features:
  - Live counters for gold (mg) and cocoa receipts (MT).
  - Circulating GBDC/CRDN charts with historical slider.
  - Compliance badges showing last audit timestamp.
  - API access tokenless for selected endpoints (`/api/v1/dashboard`).
- Meaning-making: Encourages trust by correlating reserve movements with issuance; includes glossary and FAQ for non-technical audiences.



 9. Data Entry Standards & Validation

1. Consistent IDs: Every asset reference uses globally unique IDs (GUID) issued by the oracle layer; users never type raw IDs manually—scan/search instead.
2. Time Windows: Most submissions (deliveries, tranches, redemptions) must occur within 24 hours of attestation; expired entries require BoG override.
3. Attachments: PDF/JPEG evidence is hashed client-side; the ledger stores the hash for tamper detection.
4. Audit Trail: Each submission records user ID, role, geolocation (when available), and device fingerprint. Users can export their own activity log for transparency.



 10. Support & Escalation

| Issue Type | First Contact | Escalation SLA |
|||-|
| Login / MFA problems | Institutional IT desk | 2 hours |
| Data mismatch (oracle vs manual entry) | BoG Treasury Ops | 1 business day |
| Payment rejection / AML flag | Compliance team (`@govres/security`) | 4 hours |
| API integration errors | Northlands DevOps | 1 hour acknowledgment |

Use the in-portal "Need Help" button to open a ticket; context (page, payload hash) is attached automatically so support sees precisely what failed.



 11. Tips for Accurate Data Capture

- Prefer scanning QR codes on receipts and bar tags to avoid manual typing errors.
- Use batch upload templates for repetitive submissions; templates enforce column order and accepted value ranges.
- Double-check reserve ratios before confirming large issuances—warning banners highlight proximity to policy caps.
- Encourage field agents to sync devices daily; offline submissions queue locally but must upload within policy windows.



 12. Turning Data into Decisions

Each persona dashboard highlights the metrics most relevant to their role:

- BoG/Treasury: Reserve coverage %, issuance velocity, AML exceptions.
- Agencies: Budget execution rate, milestone status, compliance backlog.
- Banks: Liquidity inflow/outflow, redemption backlog, GL reconciliation health.
- Contractors: Cash-on-hand vs committed spend, documentation readiness.
- Farmers/LBCs: Delivery history, price trends, payout latency.
- Diaspora Investors: Portfolio coverage ratio, coupon calendar, NAV movements.
- Public: Aggregate reserves vs circulation, transparency indicators.

Dashboards update every 5 seconds from the ledger stream, but users can export static reports (PDF, CSV, JSON) for offline analysis.



Keep this guide alongside the portal; it mirrors the navigation order so new staff can follow step-by-step without deep technical context. For integration or API specifics, refer to the developer API reference in `packages/api`.
