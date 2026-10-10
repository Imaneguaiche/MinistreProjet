<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Departements
        Schema::create('departements', function (Blueprint $table) {
            $table->id();
            $table->string('nom_departement');
            $table->timestamps();
        });

        // Users (base table for all roles)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->unique();
            $table->string('mot_de_passe');
            $table->string('telephone')->nullable();
            $table->enum('role', ['personnel', 'technicien', 'helpdesk', 'admin']);
            $table->foreignId('departement_id')->nullable()->constrained('departements')->nullOnDelete();
            $table->rememberToken();
            $table->timestamps();
        });

        // Techniciens (extension of users)
        Schema::create('techniciens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('disponibilite', ['disponible', 'indisponible'])->default('disponible');
            $table->enum('specialite', ['Hardware', 'Software', 'Réseau', 'Autre'])->default('Autre');
            $table->timestamps();
        });

        // Categories pannes
        Schema::create('categories_pannes', function (Blueprint $table) {
            $table->id();
            $table->string('libelle');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Materiels
        Schema::create('materiels', function (Blueprint $table) {
            $table->id();
            $table->string('nom_materiel');
            $table->string('type_materiel');
            $table->string('numero_serie')->nullable()->unique();
            $table->enum('etat', ['fonctionnel', 'en_panne', 'en_reparation', 'hors_service'])->default('fonctionnel');
            $table->foreignId('personnel_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Personal access tokens (Sanctum)
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('materiels');
        Schema::dropIfExists('categories_pannes');
        Schema::dropIfExists('techniciens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('departements');
    }
};
