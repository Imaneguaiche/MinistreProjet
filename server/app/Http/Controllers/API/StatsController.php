<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Demande;
use App\Models\Intervention;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function helpdesk()
    {
        try {
            // par_statut — key/value map
            $parStatut = Demande::select('statut', DB::raw('count(*) as total'))
                ->groupBy('statut')->pluck('total', 'statut');

            // par_priorite
            $parPriorite = Demande::select('priorite', DB::raw('count(*) as total'))
                ->groupBy('priorite')->pluck('total', 'priorite');

            // par_categorie — only demandes that have a category
            $parCategorie = Demande::join('categories_pannes', 'demandes.categorie_id', '=', 'categories_pannes.id')
                ->select('categories_pannes.libelle', DB::raw('count(*) as total'))
                ->groupBy('categories_pannes.libelle')
                ->pluck('total', 'libelle');

            // par_mois — format as "YYYY-MM" string keys
            $parMois = Demande::select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as mois"),
                DB::raw('count(*) as total')
            )->groupBy('mois')->orderBy('mois')->pluck('total', 'mois');

            // par_tache_statut
            $parTacheStatut = Intervention::select('statut', DB::raw('count(*) as total'))
                ->groupBy('statut')->get();

            // materiels en panne — count demandes per linked material (incident frequency)
            $materiels = DB::table('demandes')
                ->join('materiels', 'demandes.materiel_id', '=', 'materiels.id')
                ->whereNotNull('demandes.materiel_id')
                ->whereNotIn('demandes.statut', ['resolue', 'cloturee', 'rejetee'])
                ->select('materiels.nom_materiel as nom', DB::raw('count(demandes.id) as total'))
                ->groupBy('materiels.id', 'materiels.nom_materiel')
                ->orderBy('total', 'desc')
                ->take(8)
                ->get();


            // par_departement — via personnel_id → users → departements
            $parDepartement = DB::table('demandes')
                ->join('users', 'demandes.personnel_id', '=', 'users.id')
                ->join('departements', 'users.departement_id', '=', 'departements.id')
                ->select('departements.nom_departement as nom', DB::raw('count(demandes.id) as total'))
                ->groupBy('departements.nom_departement')
                ->orderBy('total', 'desc')
                ->get();

            $avgHeures = 0;
            try {
                $avg = Intervention::where('statut', 'terminee')
                    ->whereNotNull('date_fin')
                    ->whereNotNull('date_debut')
                    ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, date_debut, date_fin)) / 60 as avg_heures')
                    ->value('avg_heures');
                $avgHeures = $avg !== null ? (float) $avg : 0;
            } catch (\Throwable $e) { \Log::error('Stats helpdesk avg: ' . $e->getMessage()); }

            // reclamations retard — safe count
            $reclamations = 0;
            try {
                $reclamations = \App\Models\ReclamationRetard::count();
            } catch (\Throwable $e) {}

            return response()->json([
                'par_statut'                => $parStatut,
                'par_priorite'              => $parPriorite,
                'par_categorie'             => $parCategorie,
                'par_mois'                  => $parMois,
                'par_tache_statut'          => $parTacheStatut,
                'materiels_panne'           => $materiels,
                'par_departement'           => $parDepartement,
                'total'                     => Demande::count(),
                'en_attente'                => Demande::whereIn('statut', ['nouvelle', 'en_attente'])->count(),
                'resolues'                  => Demande::whereIn('statut', ['resolue', 'cloturee'])->count(),
                'techniciens_disponibles'   => \App\Models\Technicien::where('disponibilite', 'disponible')->count(),
                'demandes_nouvelles'        => Demande::where('statut', 'nouvelle')->count(),
                'demandes_aujourdhui'       => Demande::whereDate('created_at', today())->count(),
                'duree_moyenne'             => $avgHeures,
                'reclamations_retard'       => $reclamations,
            ]);
        } catch (\Throwable $e) {
            \Log::error('StatsController@helpdesk: ' . $e->getMessage());
            return response()->json([
                'par_statut' => [], 'par_priorite' => [], 'par_categorie' => [],
                'par_mois' => [], 'par_tache_statut' => [], 'materiels_panne' => [],
                'par_departement' => [], 'total' => 0, 'en_attente' => 0,
                'resolues' => 0, 'techniciens_disponibles' => 0,
                'demandes_nouvelles' => 0, 'demandes_aujourdhui' => 0,
                'duree_moyenne' => 0, 'reclamations_retard' => 0,
                '_error' => 'stats_unavailable',
            ]);
        }
    }

    public function admin()
    {
        try {
            $avgHeures = 0;
            try {
                $avg = Intervention::where('statut', 'terminee')
                    ->whereNotNull('date_fin')
                    ->whereNotNull('date_debut')
                    ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, date_debut, date_fin)) / 60 as avg_heures')
                    ->value('avg_heures');
                $avgHeures = $avg !== null ? (float) $avg : 0;
            } catch (\Throwable $e) { \Log::error('Stats admin avg: ' . $e->getMessage()); }

            // par_departement — fix: use personnel_id not demandeur_id
            $parDepartement = DB::table('demandes')
                ->join('users', 'demandes.personnel_id', '=', 'users.id')
                ->join('departements', 'users.departement_id', '=', 'departements.id')
                ->select('departements.nom_departement as nom', DB::raw('count(demandes.id) as total'))
                ->groupBy('departements.nom_departement')
                ->orderBy('total', 'desc')
                ->get();

            $total = Demande::count();
            $resolues = Demande::whereIn('statut', ['resolue', 'cloturee'])->count();

            return response()->json([
                'total_utilisateurs'        => User::count(),
                'par_role'                  => User::select('role', DB::raw('count(*) as total'))->groupBy('role')->get(),
                'total_interventions'       => Intervention::count(),
                'taux_resolution'           => $total > 0 ? round($resolues / $total * 100, 1) : 0,
                'duree_moyenne'             => $avgHeures,
                'par_materiel'              => \App\Models\Materiel::select('etat', DB::raw('count(*) as total'))->groupBy('etat')->get(),
                'par_departement'           => $parDepartement,
                'par_tache_statut'          => Intervention::select('statut', DB::raw('count(*) as total'))->groupBy('statut')->get(),
            ]);
        } catch (\Throwable $e) {
            \Log::error('StatsController@admin: ' . $e->getMessage());
            return response()->json([
                'total_utilisateurs' => 0, 'par_role' => [], 'total_interventions' => 0,
                'taux_resolution' => 0, 'duree_moyenne' => 0,
                'par_materiel' => [], 'par_departement' => [], 'par_tache_statut' => [],
                '_error' => 'admin_stats_unavailable',
            ]);
        }
    }
}
