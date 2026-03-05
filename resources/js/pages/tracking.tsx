import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Search, UserPlus, Check, X, User, Wallet, ArrowUpCircle, ArrowDownCircle, Target, TrendingUp, Calendar, Filter } from 'lucide-react';

import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tracking',
        href: '/tracking',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
}

interface Favorite {
    id: number;
    sender_id: number;
    receiver_id: number;
    status: 'pending' | 'accepted';
    sender?: User;
    receiver?: User;
}

interface DashboardData {
    totalIncome: number;
    totalExpense: number;
    totalSaving: number;
    balance: number;
    goals: any[];
}

interface TrackingProps {
    linkedUser: User | null;
    pendingRequestSent: Favorite | null;
    pendingRequestReceived: Favorite | null;
    sharedData: DashboardData | null;
    currentUserData: DashboardData;
    initialUsers: User[];
    activeFavorite: Favorite | null;
}

export default function Tracking({
    linkedUser,
    pendingRequestSent,
    pendingRequestReceived,
    sharedData,
    currentUserData,
    initialUsers,
    activeFavorite
}: TrackingProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>(initialUsers);
    const [isSearching, setIsSearching] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [days, setDays] = useState(7);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [localCurrentUserData, setLocalCurrentUserData] = useState<DashboardData>(currentUserData);
    const [localSharedData, setLocalSharedData] = useState<DashboardData | null>(sharedData);
    const [isFiltering, setIsFiltering] = useState(false);
    const [detailsModal, setDetailsModal] = useState({
        open: false,
        type: 'income',
        userType: 'me',
        date: null as string | null,
        title: ''
    });
    const [detailsData, setDetailsData] = useState<any[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        if (linkedUser) {
            fetchChartData();
        }
    }, [linkedUser, days]);

    const fetchChartData = async () => {
        const response = await fetch(`/tracking/chart-data?days=${days}`);
        const data = await response.json();
        setChartData(data);
    };

    const fetchDetails = async (type: string, userType: string, date: string | null = null) => {
        setIsLoadingDetails(true);
        let url = `/tracking/daily-details?type=${type}&user_type=${userType}`;
        if (date) {
            url += `&date=${date}`;
        } else if (startDate || endDate) {
            url += `&start_date=${startDate}&end_date=${endDate}`;
        }
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            setDetailsData(data);
        } catch (error) {
            console.error('Failed to fetch details', error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchQuery.length >= 3) {
                handleSearch();
            } else if (searchQuery.length === 0) {
                setSearchResults(initialUsers);
            }
        }, 500);

        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const fetchFilteredData = async () => {
        setIsFiltering(true);
        try {
            const response = await fetch(`/tracking/filtered-data?start_date=${startDate}&end_date=${endDate}`);
            const data = await response.json();
            setLocalCurrentUserData(data.currentUserData);
            setLocalSharedData(data.sharedData);
        } catch (error) {
            console.error('Failed to fetch filtered data', error);
        } finally {
            setIsFiltering(false);
        }
    };

    const resetFilter = () => {
        setStartDate('');
        setEndDate('');
        setLocalCurrentUserData(currentUserData);
        setLocalSharedData(sharedData);
    };

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const response = await fetch(`/tracking/search?search=${searchQuery}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const sendRequest = (userId: number) => {
        router.post('/tracking', { user_id: userId });
    };

    const acceptRequest = (id: number) => {
        router.post(`/tracking/${id}/accept`);
    };

    const declineRequest = (id: number) => {
        router.delete(`/tracking/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tracking" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 overflow-hidden">
                
                {/* Header & Search Section (Only if NOT linked) */}
                {!linkedUser && !pendingRequestSent && (
                    <div className="max-w-43xl mx-auto w-full space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-extrabold tracking-tight">Financial Tracking</h1>
                            <p className="text-muted-foreground">Link with a favorite person to share and track financial progress together.</p>
                        </div>

                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Find User</CardTitle>
                                <CardDescription>Search by email or name to send a tracking request.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Input 
                                        placeholder="Search user..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full"
                                    />
                                    <Button onClick={handleSearch} disabled={isSearching} className="w-full sm:w-auto">
                                        <Search className="mr-2 h-4 w-4" /> Search
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        {searchQuery.length >= 3 ? 'Search Results' : 'Suggested Users'}
                                    </h3>
                                    <div className="space-y-2">
                                        {searchResults.map((user) => (
                                            <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border bg-muted/30 gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                                <Button size="sm" onClick={() => sendRequest(user.id)} className="w-full sm:w-auto">
                                                    <UserPlus className="mr-2 h-4 w-4" /> Add Favorite
                                                </Button>
                                            </div>
                                        ))}
                                        {searchResults.length === 0 && searchQuery.length >= 3 && !isSearching && (
                                            <p className="text-center text-sm text-muted-foreground py-4">No users found.</p>
                                        )}
                                        {searchResults.length === 0 && searchQuery.length < 3 && !isSearching && (
                                            <p className="text-center text-sm text-muted-foreground py-4">No suggestions available.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Pending Requests */}
                {(pendingRequestSent || pendingRequestReceived) && (
                    <div className="max-w-2xl mx-auto w-full space-y-4">
                        {pendingRequestReceived && (
                            <Card className="border-yellow-500/20 bg-yellow-500/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-yellow-600">
                                        <TrendingUp className="h-4 w-4" /> Pending Request Received
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold">{pendingRequestReceived.sender?.name}</p>
                                        <p className="text-xs text-muted-foreground">{pendingRequestReceived.sender?.email}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-500/50 hover:bg-emerald-50" onClick={() => acceptRequest(pendingRequestReceived.id)}>
                                            <Check className="mr-2 h-4 w-4" /> Confirm
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => declineRequest(pendingRequestReceived.id)}>
                                            <X className="mr-2 h-4 w-4" /> Decline
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {pendingRequestSent && (
                            <Card className="border-border/50 bg-card/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" /> Request Sent
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold">{pendingRequestSent.receiver?.name}</p>
                                        <p className="text-xs text-muted-foreground">{pendingRequestSent.receiver?.email}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => declineRequest(pendingRequestSent.id)}>
                                        Cancel Request
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Shared Dashboard (When Linked) */}
                {linkedUser && localSharedData && (
                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                            <div className="space-y-1">
                                <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" /> Linked with {linkedUser.name}
                                </h1>
                                <p className="text-muted-foreground text-xs sm:text-sm">Tracking financial progress together day by day.</p>
                            </div>

                            <Card className="border-border/50 bg-card/40 backdrop-blur-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-3 shadow-sm w-full lg:w-auto">
                                <div className="grid grid-cols-1 sm:flex sm:flex-row gap-3 items-end flex-1">
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[9px] uppercase font-black text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-indigo-500" /> Start Date
                                        </label>
                                        <Input 
                                            type="date" 
                                            className="h-8 w-full sm:w-[135px] text-[11px] bg-background/50 border-indigo-500/20 focus:border-indigo-500" 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[9px] uppercase font-black text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-indigo-500" /> End Date
                                        </label>
                                        <Input 
                                            type="date" 
                                            className="h-8 w-full sm:w-[135px] text-[11px] bg-background/50 border-indigo-500/20 focus:border-indigo-500" 
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2 sm:mt-0">
                                    <Button 
                                        size="sm" 
                                        className="h-8 flex-1 sm:flex-none px-3 font-bold bg-indigo-600 hover:bg-indigo-700"
                                        onClick={fetchFilteredData}
                                        disabled={isFiltering || (!startDate && !endDate)}
                                    >
                                        <Filter className="mr-1.5 h-3 w-3" /> Filter
                                    </Button>
                                    {(startDate || endDate) && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2 font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                            onClick={resetFilter}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                    <div className="h-8 w-px bg-border/50 mx-1 hidden lg:block" />
                                    <Button variant="outline" size="sm" className="h-8 flex-1 sm:flex-none text-rose-600 border-rose-200 hover:bg-rose-50 font-bold" onClick={() => activeFavorite && declineRequest(activeFavorite.id)}>
                                        <X className="mr-1.5 h-3 w-3" /> Remove Link
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Separate Stats Sections */}
                        <div className="space-y-8">
                            {/* My Stats Section */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">My Overview</h2>
                                </div>
                                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                                    <Card className="bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 text-white border-none shadow-md">
                                        <CardHeader className="pb-1 space-y-0">
                                            <CardTitle className="text-[10px] uppercase tracking-wider opacity-70">My Balance</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-lg sm:text-xl lg:text-2xl font-black">${localCurrentUserData.balance.toLocaleString()}</div>
                                            <p className="text-[9px] opacity-60 mt-1">Current total balance</p>
                                        </CardContent>
                                    </Card>

                                    <Card 
                                        className="border-border/50 bg-card/40 backdrop-blur-sm cursor-pointer hover:bg-card/60 transition-colors"
                                        onClick={() => {
                                            setDetailsModal({ open: true, type: 'income', userType: 'me', date: null, title: 'My Income (This Month)' });
                                            fetchDetails('income', 'me');
                                        }}
                                    >
                                        <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                                            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">My Income</CardTitle>
                                            <ArrowUpCircle className="h-3 w-3 text-emerald-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base sm:text-lg lg:text-xl font-bold text-emerald-600">${localCurrentUserData.totalIncome.toLocaleString()}</div>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">Total monthly income</p>
                                        </CardContent>
                                    </Card>

                                    <Card 
                                        className="border-border/50 bg-card/40 backdrop-blur-sm cursor-pointer hover:bg-card/60 transition-colors"
                                        onClick={() => {
                                            setDetailsModal({ open: true, type: 'expense', userType: 'me', date: null, title: 'My Expense (This Month)' });
                                            fetchDetails('expense', 'me');
                                        }}
                                    >
                                        <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                                            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">My Expense</CardTitle>
                                            <ArrowDownCircle className="h-3 w-3 text-rose-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base sm:text-lg lg:text-xl font-bold text-rose-600">${localCurrentUserData.totalExpense.toLocaleString()}</div>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">Total monthly spending</p>
                                        </CardContent>
                                    </Card>

                                    <Card 
                                        className="border-border/50 bg-card/40 backdrop-blur-sm cursor-pointer hover:bg-card/60 transition-colors"
                                        onClick={() => {
                                            setDetailsModal({ open: true, type: 'saving', userType: 'me', date: null, title: 'My Saving (This Month)' });
                                            fetchDetails('saving', 'me');
                                        }}
                                    >
                                        <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                                            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">My Saving</CardTitle>
                                            <Wallet className="h-3 w-3 text-amber-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base sm:text-lg lg:text-xl font-bold text-amber-600">${localCurrentUserData.totalSaving.toLocaleString()}</div>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">Total monthly savings</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>

                            {/* Partner Stats Section */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-4 w-1 bg-amber-500 rounded-full" />
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{linkedUser.name}'s Overview</h2>
                                </div>
                                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                                    <Card className="bg-linear-to-br from-amber-500 via-orange-500 to-yellow-600 text-white border-none shadow-md">
                                        <CardHeader className="pb-1 space-y-0">
                                            <CardTitle className="text-[10px] uppercase tracking-wider opacity-70">{linkedUser.name.split(' ')[0]}'s Balance</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-lg sm:text-xl lg:text-2xl font-black">${localSharedData.balance.toLocaleString()}</div>
                                            <p className="text-[9px] opacity-60 mt-1">Current total balance</p>
                                        </CardContent>
                                    </Card>

                                    <Card 
                                        className="border-border/50 bg-card/40 backdrop-blur-sm cursor-pointer hover:bg-card/60 transition-colors"
                                        onClick={() => {
                                            setDetailsModal({ open: true, type: 'income', userType: 'partner', date: null, title: `${linkedUser.name}'s Income (This Month)` });
                                            fetchDetails('income', 'partner');
                                        }}
                                    >
                                        <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                                            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">Income</CardTitle>
                                            <ArrowUpCircle className="h-3 w-3 text-emerald-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base sm:text-lg lg:text-xl font-bold text-emerald-600">${localSharedData.totalIncome.toLocaleString()}</div>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">Total monthly income</p>
                                        </CardContent>
                                    </Card>

                                    <Card 
                                        className="border-border/50 bg-card/40 backdrop-blur-sm cursor-pointer hover:bg-card/60 transition-colors"
                                        onClick={() => {
                                            setDetailsModal({ open: true, type: 'expense', userType: 'partner', date: null, title: `${linkedUser.name}'s Expense (This Month)` });
                                            fetchDetails('expense', 'partner');
                                        }}
                                    >
                                        <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                                            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">Expense</CardTitle>
                                            <ArrowDownCircle className="h-3 w-3 text-rose-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base sm:text-lg lg:text-xl font-bold text-rose-600">${localSharedData.totalExpense.toLocaleString()}</div>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">Total monthly spending</p>
                                        </CardContent>
                                    </Card>

                                    <Card 
                                        className="border-border/50 bg-card/40 backdrop-blur-sm cursor-pointer hover:bg-card/60 transition-colors"
                                        onClick={() => {
                                            setDetailsModal({ open: true, type: 'saving', userType: 'partner', date: null, title: `${linkedUser.name}'s Saving (This Month)` });
                                            fetchDetails('saving', 'partner');
                                        }}
                                    >
                                        <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                                            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">Saving</CardTitle>
                                            <Wallet className="h-3 w-3 text-amber-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base sm:text-lg lg:text-xl font-bold text-amber-600">${localSharedData.totalSaving.toLocaleString()}</div>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">Total monthly savings</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>
                        </div>

                        {/* Daily Tracking Chart */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Daily Tracking</CardTitle>
                                    <CardDescription>Daily comparison of income and expenses</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <select 
                                        className="text-xs bg-muted border-none rounded-md px-2 py-1 outline-none w-full sm:w-auto"
                                        value={days}
                                        onChange={(e) => setDays(Number(e.target.value))}
                                    >
                                        <option value={7}>Last 7 Days</option>
                                        <option value={14}>Last 14 Days</option>
                                        <option value={30}>Last 30 Days</option>
                                    </select>
                                </div>
                            </CardHeader>
                            <CardContent className="pl-0">
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis 
                                                dataKey="date" 
                                                fontSize={11} 
                                                tickLine={false} 
                                                axisLine={false}
                                            />
                                            <YAxis
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `$${value}`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    backgroundColor: 'hsl(var(--card))',
                                                    padding: '12px'
                                                }}
                                            />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                                            <Bar 
                                                dataKey="myIncome" 
                                                name="My Income" 
                                                fill="#10b981" 
                                                radius={[4, 4, 0, 0]} 
                                                barSize={12}
                                                className="cursor-pointer"
                                                onClick={(data: any) => {
                                                    if (data?.payload) {
                                                        setDetailsModal({ open: true, type: 'income', userType: 'me', date: data.payload.fullDate, title: `My Income (${data.payload.date})` });
                                                        fetchDetails('income', 'me', data.payload.fullDate);
                                                    }
                                                }}
                                            />
                                            <Bar 
                                                dataKey="myExpense" 
                                                name="My Expense" 
                                                fill="#f43f5e" 
                                                radius={[4, 4, 0, 0]} 
                                                barSize={12}
                                                className="cursor-pointer"
                                                onClick={(data: any) => {
                                                    if (data?.payload) {
                                                        setDetailsModal({ open: true, type: 'expense', userType: 'me', date: data.payload.fullDate, title: `My Expense (${data.payload.date})` });
                                                        fetchDetails('expense', 'me', data.payload.fullDate);
                                                    }
                                                }}
                                            />
                                            <Bar 
                                                dataKey="partnerIncome" 
                                                name={`${linkedUser.name.split(' ')[0]}'s Income`} 
                                                fill="#6366f1" 
                                                radius={[4, 4, 0, 0]} 
                                                barSize={12}
                                                className="cursor-pointer"
                                                onClick={(data: any) => {
                                                    if (data?.payload) {
                                                        setDetailsModal({ open: true, type: 'income', userType: 'partner', date: data.payload.fullDate, title: `${linkedUser.name}'s Income (${data.payload.date})` });
                                                        fetchDetails('income', 'partner', data.payload.fullDate);
                                                    }
                                                }}
                                            />
                                            <Bar 
                                                dataKey="partnerExpense" 
                                                name={`${linkedUser.name.split(' ')[0]}'s Expense`} 
                                                fill="#fbbf24" 
                                                radius={[4, 4, 0, 0]} 
                                                barSize={12}
                                                className="cursor-pointer"
                                                onClick={(data: any) => {
                                                    if (data?.payload) {
                                                        setDetailsModal({ open: true, type: 'expense', userType: 'partner', date: data.payload.fullDate, title: `${linkedUser.name}'s Expense (${data.payload.date})` });
                                                        fetchDetails('expense', 'partner', data.payload.fullDate);
                                                    }
                                                }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Partner's Active Goals */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" /> {linkedUser.name}'s Active Goals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {localSharedData.goals.length > 0 ? (
                                        localSharedData.goals.map((goal: any) => {
                                            const progress = (goal.current_amount / goal.target_amount) * 100;
                                            return (
                                                <div key={goal.id} className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-bold">{goal.name}</p>
                                                        <p className="text-[10px] font-bold text-primary">
                                                            ${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-secondary/50 overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 transition-all duration-1000"
                                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold text-right">
                                                        {progress.toFixed(1)}% Completed
                                                    </p>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="col-span-full text-center text-sm text-muted-foreground py-4">No active goals.</p>
                                    )}
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
                        <DialogDescription>
                            {detailsModal.date ? `Transactions for ${detailsModal.date}` : 'Transactions for the current month'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {isLoadingDetails ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">Loading details...</div>
                        ) : detailsData.length > 0 ? (
                            detailsData.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                {detailsModal.type === 'saving' ? (item.goal?.name || 'Saving') : (item.category?.name || 'Uncategorized')}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {item.income_date || item.expense_date || item.saving_date}
                                            </span>
                                        </div>
                                        { (item.description || item.note) && (
                                            <p className="text-sm font-medium">{item.description || item.note}</p>
                                        )}
                                    </div>
                                    <div className={`text-lg font-black ${detailsModal.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {detailsModal.type === 'expense' ? '-' : '+'}${parseFloat(item.amount).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-sm text-muted-foreground">No transactions found for this selection.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
