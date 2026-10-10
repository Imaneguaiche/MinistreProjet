<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DemandeIndisponibilite extends Model
{
    use HasFactory;
    protected $table = 'demandes_indisponibilites';
    protected $guarded = ['id'];
    
    protected $casts = [
        'date_debut'   => 'datetime',
        'date_fin'     => 'datetime',
        'is_processed' => 'boolean',
    ];

    public function technicien()
    {
        return $this->belongsTo(User::class, 'technicien_id');
    }
}
