import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Folder,
    LayoutGrid,
    CreditCard,
    Target,
    Archive,
    Wallet,
    PiggyBank,
    DollarSign,
    Users,
} from 'lucide-react';

import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';

import AppLogo from './app-logo';

// Main navigation items
const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    { title: 'Income', href: '/income', icon: DollarSign },
    { title: 'Expense', href: '/expense', icon: CreditCard },
    { title: 'Goal', href: '/goal', icon: Target },
    { title: 'Saving', href: '/saving', icon: PiggyBank },
    { title: 'Wallet', href: '/wallet', icon: Wallet },
    { title: 'Category', href: '/category', icon: Archive },
    { title: 'History', href: '/history', icon: Folder },
    { title: 'Tracking', href: '/tracking', icon: Users },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarHeader className="flex flex-col items-center justify-center h-48">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarHeader>

                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
