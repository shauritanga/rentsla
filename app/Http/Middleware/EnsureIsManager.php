<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsManager
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->hasManagerPortalAccess()) {
            abort(403, 'You are not assigned to manage any building.');
        }

        return $next($request);
    }
}
