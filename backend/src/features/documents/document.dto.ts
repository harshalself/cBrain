import { IsString, IsOptional, IsEnum, IsInt, IsArray } from "class-validator";
import { Type } from "class-transformer";

export class UploadDocumentDto {
    @IsString()
    @IsOptional()
    name?: string; // If not provided, use original filename

    @IsInt()
    @IsOptional()
    folder_id?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}

export class UpdateDocumentDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsInt()
    @IsOptional()
    folder_id?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}

export class DocumentParamsDto {
    @Type(() => Number)
    @IsInt()
    id!: number;
}

export class DocumentQueryDto {
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    page?: number;

    @Type(() => Number)
    @IsInt()
    @IsOptional()
    limit?: number;

    @IsString()
    @IsOptional()
    search?: string;

    @IsEnum(["pdf", "docx", "md", "txt"])
    @IsOptional()
    file_type?: "pdf" | "docx" | "md" | "txt";

    @Type(() => Number)
    @IsInt()
    @IsOptional()
    folder_id?: number;

    @IsEnum(["processing", "ready", "failed"])
    @IsOptional()
    status?: "processing" | "ready" | "failed";
}
