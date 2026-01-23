import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { getCurrentUser, mockDocuments } from '@/lib/mockData';
import { Document } from '@/types';
import { Upload, Search, FolderTree as FolderIcon, Loader2 } from 'lucide-react';
import { folderService, Folder, FolderNode } from '@/services/folderService';
import FolderTree from '@/components/folders/FolderTree';
import CreateFolderModal from '@/components/folders/CreateFolderModal';
import RenameFolderModal from '@/components/folders/RenameFolderModal';
import DeleteFolderDialog from '@/components/folders/DeleteFolderDialog';
import FolderBreadcrumb from '@/components/folders/FolderBreadcrumb';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const KnowledgeBase: React.FC = () => {
    const user = getCurrentUser();
    const [searchQuery, setSearchQuery] = useState('');

    // Folder state
    const [folders, setFolders] = useState<FolderNode[]>([]);
    const [allFolders, setAllFolders] = useState<Folder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [folderPath, setFolderPath] = useState<Array<{ id: number; name: string }>>([]);
    const [isLoadingFolders, setIsLoadingFolders] = useState(true);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createParentId, setCreateParentId] = useState<number | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameFolder, setRenameFolder] = useState<{ id: number; name: string } | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteFolder, setDeleteFolder] = useState<{ id: number; name: string } | null>(null);

    // Load folders on mount
    useEffect(() => {
        loadFolders();
    }, []);

    const loadFolders = async () => {
        try {
            setIsLoadingFolders(true);
            const [treeData, flatData] = await Promise.all([
                folderService.getFolderTree(),
                folderService.getAllFolders(),
            ]);
            setFolders(treeData);
            setAllFolders(flatData);
        } catch (error) {
            console.error('Failed to load folders:', error);
        } finally {
            setIsLoadingFolders(false);
        }
    };

    // Build folder path for breadcrumb
    const buildFolderPath = (folderId: number | null): Array<{ id: number; name: string }> => {
        if (folderId === null) return [];

        const path: Array<{ id: number; name: string }> = [];
        let currentId: number | null = folderId;

        while (currentId !== null) {
            const folder = allFolders.find(f => f.id === currentId);
            if (folder) {
                path.unshift({ id: folder.id, name: folder.name });
                currentId = folder.parent_id;
            } else {
                break;
            }
        }

        return path;
    };

    const handleSelectFolder = (folderId: number | null) => {
        setSelectedFolderId(folderId);
        setFolderPath(buildFolderPath(folderId));
    };

    const handleCreateFolder = (parentId: number | null) => {
        setCreateParentId(parentId);
        setShowCreateModal(true);
    };

    const handleRenameFolder = (folderId: number) => {
        const folder = allFolders.find(f => f.id === folderId);
        if (folder) {
            setRenameFolder({ id: folder.id, name: folder.name });
            setShowRenameModal(true);
        }
    };

    const handleDeleteFolder = (folderId: number) => {
        const folder = allFolders.find(f => f.id === folderId);
        if (folder) {
            setDeleteFolder({ id: folder.id, name: folder.name });
            setShowDeleteDialog(true);
        }
    };

    const filteredDocuments = mockDocuments.filter(
        (doc) =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: Document['status']) => {
        const colors = {
            active: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
            outdated: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
            pending: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const columns = [
        {
            key: 'title',
            label: 'Title',
            render: (doc: Document) => (
                <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{doc.category}</p>
                </div>
            ),
        },
        {
            key: 'uploadedBy',
            label: 'Uploaded By',
            render: (doc: Document) => (
                <div>
                    <p>{doc.uploadedBy}</p>
                    <p className="text-xs text-muted-foreground mt-1">{doc.uploadDate}</p>
                </div>
            ),
        },
        {
            key: 'lastModified',
            label: 'Last Modified',
        },
        {
            key: 'status',
            label: 'Status',
            render: (doc: Document) => getStatusBadge(doc.status),
        },
        {
            key: 'version',
            label: 'Version',
            render: (doc: Document) => <span className="font-mono">v{doc.version}</span>,
        },
        {
            key: 'size',
            label: 'Size',
        },
    ];

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Knowledge Base" user={user} />

            <div className="flex">
                {/* Folder Sidebar */}
                <aside className="w-64 border-r border-border bg-card/50 min-h-[calc(100vh-80px)]">
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <FolderIcon className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold">Folders</h3>
                        </div>

                        {isLoadingFolders ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ScrollArea className="h-[calc(100vh-200px)]">
                                <FolderTree
                                    folders={folders}
                                    selectedFolderId={selectedFolderId}
                                    onSelectFolder={handleSelectFolder}
                                    onCreateFolder={handleCreateFolder}
                                    onRenameFolder={handleRenameFolder}
                                    onDeleteFolder={handleDeleteFolder}
                                />
                            </ScrollArea>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 p-6 lg:p-8 space-y-6">
                    {/* Breadcrumb */}
                    {selectedFolderId !== null && (
                        <FolderBreadcrumb
                            folderPath={folderPath}
                            onNavigate={handleSelectFolder}
                        />
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 w-full sm:w-auto">
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/20 border border-border w-full sm:w-96">
                                <Search className="w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent text-sm focus:outline-none flex-1"
                                />
                            </div>
                        </div>

                        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/25">
                            <Upload className="w-4 h-4" />
                            Upload Document
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass rounded-xl p-4">
                            <p className="text-sm text-muted-foreground">Total Documents</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{mockDocuments.length}</p>
                        </div>
                        <div className="glass rounded-xl p-4">
                            <p className="text-sm text-muted-foreground">Active</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {mockDocuments.filter((d) => d.status === 'active').length}
                            </p>
                        </div>
                        <div className="glass rounded-xl p-4">
                            <p className="text-sm text-muted-foreground">Outdated</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">
                                {mockDocuments.filter((d) => d.status === 'outdated').length}
                            </p>
                        </div>
                        <div className="glass rounded-xl p-4">
                            <p className="text-sm text-muted-foreground">Pending</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {mockDocuments.filter((d) => d.status === 'pending').length}
                            </p>
                        </div>
                    </div>

                    {/* Documents Table */}
                    <DataTable
                        data={filteredDocuments}
                        columns={columns}
                        onRowClick={(doc) => console.log('View document:', doc.id)}
                    />
                </div>
            </div>

            {/* Modals */}
            <CreateFolderModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                parentFolderId={createParentId}
                allFolders={allFolders}
                onSuccess={loadFolders}
            />

            <RenameFolderModal
                open={showRenameModal}
                onOpenChange={setShowRenameModal}
                folderId={renameFolder?.id || null}
                currentName={renameFolder?.name || ''}
                onSuccess={loadFolders}
            />

            <DeleteFolderDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                folderId={deleteFolder?.id || null}
                folderName={deleteFolder?.name || ''}
                onSuccess={loadFolders}
            />
        </div>
    );
};

export default KnowledgeBase;
