# Electricity Rulebook v1

Status: agreed for implementation baseline.
Date: 2026-03-17.
Scope: manager portal electricity billing for buildings with grid power and generator support.

## 1) Billing separation

- Electricity billing is independent from lease rent billing.
- Electricity must have its own proforma and invoice workflow.
- Lease and Electricity documents must not share billing cycles.

## 2) Bill category model

At document creation, user selects bill category:

- `lease`
- `electricity`

The system then applies category-specific validation, calculations, numbering, and posting rules.

## 3) Document types and statuses

Document type remains:

- `proforma`
- `invoice`

Status lifecycle remains:

- `draft`
- `sent`
- `partial`
- `paid`
- `overdue`
- `cancelled`

This lifecycle applies to both categories, but calculation engines differ by category.

## 4) Numbering rules

Use independent sequences by category and by document type.

Examples:

- Lease proforma sequence (LPF-...)
- Lease invoice sequence (LINV-...)
- Electricity proforma sequence (EPF-...)
- Electricity invoice sequence (EINV-...)

Goal: avoid mixed reporting and preserve accounting clarity.

## 5) Electricity cycle and measurement

- Electricity cycle is monthly.
- For each unit/meter in cycle:
    - opening kWh
    - closing kWh
    - reading timestamp
    - reader user
    - optional photo proof

Consumption formula:

- `usage_kwh = closing_kwh - opening_kwh`

Any negative or abnormal delta must be flagged for review before posting.

## 6) Source-aware costing

Sources:

- grid
- generator

Generator cost should include fuel and approved operational cost components.

Recommended MVP charging method:

- blended rate if per-tenant source split is not available.

Formula:

- `blend_rate = (grid_total_cost + generator_total_cost) / (grid_kwh + generator_kwh)`
- `tenant_charge = tenant_usage_kwh * blend_rate`

## 7) Reconciliation policy

Monthly energy reconciliation:

- `grid_kwh + generator_kwh = total_tenant_kwh + common_area_kwh + loss_kwh`

Define acceptable loss threshold (example 5%).
If exceeded, require manager review note before posting.

## 8) Posting and payments

- Electricity charges post to electricity documents only.
- Lease payments cannot settle electricity balances.
- Electricity payments cannot settle lease balances.
- Corrections must be adjustment entries, not direct edits on posted records.

## 9) UX rules

Create flow starts with bill category selection:

- Lease path: existing lease fields and logic.
- Electricity path: period + readings + source cost inputs + calculated preview.

Keep same send/resend and approval interaction style used by current document workflow.

## 10) Access and control

- Building manager can access electricity settings/control pages.
- Staff access can be extended later by explicit permission model.

## 11) MVP implementation boundaries

In v1, implement:

- electricity category documents
- category-aware numbering
- monthly usage and pricing inputs
- charge calculation and posting
- basic reconciliation check + warning

Defer to v2:

- automated meter imports
- advanced loss analytics
- source-specific per-tenant split charging
- prepaid wallets

## 12) Change control

Any changes to formulas or posting policy must increment version:

- v1.1 for minor non-breaking policy updates
- v2.0 for structural data-model changes
