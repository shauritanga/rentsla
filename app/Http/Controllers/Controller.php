<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;

abstract class Controller
{
    protected function getUser(): User
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            throw new AuthenticationException('Unauthenticated.');
        }

        return $user;
    }

    protected function getBuilding(): Building
    {
        return $this->getUser()->getBuilding();
    }
}
