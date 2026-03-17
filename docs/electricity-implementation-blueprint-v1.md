# Electricity Implementation Blueprint v1

Status: ready for implementation.
Date: 2026-03-17.
Depends on: docs/electricity-rulebook-v1.md.

## Progress snapshot (2026-03-17)

- Phase 1 completed in code and migrated: invoice category metadata (`bill_category`, `billing_cycle`, `source_mix_mode`).
- Phase 2 completed in code: invoice category constants and category-aware numbering (`LPF/LINV/EPF/EINV`).
- Phase 3 substantially implemented: `Manager/ElectricityController` with batch create, readings save, reconciliation calculate, and approve+post to electricity documents.
- Phase 4 advanced: manager electricity workspace now has split pages (`Manager/ElectricityBatches.tsx`, `Manager/ElectricityReadings.tsx`, `Manager/ElectricityReview.tsx`) with route-level navigation.
- Phase 5 partially implemented: accounting postings now carry `bill_category` tags (`lease|electricity`) on both transactions and transaction entries.
- Remaining: advanced reconciliation analytics and additional reporting surfaces that consume category-tagged accounting data.

## A. Current system baseline (already in project)

- Main billing model: `app/Models/Invoice.php`.
- Main billing controller: `app/Http/Controllers/Manager/InvoiceController.php`.
- Existing invoice table: `database/migrations/2026_03_02_060002_create_invoices_table.php`.
- Existing UI create/list flow: `resources/js/Pages/Manager/Invoices.tsx`.

## B. Data model changes (Phase 1)

### 1) Extend `invoices` table

Add category and cycle metadata:

- `bill_category` string(20) default `lease` (`lease|electricity`)
- `billing_cycle` string(20) default `lease_cycle` (`lease_cycle|monthly_electricity`)
- `source_mix_mode` string(20) nullable (`blended|source_specific`)

Notes:

- Keep existing `type` (`proforma|invoice`) and status lifecycle unchanged.
- Keep all existing lease columns for backward compatibility.

### 2) Add electricity monthly batch table

Create `electricity_batches`:

- id
- building_id
- period_month (YYYY-MM)
- issue_date
- due_date
- grid_kwh
- grid_cost
- generator_kwh
- generator_cost
- blend_rate
- loss_threshold_percent
- reconciliation_status (`ok|warning|blocked`)
- notes
- created_by
- approved_by nullable
- approved_at nullable
- timestamps

### 3) Add electricity meter readings table

Create `electricity_readings`:

- id
- electricity_batch_id
- unit_id
- tenant_id nullable
- opening_kwh
- closing_kwh
- usage_kwh
- reading_date
- reader_user_id
- photo_path nullable
- is_estimated boolean default false
- estimation_reason nullable
- exception_flag boolean default false
- exception_note nullable
- timestamps

### 4) Optional source cost detail table (if needed)

Create `generator_cost_entries`:

- id
- electricity_batch_id
- cost_type (`fuel|maintenance|operator|reserve|other`)
- amount
- note nullable
- timestamps

## C. Domain behavior changes (Phase 2)

### 1) Invoice category constants

In `app/Models/Invoice.php` add:

- `CATEGORY_LEASE = 'lease'`
- `CATEGORY_ELECTRICITY = 'electricity'`

Add fillable and casts for new category fields.

### 2) Numbering strategy

Refactor `Invoice::nextNumber(...)` to include category prefix:

- lease proforma: `LPF-YYYY-####`
- lease invoice: `LINV-YYYY-####`
- electricity proforma: `EPF-YYYY-####`
- electricity invoice: `EINV-YYYY-####`

Global uniqueness stays enforced.

### 3) Calculation engines

Keep lease calculation logic as-is.
Add electricity calculation path:

- consumption from readings
- blended rate from monthly source totals
- electricity line items per tenant

## D. Controller flow changes (Phase 3)

### 1) `InvoiceController@store`

Add validation for:

- `bill_category` required in `lease|electricity`

Behavior split:

- If `lease`: current behavior.
- If `electricity`: use electricity batch + readings data, create invoice items from calculated charge.

### 2) New electricity management controller

Create `app/Http/Controllers/Manager/ElectricityController.php` with:

- `index` monthly batches list
- `createBatch`
- `saveReadings`
- `calculate`
- `approveAndPost`

### 3) Reconciliation check

Before posting electricity docs:

- compute system energy balance
- if threshold exceeded, set warning/blocked based on policy

## E. UI changes (Phase 4)

### 1) Invoice create UI

In `resources/js/Pages/Manager/Invoices.tsx`:

- add first selector: `Bill Category` (`Lease` / `Electricity`)
- keep existing `type` selector (`Proforma` / `Invoice`)
- conditionally render lease vs electricity inputs

### 2) Electricity workspace UI

New pages under `resources/js/Pages/Manager/`:

- `ElectricityBatches.tsx`
- `ElectricityReadings.tsx`
- `ElectricityReview.tsx`

### 3) Filters and badges

Update list page with category badge and filter.

## F. Accounting and payment rules (Phase 5)

- Payments remain document-scoped.
- No cross settlement between lease and electricity categories.
- Posting entries tagged with category for reporting.

## G. Migration safety and rollout

### 1) Backward compatibility

- Existing records default `bill_category = lease`.
- Existing UI keeps working for lease path.

### 2) Rollout steps

1. Add schema and model fields.
2. Add category-aware numbering.
3. Add UI category selector.
4. Add electricity batch/readings flow.
5. Enable posting to electricity documents.

### 3) Test checklist

- Lease creation still works unchanged.
- Electricity doc creation works monthly.
- Numbering unique by category/type.
- Reconciliation warning triggers correctly.
- Payments do not cross-settle categories.
