<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rapport extends Model
{
    protected $fillable = ['duree', 'description', 'remarque', 'diagnostic', 'intervention_id'];

    protected $casts = ['date_rapport' => 'datetime'];

    public function intervention()
    {
        return $this->belongsTo(Intervention::class);
    }
}
