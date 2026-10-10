<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'nom', 'prenom', 'email', 'mot_de_passe',
        'telephone', 'role', 'departement_id', 'numero_bureau',
    ];

    protected $hidden = ['mot_de_passe', 'remember_token'];

    protected $casts = ['email_verified_at' => 'datetime'];

    public function getAuthPasswordName(): string
    {
        return 'mot_de_passe';
    }

    // Relationships
    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }

    public function technicien()
    {
        return $this->hasOne(Technicien::class);
    }

    public function demandesCreees()
    {
        return $this->hasMany(Demande::class, 'personnel_id');
    }

    public function demandesGerees()
    {
        return $this->hasMany(Demande::class, 'helpdesk_id');
    }

    public function interventions()
    {
        return $this->hasMany(Intervention::class, 'technicien_id');
    }

    public function materiels()
    {
        return $this->hasMany(Materiel::class, 'personnel_id');
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class, 'personnel_id');
    }

    public function reclamations()
    {
        return $this->hasMany(ReclamationRetard::class, 'personnel_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
}
