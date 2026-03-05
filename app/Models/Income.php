<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Income extends Model
{
    protected $fillable = [
        'user_id',
        'category_id',
        'amount',
        'description',
        'income_date',
    ];

    protected $casts = [
        'income_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function moneyHistory(): MorphOne
    {
        return $this->morphOne(MoneyHistory::class, 'source');
    }
}
