<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories_pannes', function (Blueprint $table) {
            // Add unique constraint so no two categories can share the same name
            $table->unique('libelle', 'categories_pannes_libelle_unique');
        });
    }

    public function down(): void
    {
        Schema::table('categories_pannes', function (Blueprint $table) {
            $table->dropUnique('categories_pannes_libelle_unique');
        });
    }
};
