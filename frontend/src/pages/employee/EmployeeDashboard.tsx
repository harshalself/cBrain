import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { mockQuestions, mockDocuments } from '@/lib/mockData';
import { formatRelativeTime } from '@/lib/utils';
import { Brain, BookOpen, Clock, ThumbsUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmployeeDashboard: React.FC = () => {
    const { user } = useAuth();

    // Get recent questions for the current user
    const recentQuestions = mockQuestions.slice(0, 3);

    // Get featured documents
    const featuredDocs = mockDocuments.filter(d => d.status === 'active').slice(0, 4);

    if (!user) return null;

    return (
        <div className="min-h-screen">
            <DashboardHeader
                title="Dashboard"
                user={{
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
                    joinedDate: new Date().toISOString(),
                    status: 'active' as const,
                }}
            />

            <div className="p-6 lg:p-8 space-y-8">
                {/* Welcome Section */}
                <div className="glass rounded-2xl p-8 bg-gradient-to-r from-primary/5 to-accent/5">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Brain className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-foreground">
                                Welcome back, {user.name.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                What would you like to learn today? Ask cBrain anything about company policies, processes, or documentation.
                            </p>
                        </div>
                        <Link
                            to="/employee/ask"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/25"
                        >
                            <Brain className="w-5 h-5" />
                            Ask cBrain
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-info-bg))] flex items-center justify-center">
                                <Brain className="w-5 h-5 text-[hsl(var(--status-info))]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">12</p>
                                <p className="text-sm text-muted-foreground">Questions Asked</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success-bg))] flex items-center justify-center">
                                <ThumbsUp className="w-5 h-5 text-[hsl(var(--status-success))]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">10</p>
                                <p className="text-sm text-muted-foreground">Helpful Answers</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--accent)/.1)] flex items-center justify-center">
                                <Clock className="w-5 h-5 text-[hsl(var(--accent))]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">2.4s</p>
                                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Recent Questions */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Recent Questions</h2>
                            <Link to="/employee/ask" className="text-sm text-primary hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentQuestions.map((q) => (
                                <div key={q.id} className="p-4 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                                    <p className="font-medium text-foreground">{q.question}</p>
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{q.answer}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatRelativeTime(q.timestamp)}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                            {q.category}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Featured Documents */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Featured Documents</h2>
                            <Link to="/employee/documents" className="text-sm text-primary hover:underline">
                                Browse All
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {featuredDocs.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/20 transition-colors cursor-pointer">
                                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-accent" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">{doc.title}</p>
                                        <p className="text-xs text-muted-foreground">{doc.category} • {doc.size}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Tips */}
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">💡 Quick Tips</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-[hsl(var(--status-info-bg))] border border-[hsl(var(--status-info-border))]">
                            <p className="text-sm font-medium text-foreground">Be Specific</p>
                            <p className="text-xs text-muted-foreground mt-1">Ask detailed questions for better answers</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[hsl(var(--status-success-bg))] border border-[hsl(var(--status-success-border))]">
                            <p className="text-sm font-medium text-foreground">Rate Answers</p>
                            <p className="text-xs text-muted-foreground mt-1">Help us improve by rating responses</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[hsl(var(--accent)/.05)] border border-[hsl(var(--accent)/.1)]">
                            <p className="text-sm font-medium text-foreground">Browse Docs</p>
                            <p className="text-xs text-muted-foreground mt-1">Explore the knowledge base yourself</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
