<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::get('income', [App\Http\Controllers\IncomeController::class, 'index'])->name('income');
    Route::post('income', [App\Http\Controllers\IncomeController::class, 'store'])->name('income.store');
    Route::put('income/{income}', [App\Http\Controllers\IncomeController::class, 'update'])->name('income.update');
    Route::delete('income/{income}', [App\Http\Controllers\IncomeController::class, 'destroy'])->name('income.destroy');
    Route::get('expense', [App\Http\Controllers\ExpenseController::class, 'index'])->name('expense');
    Route::post('expense', [App\Http\Controllers\ExpenseController::class, 'store'])->name('expense.store');
    Route::put('expense/{expense}', [App\Http\Controllers\ExpenseController::class, 'update'])->name('expense.update');
    Route::delete('expense/{expense}', [App\Http\Controllers\ExpenseController::class, 'destroy'])->name('expense.destroy');
    Route::get('goal', [App\Http\Controllers\GoalController::class, 'index'])->name('goal');
    Route::post('goal', [App\Http\Controllers\GoalController::class, 'store'])->name('goal.store');
    Route::post('goal/{goal}', [App\Http\Controllers\GoalController::class, 'update'])->name('goal.update');
    Route::delete('goal/{goal}', [App\Http\Controllers\GoalController::class, 'destroy'])->name('goal.destroy');
    Route::get('saving', [App\Http\Controllers\SavingController::class, 'index'])->name('saving');
    Route::post('saving', [App\Http\Controllers\SavingController::class, 'store'])->name('saving.store');
    Route::put('saving/{saving}', [App\Http\Controllers\SavingController::class, 'update'])->name('saving.update');
    Route::delete('saving/{saving}', [App\Http\Controllers\SavingController::class, 'destroy'])->name('saving.destroy');
    Route::get('wallet', [App\Http\Controllers\WalletController::class, 'index'])->name('wallet');
    Route::get('category', [App\Http\Controllers\CategoryController::class, 'index'])->name('category');
    Route::post('category', [App\Http\Controllers\CategoryController::class, 'store'])->name('category.store');
    Route::put('category/{category}', [App\Http\Controllers\CategoryController::class, 'update'])->name('category.update');
    Route::delete('category/{category}', [App\Http\Controllers\CategoryController::class, 'destroy'])->name('category.destroy');
    Route::get('history', [App\Http\Controllers\MoneyHistoryController::class, 'index'])->name('history');

    // Tracking Routes
    Route::get('tracking', [App\Http\Controllers\TrackingController::class, 'index'])->name('tracking');
    Route::get('tracking/search', [App\Http\Controllers\TrackingController::class, 'search'])->name('tracking.search');
    Route::post('tracking', [App\Http\Controllers\TrackingController::class, 'store'])->name('tracking.store');
    Route::post('tracking/{favorite}/accept', [App\Http\Controllers\TrackingController::class, 'accept'])->name('tracking.accept');
    Route::delete('tracking/{favorite}', [App\Http\Controllers\TrackingController::class, 'destroy'])->name('tracking.destroy');
    Route::get('tracking/chart-data', [App\Http\Controllers\TrackingController::class, 'getChartData'])->name('tracking.chart-data');
    Route::get('tracking/daily-details', [App\Http\Controllers\TrackingController::class, 'getDailyDetails'])->name('tracking.daily-details');
    Route::get('tracking/filtered-data', [App\Http\Controllers\TrackingController::class, 'getFilteredData'])->name('tracking.filtered-data');
});

require __DIR__.'/settings.php';
