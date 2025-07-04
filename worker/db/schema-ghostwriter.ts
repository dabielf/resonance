import { sql, relations } from "drizzle-orm";
import {
	sqliteTable,
	text,
	integer,
	index,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { users } from "./schema";

// ============ GHOSTWRITER TABLES ============

export const ghostwriters = sqliteTable(
	"ghostwriters",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: integer("user_id").notNull().references(() => users.id),
		name: text("name").notNull(),
		description: text("description"),
		avatarUrl: text("avatar_url"),
		psyProfileId: integer("psy_profile_id"), // Remove reference here, add it later
		writingProfileId: integer("writing_profile_id"), // Remove reference here, add it later
		basePersonaId: integer("base_persona_id"), // Optional default persona for this writer
		psyProfileRating: integer("psy_profile_rating").default(50), // 1-100
		writingProfileRating: integer("writing_profile_rating").default(50), // 1-100
		psyCritic: text("psy_critic"),
		humanInputPsyCritic: text("human_input_psy_critic"),
		writingCritic: text("writing_critic"),
		humanInputWritingCritic: text("human_input_writing_critic"),
		trainingIterations: integer("training_iterations").notNull().default(0),
		deletedAt: text("deleted_at"), // For soft delete support
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("ghostwriter_user_id_idx").on(table.userId),
		index("ghostwriter_deleted_at_idx").on(table.deletedAt), // Index for filtering soft deletes
		index("ghostwriter_base_persona_id_idx").on(table.basePersonaId), // Index for base persona lookups
		uniqueIndex("ghostwriter_user_name_idx").on(table.userId, table.name), // unique per user
	],
);

export const psyProfiles = sqliteTable(
	"psy_profiles",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: integer("user_id").notNull().references(() => users.id),
		ghostwriterId: integer("ghostwriter_id").references(() => ghostwriters.id), // optional
		name: text("name").notNull(),
		description: text("description"),
		content: text("content").notNull(),
		custom: integer({ mode: "boolean" }).notNull().default(false),
		dateReplaced: text("date_replaced"), // null means current version
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("psy_profile_user_id_idx").on(table.userId),
		index("psy_profile_ghostwriter_id_idx").on(table.ghostwriterId),
	],
);

export const writingProfiles = sqliteTable(
	"writing_profiles",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: integer("user_id").notNull().references(() => users.id),
		ghostwriterId: integer("ghostwriter_id").references(() => ghostwriters.id), // optional
		name: text("name").notNull(),
		description: text("description"),
		content: text("content").notNull(),
		custom: integer({ mode: "boolean" }).notNull().default(false),
		dateReplaced: text("date_replaced"), // null means current version
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("writing_profile_user_id_idx").on(table.userId),
		index("writing_profile_ghostwriter_id_idx").on(table.ghostwriterId),
	],
);

export const originalContents = sqliteTable(
	"original_contents",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		ghostwriterId: integer("ghostwriter_id").references(() => ghostwriters.id), // Made nullable for safe delete
		content: text("content").notNull(),
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("original_content_ghostwriter_id_idx").on(table.ghostwriterId),
	],
);

export const personas = sqliteTable(
	"personas",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: integer("user_id").notNull().references(() => users.id),
		name: text("name").notNull(),
		description: text("description"),
		content: text("content").notNull(),
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("persona_user_id_idx").on(table.userId),
	],
);

export const generatedContents = sqliteTable(
	"generated_contents",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: integer("user_id").notNull().references(() => users.id),
		ghostwriterId: integer("ghostwriter_id").references(() => ghostwriters.id), // optional
		psyProfileId: integer("psy_profile_id").references(() => psyProfiles.id), // Made nullable for safe delete
		writingProfileId: integer("writing_profile_id").references(() => writingProfiles.id), // Made nullable for safe delete
		personaId: integer("persona_id").references(() => personas.id), // optional
		prompt: text("prompt").notNull(),
		content: text("content").notNull(),
		userFeedBack: text('user_feedback'),
		isTrainingData: integer({ mode: "boolean" }).notNull().default(false),
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("generated_content_user_id_idx").on(table.userId),
		index("generated_content_ghostwriter_id_idx").on(table.ghostwriterId),
		index("generated_content_training_idx").on(table.ghostwriterId, table.isTrainingData),
	],
);

export const gwWritingAnalysis = sqliteTable(
	"gw_writing_analysis",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: integer("user_id").notNull().references(() => users.id),
		writingProfileId: integer("writing_profile_id").notNull().references(() => writingProfiles.id),
		ghostwriterId: integer("ghostwriter_id").notNull().references(() => ghostwriters.id),
		analysis: text("analysis").notNull(),
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("gw_writing_analysis_user_id_idx").on(table.userId),
		index("gw_writing_analysis_ghostwriter_id_idx").on(table.ghostwriterId),
	],
);

export const gwPsychologicalAnalysis = sqliteTable(
	"gw_psychological_analysis",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: integer("user_id").notNull().references(() => users.id),
		psyProfileId: integer("psy_profile_id").notNull().references(() => psyProfiles.id),
		ghostwriterId: integer("ghostwriter_id").notNull().references(() => ghostwriters.id),
		analysis: text("analysis").notNull(),
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("gw_psychological_analysis_user_id_idx").on(table.userId),
		index("gw_psychological_analysis_ghostwriter_id_idx").on(table.ghostwriterId),
	],
);

export const resourceContents = sqliteTable(
	"resource_contents",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: integer("user_id").notNull().references(() => users.id),
		title: text("title").notNull(),
		author: text("author"),
		content: text("content").notNull(),
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("resource_content_user_id_idx").on(table.userId),
	],
);

export const insights = sqliteTable(
	"insights",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		resourceContentId: integer("resource_content_id").notNull().references(() => resourceContents.id),
		userId: integer("user_id").notNull().references(() => users.id),
		personaId: integer("persona_id").notNull().references(() => personas.id),
		title: text("title").notNull(),
		rawContent: text("raw_content").notNull(),
		keyPoints: text("key_points", { mode: 'json' }).$type<string[]>().notNull(),
		generatedContentId: integer("generated_content_id").references(() => generatedContents.id), // optional
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("insight_user_id_idx").on(table.userId),
		index("insight_resource_content_id_idx").on(table.resourceContentId),
		index("insight_persona_id_idx").on(table.personaId),
	],
);

// ============ GHOSTWRITER RELATIONS ============

export const ghostwritersRelations = relations(ghostwriters, ({ one, many }) => ({
	user: one(users, {
		fields: [ghostwriters.userId],
		references: [users.id],
	}),
	currentPsyProfile: one(psyProfiles, {
		fields: [ghostwriters.psyProfileId],
		references: [psyProfiles.id],
	}),
	currentWritingProfile: one(writingProfiles, {
		fields: [ghostwriters.writingProfileId],
		references: [writingProfiles.id],
	}),
	basePersona: one(personas, {
		fields: [ghostwriters.basePersonaId],
		references: [personas.id],
	}),
	originalContents: many(originalContents),
	generatedContents: many(generatedContents),
}));

export const psyProfilesRelations = relations(psyProfiles, ({ one, many }) => ({
	user: one(users, {
		fields: [psyProfiles.userId],
		references: [users.id],
	}),
	ghostwriter: one(ghostwriters, {
		fields: [psyProfiles.ghostwriterId],
		references: [ghostwriters.id],
	}),
	generatedContents: many(generatedContents),
}));

export const writingProfilesRelations = relations(writingProfiles, ({ one, many }) => ({
	user: one(users, {
		fields: [writingProfiles.userId],
		references: [users.id],
	}),
	ghostwriter: one(ghostwriters, {
		fields: [writingProfiles.ghostwriterId],
		references: [ghostwriters.id],
	}),
	generatedContents: many(generatedContents),
}));

export const originalContentsRelations = relations(originalContents, ({ one }) => ({
	ghostwriter: one(ghostwriters, {
		fields: [originalContents.ghostwriterId],
		references: [ghostwriters.id],
	}),
}));

export const personasRelations = relations(personas, ({ one, many }) => ({
	user: one(users, {
		fields: [personas.userId],
		references: [users.id],
	}),
	generatedContents: many(generatedContents),
	insights: many(insights),
}));

export const generatedContentsRelations = relations(generatedContents, ({ one, many }) => ({
	user: one(users, {
		fields: [generatedContents.userId],
		references: [users.id],
	}),
	ghostwriter: one(ghostwriters, {
		fields: [generatedContents.ghostwriterId],
		references: [ghostwriters.id],
	}),
	psyProfile: one(psyProfiles, {
		fields: [generatedContents.psyProfileId],
		references: [psyProfiles.id],
	}),
	writingProfile: one(writingProfiles, {
		fields: [generatedContents.writingProfileId],
		references: [writingProfiles.id],
	}),
	persona: one(personas, {
		fields: [generatedContents.personaId],
		references: [personas.id],
	}),
	insights: many(insights),
}));

export const resourceContentsRelations = relations(resourceContents, ({ one, many }) => ({
	user: one(users, {
		fields: [resourceContents.userId],
		references: [users.id],
	}),
	insights: many(insights),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
	user: one(users, {
		fields: [insights.userId],
		references: [users.id],
	}),
	resourceContent: one(resourceContents, {
		fields: [insights.resourceContentId],
		references: [resourceContents.id],
	}),
	persona: one(personas, {
		fields: [insights.personaId],
		references: [personas.id],
	}),
	generatedContent: one(generatedContents, {
		fields: [insights.generatedContentId],
		references: [generatedContents.id],
	}),
}));