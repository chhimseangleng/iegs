<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrackingGroup extends Model
{
    protected $fillable = ['name', 'creator_id'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function members()
    {
        return $this->hasMany(TrackingGroupMember::class, 'group_id');
    }

    public function acceptedMembers()
    {
        return $this->hasMany(TrackingGroupMember::class, 'group_id')->where('status', 'accepted');
    }

    public function pendingMembers()
    {
        return $this->hasMany(TrackingGroupMember::class, 'group_id')->where('status', 'pending');
    }
}
