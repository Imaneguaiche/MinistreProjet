<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Demande;
use App\Models\Intervention;
use App\Models\Technicien;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DemandeController extends Controller
{
    /**
     * Directly update materiel.etat in database.
     * Returns old etat before update, or null if material not found / is hors_service.
     */
    private static function setMaterielEtat(int $materielId, string $newEtat): ?string
    {
        $current = DB::table('materiels')->where('id', $materielId)->value('etat');

        if ($current === null) {
            \Log::warning("[MATERIEL SYNC] Material #{$materielId} not found in DB.");
            return null;
        }

        if ($current === 'hors_service') {
            \Log::info("[MATERIEL SYNC] Material #{$materielId} is hors_service — skipped.");
            return $current;
        }

        $rows = DB::table('materiels')
            ->where('id', $materielId)
            ->where('etat', '!=', 'hors_service')
            ->update(['etat' => $newEtat, 'updated_at' => now()]);

        if ($rows > 0) {
            \Log::info("[MATERIEL SYNC] Material #{$materielId}: '{$current}' -> '{$newEtat}' (1 row updated)");
        } else {
            \Log::warning("[MATERIEL SYNC] Material #{$materielId}: update() returned 0 rows (etat was already '{$current}').");
        }

        return $current;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Demande::with([
            'personnel.departement',
            'categorie',
            'materiel',
            'helpdesk',
            'interventions.technicien',
            'reclamations',
        ]);

        if ($user->role === 'personnel') {
            $query->where('personnel_id', $user->id);
        } elseif ($user->role === 'technicien') {
            $query->whereHas('interventions', fn($q) => $q->where('technicien_id', $user->id));
        }

        $statut   = $request->query('statut');
        if ($statut)   $query->where('statut', $statut);

        $priorite = $request->query('priorite');
        if ($priorite) $query->where('priorite', $priorite);

        return response()->json(
            $query->orderBy('created_at', 'desc')->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'description'  => 'required|string|min:10',
            'priorite'     => 'nullable|in:basse,normale,haute,urgente',
            'categorie_id' => 'nullable|exists:categories_pannes,id',
            'materiel_id'  => 'nullable|exists:materiels,id',
        ]);

        $validated['personnel_id'] = $request->user()->id;
        $validated['statut']       = 'nouvelle';
        $validated['priorite']     = $validated['priorite'] ?? 'normale';

        $demande = Demande::create($validated);

        // Handle file attachments safely
        if ($request->hasFile('pieces_jointes')) {
            foreach ($request->file('pieces_jointes') as $file) {
                try {
                    $path = $file->store('pieces_jointes', 'public');
                    $demande->piecesJointes()->create([
                        'nom_fichier'    => $file->getClientOriginalName(),
                        'type_fichier'   => $file->getMimeType(),
                        'chemin_fichier' => $path,
                    ]);
                } catch (\Throwable $e) {
                    \Log::warning('Pièce jointe non sauvegardée: ' . $e->getMessage());
                }
            }
        }

        try {
            AuditLog::create([
                'action'      => 'create_demande',
                'user_id'     => $request->user()->id,
                'entity_type' => 'Demande',
                'entity_id'   => $demande->id,
                'new_values'  => $validated,
                'ip_address'  => $request->ip(),
            ]);
        } catch (\Throwable $e) {}

        // ── Direct material state update: nouvelle demande → en_panne ──────────────────
        if (!empty($validated['materiel_id'])) {
            \Log::info("[MATERIEL SYNC] store() — Demande #{$demande->id} linked to materiel_id={$validated['materiel_id']}. Setting en_panne.");
            self::setMaterielEtat((int) $validated['materiel_id'], 'en_panne');
        } else {
            \Log::info("[MATERIEL SYNC] store() — Demande #{$demande->id} has no materiel_id, skipping sync.");
        }

        return response()->json($demande->load(['categorie', 'materiel', 'piecesJointes']), 201);
    }

    public function update(Request $request, int $id)
    {
        $demande = Demande::findOrFail($id);

        // Only the owner can edit
        if ($demande->personnel_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        // Only editable while still 'nouvelle' (before HelpDesk touches it)
        if ($demande->statut !== 'nouvelle') {
            return response()->json([
                'message' => 'Cette demande ne peut plus être modifiée (déjà prise en charge).',
            ], 422);
        }

        $validated = $request->validate([
            'description'  => 'sometimes|required|string|min:10',
            'priorite'     => 'sometimes|required|in:basse,normale,haute,urgente',
            'categorie_id' => 'sometimes|nullable|exists:categories_pannes,id',
            'materiel_id'  => 'sometimes|nullable|exists:materiels,id',
        ]);

        $demande->update($validated);

        return response()->json($demande->load(['categorie', 'materiel']));
    }

    public function show(Request $request, int $id)
    {
        try {
            $demande = Demande::with([
                'personnel.departement',
                'categorie', 'materiel', 'helpdesk',
                'interventions.technicien',
                'interventions.rapport',
                'piecesJointes',
                'reclamations',
            ])->findOrFail($id);

            return response()->json($demande);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Demande introuvable.'], 404);
        }
    }

    public function affecter(Request $request, int $id)
    {
        $validated = $request->validate([
            'technicien_id' => 'required|exists:users,id',
        ]);

        // Verify technician is available
        $tech = Technicien::where('user_id', $validated['technicien_id'])->first();
        if ($tech && $tech->disponibilite !== 'disponible') {
            return response()->json([
                'message' => 'Ce technicien n\'est pas disponible.',
            ], 422);
        }

        $demande = Demande::findOrFail($id);
        $demande->update([
            'statut'     => 'affectee',
            'helpdesk_id'=> $request->user()->id,
        ]);

        Intervention::create([
            'demande_id'    => $demande->id,
            'technicien_id' => $validated['technicien_id'],
            'statut'        => 'en_attente',
        ]);

        try {
            AuditLog::create([
                'action'      => 'affecter_demande',
                'user_id'     => $request->user()->id,
                'entity_type' => 'Demande',
                'entity_id'   => $demande->id,
                'new_values'  => $validated,
                'ip_address'  => $request->ip(),
            ]);
        } catch (\Throwable $e) {}

        return response()->json($demande->load('interventions.technicien'));
    }

    public function updateStatut(Request $request, int $id)
    {
        $validated = $request->validate([
            'statut' => 'required|in:en_attente,affectee,en_cours,resolue,cloturee,rejetee',
        ]);

        $demande = Demande::findOrFail($id);
        $old     = $demande->statut;
        $demande->update($validated);

        try {
            AuditLog::create([
                'action'      => 'update_statut_demande',
                'user_id'     => $request->user()->id,
                'entity_type' => 'Demande',
                'entity_id'   => $demande->id,
                'old_values'  => ['statut' => $old],
                'new_values'  => $validated,
                'ip_address'  => $request->ip(),
            ]);
        } catch (\Throwable $e) {}

        // ── Direct material state update ────────────────────────────────────────
        if ($demande->materiel_id) {
            $newEtat = match($validated['statut']) {
                'en_cours'            => 'en_reparation',
                'resolue', 'cloturee' => 'fonctionnel',
                default               => 'en_panne',
            };
            \Log::info("[MATERIEL SYNC] updateStatut() — Demande #{$demande->id} statut='{$validated['statut']}' → setting materiel #{$demande->materiel_id} to '{$newEtat}'.");
            self::setMaterielEtat((int) $demande->materiel_id, $newEtat);
        } else {
            \Log::info("[MATERIEL SYNC] updateStatut() — Demande #{$demande->id} has no materiel_id, skipping sync.");
        }

        return response()->json($demande);
    }
}
