import knex from "../../../database/index.schema";
import HttpException from "../../exceptions/HttpException";
import { CreateFolderDto, UpdateFolderDto } from "./folder.dto";
import { IFolder, IFolderNode } from "./folder.interface";

class FolderService {
    /**
     * Get folder tree structure (hierarchical)
     */
    public async getFolderTree(): Promise<IFolderNode[]> {
        try {
            // Get all folders
            const folders = await knex("folders")
                .orderBy("name");

            // Get document counts for each folder
            const documentCounts = await knex("documents")
                .groupBy("folder_id")
                .select("folder_id")
                .count("* as count");

            const countMap = new Map(
                documentCounts.map((dc: any) => [dc.folder_id, parseInt(dc.count)])
            );

            // Build tree structure
            return this.buildTree(folders, null, countMap);
        } catch (error: any) {
            throw new HttpException(500, `Error fetching folder tree: ${error.message}`);
        }
    }

    /**
     * Recursively build folder tree
     */
    private buildTree(
        folders: IFolder[],
        parentId: number | null,
        countMap: Map<number, number>
    ): IFolderNode[] {
        const children: IFolderNode[] = [];

        for (const folder of folders) {
            if (folder.parent_id === parentId) {
                const node: IFolderNode = {
                    ...folder,
                    document_count: countMap.get(folder.id) || 0,
                    children: this.buildTree(folders, folder.id, countMap),
                };
                children.push(node);
            }
        }

        return children;
    }

    /**
     * Get all folders (flat list)
     */
    public async getAllFolders(): Promise<IFolder[]> {
        try {
            return await knex("folders")
                .orderBy("name");
        } catch (error: any) {
            throw new HttpException(500, `Error fetching folders: ${error.message}`);
        }
    }

    /**
     * Get folder by ID
     */
    public async getFolderById(id: number): Promise<IFolder> {
        try {
            const folder = await knex("folders")
                .where({ id })
                .first();

            if (!folder) {
                throw new HttpException(404, "Folder not found");
            }

            return folder;
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error fetching folder: ${error.message}`);
        }
    }

    /**
     * Create a new folder
     */
    public async createFolder(data: CreateFolderDto, userId: number): Promise<IFolder> {
        try {
            // Verify parent exists if provided
            if (data.parent_id) {
                await this.getFolderById(data.parent_id);
            }

            // Check for duplicate name in same parent
            const existing = await knex("folders")
                .where({
                    name: data.name,
                    parent_id: data.parent_id || null,
                })
                .first();

            if (existing) {
                throw new HttpException(
                    409,
                    "A folder with this name already exists in this location"
                );
            }

            const [folder] = await knex("folders")
                .insert({
                    name: data.name,
                    parent_id: data.parent_id || null,
                    created_by: userId,
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                .returning("*");

            return folder;
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error creating folder: ${error.message}`);
        }
    }

    /**
     * Update folder (rename or move)
     */
    public async updateFolder(
        id: number,
        data: UpdateFolderDto,
        userId: number
    ): Promise<IFolder> {
        try {
            await this.getFolderById(id);

            // Prevent moving to itself
            if (data.parent_id === id) {
                throw new HttpException(400, "Folder cannot be its own parent");
            }

            // Prevent circular references if changing parent
            if (data.parent_id !== undefined) {
                await this.validateNoCircularReference(id, data.parent_id);
            }

            // Check for duplicate name if renaming
            if (data.name) {
                const folder = await this.getFolderById(id);
                const existing = await knex("folders")
                    .where({
                        name: data.name,
                        parent_id: folder.parent_id,
                    })
                    .whereNot({ id })
                    .first();

                if (existing) {
                    throw new HttpException(
                        409,
                        "A folder with this name already exists in this location"
                    );
                }
            }

            const [updated] = await knex("folders")
                .where({ id })
                .update({
                    ...data,
                    updated_at: new Date(),
                })
                .returning("*");

            return updated;
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error updating folder: ${error.message}`);
        }
    }

    /**
     * Delete folder (with safety checks)
     */
    public async deleteFolder(id: number, userId: number): Promise<void> {
        try {
            await this.getFolderById(id);

            // Check for documents
            const documentsCount = await knex("documents")
                .where({ folder_id: id })
                .count("* as count")
                .first();

            if (parseInt(documentsCount?.count as string) > 0) {
                throw new HttpException(
                    400,
                    `Cannot delete folder containing ${documentsCount?.count} document(s). Move or delete documents first.`
                );
            }

            // Check for subfolders
            const subfoldersCount = await knex("folders")
                .where({ parent_id: id })
                .count("* as count")
                .first();

            if (parseInt(subfoldersCount?.count as string) > 0) {
                throw new HttpException(
                    400,
                    `Cannot delete folder containing ${subfoldersCount?.count} subfolder(s). Delete subfolders first.`
                );
            }

            // Hard delete
            await knex("folders")
                .where({ id })
                .del();
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error deleting folder: ${error.message}`);
        }
    }

    /**
     * Get documents in a folder
     */
    public async getFolderDocuments(folderId: number): Promise<any[]> {
        try {
            await this.getFolderById(folderId);

            return await knex("documents")
                .where({ folder_id: folderId })
                .orderBy("name");
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error fetching folder documents: ${error.message}`);
        }
    }

    /**
     * Move document to folder
     */
    public async moveDocumentToFolder(
        documentId: number,
        folderId: number | null,
        userId: number
    ): Promise<any> {
        try {
            // Verify document exists
            const doc = await knex("documents")
                .where({ id: documentId })
                .first();

            if (!doc) {
                throw new HttpException(404, "Document not found");
            }

            // Verify folder exists if not null
            if (folderId !== null) {
                await this.getFolderById(folderId);
            }

            const [updated] = await knex("documents")
                .where({ id: documentId })
                .update({
                    folder_id: folderId,
                    updated_at: new Date(),
                })
                .returning("*");

            return updated;
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error moving document: ${error.message}`);
        }
    }

    /**
     * Validate no circular references when moving folders
     */
    private async validateNoCircularReference(
        folderId: number,
        newParentId: number | null
    ): Promise<void> {
        if (newParentId === null) return; // Moving to root is always safe

        // Can't be its own parent (already checked, but double-check)
        if (folderId === newParentId) {
            throw new HttpException(400, "Folder cannot be its own parent");
        }

        // Check if newParent is a descendant of folder
        let currentId: number | null = newParentId;
        const visited = new Set<number>();
        const maxDepth = 100; // Prevent infinite loops
        let depth = 0;

        while (currentId && depth < maxDepth) {
            if (visited.has(currentId)) {
                throw new HttpException(400, "Circular reference detected");
            }
            visited.add(currentId);

            if (currentId === folderId) {
                throw new HttpException(
                    400,
                    "Cannot move folder into its own subfolder"
                );
            }

            const parent = await knex("folders")
                .where({ id: currentId })
                .first();

            currentId = parent?.parent_id || null;
            depth++;
        }

        if (depth >= maxDepth) {
            throw new HttpException(400, "Folder hierarchy too deep");
        }
    }
}

export default FolderService;
