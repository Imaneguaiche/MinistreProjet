<?php
use Illuminate\Support\Facades\DB;

// 1) Show current state
$all = DB::table('departements')->orderBy('nom_departement')->orderBy('id')->get(['id','nom_departement']);
echo "=== Current departements ===\n";
foreach ($all as $r) echo "  [{$r->id}] {$r->nom_departement}\n";

// 2) Build map: nom -> keepId (lowest id wins)
$keepMap = [];   // nom_departement => id to keep
$toDelete = [];
foreach ($all as $r) {
    if (!isset($keepMap[$r->nom_departement])) {
        $keepMap[$r->nom_departement] = $r->id;
    } else {
        $toDelete[] = $r->id;
    }
}

if (count($toDelete) === 0) {
    echo "\n=== No duplicates found ===\n";
} else {
    // Re-point users that reference a duplicate dept → kept dept id
    foreach ($toDelete as $dupId) {
        $dupRow = $all->firstWhere('id', $dupId);
        if (!$dupRow) continue;
        $keepId = $keepMap[$dupRow->nom_departement];
        DB::table('users')->where('departement_id', $dupId)->update(['departement_id' => $keepId]);
    }
    DB::table('departements')->whereIn('id', $toDelete)->delete();
    echo "\n=== Deleted duplicate IDs: " . implode(', ', $toDelete) . " ===\n";
}

// 3) Final state
$clean = DB::table('departements')->orderBy('nom_departement')->get(['id','nom_departement']);
echo "\n=== Clean departements ===\n";
foreach ($clean as $r) echo "  [{$r->id}] {$r->nom_departement}\n";
echo "\nDone.\n";
