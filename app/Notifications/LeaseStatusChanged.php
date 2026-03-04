<?php

namespace App\Notifications;

use App\Models\Lease;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaseStatusChanged extends Notification
{

    public function __construct(
        public Lease $lease,
        public string $action,         // 'approved', 'rejected', 'activated'
        public string $actorName,
        public string $actorRole,
        public string $buildingName,
        public ?string $comment = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $unit = $this->lease->unit->unit_number ?? 'N/A';
        $tenant = $this->lease->tenant->full_name ?? 'N/A';
        $statusLabel = ucfirst(str_replace('_', ' ', $this->lease->status));

        $mail = (new MailMessage)
            ->subject("Lease {$this->action} – {$this->buildingName}")
            ->greeting("Hello {$notifiable->name},");

        if ($this->action === 'approved') {
            $mail->line("A lease has been **approved** by {$this->actorName} ({$this->actorRole}).");
        } elseif ($this->action === 'rejected') {
            $mail->line("A lease has been **rejected** by {$this->actorName} ({$this->actorRole}).");
        } else {
            $mail->line("A lease status has been updated to **{$statusLabel}**.");
        }

        $mail->line("**Building:** {$this->buildingName}")
            ->line("**Unit:** {$unit}")
            ->line("**Tenant:** {$tenant}");

        if ($this->comment) {
            $mail->line("**Comment:** {$this->comment}");
        }

        if ($this->action === 'approved' && $this->lease->status === Lease::STATUS_PENDING_MANAGER) {
            $mail->line('The lease now awaits final manager approval.');
        } elseif ($this->action === 'approved' && $this->lease->status === Lease::STATUS_ACTIVE) {
            $mail->line('The lease is now **active**.');
        }

        return $mail->action('View Leases', url('/manager/leases'))
            ->line('Thank you.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'lease_status_changed',
            'lease_id' => $this->lease->id,
            'action' => $this->action,
            'actor_name' => $this->actorName,
            'actor_role' => $this->actorRole,
            'building_name' => $this->buildingName,
            'unit_number' => $this->lease->unit->unit_number ?? null,
            'tenant_name' => $this->lease->tenant->full_name ?? null,
            'new_status' => $this->lease->status,
            'comment' => $this->comment,
            'message' => "Lease for unit {$this->lease->unit->unit_number} has been {$this->action} by {$this->actorName}.",
        ];
    }
}
