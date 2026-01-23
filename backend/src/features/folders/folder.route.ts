import { Router } from "express";
import Route from "../../interfaces/route.interface";
import FolderController from "./folder.controller";
import validationMiddleware from "../../middlewares/validation.middleware";
import { CreateFolderDto, UpdateFolderDto } from "./folder.dto";

class FolderRoute implements Route {
    public path = "/folders";
    public router = Router();
    public folderController = new FolderController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Get all folders (supports ?tree=true for hierarchical structure)
        this.router.get(
            `${this.path}`,
            this.folderController.getFolders
        );

        // Create a new folder
        this.router.post(
            `${this.path}`,
            validationMiddleware(CreateFolderDto, "body", false, []),
            this.folderController.createFolder
        );

        // Get a specific folder by ID
        this.router.get(
            `${this.path}/:id`,
            this.folderController.getFolder
        );

        // Update a folder (rename or move)
        this.router.put(
            `${this.path}/:id`,
            validationMiddleware(UpdateFolderDto, "body", true, []),
            this.folderController.updateFolder
        );

        // Delete a folder
        this.router.delete(
            `${this.path}/:id`,
            this.folderController.deleteFolder
        );

        // Get all documents in a folder
        this.router.get(
            `${this.path}/:id/documents`,
            this.folderController.getFolderDocuments
        );
    }
}

export default FolderRoute;
