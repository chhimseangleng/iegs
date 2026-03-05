<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Favorite;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TrackingController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        
        $activeFavorite = Favorite::where('status', 'accepted')
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id);
            })
            ->first();

        $linkedUser = $user->linkedFavorite();
        $pendingRequestSent = $user->favoriteSent()->where('status', 'pending')->with('receiver')->first();
        $pendingRequestReceived = $user->favoriteReceived()->where('status', 'pending')->with('sender')->first();

        // Get shared data if linked
        $sharedData = null;
        if ($linkedUser) {
            $sharedData = $this->getDashboardData($linkedUser);
        }

        // Get initial list of users to display (excluding those already in a relationship with someone)
        $usersInRelationships = Favorite::pluck('sender_id')->merge(Favorite::pluck('receiver_id'))->unique();
        
        $allUsers = User::where('id', '!=', auth()->id())
            ->whereNotIn('id', $usersInRelationships)
            ->take(10)
            ->get(['id', 'name', 'email']);

        return Inertia::render('tracking', [
            'linkedUser' => $linkedUser,
            'activeFavorite' => $activeFavorite,
            'pendingRequestSent' => $pendingRequestSent,
            'pendingRequestReceived' => $pendingRequestReceived,
            'sharedData' => $sharedData,
            'currentUserData' => $this->getDashboardData($user),
            'initialUsers' => $allUsers
        ]);
    }

    public function search(Request $request)
    {
        $request->validate(['search' => 'required|string|min:3']);
        $query = $request->input('search');

        $users = User::where('id', '!=', auth()->id())
            ->where(function($q) use ($query) {
                $q->where('email', 'like', "%{$query}%")
                  ->orWhere('name', 'like', "%{$query}%");
            })
            ->get(['id', 'name', 'email']);

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $senderId = auth()->id();
        $receiverId = $request->user_id;

        if ($senderId == $receiverId) {
            return back()->with('error', 'You cannot add yourself.');
        }

        // Check if either user already has a relationship
        $hasRelationship = Favorite::where(function($q) use ($senderId, $receiverId) {
            $q->whereIn('sender_id', [$senderId, $receiverId])
              ->orWhereIn('receiver_id', [$senderId, $receiverId]);
        })->exists();

        if ($hasRelationship) {
            return back()->with('error', 'One of the users is already linked or has a pending request.');
        }

        Favorite::create([
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'status' => 'pending'
        ]);

        return back()->with('success', 'Favorite request sent.');
    }

    public function accept(Favorite $favorite)
    {
        if ($favorite->receiver_id != auth()->id()) {
            return abort(403);
        }

        $favorite->update(['status' => 'accepted']);

        return back()->with('success', 'Request accepted.');
    }

    public function destroy(Favorite $favorite)
    {
        if ($favorite->sender_id != auth()->id() && $favorite->receiver_id != auth()->id()) {
            return abort(403);
        }

        $favorite->delete();

        return back()->with('success', 'Relationship removed.');
    }

    public function getFilteredData(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        /** @var User $user */
        $user = $request->user();
        $linkedUser = $user->linkedFavorite();

        $startDate = $request->start_date;
        $endDate = $request->end_date;

        return response()->json([
            'currentUserData' => $this->getDashboardData($user, $startDate, $endDate),
            'sharedData' => $linkedUser ? $this->getDashboardData($linkedUser, $startDate, $endDate) : null,
        ]);
    }

    public function getChartData(Request $request)
    {
        $days = $request->input('days', 7);
        /** @var User $user */
        $user = $request->user();
        $linkedUser = $user->linkedFavorite();

        if (!$linkedUser) {
            return response()->json(['error' => 'No linked user found.'], 404);
        }

        $chartData = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dateStr = $date->toDateString();

            $chartData[] = [
                'date' => $date->format('M d'),
                'fullDate' => $dateStr,
                'myIncome' => (float) $this->getDayTotal($user, 'incomes', 'income_date', $dateStr),
                'myExpense' => (float) $this->getDayTotal($user, 'expenses', 'expense_date', $dateStr),
                'partnerIncome' => (float) $this->getDayTotal($linkedUser, 'incomes', 'income_date', $dateStr),
                'partnerExpense' => (float) $this->getDayTotal($linkedUser, 'expenses', 'expense_date', $dateStr),
            ];
        }

        return response()->json($chartData);
    }

    private function getDayTotal($user, $relation, $dateColumn, $date)
    {
        return $user->$relation()->whereDate($dateColumn, $date)->sum('amount');
    }

    private function getDashboardData($user, $startDate = null, $endDate = null)
    {
        $incomeQuery = $user->incomes();
        $expenseQuery = $user->expenses();
        $savingQuery = $user->savings();

        if ($startDate && $endDate) {
            $incomeQuery->whereBetween('income_date', [$startDate, $endDate]);
            $expenseQuery->whereBetween('expense_date', [$startDate, $endDate]);
            $savingQuery->whereBetween('saving_date', [$startDate, $endDate]);
        } elseif ($startDate) {
            $incomeQuery->where('income_date', '>=', $startDate);
            $expenseQuery->where('expense_date', '>=', $startDate);
            $savingQuery->where('saving_date', '>=', $startDate);
        }

        return [
            'totalIncome' => (float) $incomeQuery->sum('amount'),
            'totalExpense' => (float) $expenseQuery->sum('amount'),
            'totalSaving' => (float) $savingQuery->sum('amount'),
            'balance' => (float) ($incomeQuery->sum('amount') - $expenseQuery->sum('amount') - $savingQuery->sum('amount')),
            'goals' => $user->goals()->where('status', 'in_progress')->get(),
        ];
    }

    public function getDailyDetails(Request $request)
    {
        $request->validate([
            'user_type' => 'required|in:me,partner',
            'type' => 'required|in:income,expense,saving',
            'date' => 'nullable|date',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        /** @var User $currentUser */
        $currentUser = $request->user();
        $user = $request->user_type === 'me' ? $currentUser : $currentUser->linkedFavorite();

        if (!$user) {
            return response()->json(['error' => 'User not found or not linked.'], 404);
        }

        $query = match($request->type) {
            'income' => $user->incomes(),
            'expense' => $user->expenses(),
            'saving' => $user->savings(),
        };

        $dateCol = match($request->type) {
            'income' => 'income_date',
            'expense' => 'expense_date',
            'saving' => 'saving_date',
        };

        if ($request->date) {
            $query->whereDate($dateCol, $request->date);
        } elseif ($request->start_date && $request->end_date) {
            $query->whereBetween($dateCol, [$request->start_date, $request->end_date]);
        } elseif ($request->start_date) {
             $query->where($dateCol, '>=', $request->start_date);
        } else {
            // Default to current month if no date provided
            $query->whereMonth('created_at', Carbon::now()->month);
        }

        $with = $request->type === 'saving' ? 'goal' : 'category';
        $details = $query->with($with)->orderBy('created_at', 'desc')->get();

        return response()->json($details);
    }
}
