<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            AuditLog::with('user')
                ->orderBy('created_at', 'desc')
                ->paginate(50)
        );
    }
}
