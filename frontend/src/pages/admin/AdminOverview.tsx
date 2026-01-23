import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { getCurrentUser, mockStats, mockActivities } from '@/lib/mockData';
import { formatRelativeTime } from '@/lib/utils';
import { Activity } from '@/types';
import { Upload, MessageSquare, UserPlus, FileEdit } from 'lucide-react';

const activityIcons: Record<Activity['type'], React.ElementType> = {
    upload: Upload,
    question: MessageSquare,
    user_joined: UserPlus,
    document_updated: FileEdit,
};

const AdminOverview: React.FC = () => {
    const user = getCurrentUser();

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Overview" user={user} />

            <div className="p-6 lg:p-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {mockStats.map((stat) => (
                        <StatCard key={stat.id} stat={stat} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="xl:col-span-2 glass rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-foreground mb-6">Recent Activity</h2>
                        <div className="space-y-4">
                            {mockActivities.map((activity) => {
                                const Icon = activityIcons[activity.type];
                                return (
                                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-secondary/20 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground">
                                                <span className="font-semibold">{activity.user}</span>{' '}
                                                {activity.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatRelativeTime(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Knowledge Health */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-foreground mb-6">Knowledge Health</h2>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Active</span>
                                    <span className="text-2xl font-bold text-green-700 dark:text-green-400">5</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Documents up to date</p>
                            </div>

                            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Outdated</span>
                                    <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">2</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Need updates</p>
                            </div>

                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Pending</span>
                                    <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">1</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Awaiting review</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-foreground mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                            <Upload className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-semibold text-foreground">Upload Document</h3>
                            <p className="text-xs text-muted-foreground mt-1">Add new knowledge</p>
                        </button>

                        <button className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                            <UserPlus className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-semibold text-foreground">Add User</h3>
                            <p className="text-xs text-muted-foreground mt-1">Invite team member</p>
                        </button>

                        <button className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                            <MessageSquare className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-semibold text-foreground">View Questions</h3>
                            <p className="text-xs text-muted-foreground mt-1">Recent inquiries</p>
                        </button>

                        <button className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                            <FileEdit className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-semibold text-foreground">Update Docs</h3>
                            <p className="text-xs text-muted-foreground mt-1">Review outdated</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
