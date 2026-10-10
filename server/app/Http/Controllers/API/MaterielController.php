<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Materiel;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class MaterielController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Materiel::with('personnel');

        if ($user->role === 'personnel') {
            $query->where('personnel_id', $user->id);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_materiel'  => 'required|string',
            'type_materiel' => 'required|string',
            'numero_serie'  => 'nullable|string|unique:materiels',
            'etat'          => 'in:fonctionnel,en_panne,en_reparation,hors_service',
        ]);

        if ($request->user()->role === 'personnel') {
            $validated['personnel_id'] = $request->user()->id;
        }

        $materiel = Materiel::create($validated);
        return response()->json($materiel, 201);
    }

    public function update(Request $request, int $id)
    {
        $materiel = Materiel::findOrFail($id);
        $validated = $request->validate([
            'nom_materiel'  => 'sometimes|string',
            'type_materiel' => 'sometimes|string',
            'numero_serie'  => "nullable|string|unique:materiels,numero_serie,$id",
            'etat'          => 'in:fonctionnel,en_panne,en_reparation,hors_service',
            'personnel_id'  => 'nullable|exists:users,id',
        ]);
        $materiel->update($validated);
        return response()->json($materiel);
    }

    public function destroy(int $id)
    {
        Materiel::findOrFail($id)->delete();
        return response()->json(['message' => 'Matériel supprimé.']);
    }

    /**
     * Permanently mark a material as hors_service (irreparable).
     * The syncEtat() guard will prevent any automatic recovery from this state.
     */
    public function markHorsService(Request $request, int $id)
    {
        $materiel = Materiel::findOrFail($id);
        $oldEtat  = $materiel->etat;

        // Use updateQuietly to bypass Eloquent events (no syncEtat re-evaluation)
        $materiel->updateQuietly(['etat' => 'hors_service']);

        try {
            AuditLog::create([
                'action'      => 'mark_hors_service',
                'user_id'     => $request->user()->id,
                'entity_type' => 'Materiel',
                'entity_id'   => $materiel->id,
                'old_values'  => ['etat' => $oldEtat],
                'new_values'  => ['etat' => 'hors_service'],
                'ip_address'  => $request->ip(),
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => 'Matériel marqué comme hors service.',
            'materiel' => $materiel->fresh(),
        ]);
    }
}
