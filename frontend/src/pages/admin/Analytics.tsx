import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import {
    getCurrentUser,
    mockPopularQuestions,
    mockKnowledgeGaps,
    mockDepartmentStats,
} from '@/lib/mockData';
import { PopularQuestion, KnowledgeGap, DepartmentStat } from '@/types';
import { TrendingUp, AlertTriangle } from 'lucide-react';

const Analytics: React.FC = () => {
    const user = getCurrentUser();

    const popularQuestionsColumns = [
        {
            key: 'question',
            label: 'Question',
            render: (item: PopularQuestion) => (
                <div>
                    <p className="font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                </div>
            ),
        },
        {
            key: 'count',
            label: 'Times Asked',
            render: (item: PopularQuestion) => (
                <span className="font-semibold text-primary">{item.count}</span>
            ),
        },
    ];

    const knowledgeGapsColumns = [
        {
            key: 'topic',
            label: 'Topic',
        },
        {
            key: 'frequency',
            label: 'Frequency',
            render: (item: KnowledgeGap) => (
                <span className="font-semibold text-yellow-600">{item.frequency}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item: KnowledgeGap) =>
                item.status === 'missing' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                        Missing
                    </span>
                ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">
                        Outdated
                    </span>
                ),
        },
    ];

    const departmentStatsColumns = [
        {
            key: 'department',
            label: 'Department',
            render: (item: DepartmentStat) => <span className="font-medium">{item.department}</span>,
        },
        {
            key: 'activeUsers',
            label: 'Active Users',
        },
        {
            key: 'questionsAsked',
            label: 'Questions Asked',
        },
        {
            key: 'avgResponseTime',
            label: 'Avg Response Time',
            render: (item: DepartmentStat) => <span>{item.avgResponseTime.toFixed(1)}s</span>,
        },
    ];

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Analytics & Insights" user={user} />

            <div className="p-6 lg:p-8 space-y-8">
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
                            Most frequently asked questions across the organization
                        </p>
                        <div className="space-y-2">
                            {mockPopularQuestions.slice(0, 3).map((q, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-secondary/20">
                                    <span className="text-sm">{q.question}</span>
                                    <span className="text-sm font-semibold text-primary">{q.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Knowledge Gaps</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Areas needing documentation or updates
                        </p>
                        <div className="space-y-2">
                            {mockKnowledgeGaps.slice(0, 3).map((gap, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-yellow-500/5">
                                    <span className="text-sm">{gap.topic}</span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                                        {gap.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Detailed Tables */}
                <div className="space-y-6">
                    {/* Popular Questions */}
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-4">Most Asked Questions</h2>
                        <DataTable data={mockPopularQuestions} columns={popularQuestionsColumns} />
                    </div>

                    {/* Knowledge Gaps */}
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-4">Knowledge Gaps Analysis</h2>
                        <DataTable data={mockKnowledgeGaps} columns={knowledgeGapsColumns} />
                    </div>

                    {/* Department Stats */}
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-4">Department Performance</h2>
                        <DataTable data={mockDepartmentStats} columns={departmentStatsColumns} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
