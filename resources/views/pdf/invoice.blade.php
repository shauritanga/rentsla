@php
$isProforma = $invoice->type === 'proforma';
$documentTitle = $isProforma ? 'PROFORMA INVOICE' : 'TAX INVOICE';
$numberLabel = $isProforma ? 'PROFORMA NUMBER' : 'INVOICE NUMBER';
$documentNumber = $isProforma
? ($invoice->proforma_number ?: $invoice->invoice_number)
: $invoice->invoice_number;

$companyName = env('INVOICE_COMPANY_NAME', config('app.name', 'Property Management Company'));
$companyAddress1 = env('INVOICE_COMPANY_ADDRESS_1', $building->address ?? 'Rocks Business Centre, Industrial Area');
$companyAddress2 = env('INVOICE_COMPANY_ADDRESS_2', 'P.O. Box 00000, Dar-es-Salaam');
$companyContact = env('INVOICE_COMPANY_CONTACT', (config('mail.from.address') ?: 'info@company.com') . ' | +255 000 000000');

$tenantName = $invoice->tenant->full_name ?? 'N/A';
$tenantAddress = $invoice->tenant->billing_address ?: 'Address not provided';

$tenantContactParts = array_filter([
$invoice->tenant->email ?? null,
$invoice->tenant->phone ?? null,
]);
$tenantContact = count($tenantContactParts) > 0 ? implode(' | ', $tenantContactParts) : 'Contact details not provided';

$currency = $invoice->currency ?: 'TZS';
$subtotal = (float) $invoice->subtotal;
$taxRate = (float) $invoice->withholding_tax_rate;
$taxAmount = (float) $invoice->withholding_tax_amount;
$total = (float) $invoice->total_amount;

$bankName = env('INVOICE_BANK_NAME', 'DIAMOND TRUST BANK');
$bankAccountNumber = env('INVOICE_BANK_ACCOUNT_NUMBER', '03532012002');
$bankAccountName = env('INVOICE_BANK_ACCOUNT_NAME', $companyName);
$bankSwift = env('INVOICE_BANK_SWIFT_CODE', 'DTKETZTZ');
@endphp

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>{{ $documentTitle }}</title>
    <style>
        @page {
            margin: 28px 34px;
        }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #1f2937;
            font-size: 10.5px;
            margin: 0;
            padding: 0;
        }

        .title {
            text-align: center;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 1px;
            margin: 0 0 8px;
            color: #111827;
        }

        .company {
            text-align: center;
            margin-bottom: 18px;
            line-height: 1.6;
            color: #4b5563;
        }

        .company .name {
            font-size: 12px;
            font-weight: 700;
            color: #374151;
            margin-bottom: 2px;
        }

        .divider {
            border-top: 2px solid #111827;
            margin: 0 0 18px;
        }

        .meta {
            width: 100%;
            border-collapse: collapse;
            background: #f3f4f6;
            margin-bottom: 24px;
        }

        .meta td {
            padding: 12px 14px 10px;
            vertical-align: top;
            width: 50%;
        }

        .meta .label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.4px;
            color: #6b7280;
            margin: 0 0 6px;
        }

        .meta .value {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
            margin: 0;
        }

        .bill-to {
            margin-bottom: 16px;
            line-height: 1.7;
        }

        .bill-to .heading {
            font-size: 12px;
            font-style: italic;
            font-weight: 700;
            margin: 0 0 4px;
            color: #111827;
        }

        .bill-to .name {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin: 0;
            color: #374151;
        }

        .bill-to .line {
            margin: 0;
            font-size: 10px;
            color: #4b5563;
        }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }

        .items thead th {
            background: #000;
            color: #fff;
            text-align: left;
            font-size: 10px;
            letter-spacing: 0.3px;
            padding: 8px 8px;
            font-weight: 700;
        }

        .items tbody td {
            padding: 8px 8px;
            border-bottom: 1px solid #d1d5db;
            font-size: 10px;
            color: #374151;
        }

        .items tfoot td {
            border-top: 2px solid #111827;
            height: 8px;
            padding: 0;
        }

        .num {
            width: 44px;
            text-align: center;
        }

        .desc {
            width: 50%;
            font-weight: 600;
        }

        .qty,
        .rate,
        .amount {
            text-align: right;
        }

        .amount {
            font-weight: 700;
            width: 120px;
        }

        .totals {
            width: 56%;
            margin-left: auto;
            margin-top: 16px;
            border-collapse: collapse;
        }

        .totals td {
            padding: 6px 0;
            font-size: 10.5px;
            color: #374151;
        }

        .totals td.label {
            padding-right: 16px;
            border-bottom: 1px dotted #d1d5db;
        }

        .totals td.value {
            text-align: right;
            width: 140px;
            font-weight: 700;
        }

        .totals .grand td {
            border-top: 3px solid #6b7280;
            padding-top: 10px;
            font-size: 14px;
            font-weight: 800;
            color: #111827;
            letter-spacing: 0.5px;
        }

        .payment-box {
            margin-top: 26px;
            background: #f3f4f6;
            border-left: 4px solid #111827;
            padding: 14px 14px 12px;
        }

        .payment-title {
            margin: 0 0 8px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.6px;
            color: #111827;
        }

        .payment-row {
            margin: 0;
            font-size: 10px;
            line-height: 1.7;
            color: #4b5563;
        }

        .footer {
            margin-top: 28px;
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
            color: #9ca3af;
            font-size: 9px;
            width: 100%;
            border-collapse: collapse;
        }

        .footer td:last-child {
            text-align: right;
        }
    </style>
</head>

<body>
    <h1 class="title">{{ $documentTitle }}</h1>

    <div class="company">
        <div class="name">{{ $companyName }}</div>
        <div>{{ $companyAddress1 }}</div>
        <div>{{ $companyAddress2 }}</div>
        <div>{{ $companyContact }}</div>
    </div>

    <div class="divider"></div>

    <table class="meta">
        <tr>
            <td>
                <p class="label">DATE</p>
                <p class="value">{{ $invoice->issue_date->format('d M Y') }}</p>
            </td>
            <td style="text-align:right;">
                <p class="label">{{ $numberLabel }}</p>
                <p class="value">{{ $documentNumber }}</p>
            </td>
        </tr>
    </table>

    <div class="bill-to">
        <p class="heading">BILL TO</p>
        <p class="name">{{ $tenantName }}</p>
        <p class="line">{{ $tenantAddress }}</p>
        <p class="line">{{ $tenantContact }}</p>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th class="num">NO</th>
                <th class="desc">DESCRIPTION</th>
                <th class="qty">QTY</th>
                <th class="rate">RATE</th>
                <th class="amount">AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            @forelse($invoice->items as $index => $item)
            <tr>
                <td class="num">{{ $index + 1 }}</td>
                <td class="desc">{{ strtoupper($item->description) }}</td>
                <td class="qty">{{ number_format((float) $item->quantity, 2) }}</td>
                <td class="rate">{{ number_format((float) $item->unit_price, 2) }}</td>
                <td class="amount">{{ number_format((float) $item->amount, 2) }}</td>
            </tr>
            @empty
            <tr>
                <td class="num">1</td>
                <td class="desc">INVOICE CHARGES</td>
                <td class="qty">1.00</td>
                <td class="rate">{{ number_format($total, 2) }}</td>
                <td class="amount">{{ number_format($total, 2) }}</td>
            </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="5"></td>
            </tr>
        </tfoot>
    </table>

    <table class="totals">
        <tr>
            <td class="label">Subtotal</td>
            <td class="value">{{ number_format($subtotal, 2) }}</td>
        </tr>
        <tr>
            <td class="label">WITHHOLDING TAX ({{ number_format($taxRate, 2) }}%)</td>
            <td class="value">-{{ number_format($taxAmount, 2) }}</td>
        </tr>
        <tr class="grand">
            <td class="label" style="border-bottom:none;">TOTAL AMOUNT {{ strtoupper($currency) }}</td>
            <td class="value" style="border-bottom:none;">{{ number_format($total, 2) }}</td>
        </tr>
    </table>

    <div class="payment-box">
        <p class="payment-title">PAYMENT DETAILS</p>
        <p class="payment-row">Bank Name:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $bankName }}</p>
        <p class="payment-row">Account Number:&nbsp;&nbsp;{{ $bankAccountNumber }}</p>
        <p class="payment-row">Account Name:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $bankAccountName }}</p>
        <p class="payment-row">Swift Code:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $bankSwift }}</p>
    </div>

    <table class="footer">
        <tr>
            <td>Approved by: {{ $invoice->creator->name ?? 'Admin User' }}</td>
            <td>Date: {{ $invoice->created_at ? $invoice->created_at->format('d/m/Y') : now()->format('d/m/Y') }}</td>
        </tr>
    </table>
</body>

</html>