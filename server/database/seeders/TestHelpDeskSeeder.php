<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Departement;
use App\Models\Materiel;
use App\Models\Technicien;
use App\Models\CategoriePanne;
use App\Models\Demande;

class TestHelpDeskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // 1) Departments
        $deptRH = Departement::firstOrCreate(['nom_departement' => 'Ressources Humaines']);
        $deptInfo = Departement::firstOrCreate(['nom_departement' => 'Informatique']);

        // 2) Personnel Users
        $yassir = User::firstOrCreate([
            'email' => 'yassir@ministere.ma'
        ], [
            'nom' => 'El Bor',
            'prenom' => 'Yassir',
            'mot_de_passe' => Hash::make('password'),
            'telephone' => '0600000001',
            'role' => 'personnel',
            'departement_id' => $deptRH->id,
            'numero_bureau' => 'B-102',
        ]);

        $hamza = User::firstOrCreate([
            'email' => 'hamza@ministere.ma'
        ], [
            'nom' => 'El Byad',
            'prenom' => 'Hamza',
            'mot_de_passe' => Hash::make('password'),
            'telephone' => '0600000002',
            'role' => 'personnel',
            'departement_id' => $deptInfo->id,
            'numero_bureau' => 'A-205',
        ]);

        // 3) Materials for Personnel
        Materiel::firstOrCreate([
            'numero_serie' => 'DELL-OPT-1001'
        ], [
            'nom_materiel' => 'Ordinateur Dell OptiPlex',
            'type_materiel' => 'ordinateur',
            'etat' => 'fonctionnel',
            'personnel_id' => $yassir->id,
        ]);

        Materiel::firstOrCreate([
            'numero_serie' => 'HP-LJ-2001'
        ], [
            'nom_materiel' => 'Imprimante HP LaserJet',
            'type_materiel' => 'imprimante',
            'etat' => 'fonctionnel',
            'personnel_id' => $yassir->id,
        ]);

        Materiel::firstOrCreate([
            'numero_serie' => 'SAM-SCR-3001'
        ], [
            'nom_materiel' => 'Écran Samsung',
            'type_materiel' => 'ecran',
            'etat' => 'fonctionnel',
            'personnel_id' => $hamza->id,
        ]);

        Materiel::firstOrCreate([
            'numero_serie' => 'KEY-MOU-4001'
        ], [
            'nom_materiel' => 'Clavier + Souris',
            'type_materiel' => 'accessoire',
            'etat' => 'fonctionnel',
            'personnel_id' => $hamza->id,
        ]);

        // 4) Technicians
        $youssef = User::firstOrCreate([
            'email' => 'youssef.alami@ministere.ma'
        ], [
            'nom' => 'Alami',
            'prenom' => 'Youssef',
            'mot_de_passe' => Hash::make('password'),
            'telephone' => '0600000003',
            'role' => 'technicien',
            'departement_id' => $deptInfo->id,
        ]);
        Technicien::firstOrCreate([
            'user_id' => $youssef->id
        ], [
            'specialite' => 'Software',
            'disponibilite' => 'disponible',
        ]);

        $khalid = User::firstOrCreate([
            'email' => 'khalid.benali@ministere.ma'
        ], [
            'nom' => 'Benali',
            'prenom' => 'Khalid',
            'mot_de_passe' => Hash::make('password'),
            'telephone' => '0600000004',
            'role' => 'technicien',
            'departement_id' => $deptInfo->id,
        ]);
        Technicien::firstOrCreate([
            'user_id' => $khalid->id
        ], [
            'specialite' => 'Hardware',
            'disponibilite' => 'disponible',
        ]);

        $sara = User::firstOrCreate([
            'email' => 'sara.amrani@ministere.ma'
        ], [
            'nom' => 'Amrani',
            'prenom' => 'Sara',
            'mot_de_passe' => Hash::make('password'),
            'telephone' => '0600000005',
            'role' => 'technicien',
            'departement_id' => $deptInfo->id,
        ]);
        Technicien::firstOrCreate([
            'user_id' => $sara->id
        ], [
            'specialite' => 'Réseau',
            'disponibilite' => 'disponible',
        ]);

        // 5) Category Logiciel
        $catLogiciel = CategoriePanne::firstOrCreate([
            'libelle' => 'Logiciel'
        ], [
            'description' => 'Problèmes liés aux applications et systèmes d\'exploitation'
        ]);

        // 6) Create Demande and assign to Software Technician
        $demande = Demande::firstOrCreate([
            'description' => 'Problème avec Microsoft Word qui ne s’ouvre pas',
            'personnel_id' => $yassir->id,
            'categorie_id' => $catLogiciel->id,
        ], [
            'statut' => 'nouvelle',
            'priorite' => 'normale',
        ]);

        // Assign automatically (or explicitly via DB) to Youssef (Software)
        // Check if intervention already exists
        $intervention = \App\Models\Intervention::firstOrCreate([
            'demande_id' => $demande->id,
            'technicien_id' => $youssef->id,
        ], [
            'statut' => 'en_attente', // or standard initial status
        ]);

        // Usually assigning a technician updates the request status
        $demande->update(['statut' => 'affectee']);
    }
}
