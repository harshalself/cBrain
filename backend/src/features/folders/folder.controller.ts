import { NextFunction, Request, Response } from "express";
import { RequestWithUser } from "../../interfaces/auth.interface";
import FolderService from "./folder.service";
import { CreateFolderDto, UpdateFolderDto } from "./folder.dto";
import HttpException from "../../exceptions/HttpException";
import ResponseUtil from "../../utils/response.util";

class FolderController {
    public folderService = new FolderService();

    /**
     * Get all folders (flat or tree structure)
     */
    public getFolders = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const tree = req.query.tree === "true";

            const folders = tree
                ? await this.folderService.getFolderTree()
                : await this.folderService.getAllFolders();

            res.status(200).json(
                ResponseUtil.success("Folders retrieved successfully", folders)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get a specific folder by ID
     */
    public getFolder = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new HttpException(400, "Invalid folder ID");
            }

            const folder = await this.folderService.getFolderById(id);

            res.status(200).json(
                ResponseUtil.success("Folder retrieved successfully", folder)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Create a new folder
     */
    public createFolder = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            const data: CreateFolderDto = req.body;
            const folder = await this.folderService.createFolder(data, userId);

            res.status(201).json(
                ResponseUtil.created("Folder created successfully", folder)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update a folder (rename or move)
     */
    public updateFolder = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new HttpException(400, "Invalid folder ID");
            }

            const data: UpdateFolderDto = req.body;
            const folder = await this.folderService.updateFolder(id, data, userId);

            res.status(200).json(
                ResponseUtil.updated("Folder updated successfully", folder)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Delete a folder
     */
    public deleteFolder = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new HttpException(400, "Invalid folder ID");
            }

            await this.folderService.deleteFolder(id, userId);

            res.status(200).json(
                ResponseUtil.deleted("Folder deleted successfully")
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all documents in a folder
     */
    public getFolderDocuments = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new HttpException(400, "Invalid folder ID");
            }

            const documents = await this.folderService.getFolderDocuments(id);

            res.status(200).json(
                ResponseUtil.success("Documents retrieved successfully", documents)
            );
        } catch (error) {
            next(error);
        }
    };
}

export default FolderController;
