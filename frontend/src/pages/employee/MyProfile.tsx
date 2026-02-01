import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Building, Calendar, Clock, Award, BookOpen, MessageSquare, ThumbsUp } from 'lucide-react';

const MyProfile: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    // Map backend fields to UI
    const profile = {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || 'Not Assigned',
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
        joinedDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
        lastActive: user.last_login || new Date().toISOString(), // Fallback to now if missing
        status: 'active' as const,
    };

    // Mock stats for the employee (could be fetched dynamically later)
    const stats = [
        { label: 'Questions Asked', value: 12, icon: MessageSquare, color: 'text-[hsl(var(--status-info))] bg-[hsl(var(--status-info-bg))]' },
        { label: 'Helpful Ratings', value: 10, icon: ThumbsUp, color: 'text-[hsl(var(--status-success))] bg-[hsl(var(--status-success-bg))]' },
        { label: 'Docs Viewed', value: 24, icon: BookOpen, color: 'text-[hsl(var(--accent))] bg-[hsl(var(--accent)/.1)]' },
        { label: 'Days Active', value: 45, icon: Award, color: 'text-orange-600 bg-orange-500/10' },
    ];

    return (
        <div className="min-h-screen">
            <DashboardHeader title="My Profile" user={profile} />

            <div className="p-6 lg:p-8 space-y-8 max-w-4xl">
                {/* Profile Header */}
                <div className="glass rounded-2xl p-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <img
                            src={profile.avatar}
                            alt={profile.name}
                            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary/20"
                        />
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                            <p className="text-muted-foreground capitalize">{profile.role}</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {profile.email}
                                </span>
                                {profile.department && (
                                    <span className="flex items-center gap-1">
                                        <Building className="w-4 h-4" />
                                        {profile.department}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="glass rounded-xl p-5 text-center">
                                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Account Info */}
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-foreground mb-6">Account Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                            <p className="text-foreground mt-1">{profile.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                            <p className="text-foreground mt-1">{profile.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Department</label>
                            <p className="text-foreground mt-1">{profile.department}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Role</label>
                            <p className="text-foreground mt-1 capitalize">{profile.role}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> Joined Date
                            </label>
                            <p className="text-foreground mt-1">{profile.joinedDate}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <Clock className="w-4 h-4" /> Last Active
                            </label>
                            <p className="text-foreground mt-1">
                                {profile.lastActive ? new Date(profile.lastActive).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-foreground mb-6">Preferences</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-border">
                            <div>
                                <p className="font-medium text-foreground">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive updates about new documents</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary transition-colors peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border">
                            <div>
                                <p className="font-medium text-foreground">Weekly Summary</p>
                                <p className="text-sm text-muted-foreground">Get a weekly digest of your activity</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary transition-colors peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
