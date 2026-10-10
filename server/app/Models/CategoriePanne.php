<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriePanne extends Model
{
    protected $table = 'categories_pannes';
    protected $fillable = ['libelle', 'description'];

    public function demandes()
    {
        return $this->hasMany(Demande::class, 'categorie_id');
    }
}
