import DB from "../../../database/index.schema";

export const FOLDERS_TABLE = "folders";

// Schema Definition
export const createTable = async () => {
    await DB.schema.createTable(FOLDERS_TABLE, (table) => {
        table.increments("id").primary();
        table.text("name").notNullable();
        table.integer("parent_id").references("id").inTable(FOLDERS_TABLE).onDelete("CASCADE").nullable();
        table.integer("created_by").references("id").inTable("users").notNullable();
        table.timestamp("created_at").defaultTo(DB.fn.now());
        table.timestamp("updated_at").defaultTo(DB.fn.now());
    });

    // Create the update_timestamp trigger
    await DB.raw(`
    CREATE TRIGGER update_folders_timestamp
    BEFORE UPDATE ON ${FOLDERS_TABLE}
    FOR EACH ROW
    EXECUTE PROCEDURE update_timestamp();
  `);
};

// Drop Table
export const dropTable = async () => {
    await DB.schema.dropTableIfExists(FOLDERS_TABLE);
};

// For individual table migration (when run directly)
if (require.main === module) {
    const dropFirst = process.argv.includes("--drop");

    (async () => {
        try {
            if (dropFirst) {
                console.log(`Dropping ${FOLDERS_TABLE} table...`);
                await dropTable();
            }
            console.log(`Creating ${FOLDERS_TABLE} table...`);
            await createTable();

            console.log(
                `${FOLDERS_TABLE} table ${dropFirst ? "recreated" : "created"}`
            );
            process.exit(0);
        } catch (error) {
            console.error(`Error with ${FOLDERS_TABLE} table:`, error);
            process.exit(1);
        }
    })();
}
