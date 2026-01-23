import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { getCurrentUser, mockUsers } from '@/lib/mockData';
import { User } from '@/types';
import { UserPlus, Search, Mail } from 'lucide-react';
import InviteUserModal from '@/components/invitations/InviteUserModal';
import PendingInvitations from '@/components/invitations/PendingInvitations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const UserManagement: React.FC = () => {
    const user = getCurrentUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const filteredUsers = mockUsers.filter((u) => {
        const matchesSearch =
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.department?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getStatusBadge = (status: User['status']) => {
        return status === 'active' ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                Active
            </span>
        ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20">
                Inactive
            </span>
        );
    };

    const getRoleBadge = (role: User['role']) => {
        return role === 'admin' ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                Admin
            </span>
        ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/30 text-foreground border border-border">
                Employee
            </span>
        );
    };

    const columns = [
        {
            key: 'name',
            label: 'User',
            render: (u: User) => (
                <div className="flex items-center gap-3">
                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full" />
                    <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            render: (u: User) => getRoleBadge(u.role),
        },
        {
            key: 'department',
            label: 'Department',
        },
        {
            key: 'joinedDate',
            label: 'Joined Date',
        },
        {
            key: 'status',
            label: 'Status',
            render: (u: User) => getStatusBadge(u.status),
        },
        {
            key: 'lastActive',
            label: 'Last Active',
            render: (u: User) =>
                u.lastActive
                    ? new Date(u.lastActive).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                    : 'N/A',
        },
    ];

    const handleInviteSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="min-h-screen">
            <DashboardHeader title="User Management" user={user} />

            <div className="p-6 lg:p-8 space-y-6">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1 w-full">
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/20 border border-border w-full sm:w-96">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-sm focus:outline-none flex-1"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'employee')}
                            className="px-4 py-3 rounded-xl bg-secondary/20 border border-border text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admins</option>
                            <option value="employee">Employees</option>
                        </select>
                    </div>

                    <Button
                        className="shadow-lg shadow-primary/25"
                        onClick={() => setShowInviteModal(true)}
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Invite User
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{mockUsers.length}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Admins</p>
                        <p className="text-2xl font-bold text-primary mt-1">
                            {mockUsers.filter((u) => u.role === 'admin').length}
                        </p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Employees</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                            {mockUsers.filter((u) => u.role === 'employee').length}
                        </p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Active Today</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                            {mockUsers.filter((u) => u.status === 'active').length}
                        </p>
                    </div>
                </div>

                {/* Tabs for Users and Invitations */}
                <Tabs defaultValue="users" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
                        <DataTable
                            data={filteredUsers}
                            columns={columns}
                            onRowClick={(u) => console.log('View user:', u.id)}
                        />
                    </TabsContent>

                    <TabsContent value="invitations">
                        <PendingInvitations refreshTrigger={refreshTrigger} />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Invite Modal */}
            <InviteUserModal
                open={showInviteModal}
                onOpenChange={setShowInviteModal}
                onSuccess={handleInviteSuccess}
            />
        </div>
    );
};

export default UserManagement;
