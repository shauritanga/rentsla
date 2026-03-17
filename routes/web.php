<?php

use App\Http\Controllers\BuildingController;
use App\Http\Controllers\ManagerController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\Manager\DashboardController as ManagerDashboardController;
use App\Http\Controllers\Manager\FloorController;
use App\Http\Controllers\Manager\UnitController;
use App\Http\Controllers\Manager\TenantController;
use App\Http\Controllers\Manager\LeaseController;
use App\Http\Controllers\Manager\PaymentController;
use App\Http\Controllers\Manager\InvoiceController;
use App\Http\Controllers\Manager\ElectricityController;
use App\Http\Controllers\Manager\AccountingController;
use App\Http\Controllers\Manager\RoleController;
use App\Http\Controllers\Manager\StaffController;
use App\Http\Controllers\Manager\SettingsController as ManagerSettingsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
});

Route::get('/login', function () {
    return Inertia::render('Auth/Login');
})->name('login');

Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required'],
    ]);

    if (Auth::attempt($credentials, $request->boolean('remember'))) {
        $request->session()->regenerate();

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // If user has access to manager portal (manager or building staff), redirect there
        if ($user->hasManagerPortalAccess()) {
            return redirect()->route('manager.dashboard');
        }

        return redirect()->route('dashboard');
    }

    return back()->withErrors([
        'email' => 'Invalid credentials. Please try again.',
    ])->onlyInput('email');
});

Route::post('/logout', function (Request $request) {
    Auth::logout();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/login');
})->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard', [
            'user' => Auth::user(),
        ]);
    })->name('dashboard');

    // Buildings CRUD
    Route::get('/buildings', [BuildingController::class, 'index'])->name('buildings.index');
    Route::post('/buildings', [BuildingController::class, 'store'])->name('buildings.store');
    Route::put('/buildings/{building}', [BuildingController::class, 'update'])->name('buildings.update');
    Route::delete('/buildings/{building}', [BuildingController::class, 'destroy'])->name('buildings.destroy');

    // Managers CRUD
    Route::get('/managers', [ManagerController::class, 'index'])->name('managers.index');
    Route::post('/managers', [ManagerController::class, 'store'])->name('managers.store');
    Route::put('/managers/{manager}', [ManagerController::class, 'update'])->name('managers.update');
    Route::delete('/managers/{manager}', [ManagerController::class, 'destroy'])->name('managers.destroy');

    // Settings
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::put('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile');
    Route::put('/settings/password', [SettingsController::class, 'updatePassword'])->name('settings.password');
});

// ─── Manager Routes ─────────────────────────────────────────────────
Route::middleware(['auth', 'manager'])->prefix('manager')->name('manager.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [ManagerDashboardController::class, 'index'])->name('dashboard');

    // Floors
    Route::get('/floors', [FloorController::class, 'index'])->name('floors.index');
    Route::post('/floors', [FloorController::class, 'store'])->name('floors.store');
    Route::put('/floors/{floor}', [FloorController::class, 'update'])->name('floors.update');
    Route::delete('/floors/{floor}', [FloorController::class, 'destroy'])->name('floors.destroy');

    // Units
    Route::get('/units', [UnitController::class, 'index'])->name('units.index');
    Route::post('/units', [UnitController::class, 'store'])->name('units.store');
    Route::put('/units/{unit}', [UnitController::class, 'update'])->name('units.update');
    Route::delete('/units/{unit}', [UnitController::class, 'destroy'])->name('units.destroy');

    // Tenants
    Route::get('/tenants', [TenantController::class, 'index'])->name('tenants.index');
    Route::post('/tenants', [TenantController::class, 'store'])->name('tenants.store');
    Route::put('/tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');

    // Leases
    Route::get('/leases', [LeaseController::class, 'index'])->name('leases.index');
    Route::get('/leases/{lease}', [LeaseController::class, 'show'])->name('leases.show');
    Route::post('/leases', [LeaseController::class, 'store'])->name('leases.store');
    Route::put('/leases/{lease}', [LeaseController::class, 'update'])->name('leases.update');
    Route::post('/leases/{lease}/approve', [LeaseController::class, 'approve'])->name('leases.approve');
    Route::post('/leases/{lease}/reject', [LeaseController::class, 'reject'])->name('leases.reject');
    Route::get('/leases/poll/statuses', [LeaseController::class, 'statuses'])->name('leases.statuses');
    Route::post('/leases/{lease}/amendments', [LeaseController::class, 'requestAmendment'])->name('leases.amendments.store');
    Route::post('/leases/amendments/{amendment}/approve', [LeaseController::class, 'approveAmendment'])->name('leases.amendments.approve');
    Route::post('/leases/amendments/{amendment}/reject', [LeaseController::class, 'rejectAmendment'])->name('leases.amendments.reject');

    // Notifications
    Route::get('/notifications', [LeaseController::class, 'notifications'])->name('notifications.index');
    Route::post('/notifications/read-all', [LeaseController::class, 'markAllNotificationsRead'])->name('notifications.readAll');
    Route::post('/notifications/{notification}/read', [LeaseController::class, 'markNotificationRead'])->name('notifications.read');

    // Payments
    Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
    Route::post('/payments', [PaymentController::class, 'store'])->name('payments.store');

    // Invoices
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::get('/invoices/{invoice}/download', [\App\Http\Controllers\Manager\InvoicePdfController::class, 'download'])->name('invoices.download');
    // Accounting placeholders
    Route::get('/accounts', [AccountingController::class, 'accounts'])->name('accounts.index');
    Route::get('/ledger', [AccountingController::class, 'ledger'])->name('ledger.index');
    Route::get('/reports', [AccountingController::class, 'reports'])->name('reports.index');
    Route::get('/receivables', [AccountingController::class, 'comingSoon'])->name('receivables.index');
    Route::get('/reconciliation', [AccountingController::class, 'comingSoon'])->name('reconciliation.index');
    Route::get('/plreport', [AccountingController::class, 'comingSoon'])->name('plreport.index');
    Route::get('/balancesheet', [AccountingController::class, 'comingSoon'])->name('balancesheet.index');
    Route::get('/cashflow', [AccountingController::class, 'comingSoon'])->name('cashflow.index');
    Route::get('/taxwithholding', [AccountingController::class, 'comingSoon'])->name('taxwithholding.index');
    Route::get('/export', [AccountingController::class, 'comingSoon'])->name('export.index');
    Route::get('/bankcash', [AccountingController::class, 'comingSoon'])->name('bankcash.index');
    Route::get('/audittrail', [AccountingController::class, 'auditTrail'])->name('audittrail.index');
    Route::get('/integration', [AccountingController::class, 'integration'])->name('integration.index');
    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::post('/invoices/{invoice}/convert', [InvoiceController::class, 'convert'])->name('invoices.convert');
    Route::post('/invoices/{invoice}/send', [InvoiceController::class, 'send'])->name('invoices.send');
    Route::post('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel'])->name('invoices.cancel');
    Route::post('/invoices/{invoice}/payment', [InvoiceController::class, 'recordPayment'])->name('invoices.payment');

    // Electricity billing workspace
    Route::get('/electricity', [ElectricityController::class, 'index'])->name('electricity.index');
    Route::post('/electricity/batches', [ElectricityController::class, 'createBatch'])->name('electricity.batches.store');
    Route::post('/electricity/batches/{batch}/readings', [ElectricityController::class, 'saveReadings'])->name('electricity.batches.readings.store');
    Route::post('/electricity/batches/{batch}/calculate', [ElectricityController::class, 'calculate'])->name('electricity.batches.calculate');
    Route::post('/electricity/batches/{batch}/approve', [ElectricityController::class, 'approveAndPost'])->name('electricity.batches.approve');

    // Staff
    Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');
    Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
    Route::put('/staff/{staff}', [StaffController::class, 'update'])->name('staff.update');
    Route::delete('/staff/{staff}', [StaffController::class, 'destroy'])->name('staff.destroy');

    // Roles
    Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

    // Profile & Settings
    Route::get('/profile', [ManagerSettingsController::class, 'profile'])->name('profile');
    Route::get('/settings', [ManagerSettingsController::class, 'settings'])->name('settings.index');
    Route::put('/settings/profile', [ManagerSettingsController::class, 'updateProfile'])->name('settings.profile');
    Route::put('/settings/password', [ManagerSettingsController::class, 'updatePassword'])->name('settings.password');
});
