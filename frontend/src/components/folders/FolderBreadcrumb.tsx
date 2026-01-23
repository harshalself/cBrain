import { ChevronRight, Home } from 'lucide-react';

interface FolderBreadcrumbProps {
    folderPath: Array<{ id: number; name: string }>;
    onNavigate: (folderId: number | null) => void;
}

export default function FolderBreadcrumb({
    folderPath,
    onNavigate,
}: FolderBreadcrumbProps) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* Home / Root */}
            <button
                onClick={() => onNavigate(null)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
                <span>All Documents</span>
            </button>

            {/* Breadcrumb Trail */}
            {folderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    <button
                        onClick={() => onNavigate(folder.id)}
                        className={`hover:text-foreground transition-colors ${index === folderPath.length - 1 ? 'text-foreground font-medium' : ''
                            }`}
                    >
                        {folder.name}
                    </button>
                </div>
            ))}
        </div>
    );
}
