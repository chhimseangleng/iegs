import { Head, router } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Folder, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface HistoryItem {
    id: number;
    type: 'in' | 'out';
    amount: number;
    description: string;
    transaction_date: string;
    source_type: string;
}

interface HistoryPagination {
    data: HistoryItem[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    current_page: number;
    last_page: number;
}

interface Props {
    history: HistoryPagination;
    filters: {
        search: string | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'History',
        href: '/history',
    },
];

export default function History({ history, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        router.get(
            '/history',
            { search: debouncedSearch },
            {
                preserveState: true,
                replace: true,
            },
        );
    }, [debouncedSearch]);

    const historyData = history?.data || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="History" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 sm:p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Transaction History
                    </h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search transactions..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>All Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {historyData.length === 0 ? (
                            <div className="flex h-96 flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                                <Folder className="mb-4 h-12 w-12 opacity-20" />
                                <p>
                                    {search
                                        ? 'No matching transactions.'
                                        : 'No transactions found.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Source</TableHead>
                                            <TableHead className="text-right">
                                                Amount
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historyData.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {new Date(
                                                        item.transaction_date,
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {item.description}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {item.type === 'in' ? (
                                                            <>
                                                                <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-green-200 bg-green-50 text-green-600"
                                                                >
                                                                    In
                                                                </Badge>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-red-200 bg-red-50 text-red-600"
                                                                >
                                                                    Out
                                                                </Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {item.source_type
                                                        .split('\\')
                                                        .pop()}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-right font-bold ${item.type === 'in' ? 'text-green-600' : 'text-red-600'}`}
                                                >
                                                    {item.type === 'in'
                                                        ? '+'
                                                        : '-'}
                                                    $
                                                    {Number(
                                                        item.amount,
                                                    ).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="mt-4 flex justify-center gap-2">
                                    {history?.links?.map((link, index) => (
                                        <Button
                                            key={index}
                                            size="sm"
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url &&
                                                router.visit(link.url)
                                            }
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
