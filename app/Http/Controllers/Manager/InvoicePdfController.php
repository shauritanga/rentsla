<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;

class InvoicePdfController extends Controller
{
    public function download(Invoice $invoice)
    {
        $user = Auth::user();
        $building = $user->getBuilding();
        abort_unless($invoice->building_id === $building->id, 403);
        $invoice->load(['lease.unit', 'tenant', 'items', 'payments', 'creator']);
        $pdf = Pdf::loadView('pdf.invoice', ['invoice' => $invoice, 'building' => $building]);
        $filename = ($invoice->type === 'proforma' ? 'Proforma' : 'Invoice') . "_{$invoice->invoice_number}.pdf";
        return $pdf->download($filename);
    }
}
