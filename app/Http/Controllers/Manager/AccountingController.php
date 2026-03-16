<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountingController extends Controller
{
    public function accounts(Request $request)
    {
        $user = $request->user();
        $building = $this->getBuilding();
        return Inertia::render('Manager/Accounts', [
            'title' => 'Chart of Accounts',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleLabelForBuilding($building->id),
            ],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
        ]);
    }

    public function ledger(Request $request)
    {
        $user = $request->user();
        $building = $this->getBuilding();
        return Inertia::render('Manager/Ledger', [
            'title' => 'General Ledger',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleLabelForBuilding($building->id),
            ],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
        ]);
    }

    public function reports(Request $request)
    {
        $user = $request->user();
        $building = $this->getBuilding();
        return Inertia::render('Manager/Reports', [
            'title' => 'Accounting Reports',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleLabelForBuilding($building->id),
            ],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
        ]);
    }

    public function comingSoon(Request $request)
    {
        $user = $request->user();
        $building = $this->getBuilding();
        return Inertia::render('Manager/ComingSoon', [
            'title' => 'Coming Soon',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleLabelForBuilding($building->id),
            ],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
        ]);
    }

    public function permissions(Request $request)
    {
        $user = $request->user();
        $building = $this->getBuilding();
        return Inertia::render('Manager/Permissions', [
            'title' => 'Permissions',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleLabelForBuilding($building->id),
            ],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
        ]);
    }

    public function integration(Request $request)
    {
        $user = $request->user();
        $building = $this->getBuilding();
        return Inertia::render('Manager/Integration', [
            'title' => 'Integration',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleLabelForBuilding($building->id),
            ],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
        ]);
    }

    public function auditTrail(Request $request)
    {
        $user = $request->user();
        $building = $this->getBuilding();
        return Inertia::render('Manager/AuditTrail', [
            'title' => 'Audit Trail',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleLabelForBuilding($building->id),
            ],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
        ]);
    }
}
