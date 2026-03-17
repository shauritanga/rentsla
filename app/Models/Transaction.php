<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = ['date', 'description', 'reference_type', 'reference_id', 'bill_category', 'created_by'];

    public function entries(): HasMany
    {
        return $this->hasMany(TransactionEntry::class);
    }
}
