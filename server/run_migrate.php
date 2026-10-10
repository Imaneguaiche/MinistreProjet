<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    \Artisan::call('migrate');
    file_put_contents('err.json', json_encode(['status'=>'success']));
} catch (\Exception $e) {
    file_put_contents('err.json', json_encode([
        'error' => $e->getMessage(), 
        'file' => $e->getFile(), 
        'line' => $e->getLine()
    ]));
}
