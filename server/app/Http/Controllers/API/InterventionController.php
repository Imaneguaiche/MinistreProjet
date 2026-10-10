<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\AuditLog;
use App\Models\Technicien;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InterventionController extends Controller
{
    public function updateStatut(Request $request, int $id)
    {
        $validated = $request->validate([
            'statut' => 'required|in:en_attente,en_cours,terminee,annulee',
        ]);

        $intervention = Intervention::with('demande')->findOrFail($id);
        $intervention->update($validated);

        // Synchronise demande status + material state
        if ($intervention->demande) {
            $demande    = $intervention->demande;
            $materielId = $demande->materiel_id;

            if ($validated['statut'] === 'en_cours') {
                $demande->update(['statut' => 'en_cours']);
                if (!$intervention->date_debut) {
                    $intervention->update(['date_debut' => now()]);
                }
                Technicien::where('user_id', $intervention->technicien_id)
                    ->update(['disponibilite' => 'indisponible']);

                // → material becomes en_reparation
                if ($materielId) {
                    $old = DB::table('materiels')->where('id', $materielId)->value('etat');
                    DB::table('materiels')
                        ->where('id', $materielId)
                        ->where('etat', '!=', 'hors_service')
                        ->update(['etat' => 'en_reparation', 'updated_at' => now()]);
                    \Log::info("[MATERIEL SYNC] intervention en_cours — materiel #{$materielId}: '{$old}' -> 'en_reparation'");
                }

            } elseif ($validated['statut'] === 'terminee') {
                $demande->update(['statut' => 'resolue']);
                if (!$intervention->date_fin) {
                    $intervention->update(['date_fin' => now()]);
                }
                Technicien::where('user_id', $intervention->technicien_id)
                    ->update(['disponibilite' => 'disponible']);

                // → material becomes fonctionnel
                if ($materielId) {
                    $old = DB::table('materiels')->where('id', $materielId)->value('etat');
                    DB::table('materiels')
                        ->where('id', $materielId)
                        ->where('etat', '!=', 'hors_service')
                        ->update(['etat' => 'fonctionnel', 'updated_at' => now()]);
                    \Log::info("[MATERIEL SYNC] intervention terminee — materiel #{$materielId}: '{$old}' -> 'fonctionnel'");
                }

            } elseif ($validated['statut'] === 'annulee') {
                Technicien::where('user_id', $intervention->technicien_id)
                    ->update(['disponibilite' => 'disponible']);

                // → material goes back to en_panne
                if ($materielId) {
                    $old = DB::table('materiels')->where('id', $materielId)->value('etat');
                    DB::table('materiels')
                        ->where('id', $materielId)
                        ->where('etat', '!=', 'hors_service')
                        ->update(['etat' => 'en_panne', 'updated_at' => now()]);
                    \Log::info("[MATERIEL SYNC] intervention annulee — materiel #{$materielId}: '{$old}' -> 'en_panne'");
                }
            }
        }

        try {
            AuditLog::create([
                'action'      => 'update_statut_intervention',
                'user_id'     => $request->user()->id,
                'entity_type' => 'Intervention',
                'entity_id'   => $intervention->id,
                'new_values'  => $validated,
                'ip_address'  => $request->ip(),
            ]);
        } catch (\Throwable $e) {}

        return response()->json($intervention->load('demande'));
    }
}
