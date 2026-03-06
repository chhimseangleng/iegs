import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Flag, CheckCircle, Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, Calendar } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
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
import { Badge } from '@/components/ui/badge';

interface Goal {
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    start_date: string;
    target_date: string;
    status: string;
    image: string | null;
}

interface Props {
    goals: Goal[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Goal',
        href: '/goal',
    },
];

export default function Goal({ goals }: Props) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, delete: destroy, reset, errors, processing } = useForm({
        name: '',
        target_amount: '',
        start_date: new Date().toISOString().split('T')[0],
        target_date: '',
        status: 'in_progress',
        current_amount: '0',
        image: null as File | null,
        _method: 'POST',
    });

    const activeGoals = goals.filter(g => g.status !== 'completed').length;
    const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        reset();
        setPreviewImage(null);
        setData('image', null);
    };

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        post('/goal', {
            onSuccess: () => {
                setIsAddOpen(false);
                resetForm();
            },
        });
    };

    const submitUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingGoal) {
            post(`/goal/${editingGoal.id}`, {
                onSuccess: () => {
                    setIsEditOpen(false);
                    resetForm();
                },
            });
        }
    };

    const deleteGoal = (id: number) => {
        if (confirm('Are you sure you want to delete this goal?')) {
            destroy(`/goal/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Goal" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">Savings Goals</h2>
                    <Button onClick={() => { setIsAddOpen(true); resetForm(); }} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add Goal
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeGoals}</div>
                            <p className="text-xs text-muted-foreground">In progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Target Amount</CardTitle>
                            <Flag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalTarget.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Total across goals</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{completedGoals}</div>
                            <p className="text-xs text-muted-foreground">Goals reached</p>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {goals.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>No goals set yet. Start by creating a financial goal.</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {goals.map((goal) => {
                                const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                                return (
                                    <Card key={goal.id} className="overflow-hidden flex flex-col group transition-all hover:shadow-md">
                                        <div 
                                            className="aspect-video relative overflow-hidden bg-muted cursor-zoom-in"
                                            onClick={() => goal.image && setViewingImage(`/storage/${goal.image}`)}
                                        >
                                            {goal.image ? (
                                                <img 
                                                    src={`/storage/${goal.image}`} 
                                                    alt={goal.name} 
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <Target className="h-10 w-10 text-muted-foreground opacity-20" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'} className="capitalize shadow-sm text-[10px] px-1.5 py-0">
                                                    {goal.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>

                                        <CardHeader className="p-3 pb-1">
                                            <CardTitle className="text-base line-clamp-1">{goal.name}</CardTitle>
                                        </CardHeader>

                                        <CardContent className="p-3 pt-0 flex-1 flex flex-col gap-3">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-muted-foreground font-medium">Progress</span>
                                                    <span className="font-bold">{progress.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className="bg-primary h-full transition-all duration-1000 ease-out" 
                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 py-2 border-y border-border/50">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Current</span>
                                                    <span className="text-sm font-bold text-primary">${Number(goal.current_amount).toLocaleString()}</span>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Target</span>
                                                    <span className="text-sm font-bold">${Number(goal.target_amount).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                                            </div>
                                        </CardContent>

                                        <div className="p-3 pt-0 mt-auto flex justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="flex-1 h-8 text-xs"
                                                onClick={() => {
                                                    setEditingGoal(goal);
                                                    setData({
                                                        name: goal.name,
                                                        target_amount: goal.target_amount.toString(),
                                                        start_date: goal.start_date,
                                                        target_date: goal.target_date,
                                                        status: goal.status,
                                                        current_amount: goal.current_amount.toString(),
                                                        image: null,
                                                        _method: 'POST',
                                                    });
                                                    setPreviewImage(goal.image ? `/storage/${goal.image}` : null);
                                                    setIsEditOpen(true);
                                                }}
                                            >
                                                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                                            </Button>
                                            <Button 
                                                variant="destructive" 
                                                size="icon" 
                                                className="shrink-0 h-8 w-8"
                                                onClick={() => deleteGoal(goal.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Savings Goal</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitAdd}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Goal Image</Label>
                                <div 
                                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors relative"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewImage ? (
                                        <div className="relative h-32 w-32">
                                            <img 
                                                src={previewImage} 
                                                alt="Preview" 
                                                className="h-full w-full object-cover rounded-md" 
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewImage(null);
                                                    setData('image', null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-muted-foreground">
                                            <div className="p-3 bg-muted rounded-full mb-2">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                            <span className="text-sm font-medium">Click to upload image</span>
                                            <span className="text-xs">PNG, JPG up to 2MB</span>
                                        </div>
                                    )}
                                    <input 
                                        ref={fileInputRef}
                                        type="file" 
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Goal Name</Label>
                                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="target_amount">Target Amount</Label>
                                <Input id="target_amount" type="number" step="0.01" value={data.target_amount} onChange={e => setData('target_amount', e.target.value)} />
                                {errors.target_amount && <p className="text-sm text-destructive">{errors.target_amount}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">Start Date</Label>
                                    <Input id="start_date" type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} />
                                    {errors.start_date && <p className="text-sm text-destructive">{errors.start_date}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="target_date">Target Date</Label>
                                    <Input id="target_date" type="date" value={data.target_date} onChange={e => setData('target_date', e.target.value)} />
                                    {errors.target_date && <p className="text-sm text-destructive">{errors.target_date}</p>}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>Create Goal</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Settings</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitUpdate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Goal Image</Label>
                                <div 
                                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors relative"
                                    onClick={() => editFileInputRef.current?.click()}
                                >
                                    {previewImage ? (
                                        <div className="relative h-32 w-32">
                                            <img 
                                                src={previewImage} 
                                                alt="Preview" 
                                                className="h-full w-full object-cover rounded-md" 
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewImage(null);
                                                    setData('image', null); // This will mark it for deletion in backend if we implement that logic, but currently just clears selection
                                                    if (editFileInputRef.current) editFileInputRef.current.value = '';
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-muted-foreground">
                                            <div className="p-3 bg-muted rounded-full mb-2">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                            <span className="text-sm font-medium">Click to change image</span>
                                            <span className="text-xs">PNG, JPG up to 2MB</span>
                                        </div>
                                    )}
                                    <input 
                                        ref={editFileInputRef}
                                        type="file" 
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Goal Name</Label>
                                <Input id="edit-name" value={data.name} onChange={e => setData('name', e.target.value)} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-target_amount">Target Amount</Label>
                                <Input id="edit-target_amount" type="number" step="0.01" value={data.target_amount} onChange={e => setData('target_amount', e.target.value)} />
                                {errors.target_amount && <p className="text-sm text-destructive">{errors.target_amount}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-current_amount">Current Saved</Label>
                                <Input id="edit-current_amount" type="number" step="0.01" value={data.current_amount} onChange={e => setData('current_amount', e.target.value)} />
                                {errors.current_amount && <p className="text-sm text-destructive">{errors.current_amount}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select value={data.status} onValueChange={val => setData('status', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-start_date">Start Date</Label>
                                    <Input id="edit-start_date" type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} />
                                    {errors.start_date && <p className="text-sm text-destructive">{errors.start_date}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-target_date">Target Date</Label>
                                    <Input id="edit-target_date" type="date" value={data.target_date} onChange={e => setData('target_date', e.target.value)} />
                                    {errors.target_date && <p className="text-sm text-destructive">{errors.target_date}</p>}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>Update Goal</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Image Viewer Modal */}
            <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden border-none bg-transparent shadow-none">
                    <div className="relative group">
                        {viewingImage && (
                            <img 
                                src={viewingImage} 
                                alt="Goal Preview" 
                                className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl" 
                            />
                        )}
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setViewingImage(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

