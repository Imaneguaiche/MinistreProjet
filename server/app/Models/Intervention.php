<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Intervention extends Model
{
    protected $fillable = [
        'date_debut', 'date_fin', 'statut',
        'demande_id', 'technicien_id',
    ];

    protected $casts = [
        'date_affectation' => 'datetime',
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
    ];

    public function demande()
    {
        return $this->belongsTo(Demande::class);
    }

    public function technicien()
    {
        return $this->belongsTo(User::class, 'technicien_id');
    }

    public function rapport()
    {
        return $this->hasOne(Rapport::class);
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class);
    }
}
