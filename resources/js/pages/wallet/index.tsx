import { Head } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Wallet',
        href: '/wallet',
    },
];

interface Props {
    balance: number;
    totalIncomes: number;
    totalExpenses: number;
}

export default function WalletView({
    balance,
    totalIncomes,
    totalExpenses,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Wallet" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 sm:p-6">
                <div className="grid gap-4 md:grid-cols-1">
                    <Card className="bg-primary text-primary-foreground">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold">
                                Total Balance
                            </CardTitle>
                            <Wallet className="h-6 w-6" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">
                                ${Number(balance).toFixed(2)}
                            </div>
                            <p className="mt-1 text-sm opacity-80">
                                Available across all accounts
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center space-x-2">
                            <ArrowUpCircle className="h-5 w-5 text-green-500" />
                            <CardTitle>Cash Flow In</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                +${Number(totalIncomes).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center space-x-2">
                            <ArrowDownCircle className="h-5 w-5 text-red-500" />
                            <CardTitle>Cash Flow Out</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                -${Number(totalExpenses).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
