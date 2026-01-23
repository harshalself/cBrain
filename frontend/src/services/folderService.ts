import api from './api';

export interface Folder {
    id: number;
    name: string;
    parent_id: number | null;
    created_by: number;
    created_at: string;
    updated_at: string;
}

export interface FolderNode extends Folder {
    children?: FolderNode[];
    document_count?: number;
}

export const folderService = {
    // Get folder tree
    getFolderTree: async (): Promise<FolderNode[]> => {
        const response = await api.get('/folders?tree=true');
        return response.data.data;
    },

    // Get all folders (flat)
    getAllFolders: async (): Promise<Folder[]> => {
        const response = await api.get('/folders');
        return response.data.data;
    },

    // Create folder
    createFolder: async (data: { name: string; parent_id?: number | null }) => {
        const response = await api.post('/folders', data);
        return response.data.data;
    },

    // Update folder
    updateFolder: async (id: number, data: { name?: string; parent_id?: number | null }) => {
        const response = await api.put(`/folders/${id}`, data);
        return response.data.data;
    },

    // Delete folder
    deleteFolder: async (id: number) => {
        await api.delete(`/folders/${id}`);
    },

    // Get folder documents
    getFolderDocuments: async (id: number) => {
        const response = await api.get(`/folders/${id}/documents`);
        return response.data.data;
    },

    // Move document
    moveDocument: async (documentId: number, folderId: number | null) => {
        const response = await api.put(`/documents/${documentId}/move`, {
            folder_id: folderId,
        });
        return response.data.data;
    },
};
