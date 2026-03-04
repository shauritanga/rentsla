<?php

namespace App\Notifications;

use App\Models\Lease;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaseApprovalRequired extends Notification
{

    public function __construct(
        public Lease $lease,
        public string $stage,
        public string $buildingName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $unit = $this->lease->unit->unit_number ?? 'N/A';
        $tenant = $this->lease->tenant->full_name ?? 'N/A';
        $roleLabel = ucfirst($this->stage);
        $companyName = config('app.name', 'Your Company');

        return (new MailMessage)
            ->subject("Lease Approval Required – {$this->buildingName}")
            ->greeting("Hello {$notifiable->name},")
            ->line("A new lease requires your approval as **{$roleLabel}**.")
            ->line("**Building:** {$this->buildingName}")
            ->line("**Unit:** {$unit}")
            ->line("**Tenant:** {$tenant}")
            ->line("**Monthly Rent:** " . number_format($this->lease->monthly_rent, 0) . " {$this->lease->rent_currency}")
            ->action('Review Lease', url('/manager/leases'))
            ->line('Please review and approve or reject this lease at your earliest convenience.')
            ->salutation("Thank you,\n{$companyName} Team");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'lease_approval_required',
            'lease_id' => $this->lease->id,
            'stage' => $this->stage,
            'building_name' => $this->buildingName,
            'unit_number' => $this->lease->unit->unit_number ?? null,
            'tenant_name' => $this->lease->tenant->full_name ?? null,
            'monthly_rent' => (float) $this->lease->monthly_rent,
            'message' => "Lease for unit {$this->lease->unit->unit_number} requires your approval as {$this->stage}.",
        ];
    }
}
