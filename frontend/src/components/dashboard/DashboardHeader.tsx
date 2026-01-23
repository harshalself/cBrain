import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import NotificationBell from '@/components/notifications/NotificationBell';

interface DashboardHeaderProps {
    title: string;
    user: User;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, user }) => {
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
            <div className="flex items-center justify-between px-6 lg:px-8 py-4">
                {/* Page Title */}
                <div className="flex-1">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
                </div>

                {/* Search and Actions */}
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/20 border border-border">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent text-sm focus:outline-none w-48 lg:w-64"
                        />
                    </div>

                    {/* Notifications */}
                    <NotificationBell />

                    {/* User Avatar (desktop only) */}
                    <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-border">
                        <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full" />
                    </div>
                </div>
            </div>
        </header>
    );
};
