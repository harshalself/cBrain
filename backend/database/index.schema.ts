import dotenv from "dotenv";
dotenv.config({ quiet: true });

import knex from "knex";

const awsConf = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || "5432"),
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  },
  pool: { min: 1, max: 5 },
  searchPath: "public",
};

const DB = knex(awsConf);

export default DB;

// Table Names
import { USERS_TABLE } from "../src/features/user/users.schema";
import { AGENTS_TABLE } from "../src/features/agent/agents.schema";
import { CHAT_SESSIONS_TABLE } from "../src/features/chat/chat_sessions.schema";
import { MESSAGES_TABLE } from "../src/features/chat/messages.schema";
import { SOURCES_TABLE } from "../src/features/source/sources.schema";
import { FILE_SOURCES_TABLE } from "../src/features/source/file/file_sources.schema";
// Removed: TEXT_SOURCES, WEBSITE_SOURCES, DATABASE_SOURCES, QA_SOURCES, DATABASE_TABLE_SCHEMAS
import { PROVIDER_MODELS_TABLE } from "../src/features/provider_model/provider_models.schema";

// Table Names
export const T = {
  USERS_TABLE,
  AGENTS_TABLE,
  CHAT_SESSIONS_TABLE,
  MESSAGES_TABLE,
  SOURCES_TABLE,
  FILE_SOURCES_TABLE,
  PROVIDER_MODELS_TABLE,
};

// Creates the procedure that is then added as a trigger to every table
// Only needs to be run once on each postgres schema
// SECURITY FIX: Set search_path to prevent SQL injection
export const createProcedure = async () => {
  await DB.raw(`
      CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS
      $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$;
    `);
};

// const run = async () => {
//   createProcedure();
// };
// run();
