<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Saving extends Model
{
    protected $fillable = [
        'user_id',
        'goal_id',
        'amount',
        'saving_date',
        'note',
    ];

    protected $casts = [
        'saving_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }

    public function moneyHistory(): MorphOne
    {
        return $this->morphOne(MoneyHistory::class, 'source');
    }
}
