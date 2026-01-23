import { useState } from 'react';
import { folderService } from '@/services/folderService';
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
import { useToast } from '@/hooks/use-toast';

interface RenameFolderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folderId: number | null;
    currentName: string;
    onSuccess: () => void;
}

export default function RenameFolderModal({
    open,
    onOpenChange,
    folderId,
    currentName,
    onSuccess,
}: RenameFolderModalProps) {
    const [name, setName] = useState(currentName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !folderId) return;

        setIsSubmitting(true);
        try {
            await folderService.updateFolder(folderId, {
                name: name.trim(),
            });

            toast({
                title: 'Folder renamed',
                description: `Folder renamed to "${name}".`,
            });

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to rename folder:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to rename folder',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Rename Folder</DialogTitle>
                        <DialogDescription>
                            Enter a new name for this folder.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-folder-name">Folder Name</Label>
                            <Input
                                id="new-folder-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isSubmitting}>
                            {isSubmitting ? 'Renaming...' : 'Rename'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
