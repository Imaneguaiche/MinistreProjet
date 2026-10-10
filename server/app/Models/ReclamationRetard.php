<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReclamationRetard extends Model
{
    protected $table = 'reclamations_retard';
    protected $fillable = ['motif', 'demande_id', 'personnel_id'];

    protected $casts = ['date_reclamation' => 'datetime'];

    public function demande()
    {
        return $this->belongsTo(Demande::class);
    }

    public function personnel()
    {
        return $this->belongsTo(User::class, 'personnel_id');
    }
}
