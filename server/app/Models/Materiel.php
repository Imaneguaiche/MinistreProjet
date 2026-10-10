<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\AuditLog;

class Materiel extends Model
{
    protected $fillable = [
        'nom_materiel', 'type_materiel', 'numero_serie',
        'etat', 'personnel_id',
    ];

    public function personnel()
    {
        return $this->belongsTo(User::class, 'personnel_id');
    }

    public function demandes()
    {
        return $this->hasMany(Demande::class);
    }

    /**
     * Automatically synchronizes the state of the material based on its related requests.
     */
    public function syncEtat()
    {
        // If it's already marked completely hors_service, it shouldn't auto-recover.
        if ($this->etat === 'hors_service') {
            return;
        }

        $oldEtat = $this->etat;
        $activeDemandes = $this->demandes()->get();

        if ($activeDemandes->isEmpty()) {
            return;
        }

        $hasEnCours = false;
        $hasAFaire  = false;
        $allTermine = true;

        foreach ($activeDemandes as $d) {
            $s = $d->statut;
            if (in_array($s, ['en_cours'])) {
                // Technician actively working → en maintenance
                $hasEnCours = true;
                $allTermine = false;
            } elseif (in_array($s, ['nouvelle', 'en_attente', 'affectee'])) {
                // Waiting or assigned but not started → en panne
                $hasAFaire = true;
                $allTermine = false;
            } elseif (!in_array($s, ['resolue', 'cloturee', 'rejetee'])) {
                $allTermine = false;
            }
        }

        $newEtat = 'fonctionnel';

        if ($hasEnCours) {
            $newEtat = 'en_reparation'; // Translates to "en maintenance" in UI
        } elseif ($hasAFaire) {
            $newEtat = 'en_panne';
        } elseif ($allTermine) {
            $newEtat = 'fonctionnel';
        }

        if ($oldEtat !== $newEtat) {
            $this->update(['etat' => $newEtat]);
            
            // Generate an Audit Log
            AuditLog::create([
                'action' => 'materiel_status_auto_sync',
                'user_id' => auth()->id() ?? null,
                'entity_type' => 'Materiel',
                'entity_id' => $this->id,
                'old_values' => ['etat' => $oldEtat],
                'new_values' => ['etat' => $newEtat],
                'ip_address' => request()->ip() ?? '127.0.0.1'
            ]);
        }
    }
}
