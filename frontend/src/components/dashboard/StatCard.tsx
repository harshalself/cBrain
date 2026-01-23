import React from 'react';
import { Stat } from '@/types';
import { TrendingUp, TrendingDown, Minus, Users, FileText, MessageSquare, Clock } from 'lucide-react';

interface StatCardProps {
    stat: Stat;
}

const iconMap: Record<string, React.ElementType> = {
    Users,
    FileText,
    MessageSquare,
    Clock,
};

export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
    const Icon = iconMap[stat.icon] || Users;
    const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Minus;
    const trendColor =
        stat.trend === 'up'
            ? 'text-green-600'
            : stat.trend === 'down'
                ? 'text-red-600'
                : 'text-muted-foreground';

    return (
        <div className="glass rounded-2xl p-6 hover-lift">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-foreground mt-2">{stat.value}</h3>
                    <div className="flex items-center gap-1 mt-2">
                        <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                        <span className={`text-sm font-medium ${trendColor}`}>
                            {Math.abs(stat.change)}%
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">vs last week</span>
                    </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                </div>
            </div>
        </div>
    );
};
