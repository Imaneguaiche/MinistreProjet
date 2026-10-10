<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $fillable = ['note', 'commentaire', 'intervention_id', 'personnel_id'];

    protected $casts = ['date_feedback' => 'datetime'];

    public function intervention()
    {
        return $this->belongsTo(Intervention::class);
    }

    public function personnel()
    {
        return $this->belongsTo(User::class, 'personnel_id');
    }
}
