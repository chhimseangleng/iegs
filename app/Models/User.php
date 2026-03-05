<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

     public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function incomes(): HasMany
    {
        return $this->hasMany(Income::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function goals(): HasMany
    {
        return $this->hasMany(Goal::class);
    }

    public function savings(): HasMany
    {
        return $this->hasMany(Saving::class);
    }

    public function moneyHistories(): HasMany
    {
        return $this->hasMany(MoneyHistory::class);
    }

    /**
     * Get the favorite request sent by this user.
     */
    public function favoriteSent()
    {
        return $this->hasOne(Favorite::class, 'sender_id');
    }

    /**
     * Get the favorite request received by this user.
     */
    public function favoriteReceived()
    {
        return $this->hasOne(Favorite::class, 'receiver_id');
    }

    /**
     * Get the linked favorite user if linked.
     */
    public function linkedFavorite()
    {
        // Try to find an accepted favorite where the user is either sender or receiver
        $favorite = Favorite::where('status', 'accepted')
            ->where(function ($query) {
                $query->where('sender_id', $this->id)
                      ->orWhere('receiver_id', $this->id);
            })
            ->first();

        if (!$favorite) {
            return null;
        }

        return $favorite->sender_id == $this->id 
            ? User::find($favorite->receiver_id) 
            : User::find($favorite->sender_id);
    }
}
