import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Target, Activity } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    monthlyStats: {
        name: string;
        Income: number;
        Expense: number;
    }[];
    expenseCategories: {
        name: string;
        value: number;
    }[];
    recentTransactions: {
        id: string;
        type: 'income' | 'expense';
        description: string;
        amount: number;
        date: string;
        category: string;
    }[];
    goals: {
        id: number;
        name: string;
        current_amount: number;
        target_amount: number;
        image: string | null;
    }[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

export default function Dashboard({
    balance,
    totalIncome,
    totalExpense,
    monthlyStats,
    expenseCategories,
    recentTransactions,
    goals
}: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="relative overflow-hidden border-none bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 text-primary-foreground shadow-lg shadow-indigo-500/20">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-semibold tracking-wide text-indigo-50/80">Total Balance</CardTitle>
                            <div className="rounded-full bg-white/20 p-2 glass">
                                <Wallet className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold tracking-tight">${balance.toLocaleString()}</div>
                            <p className="mt-2 text-xs font-medium text-indigo-100/60">Net worth across all accounts</p>
                        </CardContent>
                    </Card>
                    <Card className="group transition-all hover:shadow-md border-border/50 bg-card/60 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground">Monthly Income</CardTitle>
                            <div className="rounded-full bg-emerald-500/10 p-2 transition-colors group-hover:bg-emerald-500/20">
                                <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold tracking-tight text-emerald-600">+${totalIncome.toLocaleString()}</div>
                            <p className="mt-2 text-xs font-medium text-muted-foreground">Total income this month</p>
                        </CardContent>
                    </Card>
                    <Card className="group transition-all hover:shadow-md border-border/50 bg-card/60 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground">Monthly Expense</CardTitle>
                            <div className="rounded-full bg-rose-500/10 p-2 transition-colors group-hover:bg-rose-500/20">
                                <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold tracking-tight text-rose-600">-${totalExpense.toLocaleString()}</div>
                            <p className="mt-2 text-xs font-medium text-muted-foreground">Total spending this month</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Area */}
                <div className="grid gap-6 md:grid-cols-7">
                    <Card className="col-span-4 border-border/50 bg-card/60 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Financial Overview</CardTitle>
                                <CardDescription>Income vs Expense flow</CardDescription>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                                    <span>Income</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded-sm bg-rose-500" />
                                    <span>Expense</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyStats} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                        <XAxis 
                                            dataKey="name" 
                                            fontSize={11} 
                                            tickLine={false} 
                                            axisLine={false}
                                            dy={10}
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
                                            formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                                        />
                                        <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                        <Bar dataKey="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 border-border/50 bg-card/60 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Expense Breakdown</CardTitle>
                            <CardDescription>Major spending categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px] w-full relative">
                                {expenseCategories.length > 0 ? (
                                    <>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total</span>
                                            <span className="text-2xl font-black">${totalExpense.toLocaleString()}</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={expenseCategories}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={75}
                                                    outerRadius={95}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {expenseCategories.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity" />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                        backgroundColor: 'hsl(var(--card))',
                                                        padding: '10px'
                                                    }}
                                                    formatter={(value: any) => [`$${value.toLocaleString()}`, '']} 
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                                        No expense data available
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
                                {expenseCategories.slice(0, 5).map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs font-medium">
                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span>{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Recent Transactions */}
                    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" /> Recent Activity
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">View All</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {recentTransactions.length > 0 ? (
                                    recentTransactions.map((transaction) => (
                                        <div key={transaction.id} className="group flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-muted/50">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-110 ${
                                                    transaction.type === 'income' 
                                                        ? 'bg-emerald-500/10 text-emerald-600' 
                                                        : 'bg-rose-500/10 text-rose-600'
                                                }`}>
                                                    {transaction.type === 'income' ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold leading-tight">{transaction.description}</p>
                                                    <p className="mt-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                                        {transaction.category} <span className="mx-1 opacity-30">•</span> {transaction.date}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-bold ${
                                                    transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                        <Activity className="h-10 w-10 mb-2" />
                                        <p className="text-sm font-medium">No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Goals Progress */}
                    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" /> Active Goals
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">View Goals</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {goals.length > 0 ? (
                                    goals.map((goal) => {
                                        const progress = (goal.current_amount / goal.target_amount) * 100;
                                        return (
                                            <div key={goal.id} className="group space-y-3">
                                                <div className="flex justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-background shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-110">
                                                            {goal.image ? (
                                                                <img src={`/storage/${goal.image}`} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center bg-muted">
                                                                    <Target className="h-5 w-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold">{goal.name}</p>
                                                            <p className="mt-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                Progress: {progress.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-primary">
                                                            ${goal.current_amount.toLocaleString()} <span className="text-[10px] font-medium text-muted-foreground">/ ${goal.target_amount.toLocaleString()}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-secondary/50 shadow-inner overflow-hidden">
                                                    <div
                                                        className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out"
                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                        <Target className="h-10 w-10 mb-2" />
                                        <p className="text-sm font-medium">No active goals</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
