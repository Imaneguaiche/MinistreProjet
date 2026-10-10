<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Technicien;
use App\Models\Departement;
use App\Models\CategoriePanne;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed departments
        $informatique = Departement::create(['nom_departement' => 'Informatique']);
        $rh = Departement::create(['nom_departement' => 'Ressources Humaines']);
        $finance = Departement::create(['nom_departement' => 'Finance']);
        $juridique = Departement::create(['nom_departement' => 'Affaires Juridiques']);

        // Seed categories
        CategoriePanne::insert([
            ['libelle' => 'Matériel', 'description' => 'Pannes liées au matériel informatique', 'created_at' => now(), 'updated_at' => now()],
            ['libelle' => 'Logiciel', 'description' => 'Problèmes logiciels et applications', 'created_at' => now(), 'updated_at' => now()],
            ['libelle' => 'Réseau', 'description' => 'Problèmes de connectivité réseau', 'created_at' => now(), 'updated_at' => now()],
            ['libelle' => 'Imprimante', 'description' => 'Pannes imprimantes et périphériques', 'created_at' => now(), 'updated_at' => now()],
            ['libelle' => 'Accès / Droits', 'description' => 'Problèmes d\'accès et droits utilisateur', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Admin
        User::create([
            'nom' => 'Admin',
            'prenom' => 'Système',
            'email' => 'admin@ministere.ma',
            'mot_de_passe' => Hash::make('Admin123!'),
            'telephone' => '0600000001',
            'role' => 'admin',
            'departement_id' => $informatique->id,
        ]);

        // Helpdesk
        User::create([
            'nom' => 'Alami',
            'prenom' => 'Youssef',
            'email' => 'helpdesk@ministere.ma',
            'mot_de_passe' => Hash::make('Helpdesk123!'),
            'telephone' => '0600000002',
            'role' => 'helpdesk',
            'departement_id' => $informatique->id,
        ]);

        // Technicien
        $tech = User::create([
            'nom' => 'Benali',
            'prenom' => 'Khalid',
            'email' => 'technicien@ministere.ma',
            'mot_de_passe' => Hash::make('Tech123!'),
            'telephone' => '0600000003',
            'role' => 'technicien',
            'departement_id' => $informatique->id,
        ]);
        Technicien::create([
            'user_id' => $tech->id,
            'disponibilite' => 'disponible',
            'specialite' => 'Hardware',
        ]);

        // Personnel
        User::create([
            'nom' => 'Idrissi',
            'prenom' => 'Fatima',
            'email' => 'personnel@ministere.ma',
            'mot_de_passe' => Hash::make('Personnel123!'),
            'telephone' => '0600000004',
            'role' => 'personnel',
            'departement_id' => $rh->id,
        ]);
    }
}
