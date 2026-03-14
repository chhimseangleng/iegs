import { Head, router } from '@inertiajs/react';
import {
    ArrowDownCircle, ArrowUpCircle, Calendar, Check, ChevronLeft,
    Filter, Flag, Search, Target, TrendingUp, Trophy,
    User, UserPlus, Wallet, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tracking', href: '/tracking' }];

interface UserData { id: number; name: string; email: string; favorite_id?: number; favorite_type?: string; }
interface Favorite { id: number; sender_id: number; receiver_id: number; status: string; type: string; sender?: UserData; receiver?: UserData; }
interface GoalData { id: number; name: string; target_amount: number; current_amount: number; remaining: number; progress: number; start_date: string | null; target_date: string | null; status: string; image: string | null; }
interface DashboardData { totalIncome: number | null; totalExpense: number; totalSaving: number; balance: number; goals: GoalData[]; hideIncome?: boolean; }
interface LinkedUserEntry { user: UserData; data: DashboardData; }

interface TrackingProps {
    linkedUsers: LinkedUserEntry[];
    pendingRequestsSent: Favorite[];
    pendingRequestsReceived: Favorite[];
    currentUserData: DashboardData;
    initialUsers: UserData[];
    activeFavorites: Favorite[];
    pairAddedUserIds: number[];
}

export default function Tracking({
    linkedUsers, pendingRequestsSent, pendingRequestsReceived, currentUserData,
    initialUsers, activeFavorites, pairAddedUserIds,
}: TrackingProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserData[]>(initialUsers);
    const [isSearching, setIsSearching] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [days, setDays] = useState(7);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [localCurrentUserData, setLocalCurrentUserData] = useState<DashboardData>(currentUserData);
    const [localPartnerData, setLocalPartnerData] = useState<DashboardData | null>(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<LinkedUserEntry | null>(linkedUsers.length > 0 ? linkedUsers[0] : null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [addedIds, setAddedIds] = useState<number[]>(pairAddedUserIds);
    const [isProcessingRequest, setIsProcessingRequest] = useState(false);

    useEffect(() => {
        setAddedIds(pairAddedUserIds);
    }, [pairAddedUserIds]);

    const [detailsModal, setDetailsModal] = useState({ open: false, type: 'income', userType: 'me', date: null as string | null, title: '' });
    const [detailsData, setDetailsData] = useState<any[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        if (selectedPartner) { setLocalPartnerData(selectedPartner.data); fetchChartData(); }
    }, [selectedPartner, days]);

    const fetchChartData = async () => {
        if (!selectedPartner) return;
        const res = await fetch(`/tracking/chart-data?days=${days}&favorite_id=${selectedPartner.user.favorite_id}`);
        const data = await res.json();
        setChartData(data.chartData || []);
    };

    const fetchDetails = async (type: string, userType: string, date: string | null = null) => {
        setIsLoadingDetails(true);
        let url = `/tracking/daily-details?type=${type}&user_type=${userType}`;
        if (selectedPartner && userType === 'partner') url += `&favorite_id=${selectedPartner.user.favorite_id}`;
        if (date) url += `&date=${date}`;
        else if (startDate || endDate) url += `&start_date=${startDate}&end_date=${endDate}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            setDetailsData(Array.isArray(data) ? data : []);
        } catch { /* ignore */ } finally { setIsLoadingDetails(false); }
    };

    useEffect(() => {
        const d = setTimeout(() => {
            if (searchQuery.length >= 3) handleSearch();
            else if (searchQuery.length === 0) setSearchResults(initialUsers);
        }, 500);
        return () => clearTimeout(d);
    }, [searchQuery]);

    const fetchFilteredData = async () => {
        if (!selectedPartner) return;
        setIsFiltering(true);
        try {
            const res = await fetch(`/tracking/filtered-data?start_date=${startDate}&end_date=${endDate}&favorite_id=${selectedPartner.user.favorite_id}`);
            const data = await res.json();
            setLocalCurrentUserData(data.currentUserData);
            setLocalPartnerData(data.sharedData || null);
        } catch { /* ignore */ } finally { setIsFiltering(false); }
    };

    const resetFilter = () => { setStartDate(''); setEndDate(''); setLocalCurrentUserData(currentUserData); if (selectedPartner) setLocalPartnerData(selectedPartner.data); };

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const res = await fetch(`/tracking/search?search=${searchQuery}`);
            const data = await res.json();
            setSearchResults(data.users || []);
            if (data.pairAddedUserIds) setAddedIds(data.pairAddedUserIds);
        } catch { /* ignore */ } finally { setIsSearching(false); }
    };

    const sendRequest = (userId: number) => {
        setIsProcessingRequest(true);
        router.post('/tracking', { user_id: userId }, {
            onFinish: () => setIsProcessingRequest(false)
        });
    };
    const acceptRequest = (id: number) => {
        setIsProcessingRequest(true);
        router.post(`/tracking/${id}/accept`, {}, {
            onFinish: () => setIsProcessingRequest(false)
        });
    };
    const declineRequest = (id: number) => {
        setIsProcessingRequest(true);
        router.delete(`/tracking/${id}`, {
            onFinish: () => setIsProcessingRequest(false)
        });
    };

    // Details modal helpers
    const groupedDetailsData = detailsData.reduce((acc, item) => {
        let date = item.income_date || item.expense_date || item.saving_date || 'Unknown Date';
        if (date !== 'Unknown Date') { const d = new Date(date); if (!isNaN(d.getTime())) { date = `${d.getFullYear().toString().slice(-2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`; } }
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {} as Record<string, any[]>);

    const groupedAndSummedDetailsData = Object.entries(groupedDetailsData).reduce((dateAcc, [date, items]) => {
        const typedItems = items as any[];
        const byName = typedItems.reduce((na: Record<string, any>, item: any) => {
            const name = detailsModal.type === 'saving' ? item.goal?.name || 'Saving' : item.category?.name || item.description || 'Uncategorized';
            if (!na[name]) na[name] = { name, totalAmount: 0, count: 0, items: [] };
            na[name].totalAmount += parseFloat(item.amount); na[name].count += 1; na[name].items.push(item);
            return na;
        }, {} as Record<string, any>);
        dateAcc[date] = Object.values(byName);
        return dateAcc;
    }, {} as Record<string, any[]>);

    const UserListItem = ({ user, isAdded, onAdd, addLabel }: { user: UserData; isAdded: boolean; onAdd: () => void; addLabel: string }) => (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            {isAdded ? (
                <span className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-bold text-muted-foreground">
                    <Check className="h-3.5 w-3.5" /> Added
                </span>
            ) : (
                <Button size="sm" onClick={onAdd} className="w-full sm:w-auto" disabled={isProcessingRequest}>
                    {isProcessingRequest ? <span className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5 animate-spin" /> ...</span> : <><UserPlus className="mr-2 h-4 w-4" /> {addLabel}</>}
                </Button>
            )}
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tracking" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4 sm:p-6">

                {/* ════ PAIR TRACKING ════ */}
                {linkedUsers.length > 0 && (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            {linkedUsers.map((lu) => (
                                <button key={lu.user.id} onClick={() => { setSelectedPartner(lu); setShowAddUser(false); }}
                                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all ${selectedPartner?.user.id === lu.user.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600' : 'border-border/50 bg-card/40 text-muted-foreground hover:bg-card/60'}`}>
                                    <User className="h-4 w-4" /> {lu.user.name}
                                </button>
                            ))}
                            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAddUser(!showAddUser)}>
                                <UserPlus className="mr-1 h-4 w-4" /> Add
                            </Button>
                        </div>
                    </div>
                )}

                {/* Pending Requests */}
                {pendingRequestsReceived.map((req) => (
                    <Card key={req.id} className="border-yellow-500/20 bg-yellow-500/5">
                        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-bold text-yellow-600"><TrendingUp className="h-4 w-4" /> Pending Request</CardTitle></CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div><p className="font-bold">{req.sender?.name}</p><p className="text-xs text-muted-foreground">{req.sender?.email}</p></div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-50" onClick={() => acceptRequest(req.id)}><Check className="mr-2 h-4 w-4" /> Confirm</Button>
                                <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => declineRequest(req.id)}><X className="mr-2 h-4 w-4" /> Decline</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {pendingRequestsSent.map((req) => (
                    <Card key={req.id} className="border-border/50 bg-card/60">
                        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-bold"><TrendingUp className="h-4 w-4" /> Request Sent</CardTitle></CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div><p className="font-bold">{req.receiver?.name}</p><p className="text-xs text-muted-foreground">{req.receiver?.email}</p></div>
                            <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => declineRequest(req.id)}>Cancel</Button>
                        </CardContent>
                    </Card>
                ))}

                {/* Search / Add User */}
                {(linkedUsers.length === 0 || showAddUser) && (
                    <div className="max-w-3xl mx-auto w-full space-y-6">
                        {linkedUsers.length > 0 && <Button variant="ghost" size="sm" onClick={() => setShowAddUser(false)} className="text-muted-foreground"><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>}
                        <div className="space-y-2 text-center">
                            <h1 className="text-3xl font-extrabold tracking-tight">{linkedUsers.length > 0 ? 'Add Tracking Partner' : 'Financial Tracking'}</h1>
                            <p className="text-muted-foreground">Link with people to share and track financial progress together.</p>
                        </div>
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader><CardTitle>Find User</CardTitle><CardDescription>Search by email or name to send a tracking request.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input placeholder="Search user..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full" />
                                    <Button onClick={handleSearch} disabled={isSearching} className="w-full sm:w-auto"><Search className="mr-2 h-4 w-4" /> Search</Button>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{searchQuery.length >= 3 ? 'Search Results' : 'Suggested Users'}</h3>
                                    <div className="space-y-2">
                                        {searchResults.map((user) => (
                                            <UserListItem key={user.id} user={user} isAdded={addedIds.includes(user.id)} onAdd={() => sendRequest(user.id)} addLabel="Add" />
                                        ))}
                                        {searchResults.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">{searchQuery.length >= 3 && !isSearching ? 'No users found.' : 'No suggestions available.'}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Selected Partner Dashboard */}
                {selectedPartner && localPartnerData && !showAddUser && (
                    <div className="space-y-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                            <div className="space-y-1">
                                <h1 className="flex items-center gap-2 text-xl font-black sm:text-2xl">
                                    <User className="h-5 w-5 text-indigo-500 sm:h-6 sm:w-6" /> Tracking with {selectedPartner.user.name}
                                </h1>
                                <p className="text-xs text-muted-foreground sm:text-sm">Tracking financial progress together day by day.</p>
                            </div>
                            <Card className="flex w-full flex-col items-stretch gap-3 border-border/50 bg-card/40 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-end lg:w-auto">
                                <div className="grid flex-1 grid-cols-1 items-end gap-3 sm:flex sm:flex-row">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase"><Calendar className="h-3 w-3 text-indigo-500" /> Start Date</label>
                                        <Input type="date" className="h-8 w-full border-indigo-500/20 bg-background/50 text-[11px] sm:w-[135px]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase"><Calendar className="h-3 w-3 text-indigo-500" /> End Date</label>
                                        <Input type="date" className="h-8 w-full border-indigo-500/20 bg-background/50 text-[11px] sm:w-[135px]" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                    </div>
                                </div>
                                <div className="mt-2 flex gap-2 sm:mt-0">
                                    <Button size="sm" className="h-8 flex-1 bg-indigo-600 px-3 font-bold hover:bg-indigo-700 sm:flex-none" onClick={fetchFilteredData} disabled={isFiltering || (!startDate && !endDate)}><Filter className="mr-1.5 h-3 w-3" /> Filter</Button>
                                    {(startDate || endDate) && <Button variant="ghost" size="sm" className="h-8 px-2 font-bold text-rose-500" onClick={resetFilter}><X className="h-3 w-3" /></Button>}
                                    <div className="mx-1 hidden h-8 w-px bg-border/50 lg:block" />
                                    <Button variant="outline" size="sm" className="h-8 flex-1 border-rose-200 font-bold text-rose-600 hover:bg-rose-50 sm:flex-none" onClick={() => { const fav = activeFavorites.find(f => f.id === selectedPartner.user.favorite_id); if (fav) declineRequest(fav.id); }}><X className="mr-1.5 h-3 w-3" /> Remove</Button>
                                </div>
                            </Card>
                        </div>

                        {/* My Stats */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-1"><div className="h-4 w-1 rounded-full bg-indigo-500" /><h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">My Overview</h2></div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                                <Card className="border-none bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-md">
                                    <CardHeader className="space-y-0 pb-1"><CardTitle className="text-[10px] tracking-wider uppercase opacity-70">My Balance</CardTitle></CardHeader>
                                    <CardContent><div className="text-lg font-black sm:text-xl lg:text-2xl">${localCurrentUserData.balance.toLocaleString()}</div><p className="mt-1 text-[9px] opacity-60">Current total balance</p></CardContent>
                                </Card>
                                {[
                                    { label: 'My Income', value: localCurrentUserData.totalIncome, icon: <ArrowUpCircle className="h-3 w-3 text-emerald-500" />, color: 'text-emerald-600', type: 'income' },
                                    { label: 'My Expense', value: localCurrentUserData.totalExpense, icon: <ArrowDownCircle className="h-3 w-3 text-rose-500" />, color: 'text-rose-600', type: 'expense' },
                                    { label: 'My Saving', value: localCurrentUserData.totalSaving, icon: <Wallet className="h-3 w-3 text-amber-500" />, color: 'text-amber-600', type: 'saving' },
                                ].map(s => (
                                    <Card key={s.type} className="cursor-pointer border-border/50 bg-card/40 backdrop-blur-sm transition-colors hover:bg-card/60" onClick={() => { setDetailsModal({ open: true, type: s.type, userType: 'me', date: null, title: `${s.label} (This Month)` }); fetchDetails(s.type, 'me'); }}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1"><CardTitle className="text-[10px] tracking-wider text-muted-foreground uppercase">{s.label}</CardTitle>{s.icon}</CardHeader>
                                        <CardContent><div className={`text-base font-bold sm:text-lg lg:text-xl ${s.color}`}>${(s.value ?? 0).toLocaleString()}</div></CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* Partner Stats */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-1"><div className="h-4 w-1 rounded-full bg-amber-500" /><h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">{selectedPartner.user.name}'s Overview</h2></div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                                <Card className="border-none bg-linear-to-br from-amber-500 via-orange-500 to-yellow-600 text-white shadow-md">
                                    <CardHeader className="space-y-0 pb-1"><CardTitle className="text-[10px] tracking-wider uppercase opacity-70">{selectedPartner.user.name.split(' ')[0]}'s Balance</CardTitle></CardHeader>
                                    <CardContent><div className="text-lg font-black sm:text-xl lg:text-2xl">${localPartnerData.balance.toLocaleString()}</div><p className="mt-1 text-[9px] opacity-60">Current total balance</p></CardContent>
                                </Card>
                                {[
                                    { label: 'Income', value: localPartnerData.totalIncome, icon: <ArrowUpCircle className="h-3 w-3 text-emerald-500" />, color: 'text-emerald-600', type: 'income' },
                                    { label: 'Expense', value: localPartnerData.totalExpense, icon: <ArrowDownCircle className="h-3 w-3 text-rose-500" />, color: 'text-rose-600', type: 'expense' },
                                    { label: 'Saving', value: localPartnerData.totalSaving, icon: <Wallet className="h-3 w-3 text-amber-500" />, color: 'text-amber-600', type: 'saving' },
                                ].map(s => (
                                    <Card key={s.type} className="cursor-pointer border-border/50 bg-card/40 backdrop-blur-sm transition-colors hover:bg-card/60" onClick={() => { setDetailsModal({ open: true, type: s.type, userType: 'partner', date: null, title: `${selectedPartner.user.name}'s ${s.label} (This Month)` }); fetchDetails(s.type, 'partner'); }}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1"><CardTitle className="text-[10px] tracking-wider text-muted-foreground uppercase">{s.label}</CardTitle>{s.icon}</CardHeader>
                                        <CardContent><div className={`text-base font-bold sm:text-lg lg:text-xl ${s.color}`}>${(s.value ?? 0).toLocaleString()}</div></CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* Chart */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <div><CardTitle>Daily Tracking</CardTitle><CardDescription>Daily comparison of income and expenses</CardDescription></div>
                                <select className="rounded-md border-none bg-muted px-2 py-1 text-xs outline-none" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                                    <option value={7}>Last 7 Days</option><option value={14}>Last 14 Days</option><option value={30}>Last 30 Days</option>
                                </select>
                            </CardHeader>
                            <CardContent className="pl-0">
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'hsl(var(--card))', padding: '12px' }} />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                                            <Bar dataKey="myIncome" name="My Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                                            <Bar dataKey="myExpense" name="My Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
                                            <Bar dataKey="partnerIncome" name={`${selectedPartner.user.name.split(' ')[0]}'s Income`} fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
                                            <Bar dataKey="partnerExpense" name={`${selectedPartner.user.name.split(' ')[0]}'s Expense`} fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={12} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Goals */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {[
                                { title: 'My Goals', goals: localCurrentUserData.goals, accent: 'indigo' },
                                { title: `${selectedPartner.user.name.split(' ')[0]}'s Goals`, goals: localPartnerData.goals, accent: 'amber' },
                            ].map(section => (
                                <Card key={section.title} className="border-border/50 bg-card/60 backdrop-blur-sm">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${section.accent}-500/10`}><Target className={`h-4 w-4 text-${section.accent}-500`} /></div>
                                            <div><CardTitle className="text-sm font-bold">{section.title}</CardTitle><CardDescription className="text-[10px]">{section.goals.length} active goal{section.goals.length !== 1 ? 's' : ''}</CardDescription></div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {section.goals.length > 0 ? section.goals.map((goal: GoalData) => (
                                            <div key={goal.id} className="space-y-2.5 rounded-xl border border-border/50 bg-muted/20 p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{goal.name}</p>
                                                        {goal.target_date && <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><Flag className="h-2.5 w-2.5" /> Due {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</p>}
                                                    </div>
                                                    <div className={`flex items-center gap-1 rounded-full bg-${section.accent}-500/10 px-2 py-0.5`}>
                                                        {goal.progress >= 100 && <Trophy className="h-3 w-3 text-amber-500" />}
                                                        <span className={`text-[11px] font-black text-${section.accent}-600`}>{goal.progress}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/40">
                                                    <div className={`h-full rounded-full bg-gradient-to-r from-${section.accent}-500 to-${section.accent === 'indigo' ? 'violet' : 'orange'}-500 transition-all duration-1000 ease-out`} style={{ width: `${goal.progress}%` }} />
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span className="font-semibold">${goal.current_amount.toLocaleString()}</span>
                                                    <span className="font-bold text-foreground">${goal.target_amount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )) : <div className="py-6 text-center"><Target className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" /><p className="text-xs text-muted-foreground">No active goals yet</p></div>}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Financial Comparison */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5 text-indigo-500" /> Financial Progress Comparison</CardTitle>
                                <CardDescription>Side-by-side comparison of financial metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-5 flex items-center gap-4">
                                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-indigo-500" /><span className="text-[10px] font-bold text-muted-foreground">Me</span></div>
                                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" /><span className="text-[10px] font-bold text-muted-foreground">{selectedPartner.user.name.split(' ')[0]}</span></div>
                                </div>
                                <div className="space-y-5">
                                    {[
                                        { label: 'Balance', icon: <Wallet className="h-3.5 w-3.5" />, my: localCurrentUserData.balance, partner: localPartnerData.balance, myC: 'bg-indigo-500', pC: 'bg-amber-500' },
                                        { label: 'Income', icon: <ArrowUpCircle className="h-3.5 w-3.5" />, my: localCurrentUserData.totalIncome ?? 0, partner: localPartnerData.totalIncome ?? 0, myC: 'bg-emerald-500', pC: 'bg-emerald-400' },
                                        { label: 'Expense', icon: <ArrowDownCircle className="h-3.5 w-3.5" />, my: localCurrentUserData.totalExpense, partner: localPartnerData.totalExpense, myC: 'bg-rose-500', pC: 'bg-rose-400' },
                                        { label: 'Saving', icon: <Target className="h-3.5 w-3.5" />, my: localCurrentUserData.totalSaving, partner: localPartnerData.totalSaving, myC: 'bg-violet-500', pC: 'bg-violet-400' },
                                    ].map(m => {
                                        const max = Math.max(Math.abs(m.my), Math.abs(m.partner), 1);
                                        const fmt = (v: number) => `${v < 0 ? '-$' : '$'}${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                                        const bar = (v: number, c: string) => {
                                            const pct = max > 0 ? (Math.abs(v) / max) * 100 : 0;
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-16 shrink-0 text-right text-[11px] font-bold ${v < 0 ? 'text-rose-500' : 'text-foreground'}`}>{fmt(v)}</span>
                                                    <div className="h-6 flex-1 overflow-hidden rounded-lg bg-secondary/20"><div className={`flex h-full items-center rounded-lg ${c} transition-all duration-1000 ease-out`} style={{ width: `${Math.max(pct, 1)}%` }} /></div>
                                                </div>
                                            );
                                        };
                                        return (
                                            <div key={m.label} className="rounded-xl border border-border/30 bg-muted/10 p-3">
                                                <div className="mb-2.5 flex items-center gap-2"><span className="text-muted-foreground">{m.icon}</span><span className="text-xs font-bold tracking-wider uppercase">{m.label}</span></div>
                                                <div className="mb-1.5 flex items-center gap-1"><span className="w-4 shrink-0 text-[9px] font-bold text-indigo-500">●</span><div className="flex-1">{bar(m.my, m.myC)}</div></div>
                                                <div className="flex items-center gap-1"><span className="w-4 shrink-0 text-[9px] font-bold text-amber-500">●</span><div className="flex-1">{bar(m.partner, m.pC)}</div></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Transaction Details Modal */}
            <Dialog open={detailsModal.open} onOpenChange={(open) => setDetailsModal({ ...detailsModal, open })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{detailsModal.title}</DialogTitle>
                        <DialogDescription>{detailsModal.date ? `Transactions for ${detailsModal.date}` : 'Transactions for the current month'}</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                        {isLoadingDetails ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">Loading details...</div>
                        ) : detailsData.length > 0 ? (
                            <div className="space-y-6 pb-4"><div>
                                {Object.entries(groupedAndSummedDetailsData).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime()).map(([date, groups]) => (
                                    <div key={date} className="mb-6 space-y-3">
                                        <h3 className="sticky top-0 z-10 bg-background/90 py-2 text-xs font-bold tracking-wider text-muted-foreground uppercase backdrop-blur-md">{date}</h3>
                                        <div className="space-y-2">{groups.map((group: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
                                                <div className="space-y-1"><div className="flex items-center gap-2">
                                                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-black text-primary uppercase">{group.name}</span>
                                                    {group.count > 1 && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{group.count} txns</span>}
                                                </div></div>
                                                <div className={`text-base font-black ${detailsModal.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {detailsModal.type === 'expense' ? '-' : '+'}${group.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        ))}</div>
                                    </div>
                                ))}
                            </div></div>
                        ) : <div className="py-10 text-center text-sm text-muted-foreground">No transactions found.</div>}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
