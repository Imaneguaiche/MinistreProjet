<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Rapport;
use App\Models\Intervention;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class RapportController extends Controller
{
    public function index()
    {
        try {
            return response()->json(
                Rapport::with([
                    'intervention.demande.personnel.departement',
                    'intervention.demande.materiel',
                    'intervention.demande.categorie',
                    'intervention.demande.reclamations',
                    'intervention.technicien'
                ])
                    ->orderBy('created_at', 'desc')
                    ->get()
            );
        } catch (\Throwable $e) {
            \Log::error('RapportController@index: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'intervention_id' => 'required|exists:interventions,id',
            'remarque'        => 'required|string',
            'date_debut'      => 'required|date',
            'date_fin'        => 'required|date|after_or_equal:date_debut',
        ]);

        $intervention = Intervention::with('demande')->findOrFail($validated['intervention_id']);

        // Prevent duplicate reports
        if (Rapport::where('intervention_id', $intervention->id)->exists()) {
            return response()->json(['message' => 'Un rapport existe déjà pour cette intervention.'], 422);
        }

        // Calculate duration in minutes
        $duration = (strtotime($validated['date_fin']) - strtotime($validated['date_debut'])) / 60;
        if ($duration < 0) $duration = 0;

        // Mark intervention and demande as resolved
        $intervention->update([
            'statut'     => 'terminee',
            'date_debut' => $validated['date_debut'],
            'date_fin'   => $validated['date_fin'],
        ]);

        if ($intervention->demande) {
            $intervention->demande->update(['statut' => 'resolue']);
        }

        $rapport = Rapport::create([
            'intervention_id' => $intervention->id,
            'description'     => 'Rapport technique',
            'remarque'        => $validated['remarque'],
            'duree'           => $duration,
        ]);

        // Restore technician availability
        \App\Models\Technicien::where('user_id', $intervention->technicien_id)
            ->update(['disponibilite' => 'disponible']);

        try {
            AuditLog::create([
                'action'      => 'create_rapport',
                'user_id'     => $request->user()->id,
                'entity_type' => 'Rapport',
                'entity_id'   => $rapport->id,
                'ip_address'  => $request->ip(),
            ]);
        } catch (\Throwable $e) {}

        return response()->json($rapport->load('intervention.demande'), 201);
    }

    public function show(int $id)
    {
        try {
            return response()->json(
                Rapport::with(['intervention.demande', 'intervention.technicien'])->findOrFail($id)
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Rapport introuvable.'], 404);
        }
    }
}
