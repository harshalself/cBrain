import { Router } from "express";
import Route from "../../interfaces/route.interface";
import DocumentController from "./document.controller";
import validationMiddleware from "../../middlewares/validation.middleware";
import { UpdateDocumentDto, DocumentParamsDto, DocumentQueryDto } from "./document.dto";
import multer from "multer";

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

class DocumentRoute implements Route {
    public path = "/documents";
    public router = Router();
    public documentController = new DocumentController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Upload document
        this.router.post(
            `${this.path}/upload`,
            upload.single("file"),
            this.documentController.uploadDocument
        );

        // Get all documents with pagination and filters
        this.router.get(
            `${this.path}`,
            validationMiddleware(DocumentQueryDto, "query", true, []),
            this.documentController.getDocuments
        );

        // Get single document
        this.router.get(
            `${this.path}/:id`,
            validationMiddleware(DocumentParamsDto, "params", false, []),
            this.documentController.getDocument
        );

        // Update document metadata
        this.router.put(
            `${this.path}/:id`,
            validationMiddleware(DocumentParamsDto, "params", false, []),
            validationMiddleware(UpdateDocumentDto, "body", true, []),
            this.documentController.updateDocument
        );

        // Delete document
        this.router.delete(
            `${this.path}/:id`,
            validationMiddleware(DocumentParamsDto, "params", false, []),
            this.documentController.deleteDocument
        );

        // Move document to folder
        this.router.put(
            `${this.path}/:id/move`,
            this.documentController.moveDocument
        );

        // Get version history for a document
        this.router.get(
            `${this.path}/:id/versions`,
            validationMiddleware(DocumentParamsDto, "params", false, []),
            this.documentController.getVersionHistory
        );
    }
}

export default DocumentRoute;
