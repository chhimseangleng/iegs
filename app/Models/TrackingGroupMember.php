<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackingGroupMember extends Model
{
    protected $fillable = ['group_id', 'user_id', 'status'];

    public function group()
    {
        return $this->belongsTo(TrackingGroup::class, 'group_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
