<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Technicien;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UtilisateurController extends Controller
{
    public function index()
    {
        return response()->json(
            User::with(['departement', 'technicien'])->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'            => 'required|string',
            'prenom'         => 'required|string',
            'email'          => 'required|email|unique:users',
            'mot_de_passe'   => 'required|string|min:8',
            'telephone'      => 'nullable|string',
            'role'           => 'required|in:personnel,technicien,helpdesk,admin',
            'departement_id' => 'nullable|exists:departements,id',
            'numero_bureau'  => 'nullable|string|max:50',
            'specialite'     => 'nullable|in:Hardware,Software,Réseau,Autre',
        ]);

        if (isset($validated['role']) && $validated['role'] !== 'personnel') {
            $validated['numero_bureau'] = null;
        }

        $validated['mot_de_passe'] = Hash::make($validated['mot_de_passe']);
        $user = User::create($validated);

        if ($user->role === 'technicien') {
            Technicien::create([
                'user_id'    => $user->id,
                'specialite' => $validated['specialite'] ?? 'Autre',
            ]);
        }

        AuditLog::create([
            'action' => 'create_user',
            'user_id' => $request->user()->id,
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($user->load(['departement', 'technicien']), 201);
    }

    public function show(int $id)
    {
        return response()->json(User::with(['departement', 'technicien'])->findOrFail($id));
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nom'            => 'sometimes|string',
            'prenom'         => 'sometimes|string',
            'email'          => "sometimes|email|unique:users,email,$id",
            'mot_de_passe'   => 'nullable|string|min:8',
            'telephone'      => 'nullable|string',
            'role'           => 'sometimes|in:personnel,technicien,helpdesk,admin',
            'departement_id' => 'nullable|exists:departements,id',
            'numero_bureau'  => 'nullable|string|max:50',
        ]);

        if (isset($validated['role']) && $validated['role'] !== 'personnel') {
            $validated['numero_bureau'] = null;
        } elseif (!isset($validated['role']) && $user->role !== 'personnel') {
            $validated['numero_bureau'] = null;
        }

        if (isset($validated['mot_de_passe'])) {
            $validated['mot_de_passe'] = Hash::make($validated['mot_de_passe']);
        } else {
            unset($validated['mot_de_passe']);
        }

        $user->update($validated);

        return response()->json($user->fresh(['departement', 'technicien']));
    }

    public function destroy(Request $request, int $id)
    {
        $user = User::findOrFail($id);
        AuditLog::create([
            'action' => 'delete_user',
            'user_id' => $request->user()->id,
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'old_values' => $user->toArray(),
            'ip_address' => $request->ip(),
        ]);
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé.']);
    }
}
