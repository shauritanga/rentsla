<?php

namespace Database\Seeders;

use App\Models\Account;
use Illuminate\Database\Seeder;

class AccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Basic chart of accounts
        $assets = Account::create(['code' => '1000', 'name' => 'Assets', 'type' => 'asset']);
        Account::create(['code' => '1010', 'name' => 'Cash', 'type' => 'asset', 'parent_id' => $assets->id]);
        Account::create(['code' => '1020', 'name' => 'Accounts Receivable', 'type' => 'asset', 'parent_id' => $assets->id]);

        $liabilities = Account::create(['code' => '2000', 'name' => 'Liabilities', 'type' => 'liability']);
        Account::create(['code' => '2010', 'name' => 'Accounts Payable', 'type' => 'liability', 'parent_id' => $liabilities->id]);
        Account::create(['code' => '2020', 'name' => 'Deposits Liability', 'type' => 'liability', 'parent_id' => $liabilities->id]);

        $equity = Account::create(['code' => '3000', 'name' => 'Equity', 'type' => 'equity']);

        $revenue = Account::create(['code' => '4000', 'name' => 'Revenue', 'type' => 'revenue']);
        Account::create(['code' => '4010', 'name' => 'Rental Income', 'type' => 'revenue', 'parent_id' => $revenue->id]);
        Account::create(['code' => '4030', 'name' => 'Penalty Income', 'type' => 'revenue', 'parent_id' => $revenue->id]);

        $expenses = Account::create(['code' => '5000', 'name' => 'Expenses', 'type' => 'expense']);
        Account::create(['code' => '5010', 'name' => 'Service Charges Expense', 'type' => 'expense', 'parent_id' => $expenses->id]);
    }
}
