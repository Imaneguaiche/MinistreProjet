<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PieceJointe extends Model
{
    protected $table = 'pieces_jointes';
    protected $fillable = ['nom_fichier', 'type_fichier', 'chemin_fichier', 'demande_id'];

    public function demande()
    {
        return $this->belongsTo(Demande::class);
    }
}
