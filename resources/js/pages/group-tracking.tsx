import { Head, router } from '@inertiajs/react';
import {
    Check, ChevronDown, ChevronUp, EyeOff, Plus, Search, User,
    UserPlus, Users, Wallet, X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Group Tracking', href: '/group-tracking' }];

interface UserData { id: number; name: string; email: string; }
interface GroupMemberEntry { member_id: number; user: UserData; }
interface GroupData {
    id: number; name: string;
    creator: UserData;
    is_creator: boolean;
    accepted_members: GroupMemberEntry[];
    pending_members: GroupMemberEntry[];
}
interface GroupInvite { member_id: number; group: { id: number; name: string; creator: UserData }; }
interface GroupMemberData { user: UserData; member_id: number; data: { totalIncome: number | null; totalExpense: number; totalSaving: number; balance: number; hideIncome?: boolean }; }

interface GroupTrackingProps {
    groups: GroupData[];
    pendingGroupInvites: GroupInvite[];
}

export default function GroupTracking({ groups, pendingGroupInvites }: GroupTrackingProps) {
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
    const [groupMembersData, setGroupMembersData] = useState<GroupMemberData[]>([]);
    const [isLoadingGroupData, setIsLoadingGroupData] = useState(false);
    const [groupSearchQuery, setGroupSearchQuery] = useState('');
    const [groupSearchResults, setGroupSearchResults] = useState<UserData[]>([]);
    const [groupExistingMemberIds, setGroupExistingMemberIds] = useState<number[]>([]);
    const [showGroupSearch, setShowGroupSearch] = useState(false);
    const [isGroupSearching, setIsGroupSearching] = useState(false);
    const [isProcessingRequest, setIsProcessingRequest] = useState(false);

    // Group actions
    const createGroup = () => {
        if (!newGroupName.trim()) return;
        setIsProcessingRequest(true);
        router.post('/tracking/groups', { name: newGroupName }, {
            onSuccess: () => { setNewGroupName(''); setShowCreateGroup(false); },
            onFinish: () => setIsProcessingRequest(false)
        });
    };
    const deleteGroup = (id: number) => {
        setIsProcessingRequest(true);
        router.delete(`/tracking/groups/${id}`, {
            onFinish: () => setIsProcessingRequest(false)
        });
    };
    const addGroupMember = (groupId: number, userId: number) => {
        setIsProcessingRequest(true);
        router.post(`/tracking/groups/${groupId}/members`, { user_id: userId }, {
            onSuccess: () => {
                setGroupExistingMemberIds(prev => [...prev, userId]);
            },
            onFinish: () => setIsProcessingRequest(false)
        });
    };
    const acceptGroupInvite = (memberId: number) => {
        setIsProcessingRequest(true);
        router.post(`/tracking/groups/${memberId}/accept`, {}, {
            onFinish: () => setIsProcessingRequest(false)
        });
    };
    const removeGroupMember = (memberId: number) => {
        setIsProcessingRequest(true);
        router.delete(`/tracking/groups/members/${memberId}`, {
            onFinish: () => setIsProcessingRequest(false)
        });
    };

    const fetchGroupData = async (groupId: number) => {
        setIsLoadingGroupData(true);
        try {
            const res = await fetch(`/tracking/groups/${groupId}/data`);
            const data = await res.json();
            setGroupMembersData(data.members || []);
        } catch { /* ignore */ } finally { setIsLoadingGroupData(false); }
    };

    const handleGroupSearch = async (groupId: number) => {
        if (groupSearchQuery.length < 3) return;
        setIsGroupSearching(true);
        try {
            const res = await fetch(`/tracking/groups/${groupId}/search?search=${groupSearchQuery}`);
            const data = await res.json();
            setGroupSearchResults(data.users || []);
            setGroupExistingMemberIds(data.existingMemberIds || []);
        } catch { /* ignore */ } finally { setIsGroupSearching(false); }
    };

    const toggleGroup = (groupId: number) => {
        if (expandedGroupId === groupId) {
            setExpandedGroupId(null);
        } else {
            setExpandedGroupId(groupId);
            fetchGroupData(groupId);
            setShowGroupSearch(false);
            setGroupSearchQuery('');
            setGroupSearchResults([]);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Group Tracking" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                            <Users className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight sm:text-2xl">Group Tracking</h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">Create groups and track expenses together. Income is hidden for privacy.</p>
                        </div>
                    </div>
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowCreateGroup(!showCreateGroup)}>
                        <Plus className="mr-1.5 h-4 w-4" /> New Group
                    </Button>
                </div>

                {/* Create Group Form */}
                {showCreateGroup && (
                    <Card className="border-violet-500/20 bg-violet-500/5">
                        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Group Name</label>
                                <Input
                                    placeholder="e.g. Family Budget, Roommates..."
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button className="bg-violet-600 hover:bg-violet-700" onClick={createGroup} disabled={!newGroupName.trim()}>
                                    Create
                                </Button>
                                <Button variant="ghost" onClick={() => { setShowCreateGroup(false); setNewGroupName(''); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pending Group Invitations */}
                {pendingGroupInvites.map((invite) => (
                    <Card key={invite.member_id} className="border-violet-500/20 bg-violet-500/5">
                        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-bold">
                                    {invite.group.creator.name} invited you to{' '}
                                    <span className="text-violet-600">{invite.group.name}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">Group tracking — income hidden</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="border-emerald-500/50 text-emerald-600" onClick={() => acceptGroupInvite(invite.member_id)}>
                                    <Check className="mr-1 h-4 w-4" /> Join
                                </Button>
                                <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => removeGroupMember(invite.member_id)}>
                                    <X className="mr-1 h-4 w-4" /> Decline
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Empty State */}
                {groups.length === 0 && !showCreateGroup && (
                    <Card className="border-border/50 bg-card/40">
                        <CardContent className="py-12 text-center">
                            <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                            <p className="text-sm font-bold text-muted-foreground">No groups yet</p>
                            <p className="text-xs text-muted-foreground">Create a group to start tracking expenses together.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Groups List */}
                {groups.map((group) => (
                    <Card key={group.id} className={`border-border/50 transition-all ${expandedGroupId === group.id ? 'bg-card/80 ring-1 ring-violet-500/20' : 'bg-card/40'}`}>
                        <CardHeader className="cursor-pointer pb-3" onClick={() => toggleGroup(group.id)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                                        <Users className="h-4 w-4 text-violet-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold">{group.name}</CardTitle>
                                        <CardDescription className="text-[10px]">
                                            {group.accepted_members.length} member{group.accepted_members.length !== 1 ? 's' : ''}
                                            {group.pending_members.length > 0 && ` · ${group.pending_members.length} pending`}
                                            {!group.is_creator && ` · Created by ${group.creator.name}`}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-1">
                                        <EyeOff className="h-3 w-3 text-violet-500" />
                                        <span className="text-[9px] font-bold text-violet-600">Income hidden</span>
                                    </div>
                                    {expandedGroupId === group.id
                                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    }
                                </div>
                            </div>
                        </CardHeader>

                        {expandedGroupId === group.id && (
                            <CardContent className="space-y-4 border-t pt-4">
                                {/* Actions */}
                                <div className="flex flex-wrap gap-2">
                                    {group.is_creator && (
                                        <>
                                            <Button size="sm" variant="outline" className="border-violet-500/30 text-violet-600" onClick={() => { setShowGroupSearch(!showGroupSearch); setGroupSearchQuery(''); setGroupSearchResults([]); }}>
                                                <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add Member
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => deleteGroup(group.id)}>
                                                <X className="mr-1 h-3.5 w-3.5" /> Delete Group
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* Add Member Search */}
                                {showGroupSearch && group.is_creator && (
                                    <div className="space-y-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Search user to add..."
                                                value={groupSearchQuery}
                                                onChange={(e) => setGroupSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleGroupSearch(group.id)}
                                                className="flex-1"
                                            />
                                            <Button size="sm" onClick={() => handleGroupSearch(group.id)} disabled={isGroupSearching || groupSearchQuery.length < 3}>
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {groupSearchResults.map((user) => {
                                                const isInGroup = groupExistingMemberIds.includes(user.id);
                                                return (
                                                    <div key={user.id} className="flex flex-col items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate font-bold">{user.name}</p>
                                                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                        {isInGroup ? (
                                                            <span className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-bold text-muted-foreground">
                                                                <Check className="h-3.5 w-3.5" /> Added
                                                            </span>
                                                        ) : (
                                                            <Button size="sm" onClick={() => addGroupMember(group.id, user.id)} className="w-full sm:w-auto" disabled={isProcessingRequest}>
                                                                {isProcessingRequest ? <span className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5 animate-spin" /> ...</span> : <><UserPlus className="mr-2 h-4 w-4" /> Invite</>}
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Pending Members */}
                                {group.pending_members.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Pending Invitations</h4>
                                        {group.pending_members.map((m) => (
                                            <div key={m.member_id} className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-2.5">
                                                <div>
                                                    <p className="text-sm font-bold">{m.user.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{m.user.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[9px] font-bold text-yellow-600">Pending</span>
                                                    {group.is_creator && (
                                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-500" onClick={() => removeGroupMember(m.member_id)}>
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Members Financial Data */}
                                {isLoadingGroupData ? (
                                    <div className="py-8 text-center text-sm text-muted-foreground">Loading member data...</div>
                                ) : (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Members</h4>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {groupMembersData.map((member) => (
                                                <Card key={member.user.id} className="border-border/50 bg-muted/20">
                                                    <CardHeader className="pb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10">
                                                                <User className="h-3.5 w-3.5 text-violet-500" />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-xs font-bold">{member.user.name}</CardTitle>
                                                                <CardDescription className="text-[9px]">{member.user.email}</CardDescription>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-1.5">
                                                        <div className="flex items-center justify-between rounded-md bg-background/50 px-2.5 py-1.5">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Balance</span>
                                                            <span className="text-sm font-black">${member.data.balance.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-md bg-background/50 px-2.5 py-1.5">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Expense</span>
                                                            <span className="text-sm font-bold text-rose-600">${member.data.totalExpense.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-md bg-background/50 px-2.5 py-1.5">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Saving</span>
                                                            <span className="text-sm font-bold text-amber-600">${member.data.totalSaving.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-md bg-violet-500/5 px-2.5 py-1.5">
                                                            <span className="text-[10px] font-bold text-violet-500 uppercase">Income</span>
                                                            <span className="flex items-center gap-1 text-xs font-bold text-violet-400">
                                                                <EyeOff className="h-3 w-3" /> Hidden
                                                            </span>
                                                        </div>
                                                        {group.is_creator && member.user.id !== group.creator.id && (
                                                            <Button size="sm" variant="ghost" className="mt-1 h-7 w-full text-[10px] text-rose-500" onClick={() => removeGroupMember(member.member_id)}>
                                                                Remove from group
                                                            </Button>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
        </AppLayout>
    );
}
