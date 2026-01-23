export interface IFolder {
    id: number;
    name: string;
    parent_id: number | null;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}

export interface IFolderNode extends IFolder {
    children?: IFolderNode[];
    document_count?: number;
}
