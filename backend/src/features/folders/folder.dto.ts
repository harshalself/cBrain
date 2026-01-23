import { IsString, IsNumber, IsOptional } from "class-validator";

/**
 * DTO for creating a new folder
 */
export class CreateFolderDto {
    @IsString()
    name: string;

    @IsNumber()
    @IsOptional()
    parent_id?: number; // For nested folders - null or undefined = root folder
}

/**
 * DTO for updating a folder
 */
export class UpdateFolderDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    parent_id?: number; // Change parent folder
}

/**
 * DTO for moving a document to a folder
 */
export class MoveDocumentDto {
    @IsNumber()
    @IsOptional()
    folder_id?: number | null; // null = move to root (no folder)
}
