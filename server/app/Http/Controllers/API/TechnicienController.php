<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Technicien;
use Illuminate\Http\Request;

class TechnicienController extends Controller
{
    public function index()
    {
        try {
            $techniciens = User::where('role', 'technicien')
                ->with(['technicien', 'departement'])
                ->get()
                ->map(function ($user) {
                    $count = 0;
                    try {
                        $count = $user->interventions()->where('statut', 'en_cours')->count();
                    } catch (\Throwable $e) {}

                    return array_merge($user->toArray(), [
                        'disponibilite'      => $user->technicien?->disponibilite ?? 'disponible',
                        'specialite'         => $user->technicien?->specialite    ?? 'Autre',
                        'interventions_count'=> $count,
                    ]);
                });

            return response()->json($techniciens);
        } catch (\Throwable $e) {
            \Log::error('TechnicienController@index: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    public function toggleDisponibilite(Request $request, int $id)
    {
        $user = User::where('role', 'technicien')->findOrFail($id);
        $tech = $user->technicien;

        if (!$tech) {
            // Auto-create technicien record if missing
            $tech = Technicien::create([
                'user_id'      => $user->id,
                'specialite'   => 'Autre',
                'disponibilite'=> 'disponible',
            ]);
        }

        $newStatus = ($tech->disponibilite === 'disponible') ? 'indisponible' : 'disponible';
        $tech->update(['disponibilite' => $newStatus]);

        return response()->json(['disponibilite' => $newStatus]);
    }
}
