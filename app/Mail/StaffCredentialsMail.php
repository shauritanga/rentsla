<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $staffName;
    public string $email;
    public string $password;
    public string $roleName;
    public string $buildingName;

    /**
     * Create a new message instance.
     */
    public function __construct(string $staffName, string $email, string $password, string $roleName, string $buildingName)
    {
        $this->staffName = $staffName;
        $this->email = $email;
        $this->password = $password;
        $this->roleName = $roleName;
        $this->buildingName = $buildingName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Rentals Staff Account Has Been Created',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.staff-credentials',
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
