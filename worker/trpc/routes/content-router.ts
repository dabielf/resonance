import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import {
	generatedContents,
	ghostwriters,
	insights,
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
	CreatePersonaInput,
	CreateProfileInput,
	GenerateContentInput,
	type GeneratedContent,
	type GeneratedContentWithRelations,
	type Ghostwriter,
	type ListAllResponse,
	type Persona,
	type PsyProfile,
	type PsyProfileWithRelations,
	SaveContentInput,
	SaveProfileInput,
	UpdateGeneratedContentInput,
	UpdatePersonaInput,
	UpdateProfileInput,
	type WritingProfile,
	type WritingProfileWithRelations,
} from "../../types/gw";
import { t } from "../trpc-instance";

const { generateContent } = await import("../../agents/ghostwriter");
const { analyzePsychology } = await import(
	"../../agents/psychological-profiler"
);
const { analyzeWritingStyle } = await import(
	"../../agents/writing-style-profiler"
);
const { psyProfileModifier } = await import(
	"../../agents/psy-profile-modifier"
);
const { writeProfileModifier } = await import(
	"../../agents/write-profile-modifier"
);

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
	listGhostwriters: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		const writers = await db.query.ghostwriters.findMany({
			where: and(
				eq(ghostwriters.userId, ctx.userId),
				isNull(ghostwriters.deletedAt), // Filter out soft-deleted ghostwriters
			),
		});
		return {
			success: true,
			data: writers,
		} as ApiResponseSuccessType<Ghostwriter[]>;
	}),
	listPsyProfiles: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		const data = await db.query.psyProfiles.findMany({
			where: eq(psyProfiles.userId, ctx.userId),
		});
		return {
			success: true,
			data: data,
		} as ApiResponseSuccessType<PsyProfile[]>;
	}),
	listWritingProfiles: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		const data = await db.query.writingProfiles.findMany({
			where: eq(writingProfiles.userId, ctx.userId),
		});
		return {
			success: true,
			data: data,
		} as ApiResponseSuccessType<WritingProfile[]>;
	}),
	listPersonas: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		try {
			const data = await db.query.personas.findMany({
				where: eq(personas.userId, ctx.userId),
			});
			return {
				success: true,
				data: data,
			} as ApiResponseSuccessType<Persona[]>;
		} catch (error) {
			return {
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to get personas",
					details: (error as Error).message,
				},
			} as ApiResponseErrorType;
		}
	}),
	listGeneratedContents: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		try {
			const data = await db.query.generatedContents.findMany({
				where: eq(generatedContents.userId, ctx.userId),
				orderBy: [desc(generatedContents.createdAt)],
				with: {
					writingProfile: {
						columns: { id: true, name: true },
					},
					psyProfile: {
						columns: { id: true, name: true },
					},
					persona: {
						columns: { id: true, name: true },
					},
					ghostwriter: {
						columns: { id: true, name: true },
					},
				},
			});
			return {
				success: true,
				data: data,
			} as ApiResponseSuccessType<GeneratedContentWithRelations[]>;
		} catch (error) {
			return {
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to get generated contents",
					details: (error as Error).message,
				},
			} as ApiResponseErrorType;
		}
	}),
	getPersona: t.procedure
		.input(z.object({ id: z.number().min(1, "Persona ID is required") }))
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			if (!id) {
				return {
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Persona ID is required",
						details: "Please provide a persona ID",
					},
				} as ApiResponseErrorType;
			}
			try {
				const data = await db.query.personas.findFirst({
					where: eq(personas.id, id),
				});
				return {
					success: true,
					data: data,
				} as ApiResponseSuccessType<Persona>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to get persona",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	getGeneratedContent: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Generated content ID is required") }),
		)
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			if (!id) {
				return {
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Generated content ID is required",
						details: "Please provide a generated content ID",
					},
				} as ApiResponseErrorType;
			}
			try {
				const data = await db.query.generatedContents.findFirst({
					where: eq(generatedContents.id, id),
					with: {
						writingProfile: {
							columns: { id: true, name: true },
						},
						psyProfile: {
							columns: { id: true, name: true },
						},
						persona: {
							columns: { id: true, name: true },
						},
						ghostwriter: {
							columns: { id: true, name: true },
						},
					},
				});
				return {
					success: true,
					data: data,
				} as ApiResponseSuccessType<GeneratedContentWithRelations>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to get generated content",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	getGhostwriter: t.procedure
		.input(z.object({ id: z.number().min(1, "Ghostwriter ID is required") }))
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				const data = await db.query.ghostwriters.findFirst({
					where: eq(ghostwriters.id, id),
					with: {
						currentPsyProfile: {
							columns: { id: true, name: true, content: true },
						},
						currentWritingProfile: {
							columns: { id: true, name: true, content: true },
						},
					},
				});
				return {
					success: true,
					data: data,
				} as ApiResponseSuccessType<Ghostwriter>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to get ghostwriter",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	getPsyProfile: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Psychology profile ID is required") }),
		)
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				const data = await db.query.psyProfiles.findFirst({
					where: eq(psyProfiles.id, id),
					with: {
						ghostwriter: {
							columns: { id: true, name: true },
						},
					},
				});
				return {
					success: true,
					data: data,
				} as ApiResponseSuccessType<PsyProfileWithRelations>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to get psychology profile",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	getWritingProfile: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Writing profile ID is required") }),
		)
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				const data = await db.query.writingProfiles.findFirst({
					where: eq(writingProfiles.id, id),
					with: {
						ghostwriter: {
							columns: { id: true, name: true },
						},
					},
				});
				return {
					success: true,
					data: data,
				} as ApiResponseSuccessType<WritingProfileWithRelations>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to get writing profile",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	savePersona: t.procedure
		.input(CreatePersonaInput)
		.mutation(async ({ input: { name, description, content }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				const persona = await db
					.insert(personas)
					.values({
						userId: ctx.userId,
						name,
						description: description || "",
						content,
					})
					.returning();

				return {
					success: true,
					data: persona[0],
				} as ApiResponseSuccessType<Persona>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create persona",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	savePsyProfile: t.procedure
		.input(SaveProfileInput)
		.mutation(async ({ input: { name, content }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				const profile = await db
					.insert(psyProfiles)
					.values({
						userId: ctx.userId,
						ghostwriterId: null,
						name,
						content,
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
	saveWritingProfile: t.procedure
		.input(SaveProfileInput)
		.mutation(async ({ input: { name, content }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				const profile = await db
					.insert(writingProfiles)
					.values({
						userId: ctx.userId,
						ghostwriterId: null,
						name,
						content,
					})
					.returning();

				return {
					success: true,
					data: profile[0],
				} as ApiResponseSuccessType<WritingProfile>;
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
	updatePersona: t.procedure
		.input(UpdatePersonaInput)
		.mutation(async ({ input: { id, name, description, content }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				const persona = await db
					.update(personas)
					.set({
						name,
						description: description || "",
						content,
					})
					.where(eq(personas.id, id))
					.returning();
				return {
					success: true,
					data: persona[0],
				} as ApiResponseSuccessType<Persona>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to update persona",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	updateGhostwriter: t.procedure
		.input(
			z.object({
				id: z.number().min(1, "Ghostwriter ID is required"),
				name: z.string().min(1, "Name is required").optional(),
				description: z.string().optional(),
				psyProfileId: z.number().optional(),
				writingProfileId: z.number().optional(),
			}),
		)
		.mutation(
			async ({
				input: { id, name, description, psyProfileId, writingProfileId },
				ctx,
			}) => {
				const db = getDB(ctx.env);
				try {
					const updateData: Partial<typeof ghostwriters.$inferInsert> = {};
					if (name !== undefined) updateData.name = name;
					if (description !== undefined) updateData.description = description;
					if (psyProfileId !== undefined)
						updateData.psyProfileId = psyProfileId;
					if (writingProfileId !== undefined)
						updateData.writingProfileId = writingProfileId;

					const ghostwriter = await db
						.update(ghostwriters)
						.set(updateData)
						.where(eq(ghostwriters.id, id))
						.returning();

					return {
						success: true,
						data: ghostwriter[0],
					} as ApiResponseSuccessType<Ghostwriter>;
				} catch (error) {
					return {
						success: false,
						error: {
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to update ghostwriter",
							details: (error as Error).message,
						},
					} as ApiResponseErrorType;
				}
			},
		),
	deletePersona: t.procedure
		.input(z.object({ id: z.number().min(1, "Persona ID is required") }))
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				await db.delete(personas).where(eq(personas.id, id));
				return {
					success: true,
					data: id,
				} as ApiResponseSuccessType<number>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to delete persona",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	saveGeneratedContent: t.procedure
		.input(SaveContentInput)
		.mutation(
			async ({
				input: {
					content,
					gwId,
					psyProfileId,
					writingProfileId,
					personaProfileId,
					prompt,
					userFeedback,
					isTrainingData,
				},
				ctx,
			}) => {
				const db = getDB(ctx.env);
				try {
					const generatedContent = await db
						.insert(generatedContents)
						.values({
							userId: ctx.userId,
							ghostwriterId: gwId || null,
							psyProfileId,
							writingProfileId,
							personaId: personaProfileId || null,
							prompt,
							content,
							userFeedBack: userFeedback || null,
							isTrainingData: isTrainingData || false,
						})
						.returning();

					return {
						success: true,
						data: generatedContent[0],
					} as ApiResponseSuccessType<GeneratedContent>;
				} catch (error) {
					return {
						success: false,
						error: {
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to save generated content",
							details: (error as Error).message,
						},
					} as ApiResponseErrorType;
				}
			},
		),
	updateGeneratedContent: t.procedure
		.input(
			UpdateGeneratedContentInput.extend({
				id: z.number().min(1, "Generated content ID is required"),
			}),
		)
		.mutation(
			async ({ input: { id, content, userFeedBack, isTrainingData }, ctx }) => {
				const db = getDB(ctx.env);
				try {
					const updateData: Partial<GeneratedContent> = {};
					if (content !== undefined) updateData.content = content;
					if (userFeedBack !== undefined)
						updateData.userFeedBack = userFeedBack;
					if (isTrainingData !== undefined)
						updateData.isTrainingData = isTrainingData;

					const generatedContent = await db
						.update(generatedContents)
						.set(updateData)
						.where(eq(generatedContents.id, id))
						.returning();

					return {
						success: true,
						data: generatedContent[0],
					} as ApiResponseSuccessType<GeneratedContent>;
				} catch (error) {
					return {
						success: false,
						error: {
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to update generated content",
							details: (error as Error).message,
						},
					} as ApiResponseErrorType;
				}
			},
		),
	deleteGeneratedContent: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Generated content ID is required") }),
		)
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				await db.delete(generatedContents).where(eq(generatedContents.id, id));
				return {
					success: true,
					data: id,
				} as ApiResponseSuccessType<number>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to delete generated content",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	deleteGhostwriter: t.procedure
		.input(z.object({ id: z.number().min(1, "Ghostwriter ID is required") }))
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				// Soft delete: set deletedAt timestamp
				const ghostwriter = await db
					.update(ghostwriters)
					.set({ deletedAt: new Date().toISOString() })
					.where(eq(ghostwriters.id, id))
					.returning();

				return {
					success: true,
					data: ghostwriter[0],
				} as ApiResponseSuccessType<Ghostwriter>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to delete ghostwriter",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	deletePsyProfile: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Psychology profile ID is required") }),
		)
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				// Start transaction to handle cascade nullify safely
				const deletedId = await db.transaction(async (tx) => {
					// First, verify the profile exists and belongs to the user
					const profile = await tx
						.select()
						.from(psyProfiles)
						.where(
							and(
								eq(psyProfiles.id, id),
								eq(psyProfiles.userId, ctx.userId)
							)
						)
						.limit(1);

					if (profile.length === 0) {
						throw new Error("Profile not found or unauthorized");
					}

					// 1. Nullify references in generatedContents (only for this user)
					await tx
						.update(generatedContents)
						.set({ psyProfileId: null })
						.where(
							and(
								eq(generatedContents.psyProfileId, id),
								eq(generatedContents.userId, ctx.userId)
							)
						);

					// 2. Nullify references in ghostwriters (only for this user)
					await tx
						.update(ghostwriters)
						.set({ psyProfileId: null })
						.where(
							and(
								eq(ghostwriters.psyProfileId, id),
								eq(ghostwriters.userId, ctx.userId)
							)
						);

					// 3. Delete the profile itself (with user check)
					const deleted = await tx
						.delete(psyProfiles)
						.where(
							and(
								eq(psyProfiles.id, id),
								eq(psyProfiles.userId, ctx.userId)
							)
						)
						.returning({ id: psyProfiles.id });

					if (deleted.length === 0) {
						throw new Error("Failed to delete profile");
					}

					return deleted[0].id;
				});

				return {
					success: true,
					data: deletedId,
				} as ApiResponseSuccessType<number>;
			} catch (error) {
				const errorMessage = (error as Error).message;
				if (errorMessage === "Profile not found or unauthorized") {
					return {
						success: false,
						error: {
							code: "NOT_FOUND",
							message: "Psychology profile not found or you don't have permission to delete it",
							details: errorMessage,
						},
					} as ApiResponseErrorType;
				}
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to delete psychology profile",
						details: errorMessage,
					},
				} as ApiResponseErrorType;
			}
		}),
	deleteWritingProfile: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Writing profile ID is required") }),
		)
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			try {
				// Start transaction to handle cascade nullify safely
				const deletedId = await db.transaction(async (tx) => {
					// First, verify the profile exists and belongs to the user
					const profile = await tx
						.select()
						.from(writingProfiles)
						.where(
							and(
								eq(writingProfiles.id, id),
								eq(writingProfiles.userId, ctx.userId)
							)
						)
						.limit(1);

					if (profile.length === 0) {
						throw new Error("Profile not found or unauthorized");
					}

					// 1. Nullify references in generatedContents (only for this user)
					await tx
						.update(generatedContents)
						.set({ writingProfileId: null })
						.where(
							and(
								eq(generatedContents.writingProfileId, id),
								eq(generatedContents.userId, ctx.userId)
							)
						);

					// 2. Nullify references in ghostwriters (only for this user)
					await tx
						.update(ghostwriters)
						.set({ writingProfileId: null })
						.where(
							and(
								eq(ghostwriters.writingProfileId, id),
								eq(ghostwriters.userId, ctx.userId)
							)
						);

					// 3. Delete the profile itself (with user check)
					const deleted = await tx
						.delete(writingProfiles)
						.where(
							and(
								eq(writingProfiles.id, id),
								eq(writingProfiles.userId, ctx.userId)
							)
						)
						.returning({ id: writingProfiles.id });

					if (deleted.length === 0) {
						throw new Error("Failed to delete profile");
					}

					return deleted[0].id;
				});

				return {
					success: true,
					data: deletedId,
				} as ApiResponseSuccessType<number>;
			} catch (error) {
				const errorMessage = (error as Error).message;
				if (errorMessage === "Profile not found or unauthorized") {
					return {
						success: false,
						error: {
							code: "NOT_FOUND",
							message: "Writing profile not found or you don't have permission to delete it",
							details: errorMessage,
						},
					} as ApiResponseErrorType;
				}
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to delete writing profile",
						details: errorMessage,
					},
				} as ApiResponseErrorType;
			}
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

				if (gwId) {
					await db
						.update(ghostwriters)
						.set({
							psyProfileId: profile[0].id,
						})
						.where(eq(ghostwriters.id, gwId));
				}

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
	updatePsyProfile: t.procedure
		.input(UpdateProfileInput)
		.mutation(async ({ input: { id, name, description, content }, ctx }) => {
			if (!id) {
				return {
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Profile ID is required",
						details: "Please provide a profile ID",
					},
				} as ApiResponseErrorType;
			}

			const updateData: Partial<z.infer<typeof UpdateProfileInput>> = {};
			if (name) updateData.name = name;
			if (description) updateData.description = description;
			if (content) updateData.content = content;

			const db = getDB(ctx.env);
			try {
				const profile = await db
					.update(psyProfiles)
					.set(updateData)
					.where(eq(psyProfiles.id, id))
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
						message: "Failed to update psychology profile",
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

				if (gwId) {
					await db
						.update(ghostwriters)
						.set({
							writingProfileId: profile[0].id,
						})
						.where(eq(ghostwriters.id, gwId));
				}

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
	updateWritingProfile: t.procedure
		.input(UpdateProfileInput)
		.mutation(async ({ input: { id, name, description, content }, ctx }) => {
			if (!id) {
				return {
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Profile ID is required",
						details: "Please provide a profile ID",
					},
				} as ApiResponseErrorType;
			}

			const updateData: Partial<z.infer<typeof UpdateProfileInput>> = {};
			if (name) updateData.name = name;
			if (description) updateData.description = description;
			if (content) updateData.content = content;

			const db = getDB(ctx.env);
			try {
				const profile = await db
					.update(writingProfiles)
					.set(updateData)
					.where(eq(writingProfiles.id, id))
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
						message: "Failed to update writing profile",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	generateContent: t.procedure
		.input(GenerateContentInput)
		.mutation(async ({ input, ctx }) => {
			const db = getDB(ctx.env);
			const apiKey = await ctx.crypto.getApiKey("gemini");

			if (!apiKey) {
				throw new Error("MISSING_API_KEY");
			}

			const {
				topic,
				psychologyProfileId,
				writingProfileId,
				personaProfileId,
				insightId,
			} = input;
			const psychologyProfilePromise = db.query.psyProfiles.findFirst({
				where: eq(psyProfiles.id, psychologyProfileId),
			});
			const writingProfilePromise = db.query.writingProfiles.findFirst({
				where: eq(writingProfiles.id, writingProfileId),
			});
			const personaProfilePromise = personaProfileId
				? db.query.personas.findFirst({
						where: eq(personas.id, personaProfileId),
					})
				: Promise.resolve(null);
			const insightPromise = insightId
				? db.query.insights.findFirst({
						where: eq(insights.id, insightId),
					})
				: Promise.resolve(null);

			const [psychologyProfile, writingProfile, personaProfile, insight] =
				await Promise.all([
					psychologyProfilePromise,
					writingProfilePromise,
					personaProfilePromise,
					insightPromise,
				]);

			if (!psychologyProfile || !writingProfile) {
				return {
					success: false,
					error: {
						code: "NOT_FOUND",
						message: "Profile not found",
						details: "Profile not found",
					},
				} as ApiResponseErrorType;
			}

			if (!topic && !insight) {
				return {
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "No topic or insight provided",
						details: "Please provide either a topic or an insight",
					},
				} as ApiResponseErrorType;
			}

			let completeTopic = "";
			if (insight) {
				completeTopic = insight.rawContent;
			}
			if (topic) {
				completeTopic += `\n\n${topic}`;
			}

			const response = await generateContent({
				apiKey,
				psychologyProfile: psychologyProfile.content,
				writingProfile: writingProfile.content,
				personaProfile: personaProfile?.content,
				topic: completeTopic.trim(),
			});

			return {
				success: true,
				data: response,
			} as ApiResponseSuccessType<string>;
		}),
	modifyPsyProfile: t.procedure
		.input(
			z.object({
				profileId: z.number().min(1, "Profile ID is required"),
				newName: z.string().min(1, "New name is required"),
				modifications: z.string().min(1, "Modifications are required"),
			}),
		)
		.mutation(async ({ input: { profileId, newName, modifications }, ctx }) => {
			const db = getDB(ctx.env);
			const apiKey = await ctx.crypto.getApiKey("gemini");

			if (!apiKey) {
				throw new Error("MISSING_API_KEY");
			}

			try {
				// Get the original profile
				const originalProfile = await db.query.psyProfiles.findFirst({
					where: eq(psyProfiles.id, profileId),
				});

				if (!originalProfile) {
					return {
						success: false,
						error: {
							code: "NOT_FOUND",
							message: "Profile not found",
							details: "The specified psychology profile does not exist",
						},
					} as ApiResponseErrorType;
				}

				// Generate the modified profile
				const modifiedContent = await psyProfileModifier(
					apiKey,
					originalProfile.content,
					modifications,
				);

				// Create the new profile
				const newProfile = await db
					.insert(psyProfiles)
					.values({
						userId: ctx.userId,
						ghostwriterId: null, // New profiles are independent
						name: newName,
						content: modifiedContent,
					})
					.returning();

				return {
					success: true,
					data: newProfile[0],
				} as ApiResponseSuccessType<PsyProfile>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to modify psychology profile",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
	modifyWritingProfile: t.procedure
		.input(
			z.object({
				profileId: z.number().min(1, "Profile ID is required"),
				newName: z.string().min(1, "New name is required"),
				modifications: z.string().min(1, "Modifications are required"),
			}),
		)
		.mutation(async ({ input: { profileId, newName, modifications }, ctx }) => {
			const db = getDB(ctx.env);
			const apiKey = await ctx.crypto.getApiKey("gemini");

			if (!apiKey) {
				throw new Error("MISSING_API_KEY");
			}

			try {
				// Get the original profile
				const originalProfile = await db.query.writingProfiles.findFirst({
					where: eq(writingProfiles.id, profileId),
				});

				if (!originalProfile) {
					return {
						success: false,
						error: {
							code: "NOT_FOUND",
							message: "Profile not found",
							details: "The specified writing profile does not exist",
						},
					} as ApiResponseErrorType;
				}

				// Generate the modified profile
				const modifiedContent = await writeProfileModifier(
					apiKey,
					originalProfile.content,
					modifications,
				);

				// Create the new profile
				const newProfile = await db
					.insert(writingProfiles)
					.values({
						userId: ctx.userId,
						ghostwriterId: null, // New profiles are independent
						name: newName,
						content: modifiedContent,
					})
					.returning();

				return {
					success: true,
					data: newProfile[0],
				} as ApiResponseSuccessType<WritingProfile>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to modify writing profile",
						details: (error as Error).message,
					},
				} as ApiResponseErrorType;
			}
		}),
});
