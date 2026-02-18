import DB from "../../../database/index.schema";

export const DOCUMENTS_TABLE = "documents";

// Schema Definition
export const createTable = async () => {
    await DB.schema.createTable(DOCUMENTS_TABLE, (table) => {
        table.increments("id").primary();
        table.text("name").notNullable();
        table.text("original_name").notNullable();
        table.enum("file_type", ["pdf", "docx", "md", "txt"]).notNullable();
        table.integer("file_size").nullable();
        table.text("file_path").notNullable();
        table.integer("uploaded_by").references("id").inTable("users").notNullable();
        table.timestamp("upload_date").defaultTo(DB.fn.now());
        table.timestamp("last_updated").defaultTo(DB.fn.now());
        table.enum("status", ["processing", "ready", "failed"]).defaultTo("processing");
        table.integer("version").defaultTo(1);
        table.integer("chunk_count").defaultTo(0);
        table.specificType("tags", "text[]").nullable();
        table.jsonb("metadata").defaultTo("{}");
        table.timestamp("created_at").defaultTo(DB.fn.now());
        table.timestamp("updated_at").defaultTo(DB.fn.now());
    });

    // Create indexes
    await DB.raw(`
    CREATE INDEX idx_documents_status ON ${DOCUMENTS_TABLE}(status);
    CREATE INDEX idx_documents_uploaded_by ON ${DOCUMENTS_TABLE}(uploaded_by);
  `);

    // Create the update_timestamp trigger
    await DB.raw(`
    CREATE TRIGGER update_documents_timestamp
    BEFORE UPDATE ON ${DOCUMENTS_TABLE}
    FOR EACH ROW
    EXECUTE PROCEDURE update_timestamp();
  `);
};

// Drop Table
export const dropTable = async () => {
    await DB.schema.dropTableIfExists(DOCUMENTS_TABLE);
};

// For individual table migration (when run directly)
if (require.main === module) {
    const dropFirst = process.argv.includes("--drop");

    (async () => {
        try {
            if (dropFirst) {
                console.log(`Dropping ${DOCUMENTS_TABLE} table...`);
                await dropTable();
            }
            console.log(`Creating ${DOCUMENTS_TABLE} table...`);
            await createTable();

            console.log(
                `${DOCUMENTS_TABLE} table ${dropFirst ? "recreated" : "created"}`
            );
            process.exit(0);
        } catch (error) {
            console.error(`Error with ${DOCUMENTS_TABLE} table:`, error);
            process.exit(1);
        }
    })();
}
