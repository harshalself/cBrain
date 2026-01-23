import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, MoreVertical, Plus, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FolderNode } from '@/services/folderService';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface FolderTreeProps {
    folders: FolderNode[];
    selectedFolderId?: number | null;
    onSelectFolder: (folderId: number | null) => void;
    onCreateFolder: (parentId: number | null) => void;
    onRenameFolder: (folderId: number) => void;
    onDeleteFolder: (folderId: number) => void;
}

interface FolderItemProps {
    folder: FolderNode;
    level: number;
    selectedFolderId?: number | null;
    onSelectFolder: (folderId: number | null) => void;
    onCreateFolder: (parentId: number | null) => void;
    onRenameFolder: (folderId: number) => void;
    onDeleteFolder: (folderId: number) => void;
}

function FolderItem({
    folder,
    level,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
}: FolderItemProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;

    return (
        <div>
            <div
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group hover:bg-secondary/50 ${isSelected ? 'bg-primary/10 text-primary' : ''
                    }`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
                {/* Expand/Collapse Arrow */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="p-0.5 hover:bg-secondary rounded"
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )
                    ) : (
                        <div className="w-4 h-4" />
                    )}
                </button>

                {/* Folder Icon */}
                <div onClick={() => onSelectFolder(folder.id)}>
                    {isExpanded && hasChildren ? (
                        <FolderOpen className="h-4 w-4 text-yellow-500" />
                    ) : (
                        <Folder className="h-4 w-4 text-yellow-500" />
                    )}
                </div>

                {/* Folder Name */}
                <span
                    className="flex-1 text-sm truncate"
                    onClick={() => onSelectFolder(folder.id)}
                >
                    {folder.name}
                </span>

                {/* Document Count Badge */}
                {folder.document_count !== undefined && folder.document_count > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {folder.document_count}
                    </Badge>
                )}

                {/* Actions Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onCreateFolder(folder.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Subfolder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRenameFolder(folder.id)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDeleteFolder(folder.id)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Recursive Children */}
            {isExpanded && hasChildren && (
                <div>
                    {folder.children!.map((child) => (
                        <FolderItem
                            key={child.id}
                            folder={child}
                            level={level + 1}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={onSelectFolder}
                            onCreateFolder={onCreateFolder}
                            onRenameFolder={onRenameFolder}
                            onDeleteFolder={onDeleteFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FolderTree({
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
}: FolderTreeProps) {
    return (
        <div className="space-y-1">
            {/* Root Level - All Documents */}
            <div
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-secondary/50 ${selectedFolderId === null ? 'bg-primary/10 text-primary' : ''
                    }`}
                onClick={() => onSelectFolder(null)}
            >
                <FileText className="h-4 w-4 ml-6" />
                <span className="flex-1 text-sm font-medium">All Documents</span>
            </div>

            {/* Folder Tree */}
            {folders.map((folder) => (
                <FolderItem
                    key={folder.id}
                    folder={folder}
                    level={0}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    onCreateFolder={onCreateFolder}
                    onRenameFolder={onRenameFolder}
                    onDeleteFolder={onDeleteFolder}
                />
            ))}

            {/* Create Root Folder Button */}
            <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => onCreateFolder(null)}
            >
                <Plus className="h-4 w-4 mr-2" />
                New Folder
            </Button>
        </div>
    );
}
