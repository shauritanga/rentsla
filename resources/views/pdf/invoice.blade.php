<h1>{{ $invoice->type === 'proforma' ? 'Proforma' : 'Invoice' }}</h1>
<p><strong>Invoice Number:</strong> {{ $invoice->invoice_number }}</p>
<p><strong>Tenant:</strong> {{ $invoice->tenant->full_name }}</p>
<p><strong>Unit:</strong> {{ $invoice->lease->unit->unit_number }}</p>
<p><strong>Period:</strong> {{ $invoice->period_start->format('M d, Y') }} - {{ $invoice->period_end->format('M d, Y') }}</p>
<p><strong>Total Amount:</strong> {{ number_format($invoice->total_amount, 2) }} {{ $invoice->currency }}</p>

<p>
    <a href="{{ url()->current() }}" style="display:inline-block;padding:10px 20px;background:#3490dc;color:#fff;text-decoration:none;border-radius:5px;">View Invoice</a>
</p>

<p>Thanks,<br>{{ config('app.name') }}</p>