<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // CORS: allow frontend origin
        $middleware->api(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Role-based access control
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Force JSON for unauthenticated API requests instead of redirecting to a missing 'login' route
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Non authentifié.', 'status' => 401], 401);
            }
        });

        // Always return JSON for API routes — never HTML error pages
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = 500;
                $message = 'Erreur interne du serveur.';

                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    $status  = 404;
                    $message = 'Ressource introuvable.';
                } elseif ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json([
                        'message' => 'Données invalides.',
                        'errors'  => $e->errors(),
                    ], 422);
                } elseif ($e instanceof \Symfony\Component\Routing\Exception\RouteNotFoundException) {
                    $status  = 401; // Usually triggered by missing login route on auth middleware
                    $message = 'Non authentifié.';
                } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    $status  = $e->getStatusCode();
                    $message = $e->getMessage() ?: 'Erreur HTTP ' . $status;
                }

                // Log unexpected 500s
                if ($status === 500) {
                    \Illuminate\Support\Facades\Log::error(
                        'API 500: ' . $e->getMessage(),
                        ['file' => $e->getFile(), 'line' => $e->getLine()]
                    );
                }

                return response()->json([
                    'message' => $message,
                    'status'  => $status,
                ], $status);
            }
        });
    })->create();
