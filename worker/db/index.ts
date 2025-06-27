import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import * as ghostwriterSchema from "./schema-ghostwriter";

// Combine all schemas
const fullSchema = {
	...schema,
	...ghostwriterSchema,
};

// Type the database properly
export type Database = ReturnType<typeof drizzle<typeof fullSchema>>;
let db: Database;

export function getDB(env: Env) {
	if (!db) {
		db = drizzle(env.DB, {
			schema: fullSchema,
		});
	}
	return db;
}
