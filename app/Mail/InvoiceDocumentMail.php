<?php

namespace App\Mail;

use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceDocumentMail extends Mailable
{
    use Queueable, SerializesModels;

    public Invoice $invoice;

    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function envelope(): Envelope
    {
        $number = $this->documentNumber();

        $subjectPrefix = $this->invoice->type === Invoice::TYPE_PROFORMA ? 'Proforma' : 'Invoice';

        return new Envelope(
            subject: "{$subjectPrefix} {$number} from " . config('app.name', 'Rentals'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice-document',
        );
    }

    public function attachments(): array
    {
        $this->invoice->loadMissing(['building', 'lease.unit', 'tenant', 'items', 'payments', 'creator']);

        $label = $this->invoice->type === Invoice::TYPE_PROFORMA ? 'Proforma' : 'Invoice';
        $filename = sprintf('%s_%s.pdf', $label, $this->documentNumber());

        return [
            Attachment::fromData(
                fn() => Pdf::loadView('pdf.invoice', [
                    'invoice' => $this->invoice,
                    'building' => $this->invoice->building,
                ])->output(),
                $filename,
            )->withMime('application/pdf'),
        ];
    }

    private function documentNumber(): string
    {
        if ($this->invoice->type === Invoice::TYPE_PROFORMA) {
            return $this->invoice->proforma_number ?: $this->invoice->invoice_number;
        }

        return $this->invoice->invoice_number;
    }
}
