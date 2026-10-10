<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CategoriePanne;
use Illuminate\Http\Request;

class CategorieController extends Controller
{
    public function index()
    {
        return response()->json(
            CategoriePanne::select('id', 'libelle', 'description')
                ->orderBy('libelle')
                ->get()
                ->unique('libelle')
                ->values()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'libelle'     => 'required|string|unique:categories_pannes',
            'description' => 'nullable|string',
        ]);
        return response()->json(CategoriePanne::create($validated), 201);
    }

    public function update(Request $request, int $id)
    {
        $cat = CategoriePanne::findOrFail($id);
        $validated = $request->validate([
            'libelle'     => "sometimes|string|unique:categories_pannes,libelle,$id",
            'description' => 'nullable|string',
        ]);
        $cat->update($validated);
        return response()->json($cat);
    }

    public function destroy(int $id)
    {
        CategoriePanne::findOrFail($id)->delete();
        return response()->json(['message' => 'Catégorie supprimée.']);
    }
}
