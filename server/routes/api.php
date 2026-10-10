<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DemandeController;
use App\Http\Controllers\API\InterventionController;
use App\Http\Controllers\API\IndisponibiliteController;
use App\Http\Controllers\API\RapportController;
use App\Http\Controllers\API\TechnicienController;
use App\Http\Controllers\API\MaterielController;
use App\Http\Controllers\API\CategorieController;
use App\Http\Controllers\API\DepartementController;
use App\Http\Controllers\API\UtilisateurController;
use App\Http\Controllers\API\StatsController;
use App\Http\Controllers\API\AiController;
use App\Http\Controllers\API\AuditLogController;
use App\Http\Controllers\API\FeedbackController;
use App\Http\Controllers\API\ReclamationController;

// ─── Auth (public) ────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
});

// ─── Protected routes ─────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // ─── Demandes (Personnel + Helpdesk + Technicien) ─────────────────────────
    Route::get('demandes', [DemandeController::class, 'index']);
    Route::post('demandes', [DemandeController::class, 'store'])
        ->middleware('role:personnel');
    Route::patch('demandes/{id}', [DemandeController::class, 'update'])
        ->middleware('role:personnel');
    Route::get('demandes/{id}', [DemandeController::class, 'show']);
    Route::patch('demandes/{id}/affecter', [DemandeController::class, 'affecter'])
        ->middleware('role:helpdesk');
    Route::patch('demandes/{id}/statut', [DemandeController::class, 'updateStatut'])
        ->middleware('role:helpdesk,admin,technicien');

    // ─── Rapports (Technicien) ────────────────────────────────────────────────
    Route::middleware('role:technicien')->group(function () {
        Route::post('rapports', [RapportController::class, 'store']);
        Route::patch('interventions/{id}/statut', [InterventionController::class, 'updateStatut']);
    });
    Route::get('rapports', [RapportController::class, 'index']);
    Route::get('rapports/{id}', [RapportController::class, 'show']);
    // ─── Techniciens & Indisponibilités ───────────────────────────────────────
    Route::get('techniciens', [TechnicienController::class, 'index']);
    Route::patch('techniciens/{id}/disponibilite', [TechnicienController::class, 'toggleDisponibilite'])
        ->middleware('role:admin');
        
    Route::get('indisponibilites', [IndisponibiliteController::class, 'index']);
    Route::post('indisponibilites', [IndisponibiliteController::class, 'store'])
        ->middleware('role:technicien');
    Route::patch('indisponibilites/{id}/statut', [IndisponibiliteController::class, 'updateStatut'])
        ->middleware('role:admin');
    Route::post('indisponibilites/{id}/reactivate', [IndisponibiliteController::class, 'reactivate'])
        ->middleware('role:admin');

    // ─── Materiels ────────────────────────────────────────────────────────────
    Route::get('materiels', [MaterielController::class, 'index']);
    Route::post('materiels', [MaterielController::class, 'store']);
    Route::put('materiels/{id}', [MaterielController::class, 'update']);
    Route::patch('materiels/{id}/hors-service', [MaterielController::class, 'markHorsService'])
        ->middleware('role:admin,technicien');
    Route::delete('materiels/{id}', [MaterielController::class, 'destroy'])
        ->middleware('role:admin');

    // ─── Categories (public read, admin write) ────────────────────────────────
    Route::get('categories', [CategorieController::class, 'index']);
    Route::middleware('role:admin')->group(function () {
        Route::post('categories', [CategorieController::class, 'store']);
        Route::put('categories/{id}', [CategorieController::class, 'update']);
        Route::delete('categories/{id}', [CategorieController::class, 'destroy']);
    });

    // ─── Departements (public read, admin write) ──────────────────────────────
    Route::get('departements', [DepartementController::class, 'index']);
    Route::middleware('role:admin')->group(function () {
        Route::post('departements', [DepartementController::class, 'store']);
        Route::put('departements/{id}', [DepartementController::class, 'update']);
        Route::delete('departements/{id}', [DepartementController::class, 'destroy']);
    });

    // ─── Utilisateurs (Admin only) ────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::get('utilisateurs', [UtilisateurController::class, 'index']);
        Route::post('utilisateurs', [UtilisateurController::class, 'store']);
        Route::get('utilisateurs/{id}', [UtilisateurController::class, 'show']);
        Route::put('utilisateurs/{id}', [UtilisateurController::class, 'update']);
        Route::delete('utilisateurs/{id}', [UtilisateurController::class, 'destroy']);
    });

    // ─── Stats ────────────────────────────────────────────────────────────────
    Route::get('stats/helpdesk', [StatsController::class, 'helpdesk'])
        ->middleware('role:helpdesk,admin');
    Route::get('stats/admin', [StatsController::class, 'admin'])
        ->middleware('role:admin');

    // ─── AI ───────────────────────────────────────────────────────────────────
    Route::post('ai/categorize', [AiController::class, 'categorize']);

    // ─── Feedback & Reclamations (Personnel) ─────────────────────────────────
    Route::middleware('role:personnel')->group(function () {
        Route::post('feedbacks', [FeedbackController::class, 'store']);
        Route::post('reclamations', [ReclamationController::class, 'store']);
    });

    // ─── Audit Logs (Admin only) ──────────────────────────────────────────────
    Route::get('audit-logs', [AuditLogController::class, 'index'])
        ->middleware('role:admin');
});
