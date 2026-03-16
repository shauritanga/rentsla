<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function profile(): Response
    {
        return Inertia::render('Manager/Profile', $this->sharedPageProps());
    }

    public function settings(): Response
    {
        $this->ensureBuildingManager();

        return Inertia::render('Manager/Settings', $this->sharedPageProps());
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $user = $this->getUser();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
        ]);

        $user->update($validated);

        return redirect()->route('manager.profile')
            ->with('success', 'Profile updated successfully.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $this->ensureBuildingManager();

        $user = $this->getUser();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return back()->withErrors([
                'current_password' => 'The current password is incorrect.',
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->route('manager.settings.index')
            ->with('success', 'Password changed successfully.');
    }

    private function sharedPageProps(): array
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at->format('M d, Y'),
                'role' => $user->getRoleLabelForBuilding($building->id),
            ],
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'address' => $building->address,
            ],
            'app' => [
                'name' => config('app.name'),
                'timezone' => config('app.timezone'),
            ],
        ];
    }

    private function ensureBuildingManager(): void
    {
        $user = $this->getUser();
        $building = $this->getBuilding();

        if (!($user->managedBuilding && $user->managedBuilding->id === $building->id)) {
            abort(403, 'Only the building manager can access settings.');
        }
    }
}
