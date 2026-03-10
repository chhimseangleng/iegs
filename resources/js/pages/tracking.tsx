import { Head, router } from '@inertiajs/react';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Calendar,
    Check,
    Filter,
    Flag,
    Search,
    Target,
    TrendingUp,
    Trophy,
    User,
    UserPlus,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

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

interface GoalData {
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    remaining: number;
    progress: number;
    start_date: string | null;
    target_date: string | null;
    status: string;
    image: string | null;
}

interface DashboardData {
    totalIncome: number;
    totalExpense: number;
    totalSaving: number;
    balance: number;
    goals: GoalData[];
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
    activeFavorite,
}: TrackingProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>(initialUsers);
    const [isSearching, setIsSearching] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [days, setDays] = useState(7);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [localCurrentUserData, setLocalCurrentUserData] =
        useState<DashboardData>(currentUserData);
    const [localSharedData, setLocalSharedData] =
        useState<DashboardData | null>(sharedData);
    const [isFiltering, setIsFiltering] = useState(false);
    const [detailsModal, setDetailsModal] = useState({
        open: false,
        type: 'income',
        userType: 'me',
        date: null as string | null,
        title: '',
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

    const fetchDetails = async (
        type: string,
        userType: string,
        date: string | null = null,
    ) => {
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
            const response = await fetch(
                `/tracking/filtered-data?start_date=${startDate}&end_date=${endDate}`,
            );
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
            const response = await fetch(
                `/tracking/search?search=${searchQuery}`,
            );
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

    const groupedDetailsData = detailsData.reduce(
        (acc, item) => {
            let date =
                item.income_date ||
                item.expense_date ||
                item.saving_date ||
                'Unknown Date';

            if (date !== 'Unknown Date') {
                const d = new Date(date);
                if (!isNaN(d.getTime())) {
                    const yy = d.getFullYear().toString().slice(-2);
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    date = `${yy}/${mm}/${dd}`;
                }
            }

            if (!acc[date]) acc[date] = [];
            acc[date].push(item);
            return acc;
        },
        {} as Record<string, any[]>,
    );

    const groupedAndSummedDetailsData = Object.entries(
        groupedDetailsData,
    ).reduce(
        (dateAcc, [date, items]) => {
            const typedItems = items as any[];
            const groupedByName = typedItems.reduce(
                (nameAcc: Record<string, any>, item: any) => {
                    const name =
                        detailsModal.type === 'saving'
                            ? item.goal?.name || 'Saving'
                            : item.category?.name ||
                            item.description ||
                            'Uncategorized';
                    if (!nameAcc[name]) {
                        nameAcc[name] = {
                            name,
                            totalAmount: 0,
                            count: 0,
                            items: [],
                        };
                    }
                    nameAcc[name].totalAmount += parseFloat(item.amount);
                    nameAcc[name].count += 1;
                    nameAcc[name].items.push(item);
                    return nameAcc;
                },
                {} as Record<string, any>,
            );
            dateAcc[date] = Object.values(groupedByName);
            return dateAcc;
        },
        {} as Record<string, any[]>,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tracking" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4 sm:p-6">
                {/* Header & Search Section (Only if NOT linked) */}
                {!linkedUser && !pendingRequestSent && (
                    <div className="max-w-43xl mx-auto w-full space-y-6">
                        <div className="space-y-2 text-center">
                            <h1 className="text-3xl font-extrabold tracking-tight">
                                Financial Tracking
                            </h1>
                            <p className="text-muted-foreground">
                                Link with a favorite person to share and track
                                financial progress together.
                            </p>
                        </div>

                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Find User</CardTitle>
                                <CardDescription>
                                    Search by email or name to send a tracking
                                    request.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input
                                        placeholder="Search user..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' && handleSearch()
                                        }
                                        className="w-full"
                                    />
                                    <Button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="w-full sm:w-auto"
                                    >
                                        <Search className="mr-2 h-4 w-4" />{' '}
                                        Search
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                        {searchQuery.length >= 3
                                            ? 'Search Results'
                                            : 'Suggested Users'}
                                    </h3>
                                    <div className="space-y-2">
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex flex-col items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-bold">
                                                        {user.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        sendRequest(user.id)
                                                    }
                                                    className="w-full sm:w-auto"
                                                >
                                                    <UserPlus className="mr-2 h-4 w-4" />{' '}
                                                    Add Favorite
                                                </Button>
                                            </div>
                                        ))}
                                        {searchResults.length === 0 &&
                                            searchQuery.length >= 3 &&
                                            !isSearching && (
                                                <p className="py-4 text-center text-sm text-muted-foreground">
                                                    No users found.
                                                </p>
                                            )}
                                        {searchResults.length === 0 &&
                                            searchQuery.length < 3 &&
                                            !isSearching && (
                                                <p className="py-4 text-center text-sm text-muted-foreground">
                                                    No suggestions available.
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Pending Requests */}
                {(pendingRequestSent || pendingRequestReceived) && (
                    <div className="mx-auto w-full max-w-2xl space-y-4">
                        {pendingRequestReceived && (
                            <Card className="border-yellow-500/20 bg-yellow-500/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-yellow-600">
                                        <TrendingUp className="h-4 w-4" />{' '}
                                        Pending Request Received
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold">
                                            {
                                                pendingRequestReceived.sender
                                                    ?.name
                                            }
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {
                                                pendingRequestReceived.sender
                                                    ?.email
                                            }
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-50"
                                            onClick={() =>
                                                acceptRequest(
                                                    pendingRequestReceived.id,
                                                )
                                            }
                                        >
                                            <Check className="mr-2 h-4 w-4" />{' '}
                                            Confirm
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-rose-600 hover:bg-rose-50"
                                            onClick={() =>
                                                declineRequest(
                                                    pendingRequestReceived.id,
                                                )
                                            }
                                        >
                                            <X className="mr-2 h-4 w-4" />{' '}
                                            Decline
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {pendingRequestSent && (
                            <Card className="border-border/50 bg-card/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold">
                                        <TrendingUp className="h-4 w-4" />{' '}
                                        Request Sent
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold">
                                            {pendingRequestSent.receiver?.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {pendingRequestSent.receiver?.email}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-rose-600"
                                        onClick={() =>
                                            declineRequest(
                                                pendingRequestSent.id,
                                            )
                                        }
                                    >
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
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                            <div className="space-y-1">
                                <h1 className="flex items-center gap-2 text-xl font-black sm:text-2xl">
                                    <User className="h-5 w-5 text-indigo-500 sm:h-6 sm:w-6" />{' '}
                                    Linked with {linkedUser.name}
                                </h1>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                    Tracking financial progress together day by
                                    day.
                                </p>
                            </div>

                            <Card className="flex w-full flex-col items-stretch gap-3 border-border/50 bg-card/40 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-end lg:w-auto">
                                <div className="grid flex-1 grid-cols-1 items-end gap-3 sm:flex sm:flex-row">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase">
                                            <Calendar className="h-3 w-3 text-indigo-500" />{' '}
                                            Start Date
                                        </label>
                                        <Input
                                            type="date"
                                            className="h-8 w-full border-indigo-500/20 bg-background/50 text-[11px] focus:border-indigo-500 sm:w-[135px]"
                                            value={startDate}
                                            onChange={(e) =>
                                                setStartDate(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase">
                                            <Calendar className="h-3 w-3 text-indigo-500" />{' '}
                                            End Date
                                        </label>
                                        <Input
                                            type="date"
                                            className="h-8 w-full border-indigo-500/20 bg-background/50 text-[11px] focus:border-indigo-500 sm:w-[135px]"
                                            value={endDate}
                                            onChange={(e) =>
                                                setEndDate(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="mt-2 flex gap-2 sm:mt-0">
                                    <Button
                                        size="sm"
                                        className="h-8 flex-1 bg-indigo-600 px-3 font-bold hover:bg-indigo-700 sm:flex-none"
                                        onClick={fetchFilteredData}
                                        disabled={
                                            isFiltering ||
                                            (!startDate && !endDate)
                                        }
                                    >
                                        <Filter className="mr-1.5 h-3 w-3" />{' '}
                                        Filter
                                    </Button>
                                    {(startDate || endDate) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                            onClick={resetFilter}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                    <div className="mx-1 hidden h-8 w-px bg-border/50 lg:block" />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 flex-1 border-rose-200 font-bold text-rose-600 hover:bg-rose-50 sm:flex-none"
                                        onClick={() =>
                                            activeFavorite &&
                                            declineRequest(activeFavorite.id)
                                        }
                                    >
                                        <X className="mr-1.5 h-3 w-3" /> Remove
                                        Link
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Separate Stats Sections */}
                        <div className="space-y-8">
                            {/* My Stats Section */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-4 w-1 rounded-full bg-indigo-500" />
                                    <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
                                        My Overview
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                                    <Card className="border-none bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-md">
                                        <CardHeader className="space-y-0 pb-1">
                                            <CardTitle className="text-[10px] tracking-wider uppercase opacity-70">
                                                My Balance
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-lg font-black sm:text-xl lg:text-2xl">
                                                $
                                                {localCurrentUserData.balance.toLocaleString()}
                                            </div>
                                            <p className="mt-1 text-[9px] opacity-60">
                                                Current total balance
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className="cursor-pointer border-border/50 bg-card/40 backdrop-blur-sm transition-colors hover:bg-card/60"
                                        onClick={() => {
                                            setDetailsModal({
                                                open: true,
                                                type: 'income',
                                                userType: 'me',
                                                date: null,
                                                title: 'My Income (This Month)',
                                            });
                                            fetchDetails('income', 'me');
                                        }}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                            <CardTitle className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                                My Income
                                            </CardTitle>
                                            <ArrowUpCircle className="h-3 w-3 text-emerald-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base font-bold text-emerald-600 sm:text-lg lg:text-xl">
                                                $
                                                {localCurrentUserData.totalIncome.toLocaleString()}
                                            </div>
                                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                                                Total monthly income
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className="cursor-pointer border-border/50 bg-card/40 backdrop-blur-sm transition-colors hover:bg-card/60"
                                        onClick={() => {
                                            setDetailsModal({
                                                open: true,
                                                type: 'expense',
                                                userType: 'me',
                                                date: null,
                                                title: 'My Expense (This Month)',
                                            });
                                            fetchDetails('expense', 'me');
                                        }}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                            <CardTitle className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                                My Expense
                                            </CardTitle>
                                            <ArrowDownCircle className="h-3 w-3 text-rose-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base font-bold text-rose-600 sm:text-lg lg:text-xl">
                                                $
                                                {localCurrentUserData.totalExpense.toLocaleString()}
                                            </div>
                                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                                                Total monthly spending
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className="cursor-pointer border-border/50 bg-card/40 backdrop-blur-sm transition-colors hover:bg-card/60"
                                        onClick={() => {
                                            setDetailsModal({
                                                open: true,
                                                type: 'saving',
                                                userType: 'me',
                                                date: null,
                                                title: 'My Saving (This Month)',
                                            });
                                            fetchDetails('saving', 'me');
                                        }}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                            <CardTitle className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                                My Saving
                                            </CardTitle>
                                            <Wallet className="h-3 w-3 text-amber-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base font-bold text-amber-600 sm:text-lg lg:text-xl">
                                                $
                                                {localCurrentUserData.totalSaving.toLocaleString()}
                                            </div>
                                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                                                Total monthly savings
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>

                            {/* Partner Stats Section */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-4 w-1 rounded-full bg-amber-500" />
                                    <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
                                        {linkedUser.name}'s Overview
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                                    <Card className="border-none bg-linear-to-br from-amber-500 via-orange-500 to-yellow-600 text-white shadow-md">
                                        <CardHeader className="space-y-0 pb-1">
                                            <CardTitle className="text-[10px] tracking-wider uppercase opacity-70">
                                                {linkedUser.name.split(' ')[0]}
                                                's Balance
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-lg font-black sm:text-xl lg:text-2xl">
                                                $
                                                {localSharedData.balance.toLocaleString()}
                                            </div>
                                            <p className="mt-1 text-[9px] opacity-60">
                                                Current total balance
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className="cursor-pointer border-border/50 bg-card/40 backdrop-blur-sm transition-colors hover:bg-card/60"
                                        onClick={() => {
                                            setDetailsModal({
                                                open: true,
                                                type: 'income',
                                                userType: 'partner',
                                                date: null,
                                                title: `${linkedUser.name}'s Income (This Month)`,
                                            });
                                            fetchDetails('income', 'partner');
                                        }}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                            <CardTitle className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                                Income
                                            </CardTitle>
                                            <ArrowUpCircle className="h-3 w-3 text-emerald-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base font-bold text-emerald-600 sm:text-lg lg:text-xl">
                                                $
                                                {localSharedData.totalIncome.toLocaleString()}
                                            </div>
                                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                                                Total monthly income
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className="cursor-pointer border-border/50 bg-card/40 backdrop-blur-sm transition-colors hover:bg-card/60"
                                        onClick={() => {
                                            setDetailsModal({
                                                open: true,
                                                type: 'expense',
                                                userType: 'partner',
                                                date: null,
                                                title: `${linkedUser.name}'s Expense (This Month)`,
                                            });
                                            fetchDetails('expense', 'partner');
                                        }}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                            <CardTitle className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                                Expense
                                            </CardTitle>
                                            <ArrowDownCircle className="h-3 w-3 text-rose-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base font-bold text-rose-600 sm:text-lg lg:text-xl">
                                                $
                                                {localSharedData.totalExpense.toLocaleString()}
                                            </div>
                                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                                                Total monthly spending
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className="cursor-pointer border-border/50 bg-card/40 backdrop-blur-sm transition-colors hover:bg-card/60"
                                        onClick={() => {
                                            setDetailsModal({
                                                open: true,
                                                type: 'saving',
                                                userType: 'partner',
                                                date: null,
                                                title: `${linkedUser.name}'s Saving (This Month)`,
                                            });
                                            fetchDetails('saving', 'partner');
                                        }}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                            <CardTitle className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                                Saving
                                            </CardTitle>
                                            <Wallet className="h-3 w-3 text-amber-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base font-bold text-amber-600 sm:text-lg lg:text-xl">
                                                $
                                                {localSharedData.totalSaving.toLocaleString()}
                                            </div>
                                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                                                Total monthly savings
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>
                        </div>

                        {/* Daily Tracking Chart */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <CardTitle>Daily Tracking</CardTitle>
                                    <CardDescription>
                                        Daily comparison of income and expenses
                                    </CardDescription>
                                </div>
                                <div className="flex w-full items-center gap-2 sm:w-auto">
                                    <select
                                        className="w-full rounded-md border-none bg-muted px-2 py-1 text-xs outline-none sm:w-auto"
                                        value={days}
                                        onChange={(e) =>
                                            setDays(Number(e.target.value))
                                        }
                                    >
                                        <option value={7}>Last 7 Days</option>
                                        <option value={14}>Last 14 Days</option>
                                        <option value={30}>Last 30 Days</option>
                                    </select>
                                </div>
                            </CardHeader>
                            <CardContent className="pl-0">
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={chartData}
                                            margin={{
                                                top: 20,
                                                right: 30,
                                                left: 20,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                opacity={0.1}
                                            />
                                            <XAxis
                                                dataKey="date"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tick={true}
                                            />
                                            <YAxis
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) =>
                                                    `$${value}`
                                                }
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow:
                                                        '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    backgroundColor:
                                                        'hsl(var(--card))',
                                                    padding: '12px',
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="top"
                                                height={36}
                                                wrapperStyle={{
                                                    fontSize: '11px',
                                                }}
                                            />
                                            <Bar
                                                dataKey="myIncome"
                                                name="My Income"
                                                fill="#10b981"
                                                radius={[4, 4, 0, 0]}
                                                barSize={12}
                                                className="cursor-pointer"
                                                onClick={(data: any) => {
                                                    if (data?.payload) {
                                                        setDetailsModal({
                                                            open: true,
                                                            type: 'income',
                                                            userType: 'me',
                                                            date: data.payload
                                                                .fullDate,
                                                            title: `My Income (${data.payload.date})`,
                                                        });
                                                        fetchDetails(
                                                            'income',
                                                            'me',
                                                            data.payload
                                                                .fullDate,
                                                        );
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
                                                        setDetailsModal({
                                                            open: true,
                                                            type: 'expense',
                                                            userType: 'me',
                                                            date: data.payload
                                                                .fullDate,
                                                            title: `My Expense (${data.payload.date})`,
                                                        });
                                                        fetchDetails(
                                                            'expense',
                                                            'me',
                                                            data.payload
                                                                .fullDate,
                                                        );
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
                                                        setDetailsModal({
                                                            open: true,
                                                            type: 'income',
                                                            userType: 'partner',
                                                            date: data.payload
                                                                .fullDate,
                                                            title: `${linkedUser.name}'s Income (${data.payload.date})`,
                                                        });
                                                        fetchDetails(
                                                            'income',
                                                            'partner',
                                                            data.payload
                                                                .fullDate,
                                                        );
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
                                                        setDetailsModal({
                                                            open: true,
                                                            type: 'expense',
                                                            userType: 'partner',
                                                            date: data.payload
                                                                .fullDate,
                                                            title: `${linkedUser.name}'s Expense (${data.payload.date})`,
                                                        });
                                                        fetchDetails(
                                                            'expense',
                                                            'partner',
                                                            data.payload
                                                                .fullDate,
                                                        );
                                                    }
                                                }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Goals Section - Both Users */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {/* My Goals */}
                            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                                            <Target className="h-4 w-4 text-indigo-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold">
                                                My Goals
                                            </CardTitle>
                                            <CardDescription className="text-[10px]">
                                                {localCurrentUserData.goals.length} active goal{localCurrentUserData.goals.length !== 1 ? 's' : ''}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {localCurrentUserData.goals.length > 0 ? (
                                        localCurrentUserData.goals.map((goal: GoalData) => (
                                            <div
                                                key={goal.id}
                                                className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2.5"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-bold">
                                                            {goal.name}
                                                        </p>
                                                        {goal.target_date && (
                                                            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <Flag className="h-2.5 w-2.5" />
                                                                Due {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5">
                                                        {goal.progress >= 100 ? (
                                                            <Trophy className="h-3 w-3 text-amber-500" />
                                                        ) : null}
                                                        <span className="text-[11px] font-black text-indigo-600">
                                                            {goal.progress}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/40">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out"
                                                        style={{ width: `${goal.progress}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span className="font-semibold">
                                                        ${goal.current_amount.toLocaleString()}
                                                    </span>
                                                    <span className="font-bold text-foreground">
                                                        ${goal.target_amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center">
                                            <Target className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                                            <p className="text-xs text-muted-foreground">
                                                No active goals yet
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Partner's Goals */}
                            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                                            <Target className="h-4 w-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold">
                                                {linkedUser.name.split(' ')[0]}'s Goals
                                            </CardTitle>
                                            <CardDescription className="text-[10px]">
                                                {localSharedData.goals.length} active goal{localSharedData.goals.length !== 1 ? 's' : ''}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {localSharedData.goals.length > 0 ? (
                                        localSharedData.goals.map((goal: GoalData) => (
                                            <div
                                                key={goal.id}
                                                className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2.5"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-bold">
                                                            {goal.name}
                                                        </p>
                                                        {goal.target_date && (
                                                            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <Flag className="h-2.5 w-2.5" />
                                                                Due {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5">
                                                        {goal.progress >= 100 ? (
                                                            <Trophy className="h-3 w-3 text-amber-500" />
                                                        ) : null}
                                                        <span className="text-[11px] font-black text-amber-600">
                                                            {goal.progress}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/40">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-out"
                                                        style={{ width: `${goal.progress}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span className="font-semibold">
                                                        ${goal.current_amount.toLocaleString()}
                                                    </span>
                                                    <span className="font-bold text-foreground">
                                                        ${goal.target_amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center">
                                            <Target className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                                            <p className="text-xs text-muted-foreground">
                                                No active goals yet
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Financial Progress Comparison */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                                    Financial Progress Comparison
                                </CardTitle>
                                <CardDescription>
                                    Side-by-side comparison of financial metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Legend */}
                                <div className="mb-5 flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                        <span className="text-[10px] font-bold text-muted-foreground">Me</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                        <span className="text-[10px] font-bold text-muted-foreground">{linkedUser.name.split(' ')[0]}</span>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1.5">
                                        <div className="h-px w-3 bg-muted-foreground/40" />
                                        <span className="text-[9px] text-muted-foreground">Center = $0</span>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {[
                                        {
                                            label: 'Balance',
                                            icon: <Wallet className="h-3.5 w-3.5" />,
                                            myValue: localCurrentUserData.balance,
                                            partnerValue: localSharedData.balance,
                                            myColor: 'bg-indigo-500',
                                            partnerColor: 'bg-amber-500',
                                        },
                                        {
                                            label: 'Income',
                                            icon: <ArrowUpCircle className="h-3.5 w-3.5" />,
                                            myValue: localCurrentUserData.totalIncome,
                                            partnerValue: localSharedData.totalIncome,
                                            myColor: 'bg-emerald-500',
                                            partnerColor: 'bg-emerald-400',
                                        },
                                        {
                                            label: 'Expense',
                                            icon: <ArrowDownCircle className="h-3.5 w-3.5" />,
                                            myValue: localCurrentUserData.totalExpense,
                                            partnerValue: localSharedData.totalExpense,
                                            myColor: 'bg-rose-500',
                                            partnerColor: 'bg-rose-400',
                                        },
                                        {
                                            label: 'Saving',
                                            icon: <Target className="h-3.5 w-3.5" />,
                                            myValue: localCurrentUserData.totalSaving,
                                            partnerValue: localSharedData.totalSaving,
                                            myColor: 'bg-violet-500',
                                            partnerColor: 'bg-violet-400',
                                        },
                                    ].map((metric) => {
                                        const allValues = [metric.myValue, metric.partnerValue];
                                        const hasNegative = allValues.some(v => v < 0);
                                        const maxAbs = Math.max(...allValues.map(Math.abs), 1);

                                        const formatValue = (val: number) => {
                                            const prefix = val < 0 ? '-$' : '$';
                                            return `${prefix}${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                                        };

                                        // Render a bar row for a single user
                                        const renderBar = (
                                            value: number,
                                            color: string,
                                            label: string,
                                        ) => {
                                            const isNeg = value < 0;
                                            const barPercent = (Math.abs(value) / maxAbs) * 50; // 50% max because center is 50%

                                            if (hasNegative) {
                                                // Number-line mode: center = 0, left = negative, right = positive
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        {/* Value on far left */}
                                                        <span className={`w-16 shrink-0 text-right text-[11px] font-bold ${isNeg ? 'text-rose-500' : 'text-foreground'}`}>
                                                            {formatValue(value)}
                                                        </span>
                                                        {/* Number line bar */}
                                                        <div className="relative h-6 flex-1 rounded-lg bg-secondary/20">
                                                            {/* Center line */}
                                                            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-muted-foreground/30" />
                                                            {isNeg ? (
                                                                // Negative: grow left from center
                                                                <div
                                                                    className="absolute top-1 bottom-1 rounded-md transition-all duration-1000 ease-out"
                                                                    style={{
                                                                        right: '50%',
                                                                        width: `${Math.max(barPercent, 1)}%`,
                                                                        background: `linear-gradient(to left, #f43f5e, #e11d48)`,
                                                                    }}
                                                                />
                                                            ) : (
                                                                // Positive: grow right from center
                                                                <div
                                                                    className={`absolute top-1 bottom-1 rounded-md ${color} transition-all duration-1000 ease-out`}
                                                                    style={{
                                                                        left: '50%',
                                                                        width: `${Math.max(barPercent, 1)}%`,
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Simple mode: all positive, left-to-right bar
                                                const simplePercent = maxAbs > 0 ? (value / maxAbs) * 100 : 0;
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-16 shrink-0 text-right text-[11px] font-bold text-foreground">
                                                            {formatValue(value)}
                                                        </span>
                                                        <div className="h-6 flex-1 overflow-hidden rounded-lg bg-secondary/20">
                                                            <div
                                                                className={`flex h-full items-center rounded-lg ${color} transition-all duration-1000 ease-out`}
                                                                style={{ width: `${Math.max(simplePercent, 1)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        };

                                        return (
                                            <div key={metric.label} className="rounded-xl border border-border/30 bg-muted/10 p-3">
                                                {/* Header */}
                                                <div className="mb-2.5 flex items-center gap-2">
                                                    <span className="text-muted-foreground">{metric.icon}</span>
                                                    <span className="text-xs font-bold tracking-wider uppercase">
                                                        {metric.label}
                                                    </span>
                                                </div>
                                                {/* My bar */}
                                                <div className="mb-1.5 flex items-center gap-1">
                                                    <span className="w-4 shrink-0 text-[9px] font-bold text-indigo-500">●</span>
                                                    <div className="flex-1">
                                                        {renderBar(metric.myValue, metric.myColor, 'Me')}
                                                    </div>
                                                </div>
                                                {/* Partner bar */}
                                                <div className="flex items-center gap-1">
                                                    <span className="w-4 shrink-0 text-[9px] font-bold text-amber-500">●</span>
                                                    <div className="flex-1">
                                                        {renderBar(metric.partnerValue, metric.partnerColor, linkedUser.name.split(' ')[0])}
                                                    </div>
                                                </div>
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
            <Dialog
                open={detailsModal.open}
                onOpenChange={(open) =>
                    setDetailsModal({ ...detailsModal, open })
                }
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{detailsModal.title}</DialogTitle>
                        <DialogDescription>
                            {detailsModal.date
                                ? `Transactions for ${detailsModal.date}`
                                : 'Transactions for the current month'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                        {isLoadingDetails ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                Loading details...
                            </div>
                        ) : detailsData.length > 0 ? (
                            <div className="space-y-6 pb-4">
                                <div>
                                    {Object.entries(groupedAndSummedDetailsData)
                                        .sort(
                                            ([dateA], [dateB]) =>
                                                new Date(dateB).getTime() -
                                                new Date(dateA).getTime(),
                                        )
                                        .map(([date, groups]) => (
                                            <div
                                                key={date}
                                                className="mb-6 space-y-3"
                                            >
                                                <h3 className="sticky top-0 z-10 bg-background/90 py-2 text-xs font-bold tracking-wider text-muted-foreground uppercase backdrop-blur-md">
                                                    {date}
                                                </h3>
                                                <div className="space-y-2">
                                                    {groups.map(
                                                        (
                                                            group: any,
                                                            idx: number,
                                                        ) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between rounded-lg border bg-muted/20 p-3"
                                                            >
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-black text-primary uppercase">
                                                                            {
                                                                                group.name
                                                                            }
                                                                        </span>
                                                                        {group.count >
                                                                            1 && (
                                                                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                                                    {
                                                                                        group.count
                                                                                    }{' '}
                                                                                    txns
                                                                                </span>
                                                                            )}
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className={`text-base font-black ${detailsModal.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}
                                                                >
                                                                    {detailsModal.type ===
                                                                        'expense'
                                                                        ? '-'
                                                                        : '+'}
                                                                    $
                                                                    {group.totalAmount.toLocaleString(
                                                                        undefined,
                                                                        {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        },
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                No transactions found for this selection.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
