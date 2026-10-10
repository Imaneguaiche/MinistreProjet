<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Demande extends Model
{
    protected $fillable = [
        'description', 'statut', 'priorite',
        'personnel_id', 'categorie_id', 'materiel_id', 'helpdesk_id',
    ];

    protected $casts = ['date_creation' => 'datetime'];

    public function personnel()
    {
        return $this->belongsTo(User::class, 'personnel_id');
    }

    public function helpdesk()
    {
        return $this->belongsTo(User::class, 'helpdesk_id');
    }

    public function categorie()
    {
        return $this->belongsTo(CategoriePanne::class, 'categorie_id');
    }

    public function materiel()
    {
        return $this->belongsTo(Materiel::class);
    }

    public function interventions()
    {
        return $this->hasMany(Intervention::class);
    }

    public function piecesJointes()
    {
        return $this->hasMany(PieceJointe::class);
    }

    public function reclamations()
    {
        return $this->hasMany(ReclamationRetard::class);
    }

    /**
     * Boot the model to dispatch state sync events to the associated Materiel.
     */
    protected static function booted()
    {
        static::saved(function ($demande) {
            if ($demande->materiel) {
                $demande->materiel->syncEtat();
            }
        });

        static::deleted(function ($demande) {
            if ($demande->materiel) {
                $demande->materiel->syncEtat();
            }
        });
    }
}
