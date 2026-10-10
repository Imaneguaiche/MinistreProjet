<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Demandes
        Schema::create('demandes', function (Blueprint $table) {
            $table->id();
            $table->timestamp('date_creation')->useCurrent();
            $table->text('description');
            $table->enum('statut', [
                'nouvelle',
                'en_attente',
                'affectee',
                'en_cours',
                'resolue',
                'cloturee',
                'rejetee'
            ])->default('nouvelle');
            $table->enum('priorite', ['basse', 'normale', 'haute', 'urgente'])->default('normale');
            $table->foreignId('personnel_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('categorie_id')->nullable()->constrained('categories_pannes')->nullOnDelete();
            $table->foreignId('materiel_id')->nullable()->constrained('materiels')->nullOnDelete();
            $table->foreignId('helpdesk_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Pieces jointes
        Schema::create('pieces_jointes', function (Blueprint $table) {
            $table->id();
            $table->string('nom_fichier');
            $table->string('type_fichier');
            $table->string('chemin_fichier');
            $table->foreignId('demande_id')->constrained('demandes')->cascadeOnDelete();
            $table->timestamps();
        });

        // Interventions
        Schema::create('interventions', function (Blueprint $table) {
            $table->id();
            $table->timestamp('date_affectation')->useCurrent();
            $table->timestamp('date_debut')->nullable();
            $table->timestamp('date_fin')->nullable();
            $table->enum('statut', ['en_attente', 'en_cours', 'terminee', 'annulee'])->default('en_attente');
            $table->foreignId('demande_id')->constrained('demandes')->cascadeOnDelete();
            $table->foreignId('technicien_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // Rapports
        Schema::create('rapports', function (Blueprint $table) {
            $table->id();
            $table->timestamp('date_rapport')->useCurrent();
            $table->integer('duree')->nullable()->comment('Durée en minutes');
            $table->text('description');
            $table->text('remarque')->nullable();
            $table->text('diagnostic')->nullable();
            $table->foreignId('intervention_id')->constrained('interventions')->cascadeOnDelete();
            $table->timestamps();
        });

        // Feedbacks
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->tinyInteger('note')->unsigned()->comment('Note entre 1 et 5');
            $table->text('commentaire')->nullable();
            $table->timestamp('date_feedback')->useCurrent();
            $table->foreignId('intervention_id')->constrained('interventions')->cascadeOnDelete();
            $table->foreignId('personnel_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // Reclamations retard
        Schema::create('reclamations_retard', function (Blueprint $table) {
            $table->id();
            $table->timestamp('date_reclamation')->useCurrent();
            $table->text('motif');
            $table->foreignId('demande_id')->constrained('demandes')->cascadeOnDelete();
            $table->foreignId('personnel_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // Audit logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('reclamations_retard');
        Schema::dropIfExists('feedbacks');
        Schema::dropIfExists('rapports');
        Schema::dropIfExists('interventions');
        Schema::dropIfExists('pieces_jointes');
        Schema::dropIfExists('demandes');
    }
};
