<?php

namespace App\Console\Commands;

use App\Models\DemandeIndisponibilite;
use App\Models\Technicien;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ProcessExpiredLeaves extends Command
{
    protected $signature   = 'leaves:process-expired';
    protected $description = 'Restore technician availability when their approved leave period has ended';

    public function handle(): void
    {
        $expired = DemandeIndisponibilite::query()
            ->where('statut', 'approuve')
            ->where('is_processed', false)
            ->where('date_fin', '<=', Carbon::now())
            ->get();

        $count = 0;
        foreach ($expired as $leave) {
            // Restore the technician to Disponible
            Technicien::where('user_id', $leave->technicien_id)
                ->update(['disponibilite' => 'disponible']);

            // Mark as processed so we don't run it again
            DemandeIndisponibilite::where('id', $leave->id)->update(['is_processed' => true]);
            $count++;
        }

        $this->info("Processed {$count} expired leave request(s).");
    }
}
