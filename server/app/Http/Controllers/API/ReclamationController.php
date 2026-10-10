<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ReclamationRetard;
use App\Models\Demande;
use Illuminate\Http\Request;

class ReclamationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'demande_id' => 'required|exists:demandes,id',
            'motif'      => 'nullable|string|max:1000',
        ]);

        // Default motif if not provided (instant complaint, no form)
        $validated['motif'] = $validated['motif'] ?? 'Réclamation de retard signalée par le personnel.';

        $demande = Demande::findOrFail($validated['demande_id']);

        // Check if the demande belongs to the authenticated personnel
        if ($demande->personnel_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        // Check if the demande is already closed
        if (in_array($demande->statut, ['resolue', 'cloturee', 'rejetee'])) {
            return response()->json(['message' => 'La demande est déjà traitée.'], 400);
        }

        // Check if a reclamation already exists for this demande to avoid spam (optional, but good practice)
        $existing = ReclamationRetard::where('demande_id', $demande->id)->first();
        if ($existing) {
            return response()->json(['message' => 'Une réclamation a déjà été envoyée pour cette demande.'], 400);
        }

        $reclamation = ReclamationRetard::create([
            'demande_id'   => $demande->id,
            'personnel_id' => $request->user()->id,
            'motif'        => $validated['motif'],
        ]);

        return response()->json($reclamation, 201);
    }
}
