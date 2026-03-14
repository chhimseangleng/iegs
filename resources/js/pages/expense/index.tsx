import { Head, useForm } from '@inertiajs/react';
import {
    Calendar,
    ChevronDown,
    ChevronRight,
    CreditCard,
    Pencil,
    Plus,
    Trash2,
    TrendingDown,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Expense {
    id: number;
    category_id: number;
    amount: string | number;
    description: string | null;
    expense_date: string;
    category?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

interface DayGroup {
    date: string;
    total: number;
    count: number;
    expenses: Expense[];
}

interface Category {
    id: number;
    name: string;
}

interface ExpenseStats {
    total_expense: number;
    highest_expense: number;
    transaction_count: number;
}

interface Props {
    grouped_expenses: DayGroup[];
    categories: Category[];
    stats: ExpenseStats;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Expense',
        href: '/expense',
    },
];

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
        return 'Today';
    }
    if (dateOnly.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatShortDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

// Category color palette for distinct visual grouping
const categoryColors: Record<string, string> = {};
const colorPalette = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
    'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
];

function getCategoryColor(categoryName: string): string {
    if (!categoryColors[categoryName]) {
        const index =
            Object.keys(categoryColors).length % colorPalette.length;
        categoryColors[categoryName] = colorPalette[index];
    }
    return categoryColors[categoryName];
}

export default function Expense({
    grouped_expenses,
    categories,
    stats,
}: Props) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(
        () => {
            // Expand all days by default
            const initial: Record<string, boolean> = {};
            grouped_expenses?.forEach((group) => {
                initial[group.date] = true;
            });
            return initial;
        },
    );

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        reset,
        errors,
        processing,
    } = useForm({
        category_id: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
    });

    const totalExpense = Number(stats?.total_expense || 0);
    const highestExpense = Number(stats?.highest_expense || 0);
    const transactionCount = stats?.transaction_count || 0;

    const toggleDay = (date: string) => {
        setExpandedDays((prev) => ({
            ...prev,
            [date]: !prev[date],
        }));
    };

    const expandAll = () => {
        const all: Record<string, boolean> = {};
        grouped_expenses?.forEach((group) => {
            all[group.date] = true;
        });
        setExpandedDays(all);
    };

    const collapseAll = () => {
        setExpandedDays({});
    };

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        post('/expense', {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
            },
        });
    };

    const submitUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingExpense) {
            put(`/expense/${editingExpense.id}`, {
                onSuccess: () => {
                    setIsEditOpen(false);
                    reset();
                },
            });
        }
    };

    const deleteExpense = (id: number) => {
        if (confirm('Are you sure you want to delete this record?')) {
            destroy(`/expense/${id}`);
        }
    };

    const allExpanded =
        grouped_expenses?.length > 0 &&
        grouped_expenses.every((g) => expandedDays[g.date]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expense" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 sm:p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Expense Tracking
                    </h2>
                    <Button
                        onClick={() => {
                            setIsAddOpen(true);
                            reset();
                        }}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Expense
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${totalExpense.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Cumulative
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Highest Expense
                            </CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${highestExpense.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Single transaction
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Transactions
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {transactionCount}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total records
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Daily Expense List */}
                <Card className="flex-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Daily Expenses</CardTitle>
                        {grouped_expenses?.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={allExpanded ? collapseAll : expandAll}
                                className="text-xs text-muted-foreground"
                            >
                                {allExpanded ? 'Collapse All' : 'Expand All'}
                            </Button>
                        )}
                    </CardHeader>

                    <CardContent>
                        {!grouped_expenses || grouped_expenses.length === 0 ? (
                            <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                                <p>No expense records found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {grouped_expenses.map((dayGroup) => (
                                    <div
                                        key={dayGroup.date}
                                        className="overflow-hidden rounded-lg border transition-all duration-200"
                                    >
                                        {/* Day Header */}
                                        <button
                                            onClick={() =>
                                                toggleDay(dayGroup.date)
                                            }
                                            className="hover:bg-muted/50 flex w-full items-center justify-between px-4 py-3 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                    {expandedDays[
                                                        dayGroup.date
                                                    ] ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold">
                                                        {formatDate(
                                                            dayGroup.date,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {dayGroup.count}{' '}
                                                        {dayGroup.count === 1
                                                            ? 'transaction'
                                                            : 'transactions'}
                                                        {' · '}
                                                        {formatShortDate(
                                                            dayGroup.date,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                                    -$
                                                    {Number(
                                                        dayGroup.total,
                                                    ).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    daily total
                                                </p>
                                            </div>
                                        </button>

                                        {/* Expanded Expenses List */}
                                        {expandedDays[dayGroup.date] && (
                                            <div className="border-t bg-muted/20">
                                                {dayGroup.expenses.map(
                                                    (expense, idx) => (
                                                        <div
                                                            key={expense.id}
                                                            className={`flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30 ${
                                                                idx <
                                                                dayGroup
                                                                    .expenses
                                                                    .length -
                                                                    1
                                                                    ? 'border-b border-dashed border-muted-foreground/20'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                                                                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        {expense
                                                                            .category
                                                                            ?.name && (
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className={`text-xs font-medium ${getCategoryColor(expense.category.name)}`}
                                                                            >
                                                                                {
                                                                                    expense
                                                                                        .category
                                                                                        .name
                                                                                }
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    {expense.description && (
                                                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                                            {
                                                                                expense.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">
                                                                    -$
                                                                    {Number(
                                                                        expense.amount,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </span>
                                                                <div className="flex gap-0.5">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            setEditingExpense(
                                                                                expense,
                                                                            );
                                                                            setData(
                                                                                {
                                                                                    category_id:
                                                                                        expense.category_id.toString(),
                                                                                    amount: expense.amount.toString(),
                                                                                    description:
                                                                                        expense.description ||
                                                                                        '',
                                                                                    expense_date:
                                                                                        expense.expense_date,
                                                                                },
                                                                            );
                                                                            setIsEditOpen(
                                                                                true,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            deleteExpense(
                                                                                expense.id,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Expense Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitAdd}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={data.category_id}
                                    onValueChange={(val) =>
                                        setData('category_id', val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories?.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id.toString()}
                                            >
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.category_id}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) =>
                                        setData('amount', e.target.value)
                                    }
                                />
                                {errors.amount && (
                                    <p className="text-sm text-destructive">
                                        {errors.amount}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={data.expense_date}
                                    onChange={(e) =>
                                        setData('expense_date', e.target.value)
                                    }
                                />
                                {errors.expense_date && (
                                    <p className="text-sm text-destructive">
                                        {errors.expense_date}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Description</Label>
                                <Input
                                    id="desc"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                Save Record
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Expense Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitUpdate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-category">Category</Label>
                                <Select
                                    value={data.category_id}
                                    onValueChange={(val) =>
                                        setData('category_id', val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories?.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id.toString()}
                                            >
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.category_id}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-amount">Amount</Label>
                                <Input
                                    id="edit-amount"
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) =>
                                        setData('amount', e.target.value)
                                    }
                                />
                                {errors.amount && (
                                    <p className="text-sm text-destructive">
                                        {errors.amount}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-date">Date</Label>
                                <Input
                                    id="edit-date"
                                    type="date"
                                    value={data.expense_date}
                                    onChange={(e) =>
                                        setData('expense_date', e.target.value)
                                    }
                                />
                                {errors.expense_date && (
                                    <p className="text-sm text-destructive">
                                        {errors.expense_date}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-desc">Description</Label>
                                <Input
                                    id="edit-desc"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                Update Record
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
