<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * @OA\Info(
 *   title="HelpDesk Ministère API",
 *   version="1.0.0",
 *   description="API de gestion des interventions techniques"
 * )
 * @OA\SecurityScheme(
 *   securityScheme="sanctum",
 *   type="http",
 *   scheme="bearer"
 * )
 */
class AuthController extends Controller
{
    /**
     * @OA\Post(
     *   path="/api/auth/login",
     *   summary="Connexion utilisateur",
     *   tags={"Auth"},
     *   @OA\RequestBody(
     *     required=true,
     *     @OA\JsonContent(
     *       required={"email","mot_de_passe"},
     *       @OA\Property(property="email", type="string", example="admin@ministere.ma"),
     *       @OA\Property(property="mot_de_passe", type="string", example="Admin123!")
     *     )
     *   ),
     *   @OA\Response(response=200, description="Connexion réussie"),
     *   @OA\Response(response=422, description="Identifiants invalides")
     * )
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'mot_de_passe' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->mot_de_passe, $user->mot_de_passe)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        // Revoke old tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth-token', ['*'], now()->addHours(8))->plainTextToken;

        // Audit log
        AuditLog::create([
            'action' => 'login',
            'user_id' => $user->id,
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'role' => $user->role,
                'departement_id' => $user->departement_id,
            ],
        ]);
    }

    /**
     * @OA\Post(
     *   path="/api/auth/logout",
     *   summary="Déconnexion",
     *   tags={"Auth"},
     *   security={{"sanctum":{}}},
     *   @OA\Response(response=200, description="Déconnecté")
     * )
     */
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    /**
     * @OA\Get(
     *   path="/api/auth/me",
     *   summary="Profil utilisateur connecté",
     *   tags={"Auth"},
     *   security={{"sanctum":{}}},
     *   @OA\Response(response=200, description="Profil retourné")
     * )
     */
    public function me(Request $request)
    {
        $user = $request->user()->load('departement', 'technicien');
        return response()->json($user);
    }
}
