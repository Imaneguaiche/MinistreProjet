<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\ReclamationRetard;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'intervention_id' => 'required|exists:interventions,id',
            'note'            => 'required|integer|min:1|max:5',
            'commentaire'     => 'nullable|string',
        ]);
        $validated['personnel_id'] = $request->user()->id;

        return response()->json(Feedback::create($validated), 201);
    }
}

class ReclamationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'demande_id' => 'required|exists:demandes,id',
            'motif'      => 'required|string|min:10',
        ]);
        $validated['personnel_id'] = $request->user()->id;

        return response()->json(ReclamationRetard::create($validated), 201);
    }
}
