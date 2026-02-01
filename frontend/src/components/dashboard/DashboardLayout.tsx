import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { ChatbotWidget } from '@/components/chat/ChatbotWidget';

export const DashboardLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Don't render if no user
    if (!user) {
        return null;
    }

    // Hide chatbot widget on the dedicated AskBrain page to avoid duplication
    const showChatbotWidget = !location.pathname.includes('/ask');

    return (
        <div className="min-h-screen bg-background flex relative">
            {/* Sidebar */}
            <Sidebar
                user={{
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
                    joinedDate: user.created_at || new Date().toISOString(),
                    status: 'active' as const,
                }}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>

            {/* Chatbot Widget */}
            {showChatbotWidget && <ChatbotWidget />}
        </div>
    );
};
