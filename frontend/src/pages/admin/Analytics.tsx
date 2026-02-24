import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import {
    TrendingUp,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Users,
    Bot,
    BarChart3,
    DollarSign
} from 'lucide-react';
import {
    analyticsService,
    BehaviorInsights,
    RetentionMetrics,
    TopAgent,
    ModelUsage,
    PopularQuestion,
} from '@/services/analyticsService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Analytics: React.FC = () => {
    const { user: authUser } = useAuth();
    const user = authUser ? {
        id: authUser.id.toString(),
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        avatar: authUser.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${authUser.email}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        joinedDate: authUser.created_at || new Date().toISOString(),
        status: 'active' as const,
    } : null;
    const { toast } = useToast();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [behaviorInsights, setBehaviorInsights] = useState<BehaviorInsights | null>(null);
    const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
    const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
    const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
    const [popularTopics, setPopularTopics] = useState<PopularQuestion[]>([]);

    // Load analytics data on mount
    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = useCallback(async () => {
        try {
            setIsLoading(true);

            // Load all analytics data in parallel
            const [insights, retention, agents, models, topics] = await Promise.allSettled([
                analyticsService.getBehaviorInsights(),
                analyticsService.getRetentionMetrics(),
                analyticsService.getTopAgents(5),
                analyticsService.getModelUsage(),
                analyticsService.getPopularTopics(10),
            ]);

            // Handle behavior insights
            if (insights.status === 'fulfilled') {
                setBehaviorInsights(insights.value);
            }

            // Handle popular topics
            if (topics.status === 'fulfilled') {
                setPopularTopics(topics.value);
            }

            // Handle retention metrics
            if (retention.status === 'fulfilled') {
                setRetentionMetrics(retention.value);
            }

            // Handle top agents
            if (agents.status === 'fulfilled') {
                setTopAgents(agents.value);
            }

            // Handle model usage
            if (models.status === 'fulfilled') {
                setModelUsage(models.value);
            }

        } catch (error: any) {
            console.error('Failed to load analytics:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load analytics data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Column definitions
    const popularQuestionsColumns = [
        {
            key: 'question',
            label: 'Topic',
            render: (item: PopularQuestion) => (
                <div>
                    <p className="font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                </div>
            ),
        },
        {
            key: 'count',
            label: 'Frequency',
            render: (item: PopularQuestion) => (
                <span className="font-semibold text-primary">{item.count}</span>
            ),
        },
    ];

    const topAgentsColumns = [
        {
            key: 'agentName',
            label: 'Agent',
            render: (item: TopAgent) => (
                <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.agentName}</span>
                </div>
            ),
        },
        {
            key: 'totalChats',
            label: 'Conversations',
        },
        {
            key: 'avgSatisfaction',
            label: 'Satisfaction',
            render: (item: TopAgent) => (
                <span className={`font-semibold ${(item.avgSatisfaction || 0) >= 80 ? 'text-green-600' : (item.avgSatisfaction || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {(item.avgSatisfaction || 0).toFixed(1)}%
                </span>
            ),
        },
        {
            key: 'score',
            label: 'Score',
            render: (item: TopAgent) => (
                <span className="font-semibold text-primary">{(item.avgSatisfaction || 0).toFixed(1)}</span>
            ),
        },
    ];

    const modelUsageColumns = [
        {
            key: 'model',
            label: 'Model',
            render: (item: ModelUsage) => (
                <span className="font-mono text-sm">{item.model}</span>
            ),
        },
        {
            key: 'usageCount',
            label: 'Requests',
            render: (item: ModelUsage) => (
                <span>{item.usageCount.toLocaleString()}</span>
            ),
        },
        {
            key: 'totalCost',
            label: 'Total Cost',
            render: (item: ModelUsage) => (
                <span>${item.totalCost.toFixed(4)}</span>
            ),
        },
        {
            key: 'avgResponseTime',
            label: 'Avg Latency',
            render: (item: ModelUsage) => (
                <span>{(item.avgResponseTime || 0).toFixed(0)}ms</span>
            ),
        },
        {
            key: 'avgSatisfaction',
            label: 'Satisfaction',
            render: (item: ModelUsage) => (
                <span className={`font-semibold ${(item.avgSatisfaction || 0) >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {(item.avgSatisfaction || 0).toFixed(1)}%
                </span>
            ),
        },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <DashboardHeader title="Analytics & Insights" user={user} />
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Analytics & Insights" user={user} />

            <div className="p-6 lg:p-8 space-y-8">
                {/* Refresh Button */}
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadAnalytics()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Retention Metrics Cards */}
                {retentionMetrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Daily Active Users</p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{retentionMetrics.daily_active_users}</p>
                        </div>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Weekly Active Users</p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{retentionMetrics.weekly_active_users}</p>
                        </div>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">7-Day Retention</p>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{(retentionMetrics.retention_rate_7d || 0).toFixed(1)}%</p>
                        </div>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Churn Rate</p>
                            </div>
                            <p className="text-2xl font-bold text-red-600">{(retentionMetrics.churn_rate || 0).toFixed(1)}%</p>
                        </div>
                    </div>
                )}

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Popular Topics</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Most frequently discussed topics across conversations
                        </p>
                        <div className="space-y-2">
                            {popularTopics.length > 0 ? (
                                popularTopics.slice(0, 3).map((topic, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-secondary/20">
                                        <span className="text-sm">{topic.question}</span>
                                        <span className="text-sm font-semibold text-primary">{topic.count}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No topic data available yet
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Bot className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Top Agents</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Best performing AI agents by satisfaction score
                        </p>
                        <div className="space-y-2">
                            {topAgents.length > 0 ? (
                                topAgents.slice(0, 3).map((agent, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-green-500/5">
                                        <span className="text-sm">{agent.agentName}</span>
                                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-400">
                                            {(agent.avgSatisfaction || 0).toFixed(0)}% satisfaction
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No agent data available yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Detailed Tables in Tabs */}
                <Tabs defaultValue="topics" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="topics">Popular Topics</TabsTrigger>
                        <TabsTrigger value="agents">Agent Performance</TabsTrigger>
                        <TabsTrigger value="models">Model Usage</TabsTrigger>
                    </TabsList>

                    <TabsContent value="topics">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground">All Popular Topics</h2>
                            {popularTopics.length > 0 ? (
                                <DataTable data={popularTopics} columns={popularQuestionsColumns} />
                            ) : (
                                <div className="text-center py-12">
                                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium">No topic data yet</h3>
                                    <p className="text-muted-foreground mt-1">
                                        Topics will appear as users interact with the platform
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="agents">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground">Agent Performance Rankings</h2>
                            {topAgents.length > 0 ? (
                                <DataTable data={topAgents} columns={topAgentsColumns} />
                            ) : (
                                <div className="text-center py-12">
                                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium">No agent performance data yet</h3>
                                    <p className="text-muted-foreground mt-1">
                                        Train and use agents to see performance metrics
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="models">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground">Model Usage Statistics</h2>
                            {modelUsage.length > 0 ? (
                                <DataTable data={modelUsage} columns={modelUsageColumns} />
                            ) : (
                                <div className="text-center py-12">
                                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium">No model usage data yet</h3>
                                    <p className="text-muted-foreground mt-1">
                                        Model usage data will appear as AI responses are generated
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Analytics;
