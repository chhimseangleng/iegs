import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, ArrowDownCircle, Info, Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Saving {
    id: number;
    amount: number;
    saving_date: string;
    note: string;
    goal_id: number;
    goal?: { name: string };
}

interface Goal {
    id: number;
    name: string;
}

interface Props {
    savings: Saving[];
    goals: Goal[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Saving',
        href: '/saving',
    },
];

export default function Saving({ savings, goals }: Props) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingSaving, setEditingSaving] = useState<Saving | null>(null);

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        goal_id: '',
        amount: '',
        saving_date: new Date().toISOString().split('T')[0],
        note: '',
    });

    const totalSavings = savings.reduce((sum, s) => sum + Number(s.amount), 0);
    const lastDeposit = savings.length > 0 ? Number(savings[0].amount) : 0;

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        post('/saving', {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
            },
        });
    };

    const submitUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSaving) {
            put(`/saving/${editingSaving.id}`, {
                onSuccess: () => {
                    setIsEditOpen(false);
                    reset();
                },
            });
        }
    };

    const deleteSaving = (id: number) => {
        if (confirm('Are you sure you want to delete this saving record?')) {
            destroy(`/saving/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Saving" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Savings Contributions</h2>
                    <Button onClick={() => { setIsAddOpen(true); reset(); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Deposit
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                            <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalSavings.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Cumulative deposits</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Last Deposit</CardTitle>
                            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${lastDeposit.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Most recent</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tips</CardTitle>
                            <Info className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">Consistently saving small amounts leads to large results.</p>
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Savings History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {savings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>No savings history found.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Goal</TableHead>
                                        <TableHead>Note</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {savings.map((saving) => (
                                        <TableRow key={saving.id}>
                                            <TableCell>{new Date(saving.saving_date).toLocaleDateString()}</TableCell>
                                            <TableCell>{saving.goal?.name}</TableCell>
                                            <TableCell>{saving.note}</TableCell>
                                            <TableCell className="text-right font-medium text-blue-600">
                                                +${Number(saving.amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        setEditingSaving(saving);
                                                        setData({
                                                            goal_id: saving.goal_id.toString(),
                                                            amount: saving.amount.toString(),
                                                            saving_date: saving.saving_date,
                                                            note: saving.note || '',
                                                        });
                                                        setIsEditOpen(true);
                                                    }}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteSaving(saving.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Deposit</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitAdd}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="goal">Goal</Label>
                                <Select value={data.goal_id} onValueChange={val => setData('goal_id', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select goal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {goals.map(goal => (
                                            <SelectItem key={goal.id} value={goal.id.toString()}>{goal.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.goal_id && <p className="text-sm text-destructive">{errors.goal_id}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input id="amount" type="number" step="0.01" value={data.amount} onChange={e => setData('amount', e.target.value)} />
                                {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" value={data.saving_date} onChange={e => setData('saving_date', e.target.value)} />
                                {errors.saving_date && <p className="text-sm text-destructive">{errors.saving_date}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="note">Note</Label>
                                <Input id="note" value={data.note} onChange={e => setData('note', e.target.value)} />
                                {errors.note && <p className="text-sm text-destructive">{errors.note}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>Save Deposit</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Deposit</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitUpdate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-goal">Goal</Label>
                                <Select value={data.goal_id} onValueChange={val => setData('goal_id', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {goals.map(goal => (
                                            <SelectItem key={goal.id} value={goal.id.toString()}>{goal.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.goal_id && <p className="text-sm text-destructive">{errors.goal_id}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-amount">Amount</Label>
                                <Input id="edit-amount" type="number" step="0.01" value={data.amount} onChange={e => setData('amount', e.target.value)} />
                                {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-date">Date</Label>
                                <Input id="edit-date" type="date" value={data.saving_date} onChange={e => setData('saving_date', e.target.value)} />
                                {errors.saving_date && <p className="text-sm text-destructive">{errors.saving_date}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-note">Note</Label>
                                <Input id="edit-note" value={data.note} onChange={e => setData('note', e.target.value)} />
                                {errors.note && <p className="text-sm text-destructive">{errors.note}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>Update Deposit</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
