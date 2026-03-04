<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ManagerCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $managerName;
    public string $email;
    public string $password;
    public ?string $buildingName;

    /**
     * Create a new message instance.
     */
    public function __construct(string $managerName, string $email, string $password, ?string $buildingName = null)
    {
        $this->managerName = $managerName;
        $this->email = $email;
        $this->password = $password;
        $this->buildingName = $buildingName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Rentals Manager Account Has Been Created',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.manager-credentials',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
