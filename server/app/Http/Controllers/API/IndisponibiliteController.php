<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DemandeIndisponibilite;
use App\Models\Technicien;
use Illuminate\Http\Request;

class IndisponibiliteController extends Controller
{
    // List all requests (for both Admin and the Technician who submitted them)
    public function index(Request $request)
    {
        $query = DemandeIndisponibilite::with('technicien');
        if ($request->user()->role === 'technicien') {
            $query->where('technicien_id', $request->user()->id);
        }
        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    // Submit a request (for Technicians)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'        => 'required|in:maladie,conge',
            'date_debut'  => 'required|date',
            'date_fin'    => 'required|date|after_or_equal:date_debut',
            'commentaire' => 'nullable|string',
        ]);

        $validated['technicien_id'] = $request->user()->id;
        $validated['statut'] = 'en_attente';

        $demande = DemandeIndisponibilite::create($validated);
        
        return response()->json($demande->load('technicien'), 201);
    }

    // Approve or Reject (for Admins)
    public function updateStatut(Request $request, int $id)
    {
        $validated = $request->validate([
            'statut' => 'required|in:approuve,refuse',
        ]);

        $demande = DemandeIndisponibilite::findOrFail($id);
        $demande->update(['statut' => $validated['statut']]);

        // If approved, strictly update the technician's actual availability
        if ($validated['statut'] === 'approuve') {
            Technicien::where('user_id', $demande->technicien_id)->update(['disponibilite' => 'indisponible']);
        }
        // If refused, we leave them as is (disponible or otherwise engaged)

        return response()->json($demande->load('technicien'));
    }

    // Admin manually reactivates a technician (overrides approved leave)
    public function reactivate(int $id)
    {
        $demande = DemandeIndisponibilite::findOrFail($id);
        Technicien::where('user_id', $demande->technicien_id)->update(['disponibilite' => 'disponible']);
        DemandeIndisponibilite::where('id', $id)->update(['is_processed' => true]);
        return response()->json(['message' => 'Technicien réactivé avec succès.']);
    }
}
