import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

export const DashboardLayout: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Don't render if no user
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <Sidebar
                user={{
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
                    joinedDate: new Date().toISOString(),
                    status: 'active' as const,
                }}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};
