import knex from "../../../../database/index.schema";
import {
    IDocument,
    CreateDocumentRequest,
    UpdateDocumentRequest,
    DocumentListQuery,
} from "../document.interface";
import HttpException from "../../../exceptions/HttpException";
import { FileUploadResult, extractInsertedId } from "../../../utils/fileupload";

class DocumentService {
    /**
     * Upload a document to the Knowledge Base
     */
    public async uploadDocument(
        uploadResult: FileUploadResult,
        metadata: {
            name?: string;
            folder_id?: number;
            tags?: string[];
        },
        userId: number
    ): Promise<IDocument> {
        try {
            // Determine file type from mime type
            const mimeType = uploadResult.ContentType || "application/octet-stream";
            let file_type: "pdf" | "docx" | "md" | "txt" = "pdf";

            if (mimeType.includes("pdf")) {
                file_type = "pdf";
            } else if (
                mimeType.includes("word") ||
                mimeType.includes("document")
            ) {
                file_type = "docx";
            } else if (mimeType.includes("markdown")) {
                file_type = "md";
            } else if (mimeType.includes("text")) {
                file_type = "txt";
            }

            const document: CreateDocumentRequest = {
                name: metadata.name || "Untitled Document",
                original_name: metadata.name || "unknown",
                folder_id: metadata.folder_id,
                file_type,
                file_size: uploadResult.size || 0,
                file_path: uploadResult.Location,
                tags: metadata.tags || [],
                metadata: {
                    contentType: mimeType,
                    uploadedAt: new Date().toISOString(),
                },
            };

            const result = await knex("documents")
                .insert({
                    ...document,
                    uploaded_by: userId,
                    upload_date: knex.fn.now(),
                    last_updated: knex.fn.now(),
                    status: "ready", // Mark as ready since no processing needed yet
                    version: 1,
                    chunk_count: 0,
                    created_at: knex.fn.now(),
                    updated_at: knex.fn.now(),
                })
                .returning("*");


            const insertedDocument = Array.isArray(result) ? result[0] : result;

            // Broadcast notification to all users about new document
            try {
                const NotificationService = require("../../notifications/notification.service").default;
                const notificationService = new NotificationService();

                await notificationService.broadcastNotification({
                    type: 'document_upload',
                    message: `New document uploaded: ${insertedDocument.name}`,
                    metadata: {
                        document_id: insertedDocument.id,
                        document_name: insertedDocument.name,
                        file_type: insertedDocument.file_type,
                    },
                    except_user_id: userId, // Don't notify the uploader
                });
            } catch (notifError) {
                // Log but don't fail the upload if notification fails
                console.error('Failed to send notification:', notifError);
            }

            return insertedDocument as IDocument;
        } catch (error) {
            throw new HttpException(
                500,
                `Error uploading document: ${error.message}`
            );
        }
    }

    /**
     * Get all documents with pagination and filters
     */
    public async getDocuments(
        query: DocumentListQuery,
        userId?: number
    ): Promise<{ documents: IDocument[]; total: number; page: number; limit: number }> {
        try {
            const page = query.page || 1;
            const limit = query.limit || 20;
            const offset = (page - 1) * limit;

            let queryBuilder = knex("documents").where({ /* is_deleted: false */ });

            // Apply filters
            if (query.search) {
                queryBuilder = queryBuilder.where((builder) => {
                    builder
                        .where("name", "ilike", `%${query.search}%`)
                        .orWhere("original_name", "ilike", `%${query.search}%`);
                });
            }

            if (query.file_type) {
                queryBuilder = queryBuilder.where("file_type", query.file_type);
            }

            if (query.folder_id !== undefined) {
                queryBuilder = queryBuilder.where("folder_id", query.folder_id);
            }

            if (query.status) {
                queryBuilder = queryBuilder.where("status", query.status);
            }

            // Get total count
            const countResult = await queryBuilder.clone().count("* as count").first();
            const total = parseInt(countResult?.count as string) || 0;

            // Get paginated documents
            const documents = await queryBuilder
                .select("*")
                .orderBy("created_at", "desc")
                .limit(limit)
                .offset(offset);

            return {
                documents: documents as IDocument[],
                total,
                page,
                limit,
            };
        } catch (error) {
            throw new HttpException(
                500,
                `Error fetching documents: ${error.message}`
            );
        }
    }

    /**
     * Get single document by ID
     */
    public async getDocumentById(id: number): Promise<IDocument> {
        try {
            const document = await knex("documents")
                .where({ id /* , is_deleted: false */ })
                .first();

            if (!document) {
                throw new HttpException(404, "Document not found");
            }

            return document as IDocument;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error fetching document: ${error.message}`
            );
        }
    }

    /**
     * Update document metadata
     */
    public async updateDocument(
        id: number,
        updateData: UpdateDocumentRequest,
        userId: number
    ): Promise<IDocument> {
        try {
            // Check if document exists
            await this.getDocumentById(id);

            const updateFields: any = {
                last_updated: knex.fn.now(),
                updated_at: knex.fn.now(),
            };

            if (updateData.name) updateFields.name = updateData.name;
            if (updateData.folder_id !== undefined) updateFields.folder_id = updateData.folder_id;
            if (updateData.tags) updateFields.tags = updateData.tags;

            const result = await knex("documents")
                .where({ id })
                .update(updateFields)
                .returning("*");

            const updatedDocument = Array.isArray(result) ? result[0] : result;
            return updatedDocument as IDocument;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error updating document: ${error.message}`
            );
        }
    }

    /**
     * Delete document (hard delete for now, can be changed to soft delete)
     */
    public async deleteDocument(id: number, userId: number): Promise<void> {
        try {
            // Check if document exists
            await this.getDocumentById(id);

            // Check if document is linked to any agents
            const linkedSources = await knex("sources")
                .where({ document_id: id, is_deleted: false })
                .count("* as count")
                .first();

            const linkCount = parseInt(linkedSources?.count as string) || 0;

            if (linkCount > 0) {
                throw new HttpException(
                    400,
                    `Cannot delete document. It is currently linked to ${linkCount} agent(s). Please unlink it first.`
                );
            }

            // Hard delete
            await knex("documents").where({ id }).delete();
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error deleting document: ${error.message}`
            );
        }
    }

    /**
     * Get folder path for document uploads (global knowledge base)
     */
    public getFolderPathForDocuments(): string {
        return `knowledge-base/documents`;
    }
}

export default DocumentService;
