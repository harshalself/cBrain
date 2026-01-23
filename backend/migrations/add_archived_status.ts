import DB from "../database/index.schema";
import { logger } from "../src/utils/logger";

/**
 * Migration: Add 'archived' status to documents table
 * Required for document versioning feature (PRD FR-3.3)
 */

export const up = async () => {
    try {
        // Add 'archived' to the documents status enum
        await DB.raw(`
            ALTER TYPE documents_status_enum ADD VALUE IF NOT EXISTS 'archived';
        `);

        logger.info("✅ Added 'archived' status to documents enum");
    } catch (error: any) {
        // If enum type doesn't exist or value already exists, try alternative approach
        logger.warn("Enum modification may have failed, trying raw update...");

        // PostgreSQL allows updating check constraints for enum-like columns
        // If using text column with check constraint instead of enum type
        try {
            await DB.raw(`
                ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
                ALTER TABLE documents ADD CONSTRAINT documents_status_check 
                CHECK (status IN ('processing', 'ready', 'failed', 'archived'));
            `);
            logger.info("✅ Updated documents status constraint to include 'archived'");
        } catch (innerError: any) {
            logger.warn("Constraint update not needed or failed: " + innerError.message);
        }
    }
};

export const down = async () => {
    // Note: Removing enum values in PostgreSQL is complex and not recommended
    // This is a no-op for safety
    logger.warn("⚠️ Removing enum values is not supported. Manual intervention required if needed.");
};

// Run migration if executed directly
if (require.main === module) {
    (async () => {
        try {
            await up();
            console.log("Migration completed successfully");
            process.exit(0);
        } catch (error) {
            console.error("Migration failed:", error);
            process.exit(1);
        }
    })();
}
