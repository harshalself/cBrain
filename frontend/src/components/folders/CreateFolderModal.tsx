import { useState } from 'react';
import { folderService, Folder } from '@/services/folderService';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CreateFolderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentFolderId?: number | null;
    allFolders?: Folder[];
    onSuccess: () => void;
}

export default function CreateFolderModal({
    open,
    onOpenChange,
    parentFolderId,
    allFolders = [],
    onSuccess,
}: CreateFolderModalProps) {
    const [name, setName] = useState('');
    const [selectedParentId, setSelectedParentId] = useState<string>(
        parentFolderId?.toString() || 'root'
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const parentId = selectedParentId === 'root' ? null : parseInt(selectedParentId);
            await folderService.createFolder({
                name: name.trim(),
                parent_id: parentId,
            });

            toast({
                title: 'Folder created',
                description: `"${name}" has been created successfully.`,
            });

            setName('');
            setSelectedParentId('root');
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to create folder:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create folder',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form when dialog closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setName('');
            setSelectedParentId(parentFolderId?.toString() || 'root');
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                            Create a new folder to organize your documents.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Folder Name */}
                        <div className="space-y-2">
                            <Label htmlFor="folder-name">Folder Name</Label>
                            <Input
                                id="folder-name"
                                placeholder="Enter folder name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Parent Folder */}
                        <div className="space-y-2">
                            <Label htmlFor="parent-folder">Parent Folder (Optional)</Label>
                            <Select
                                value={selectedParentId}
                                onValueChange={setSelectedParentId}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id="parent-folder">
                                    <SelectValue placeholder="Select parent folder" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="root">📁 Root (No Parent)</SelectItem>
                                    {allFolders.map((folder) => (
                                        <SelectItem key={folder.id} value={folder.id.toString()}>
                                            📂 {folder.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Folder'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
