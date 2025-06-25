import { eq } from "drizzle-orm";
import { analyzePsychology } from "../../agents/psychological-profiler";
import { analyzeWritingStyle } from "../../agents/writing-style-profiler";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import {
	ghostwriters,
	originalContents,
	personas,
	psyProfiles,
	writingProfiles,
} from "../../db/schema-ghostwriter";
import {
	type ApiResponseErrorType,
	type ApiResponseSuccessType,
	CreateGhostwriterInput,
	CreateOriginalContentInput,
	CreateProfileInput,
	type Ghostwriter,
	type ListAllResponse,
	type Persona,
	type PsyProfile,
	type WritingProfile,
} from "../../types/gw";
import { t } from "../trpc-instance";

export const contentRouter = t.router({
	getUserData: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		const user = await db.query.users.findFirst({
			where: eq(users.id, ctx.userId),
			columns: {
				id: true,
				name: true,
				createdAt: true,
			},
			with: {
				ghostwriters: {
					columns: {
						id: true,
						name: true,
						psyProfileId: true,
						writingProfileId: true,
					},
				},
				psyProfiles: {
					columns: {
						id: true,
						name: true,
					},
				},
				writingProfiles: {
					columns: {
						id: true,
						name: true,
					},
				},
				personas: {
					columns: {
						id: true,
						name: true,
						description: true,
						createdAt: true,
					},
				},
				resourceContents: {
					columns: {
						id: true,
						title: true,
					},
				},
			},
		});
		if (!user) {
			return {
				success: false,
				error: {
					code: "NOT_FOUND",
					message: "User not found",
					details: "User not found",
				},
			} as ApiResponseErrorType;
		}

		return {
			success: true,
			data: user,
		} as ApiResponseSuccessType<ListAllResponse>;
	}),
	createGhostwriter: t.procedure
		.input(CreateGhostwriterInput)
		.mutation(async ({ input: { name, description }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				const gw = await db
					.insert(ghostwriters)
					.values({
						userId: ctx.userId,
						name,
						description: description || "",
					})
					.returning();

				return {
					success: true,
					data: gw[0],
				} as ApiResponseSuccessType<Ghostwriter>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create ghostwriter",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	addOriginalContents: t.procedure
		.input(CreateOriginalContentInput)
		.mutation(async ({ input: { content, gwId }, ctx }) => {
			const db = getDB(ctx.env);
			const contentArray = content.split("===").filter((item) => item.trim());
			try {
				await db
					.insert(originalContents)
					.values(
						contentArray.map((contentItem) => ({
							ghostwriterId: gwId || 0,
							content: contentItem.trim(),
						})),
					)
					.returning();
				return {
					success: true,
					data: contentArray.length,
				} as ApiResponseSuccessType<number>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create original content",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	createPsyProfile: t.procedure
		.input(CreateProfileInput)
		.mutation(async ({ input: { name, content, gwId }, ctx }) => {
			let contentArray: string[] = [];
			const db = getDB(ctx.env);
			if (!content && !gwId) {
				return {
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "No content or ghostwriter ID provided",
						details: "Please provide either content or ghostwriter ID",
					},
				} as ApiResponseErrorType;
			}

			if (content) {
				contentArray = content.split("===").filter((item) => item.trim());
			} else if (gwId) {
				const dbContent = await db
					.select()
					.from(originalContents)
					.where(eq(originalContents.ghostwriterId, gwId));
				contentArray = dbContent.map((item) => item.content);
			}

			const analyzedProfile = await analyzePsychology(
				ctx.env.GOOGLE_GENERATIVE_AI_API_KEY,
				contentArray,
			);

			try {
				const profile = await db
					.insert(psyProfiles)
					.values({
						userId: ctx.userId,
						ghostwriterId: gwId,
						name,
						content: analyzedProfile,
					})
					.returning();

				return {
					success: true,
					data: profile[0],
				} as ApiResponseSuccessType<PsyProfile>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create psychology profile",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	createWritingProfile: t.procedure
		.input(CreateProfileInput)
		.mutation(async ({ input: { name, content, gwId }, ctx }) => {
			let contentArray: string[] = [];
			const db = getDB(ctx.env);
			if (!content && !gwId) {
				return {
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "No content or ghostwriter ID provided",
						details: "Please provide either content or ghostwriter ID",
					},
				} as ApiResponseErrorType;
			}

			if (content) {
				contentArray = content.split("===").filter((item) => item.trim());
			} else if (gwId) {
				const dbContent = await db
					.select()
					.from(originalContents)
					.where(eq(originalContents.ghostwriterId, gwId));
				contentArray = dbContent.map((item) => item.content);
			}

			const analyzedProfile = await analyzeWritingStyle(
				ctx.env.GOOGLE_GENERATIVE_AI_API_KEY,
				contentArray,
			);

			try {
				const profile = await db
					.insert(writingProfiles)
					.values({
						userId: ctx.userId,
						ghostwriterId: gwId,
						name,
						content: analyzedProfile,
					})
					.returning();

				return {
					success: true,
					data: profile[0],
				} as ApiResponseSuccessType<PsyProfile>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create writing profile",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
});
