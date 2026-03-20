<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Favorite;
use App\Models\TrackingGroup;
use App\Models\TrackingGroupMember;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class TrackingController extends Controller
{
    // ─── Helper: get all user IDs already in a pair relationship with the current user ───
    private function getPairAddedUserIds($userId)
    {
        return Favorite::where(function ($q) use ($userId) {
            $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
        })->get()->flatMap(fn($f) => [$f->sender_id, $f->receiver_id])
          ->reject($userId)->unique()->values()->toArray();
    }

    // ─── PAIR TRACKING ───

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $activeFavorites = Favorite::where('status', 'accepted')
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $user->id)->orWhere('receiver_id', $user->id);
            })->get();

        $linkedUsers = $user->linkedFavorites()->values();
        $pendingRequestsSent = $user->favoriteSent()->where('status', 'pending')->with('receiver')->get();
        $pendingRequestsReceived = $user->favoriteReceived()->where('status', 'pending')->with('sender')->get();

        $linkedUsersData = [];
        foreach ($linkedUsers as $linkedUser) {
            $linkedUsersData[] = [
                'user' => [
                    'id' => $linkedUser->id,
                    'name' => $linkedUser->name,
                    'email' => $linkedUser->email,
                    'favorite_id' => $linkedUser->favorite_id,
                    'favorite_type' => $linkedUser->favorite_type,
                ],
                'data' => $this->getDashboardData($linkedUser),
            ];
        }

        $pairAddedUserIds = $this->getPairAddedUserIds($user->id);

        $allUsers = User::where('id', '!=', $user->id)
            ->take(10)
            ->get(['id', 'name', 'email']);

        return Inertia::render('tracking', [
            'linkedUsers' => $linkedUsersData,
            'activeFavorites' => $activeFavorites,
            'pendingRequestsSent' => $pendingRequestsSent,
            'pendingRequestsReceived' => $pendingRequestsReceived,
            'currentUserData' => $this->getDashboardData($user),
            'initialUsers' => $allUsers,
            'pairAddedUserIds' => $pairAddedUserIds,
        ]);
    }

    public function groupIndex(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $groups = TrackingGroup::where('creator_id', $user->id)
            ->orWhereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['creator:id,name,email', 'members.user:id,name,email'])
            ->get()
            ->map(function ($group) use ($user) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'creator' => $group->creator->only('id', 'name', 'email'),
                    'is_creator' => $group->creator_id === $user->id,
                    'accepted_members' => $group->acceptedMembers->map(fn($m) => [
                        'member_id' => $m->id,
                        'user' => $m->user->only('id', 'name', 'email'),
                    ])->values(),
                    'pending_members' => $group->pendingMembers->map(fn($m) => [
                        'member_id' => $m->id,
                        'user' => $m->user->only('id', 'name', 'email'),
                    ])->values(),
                ];
            });

        $pendingGroupInvites = TrackingGroupMember::where('user_id', $user->id)
            ->where('status', 'pending')
            ->with(['group.creator:id,name,email'])
            ->get()
            ->map(fn($m) => [
                'member_id' => $m->id,
                'group' => [
                    'id' => $m->group->id,
                    'name' => $m->group->name,
                    'creator' => $m->group->creator->only('id', 'name', 'email'),
                ],
            ]);

        return Inertia::render('group-tracking', [
            'groups' => $groups,
            'pendingGroupInvites' => $pendingGroupInvites,
        ]);
    }

    public function search(Request $request)
    {
        $request->validate(['search' => 'required|string|min:3']);
        $query = $request->input('search');
        $userId = auth()->id();

        $users = User::where('id', '!=', $userId)
            ->where(function ($q) use ($query) {
                $q->where('email', 'like', "%{$query}%")
                  ->orWhere('name', 'like', "%{$query}%");
            })->get(['id', 'name', 'email']);

        return response()->json([
            'users' => $users,
            'pairAddedUserIds' => $this->getPairAddedUserIds($userId),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'nullable|in:personal,group',
        ]);
        $senderId = auth()->id();
        $receiverId = $request->user_id;
        $type = $request->type ?? 'personal';

        if ($senderId == $receiverId) {
            return back()->with('error', 'You cannot add yourself.');
        }

        $existingPair = Favorite::where(function ($q) use ($senderId, $receiverId) {
            $q->where(function ($inner) use ($senderId, $receiverId) {
                $inner->where('sender_id', $senderId)->where('receiver_id', $receiverId);
            })->orWhere(function ($inner) use ($senderId, $receiverId) {
                $inner->where('sender_id', $receiverId)->where('receiver_id', $senderId);
            });
        })->exists();

        if ($existingPair) {
            return back()->with('error', 'You already have a relationship with this user.');
        }

        Favorite::create([
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'status' => 'pending',
            'type' => $type,
        ]);

        return back()->with('success', 'Tracking request sent.');
    }

    public function accept(Favorite $favorite)
    {
        if ($favorite->receiver_id != auth()->id()) return abort(403);
        $favorite->update(['status' => 'accepted']);
        return back()->with('success', 'Request accepted.');
    }

    public function destroy(Favorite $favorite)
    {
        if ($favorite->sender_id != auth()->id() && $favorite->receiver_id != auth()->id()) return abort(403);
        $favorite->delete();
        return back()->with('success', 'Relationship removed.');
    }

    public function getFilteredData(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'favorite_id' => 'nullable|integer',
        ]);

        /** @var User $user */
        $user = $request->user();
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        $responseData = [
            'currentUserData' => $this->getDashboardData($user, $startDate, $endDate),
        ];

        if ($request->favorite_id) {
            $linkedUser = $user->linkedFavoriteById($request->favorite_id);
            if ($linkedUser) {
                $responseData['sharedData'] = $this->getDashboardData($linkedUser, $startDate, $endDate);
            }
        }

        return response()->json($responseData);
    }

    public function getChartData(Request $request)
    {
        $days = $request->input('days', 7);
        $favoriteId = $request->input('favorite_id');

        /** @var User $user */
        $user = $request->user();

        if (!$favoriteId) return response()->json(['error' => 'No partner specified.'], 400);

        $linkedUser = $user->linkedFavoriteById($favoriteId);
        if (!$linkedUser) return response()->json(['error' => 'No linked user found.'], 404);

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

        return response()->json(['chartData' => $chartData]);
    }

    public function getDailyDetails(Request $request)
    {
        $request->validate([
            'user_type' => 'required|in:me,partner,member',
            'type' => 'required|in:income,expense,saving',
            'date' => 'nullable|date',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'favorite_id' => 'nullable|integer',
            'member_id' => 'nullable|integer',
        ]);

        /** @var User $currentUser */
        $currentUser = $request->user();

        if ($request->user_type === 'me') {
            $user = $currentUser;
        } elseif ($request->user_type === 'partner') {
            if (!$request->favorite_id) return response()->json(['error' => 'No partner specified.'], 400);
            $user = $currentUser->linkedFavoriteById($request->favorite_id);
        } else {
            if (!$request->member_id) return response()->json(['error' => 'No member specified.'], 400);
            $groupMember = TrackingGroupMember::find($request->member_id);
            if (!$groupMember) return response()->json(['error' => 'Member not found.'], 404);
            
            // Verify current user is in the same group and the group invitation is accepted
            $isMember = TrackingGroupMember::where('group_id', $groupMember->group_id)
                ->where('user_id', $currentUser->id)
                ->where('status', 'accepted')
                ->exists();
            
            if (!$isMember) return response()->json(['error' => 'Not authorized.'], 403);
            
            $user = $groupMember->user;
            
            // SECURITY: For group tracking, ONLY allow expense details
            if ($request->type !== 'expense') {
                return response()->json(['error' => 'Only expense details are shared in groups.'], 403);
            }
        }

        if (!$user) return response()->json(['error' => 'User not found or not linked.'], 404);

        $query = match ($request->type) {
            'income' => $user->incomes(),
            'expense' => $user->expenses(),
            'saving' => $user->savings(),
        };

        $dateCol = match ($request->type) {
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
            $query->whereMonth('created_at', Carbon::now()->month);
        }

        $with = $request->type === 'saving' ? 'goal' : 'category';
        return response()->json($query->with($with)->orderBy('created_at', 'desc')->get());
    }

    // ─── GROUP TRACKING ───

    public function createGroup(Request $request)
    {
        $request->validate(['name' => 'required|string|max:100']);

        $group = TrackingGroup::create([
            'name' => $request->name,
            'creator_id' => auth()->id(),
        ]);

        // Auto-add creator as accepted member
        TrackingGroupMember::create([
            'group_id' => $group->id,
            'user_id' => auth()->id(),
            'status' => 'accepted',
        ]);

        return back()->with('success', 'Group created.');
    }

    public function deleteGroup(TrackingGroup $group)
    {
        if ($group->creator_id != auth()->id()) return abort(403);
        $group->delete();
        return back()->with('success', 'Group deleted.');
    }

    public function addGroupMember(Request $request, TrackingGroup $group)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);

        // Only creator can add members
        if ($group->creator_id != auth()->id()) return abort(403);

        if ($request->user_id == auth()->id()) {
            return back()->with('error', 'You are already in this group.');
        }

        $exists = TrackingGroupMember::where('group_id', $group->id)
            ->where('user_id', $request->user_id)->exists();

        if ($exists) {
            return back()->with('error', 'User is already in this group.');
        }

        TrackingGroupMember::create([
            'group_id' => $group->id,
            'user_id' => $request->user_id,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Invitation sent.');
    }

    public function acceptGroupMember(TrackingGroupMember $groupMember)
    {
        if ($groupMember->user_id != auth()->id()) return abort(403);
        $groupMember->update(['status' => 'accepted']);
        return back()->with('success', 'Group invitation accepted.');
    }

    public function removeGroupMember(TrackingGroupMember $groupMember)
    {
        $group = $groupMember->group;
        // Creator can remove anyone, or member can remove themselves
        if ($group->creator_id != auth()->id() && $groupMember->user_id != auth()->id()) return abort(403);
        $groupMember->delete();
        return back()->with('success', 'Member removed.');
    }

    public function getGroupData(Request $request, TrackingGroup $group)
    {
        /** @var User $user */
        $user = $request->user();

        // Verify user is a member
        $isMember = TrackingGroupMember::where('group_id', $group->id)
            ->where('user_id', $user->id)->where('status', 'accepted')->exists();
        if (!$isMember) return response()->json(['error' => 'Not a member.'], 403);

        $membersData = [];
        foreach ($group->acceptedMembers()->with('user')->get() as $member) {
            $data = $this->getDashboardData($member->user);
            // Hide sensitive data for group tracking
            $data['totalIncome'] = null;
            $data['totalSaving'] = null;
            $data['balance'] = null;
            $data['goals'] = [];
            $data['hideIncome'] = true;
            $membersData[] = [
                'user' => $member->user->only('id', 'name', 'email'),
                'member_id' => $member->id,
                'data' => $data,
            ];
        }

        return response()->json(['members' => $membersData]);
    }

    public function searchGroupMembers(Request $request, TrackingGroup $group)
    {
        $request->validate(['search' => 'required|string|min:3']);
        $query = $request->input('search');

        $existingMemberIds = TrackingGroupMember::where('group_id', $group->id)
            ->pluck('user_id')->toArray();

        $users = User::where('id', '!=', auth()->id())
            ->where(function ($q) use ($query) {
                $q->where('email', 'like', "%{$query}%")
                  ->orWhere('name', 'like', "%{$query}%");
            })->get(['id', 'name', 'email']);

        return response()->json([
            'users' => $users,
            'existingMemberIds' => $existingMemberIds,
        ]);
    }

    // ─── PRIVATE HELPERS ───

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

        $totalIncome = (float) $incomeQuery->sum('amount');
        $totalExpense = (float) $expenseQuery->sum('amount');
        $totalSaving = (float) $savingQuery->sum('amount');

        $goals = $user->goals()->where('status', 'in_progress')->get()->map(function ($goal) {
            $progress = $goal->target_amount > 0
                ? round(($goal->current_amount / $goal->target_amount) * 100, 1) : 0;
            return [
                'id' => $goal->id,
                'name' => $goal->name,
                'target_amount' => (float) $goal->target_amount,
                'current_amount' => (float) $goal->current_amount,
                'remaining' => max(0, (float) $goal->target_amount - (float) $goal->current_amount),
                'progress' => min($progress, 100),
                'start_date' => $goal->start_date?->format('Y-m-d'),
                'target_date' => $goal->target_date?->format('Y-m-d'),
                'status' => $goal->status,
                'image' => $goal->image,
            ];
        });

        return [
            'totalIncome' => $totalIncome,
            'totalExpense' => $totalExpense,
            'totalSaving' => $totalSaving,
            'balance' => $totalIncome - $totalExpense - $totalSaving,
            'goals' => $goals,
        ];
    }
}
