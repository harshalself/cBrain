import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { getCurrentUser, mockDocuments } from '@/lib/mockData';
import { Document } from '@/types';
import { Search, FileText, BookOpen, File, Files } from 'lucide-react';

const MyDocuments: React.FC = () => {
    const user = getCurrentUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Get unique categories
    const categories = ['all', ...new Set(mockDocuments.map(d => d.category))];

    const filteredDocuments = mockDocuments
        .filter(d => d.status === 'active')
        .filter(doc => {
            const matchesSearch =
                doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Technical': return FileText;
            case 'HR Policies': return BookOpen;
            case 'Marketing': return Files;
            default: return File;
        }
    };

    const columns = [
        {
            key: 'title',
            label: 'Document',
            render: (doc: Document) => {
                const Icon = getCategoryIcon(doc.category);
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{doc.title}</p>
                            <div className="flex gap-1 mt-1">
                                {doc.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-secondary/50 text-muted-foreground">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'category',
            label: 'Category',
            render: (doc: Document) => (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground">
                    {doc.category}
                </span>
            ),
        },
        {
            key: 'lastModified',
            label: 'Last Updated',
        },
        {
            key: 'size',
            label: 'Size',
        },
    ];

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Documents" user={user} />

            <div className="p-6 lg:p-8 space-y-6">
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/20 border border-border">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search documents by title or tag..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-sm focus:outline-none flex-1"
                            />
                        </div>
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-secondary/20 border border-border text-sm focus:outline-none focus:border-primary"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 flex-wrap">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${categoryFilter === cat
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary/30 text-foreground hover:bg-secondary/50'
                                }`}
                        >
                            {cat === 'all' ? 'All' : cat}
                        </button>
                    ))}
                </div>

                {/* Documents Count */}
                <p className="text-sm text-muted-foreground">
                    Showing {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                </p>

                {/* Documents Table */}
                <DataTable
                    data={filteredDocuments}
                    columns={columns}
                    onRowClick={(doc) => console.log('Open document:', doc.id)}
                />
            </div>
        </div>
    );
};

export default MyDocuments;
