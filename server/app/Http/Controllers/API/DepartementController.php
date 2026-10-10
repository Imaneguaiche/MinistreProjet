<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Departement;
use Illuminate\Http\Request;

class DepartementController extends Controller
{
    public function index()
    {
        return response()->json(
            Departement::withCount('users')
                ->orderBy('nom_departement')
                ->get()
                ->unique('nom_departement')
                ->values()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_departement' => 'required|string|unique:departements',
        ]);
        return response()->json(Departement::create($validated), 201);
    }

    public function update(Request $request, int $id)
    {
        $dept = Departement::findOrFail($id);
        $validated = $request->validate([
            'nom_departement' => "required|string|unique:departements,nom_departement,$id",
        ]);
        $dept->update($validated);
        return response()->json($dept);
    }

    public function destroy(int $id)
    {
        Departement::findOrFail($id)->delete();
        return response()->json(['message' => 'Département supprimé.']);
    }
}
