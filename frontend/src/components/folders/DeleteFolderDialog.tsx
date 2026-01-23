import { folderService } from '@/services/folderService';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface DeleteFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folderId: number | null;
    folderName: string;
    onSuccess: () => void;
}

export default function DeleteFolderDialog({
    open,
    onOpenChange,
    folderId,
    folderName,
    onSuccess,
}: DeleteFolderDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        if (!folderId) return;

        setIsDeleting(true);
        try {
            await folderService.deleteFolder(folderId);

            toast({
                title: 'Folder deleted',
                description: `"${folderName}" has been deleted.`,
            });

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to delete folder:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete folder. It may contain documents or subfolders.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete "{folderName}"? This action cannot be undone.
                        The folder must be empty (no documents or subfolders) to be deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
