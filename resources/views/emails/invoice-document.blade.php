<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $invoice->type === 'proforma' ? 'Proforma' : 'Invoice' }}</title>
</head>

<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 32px 16px; background-color: #f8fafc;">
        <tr>
            <td align="center">
                <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
                    <tr>
                        <td style="padding: 24px 28px; background-color: #0f172a; color: #ffffff;">
                            <p style="margin: 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.8;">{{ config('app.name', 'Rentals') }}</p>
                            <h1 style="margin: 8px 0 0; font-size: 22px; font-weight: 700;">
                                {{ $invoice->type === 'proforma' ? 'Proforma Issued' : 'Invoice Issued' }}
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 26px 28px;">
                            <p style="margin: 0 0 14px; font-size: 14px; color: #334155; line-height: 1.6;">
                                Dear {{ $invoice->tenant->full_name ?? 'Tenant' }},
                            </p>

                            <p style="margin: 0 0 18px; font-size: 14px; color: #334155; line-height: 1.6;">
                                Please find your {{ $invoice->type === 'proforma' ? 'proforma' : 'invoice' }} details below.
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 18px;">
                                <tr>
                                    <td style="padding: 10px 14px; background-color: #f8fafc; width: 38%; font-size: 12px; color: #64748b;">Document Number</td>
                                    <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; font-weight: 600;">
                                        {{ $invoice->type === 'proforma' ? ($invoice->proforma_number ?: $invoice->invoice_number) : $invoice->invoice_number }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; background-color: #f8fafc; width: 38%; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">Property / Unit</td>
                                    <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; border-top: 1px solid #e2e8f0;">
                                        {{ $invoice->building->name ?? 'N/A' }} / Unit {{ $invoice->lease->unit->unit_number ?? 'N/A' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; background-color: #f8fafc; width: 38%; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">Billing Period</td>
                                    <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; border-top: 1px solid #e2e8f0;">
                                        {{ $invoice->period_start->format('M d, Y') }} to {{ $invoice->period_end->format('M d, Y') }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; background-color: #f8fafc; width: 38%; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">Issue Date</td>
                                    <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; border-top: 1px solid #e2e8f0;">{{ $invoice->issue_date->format('M d, Y') }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; background-color: #f8fafc; width: 38%; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">Due Date</td>
                                    <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; border-top: 1px solid #e2e8f0;">{{ $invoice->due_date->format('M d, Y') }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 14px; background-color: #f8fafc; width: 38%; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">Amount</td>
                                    <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; font-weight: 700; border-top: 1px solid #e2e8f0;">
                                        {{ number_format((float) $invoice->total_amount, 2) }} {{ $invoice->currency }}
                                    </td>
                                </tr>
                            </table>

                            @if(!empty($invoice->notes))
                            <p style="margin: 0 0 18px; font-size: 13px; color: #475569; line-height: 1.6;">
                                <strong>Notes:</strong> {{ $invoice->notes }}
                            </p>
                            @endif

                            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
                                If you have any questions, please contact the property management team.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
                            This is an automated message from {{ config('app.name', 'Rentals') }}.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>