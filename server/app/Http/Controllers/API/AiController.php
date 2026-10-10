<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CategoriePanne;
use Illuminate\Http\Request;

class AiController extends Controller
{
    /**
     * Auto-categorize a demande description using keyword matching.
     * A real AI could be plugged in here (OpenAI, etc.)
     */
    public function categorize(Request $request)
    {
        $request->validate(['description' => 'required|string']);

        $description = strtolower($request->description);
        $categories  = CategoriePanne::all();

        $keywords = [
            'matériel'   => ['panne', 'clavier', 'souris', 'écran', 'ordinateur', 'hardware', 'disque', 'mémoire'],
            'logiciel'   => ['application', 'logiciel', 'windows', 'installer', 'licence', 'bug', 'crash', 'software'],
            'réseau'     => ['réseau', 'internet', 'wifi', 'connexion', 'câble', 'switch', 'vpn', 'ip'],
            'imprimante' => ['imprimante', 'imprimer', 'scanner', 'copier', 'toner', 'papier', 'bac'],
            'accès / droits' => ['accès', 'mot de passe', 'permission', 'droits', 'compte', 'login', 'session'],
        ];

        $bestMatch = null;
        $bestScore = 0;

        foreach ($keywords as $catName => $words) {
            $score = 0;
            foreach ($words as $word) {
                if (str_contains($description, $word)) $score++;
            }
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestMatch = $catName;
            }
        }

        $categorie = $bestMatch
            ? $categories->firstWhere('libelle', ucwords($bestMatch))
            : null;

        return response()->json([
            'categorie_suggeree' => $categorie,
            'score'              => $bestScore,
        ]);
    }
}
