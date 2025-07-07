import { TRPCError } from "@trpc/server";
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
	CreateGhostwriterInput,
	CreateOriginalContentInput,
	CreatePersonaInput,
	CreateProfileInput,
	CreateWriterWithProfilesInput,
	GenerateContentInput,
	type GeneratedContent,
	ReviseContentInput,
	SaveContentInput,
	SaveProfileInput,
	UpdateGeneratedContentInput,
	UpdatePersonaInput,
	UpdateProfileInput,
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
const { extractPersona } = await import(
	"../../agents/persona-extractor"
);
const { reviseContent } = await import(
	"../../agents/content-reviser"
);

export const contentRouter = t.router({
	getUserData: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		return await db.query.users.findFirst({
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
						basePersonaId: true,
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
	}),
	listGhostwriters: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		const writers = await db.query.ghostwriters.findMany({
			where: and(
				eq(ghostwriters.userId, ctx.userId),
				isNull(ghostwriters.deletedAt), // Filter out soft-deleted ghostwriters
			),
		});
		return writers;
	}),
	listPsyProfiles: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		const data = await db.query.psyProfiles.findMany({
			where: eq(psyProfiles.userId, ctx.userId),
		});
		return data;
	}),
	listWritingProfiles: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		const data = await db.query.writingProfiles.findMany({
			where: eq(writingProfiles.userId, ctx.userId),
		});
		return data;
	}),
	listPersonas: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		const data = await db.query.personas.findMany({
			where: eq(personas.userId, ctx.userId),
		});
		return data;
	}),
	listGeneratedContents: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
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
		return data;
	}),
	getPersona: t.procedure
		.input(z.object({ id: z.number().min(1, "Persona ID is required") }))
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			const data = await db.query.personas.findFirst({
				where: and(eq(personas.id, id), eq(personas.userId, ctx.userId)),
			});
			
			if (!data) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Persona not found or you don't have permission to access it",
				});
			}
			
			return data;
		}),
	getGeneratedContent: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Generated content ID is required") }),
		)
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			const data = await db.query.generatedContents.findFirst({
				where: and(eq(generatedContents.id, id), eq(generatedContents.userId, ctx.userId)),
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
			
			if (!data) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Generated content not found or you don't have permission to access it",
				});
			}
			
			return data;
		}),
	getGhostwriter: t.procedure
		.input(z.object({ id: z.number().min(1, "Ghostwriter ID is required") }))
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			const data = await db.query.ghostwriters.findFirst({
				where: and(eq(ghostwriters.id, id), eq(ghostwriters.userId, ctx.userId)),
				with: {
					currentPsyProfile: {
						columns: { id: true, name: true, content: true },
					},
					currentWritingProfile: {
						columns: { id: true, name: true, content: true },
					},
					basePersona: {
						columns: { id: true, name: true, description: true },
					},
					originalContents: {
						columns: { id: true, content: true, createdAt: true },
						orderBy: [desc(originalContents.createdAt)],
					},
					generatedContents: {
						columns: { 
							id: true, 
							prompt: true, 
							content: true, 
							userFeedBack: true,
							isTrainingData: true,
							createdAt: true 
						},
						with: {
							persona: {
								columns: { id: true, name: true },
							},
						},
						orderBy: [desc(generatedContents.createdAt)],
					},
				},
			});
			
			if (!data) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Ghostwriter not found or you don't have permission to access it",
				});
			}
			
			// Add computed statistics
			const stats = {
				originalContentCount: data.originalContents.length,
				trainingDataCount: data.generatedContents.filter(c => c.isTrainingData).length,
				totalGeneratedCount: data.generatedContents.length,
			};
			
			return {
				...data,
				stats,
			};
		}),
	getPsyProfile: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Psychology profile ID is required") }),
		)
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			const data = await db.query.psyProfiles.findFirst({
				where: and(eq(psyProfiles.id, id), eq(psyProfiles.userId, ctx.userId)),
				with: {
					ghostwriter: {
						columns: { id: true, name: true },
					},
				},
			});
			
			if (!data) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Psychology profile not found or you don't have permission to access it",
				});
			}
			
			return data;
		}),
	getWritingProfile: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Writing profile ID is required") }),
		)
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			const data = await db.query.writingProfiles.findFirst({
				where: and(eq(writingProfiles.id, id), eq(writingProfiles.userId, ctx.userId)),
				with: {
					ghostwriter: {
						columns: { id: true, name: true },
					},
				},
			});
			
			if (!data) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Writing profile not found or you don't have permission to access it",
				});
			}
			
			return data;
		}),
	savePersona: t.procedure
		.input(CreatePersonaInput)
		.mutation(async ({ input: { name, description, content }, ctx }) => {
			const db = getDB(ctx.env);
			const persona = await db
				.insert(personas)
				.values({
					userId: ctx.userId,
					name,
					description: description || "",
					content,
				})
				.returning();

			return persona[0];
		}),
	savePsyProfile: t.procedure
		.input(SaveProfileInput)
		.mutation(async ({ input: { name, content }, ctx }) => {
			const db = getDB(ctx.env);
			const profile = await db
				.insert(psyProfiles)
				.values({
					userId: ctx.userId,
					ghostwriterId: null,
					name,
					content,
				})
				.returning();

			return profile[0];
		}),
	saveWritingProfile: t.procedure
		.input(SaveProfileInput)
		.mutation(async ({ input: { name, content }, ctx }) => {
			const db = getDB(ctx.env);
			const profile = await db
				.insert(writingProfiles)
				.values({
					userId: ctx.userId,
					ghostwriterId: null,
					name,
					content,
				})
				.returning();

			return profile[0];
		}),
	updatePersona: t.procedure
		.input(UpdatePersonaInput)
		.mutation(async ({ input: { id, name, description, content }, ctx }) => {
			const db = getDB(ctx.env);
			const persona = await db
				.update(personas)
				.set({
					name,
					description: description || "",
					content,
				})
				.where(and(eq(personas.id, id), eq(personas.userId, ctx.userId)))
				.returning();
			
			if (persona.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Persona not found or you don't have permission to update it",
				});
			}
			
			return persona[0];
		}),
	updateGhostwriter: t.procedure
		.input(
			z.object({
				id: z.number().min(1, "Ghostwriter ID is required"),
				name: z.string().min(1, "Name is required").optional(),
				description: z.string().optional(),
				psyProfileId: z.number().optional(),
				writingProfileId: z.number().optional(),
				basePersonaId: z.number().nullable().optional(),
			}),
		)
		.mutation(
			async ({
				input: { id, name, description, psyProfileId, writingProfileId, basePersonaId },
				ctx,
			}) => {
				const db = getDB(ctx.env);
				const updateData: Partial<typeof ghostwriters.$inferInsert> = {};
				if (name !== undefined) updateData.name = name;
				if (description !== undefined) updateData.description = description;
				if (psyProfileId !== undefined)
					updateData.psyProfileId = psyProfileId;
				if (writingProfileId !== undefined)
					updateData.writingProfileId = writingProfileId;
				if (basePersonaId !== undefined)
					updateData.basePersonaId = basePersonaId;

				const ghostwriter = await db
					.update(ghostwriters)
					.set(updateData)
					.where(and(eq(ghostwriters.id, id), eq(ghostwriters.userId, ctx.userId)))
					.returning();

				if (ghostwriter.length === 0) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Ghostwriter not found or you don't have permission to update it",
					});
				}

				return ghostwriter[0];
			},
		),
	deletePersona: t.procedure
		.input(z.object({ id: z.number().min(1, "Persona ID is required") }))
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Verify ownership before deletion
			const persona = await db.select().from(personas)
				.where(and(eq(personas.id, id), eq(personas.userId, ctx.userId)))
				.limit(1);

			if (persona.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Persona not found or you don't have permission to delete it",
				});
			}

			// Use batch API for atomic operations (D1 best practice)
			const batchResult = await db.batch([
				// 1. Nullify optional references in generatedContents (only for this user)
				db
					.update(generatedContents)
					.set({ personaId: null })
					.where(
						and(
							eq(generatedContents.personaId, id),
							eq(generatedContents.userId, ctx.userId),
						),
					),

				// 2. Delete dependent insights (personaId is NOT NULL, only for this user)
				db
					.delete(insights)
					.where(
						and(
							eq(insights.personaId, id),
							eq(insights.userId, ctx.userId),
						),
					),

				// 3. Delete the persona itself (with user check)
				db
					.delete(personas)
					.where(
						and(eq(personas.id, id), eq(personas.userId, ctx.userId)),
					)
					.returning({ id: personas.id }),
			]);

			// Check if deletion was successful
			const deletedPersona = batchResult[2] as { id: number }[];
			if (deletedPersona.length === 0) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete persona",
				});
			}

			return deletedPersona[0].id;
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
					insightId,
				},
				ctx,
			}) => {
				const db = getDB(ctx.env);
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

				// If insight ID is provided, link the insight to the generated content
				if (insightId) {
					await db
						.update(insights)
						.set({ generatedContentId: generatedContent[0].id })
						.where(and(eq(insights.id, insightId), eq(insights.userId, ctx.userId)));
				}

				return generatedContent[0];
			},
		),
	updateGeneratedContent: t.procedure
		.input(
			UpdateGeneratedContentInput.extend({
				id: z.number().min(1, "Generated content ID is required"),
			}),
		)
		.mutation(
			async ({ input: { id, content, prompt, userFeedBack, isTrainingData }, ctx }) => {
				const db = getDB(ctx.env);
				const updateData: Partial<GeneratedContent> = {};
				if (content !== undefined) updateData.content = content;
				if (prompt !== undefined) updateData.prompt = prompt;
				if (userFeedBack !== undefined)
					updateData.userFeedBack = userFeedBack;
				if (isTrainingData !== undefined)
					updateData.isTrainingData = isTrainingData;

				const generatedContent = await db
					.update(generatedContents)
					.set(updateData)
					.where(and(eq(generatedContents.id, id), eq(generatedContents.userId, ctx.userId)))
					.returning();

				if (generatedContent.length === 0) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Generated content not found or you don't have permission to update it",
					});
				}

				return generatedContent[0];
			},
		),
	deleteGeneratedContent: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Generated content ID is required") }),
		)
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Verify ownership before deletion
			const content = await db.select().from(generatedContents)
				.where(and(eq(generatedContents.id, id), eq(generatedContents.userId, ctx.userId)))
				.limit(1);

			if (content.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Generated content not found or you don't have permission to delete it",
				});
			}

			await db.delete(generatedContents).where(eq(generatedContents.id, id));
			return id;
		}),
	deleteGhostwriter: t.procedure
		.input(z.object({ id: z.number().min(1, "Ghostwriter ID is required") }))
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Verify ownership before deletion
			const ghostwriter = await db.select().from(ghostwriters)
				.where(and(eq(ghostwriters.id, id), eq(ghostwriters.userId, ctx.userId)))
				.limit(1);

			if (ghostwriter.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Ghostwriter not found or you don't have permission to delete it",
				});
			}

			// Soft delete: set deletedAt timestamp
			const updatedGhostwriter = await db
				.update(ghostwriters)
				.set({ deletedAt: new Date().toISOString() })
				.where(eq(ghostwriters.id, id))
				.returning();

			return updatedGhostwriter[0];
		}),
	deletePsyProfile: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Psychology profile ID is required") }),
		)
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);

			// First, verify the profile exists and belongs to the user
			const profile = await db
				.select()
				.from(psyProfiles)
				.where(and(eq(psyProfiles.id, id), eq(psyProfiles.userId, ctx.userId)))
				.limit(1);

			if (profile.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message:
						"Psychology profile not found or you don't have permission to delete it",
				});
			}

			// Use batch API for atomic operations (D1 best practice)
			const batchResult = await db.batch([
				// 1. Nullify references in generatedContents (only for this user)
				db
					.update(generatedContents)
					.set({ psyProfileId: null })
					.where(
						and(
							eq(generatedContents.psyProfileId, id),
							eq(generatedContents.userId, ctx.userId),
						),
					),

				// 2. Nullify references in ghostwriters (only for this user)
				db
					.update(ghostwriters)
					.set({ psyProfileId: null })
					.where(
						and(
							eq(ghostwriters.psyProfileId, id),
							eq(ghostwriters.userId, ctx.userId),
						),
					),

				// 3. Delete the profile itself (with user check)
				db
					.delete(psyProfiles)
					.where(
						and(eq(psyProfiles.id, id), eq(psyProfiles.userId, ctx.userId)),
					)
					.returning({ id: psyProfiles.id }),
			]);

			// Check if deletion was successful
			const deletedProfile = batchResult[2] as { id: number }[];
			if (deletedProfile.length === 0) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete psychology profile",
				});
			}

			return deletedProfile[0].id;
		}),
	deleteWritingProfile: t.procedure
		.input(
			z.object({ id: z.number().min(1, "Writing profile ID is required") }),
		)
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);

			// First, verify the profile exists and belongs to the user
			const profile = await db
				.select()
				.from(writingProfiles)
				.where(
					and(
						eq(writingProfiles.id, id),
						eq(writingProfiles.userId, ctx.userId),
					),
				)
				.limit(1);

			if (profile.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message:
						"Writing profile not found or you don't have permission to delete it",
				});
			}

			// Use batch API for atomic operations (D1 best practice)
			const batchResult = await db.batch([
				// 1. Nullify references in generatedContents (only for this user)
				db
					.update(generatedContents)
					.set({ writingProfileId: null })
					.where(
						and(
							eq(generatedContents.writingProfileId, id),
							eq(generatedContents.userId, ctx.userId),
						),
					),

				// 2. Nullify references in ghostwriters (only for this user)
				db
					.update(ghostwriters)
					.set({ writingProfileId: null })
					.where(
						and(
							eq(ghostwriters.writingProfileId, id),
							eq(ghostwriters.userId, ctx.userId),
						),
					),

				// 3. Delete the profile itself (with user check)
				db
					.delete(writingProfiles)
					.where(
						and(
							eq(writingProfiles.id, id),
							eq(writingProfiles.userId, ctx.userId),
						),
					)
					.returning({ id: writingProfiles.id }),
			]);

			// Check if deletion was successful
			const deletedProfile = batchResult[2] as { id: number }[];
			if (deletedProfile.length === 0) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete writing profile",
				});
			}

			return deletedProfile[0].id;
		}),
	createGhostwriter: t.procedure
		.input(CreateGhostwriterInput)
		.mutation(async ({ input: { name, description }, ctx }) => {
			const db = getDB(ctx.env);
			const gw = await db
				.insert(ghostwriters)
				.values({
					userId: ctx.userId,
					name,
					description: description || "",
				})
				.returning();

			return gw[0];
		}),
	createWriterWithProfiles: t.procedure
		.input(CreateWriterWithProfilesInput)
		.mutation(async ({ input: { name, description, psyProfileId, writingProfileId, basePersonaId }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Validate that all provided profiles exist and belong to the user
			const [psyProfile, writingProfile, basePersona] = await Promise.all([
				// Psychology profile (required)
				db.query.psyProfiles.findFirst({
					where: and(eq(psyProfiles.id, psyProfileId), eq(psyProfiles.userId, ctx.userId)),
				}),
				// Writing profile (required) 
				db.query.writingProfiles.findFirst({
					where: and(eq(writingProfiles.id, writingProfileId), eq(writingProfiles.userId, ctx.userId)),
				}),
				// Base persona (optional)
				basePersonaId
					? db.query.personas.findFirst({
						where: and(eq(personas.id, basePersonaId), eq(personas.userId, ctx.userId)),
					})
					: Promise.resolve(null),
			]);

			// Check if required profiles exist
			if (!psyProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Psychology profile not found or you don't have permission to access it",
				});
			}

			if (!writingProfile) {
				throw new TRPCError({
					code: "NOT_FOUND", 
					message: "Writing profile not found or you don't have permission to access it",
				});
			}

			// Check if optional base persona exists (if provided)
			if (basePersonaId && !basePersona) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Base persona not found or you don't have permission to access it",
				});
			}

			// Create the ghostwriter with all associations
			const ghostwriter = await db
				.insert(ghostwriters)
				.values({
					userId: ctx.userId,
					name,
					description: description || "",
					psyProfileId,
					writingProfileId,
					basePersonaId: basePersonaId || null,
				})
				.returning();

			return ghostwriter[0];
		}),
	addOriginalContents: t.procedure
		.input(CreateOriginalContentInput)
		.mutation(async ({ input: { content, gwId }, ctx }) => {
			const db = getDB(ctx.env);
			const contentArray = content.split("===").filter((item) => item.trim());
			await db
				.insert(originalContents)
				.values(
					contentArray.map((contentItem) => ({
						ghostwriterId: gwId || 0,
						content: contentItem.trim(),
					})),
				)
				.returning();
			
			return contentArray.length;
		}),
	deleteOriginalContent: t.procedure
		.input(z.object({ id: z.number().min(1, "Original content ID is required") }))
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			
			// First verify the content exists and belongs to a ghostwriter owned by the user
			const content = await db
				.select({
					id: originalContents.id,
					ghostwriterId: originalContents.ghostwriterId,
					ghostwriterUserId: ghostwriters.userId,
				})
				.from(originalContents)
				.innerJoin(ghostwriters, eq(originalContents.ghostwriterId, ghostwriters.id))
				.where(eq(originalContents.id, id))
				.limit(1);

			if (content.length === 0 || content[0].ghostwriterUserId !== ctx.userId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Original content not found or you don't have permission to delete it",
				});
			}

			await db.delete(originalContents).where(eq(originalContents.id, id));
			return id;
		}),
	createPsyProfile: t.procedure
		.input(CreateProfileInput)
		.mutation(async ({ input: { name, content, gwId }, ctx }) => {
			let contentArray: string[] = [];
			const db = getDB(ctx.env);
			
			if (!content && !gwId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No content or ghostwriter ID provided. Please provide either content or ghostwriter ID",
				});
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

			return profile[0];
		}),
	updatePsyProfile: t.procedure
		.input(UpdateProfileInput)
		.mutation(async ({ input: { id, name, content }, ctx }) => {
			const updateData: Partial<z.infer<typeof UpdateProfileInput>> = {};
			if (name) updateData.name = name;
			if (content) updateData.content = content;

			const db = getDB(ctx.env);
			const profile = await db
				.update(psyProfiles)
				.set(updateData)
				.where(and(eq(psyProfiles.id, id), eq(psyProfiles.userId, ctx.userId)))
				.returning();
			
			if (profile.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Psychology profile not found or you don't have permission to update it",
				});
			}
			
			return profile[0];
		}),
	createWritingProfile: t.procedure
		.input(CreateProfileInput)
		.mutation(async ({ input: { name, content, gwId }, ctx }) => {
			let contentArray: string[] = [];
			const db = getDB(ctx.env);
			
			if (!content && !gwId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No content or ghostwriter ID provided. Please provide either content or ghostwriter ID",
				});
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

			return profile[0];
		}),
	updateWritingProfile: t.procedure
		.input(UpdateProfileInput)
		.mutation(async ({ input: { id, name, content }, ctx }) => {
			const updateData: Partial<z.infer<typeof UpdateProfileInput>> = {};
			if (name) updateData.name = name;
			if (content) updateData.content = content;

			const db = getDB(ctx.env);
			const profile = await db
				.update(writingProfiles)
				.set(updateData)
				.where(and(eq(writingProfiles.id, id), eq(writingProfiles.userId, ctx.userId)))
				.returning();
			
			if (profile.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Writing profile not found or you don't have permission to update it",
				});
			}
			
			return profile[0];
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
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Profile not found",
				});
			}

			if (!topic && !insight) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No topic or insight provided. Please provide either a topic or an insight",
				});
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

			return response;
		}),
	reviseContent: t.procedure
		.input(ReviseContentInput)
		.mutation(async ({ input, ctx }) => {
			const db = getDB(ctx.env);
			const apiKey = await ctx.crypto.getApiKey("gemini");

			if (!apiKey) {
				throw new Error("MISSING_API_KEY");
			}

			const {
				contentToRevise,
				revisionRequest,
				psychologyProfileId,
				writingProfileId,
				personaProfileId,
				contentHistory,
				contentId,
			} = input;

			// Fetch the required profiles
			const [psychologyProfile, writingProfile, personaProfile] =
				await Promise.all([
					db.query.psyProfiles.findFirst({
						where: and(eq(psyProfiles.id, psychologyProfileId), eq(psyProfiles.userId, ctx.userId)),
					}),
					db.query.writingProfiles.findFirst({
						where: and(eq(writingProfiles.id, writingProfileId), eq(writingProfiles.userId, ctx.userId)),
					}),
					personaProfileId
						? db.query.personas.findFirst({
								where: and(eq(personas.id, personaProfileId), eq(personas.userId, ctx.userId)),
							})
						: Promise.resolve(null),
				]);

			if (!psychologyProfile || !writingProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Profile not found or you don't have permission to access it",
				});
			}

			// Call the revision agent
			const revisedContent = await reviseContent({
				apiKey,
				psychologyProfile: psychologyProfile.content,
				writingProfile: writingProfile.content,
				personaProfile: personaProfile?.content,
				revisionRequest,
				contentToRevise,
				contentHistory,
			});

			// If contentId is provided, update the database record
			if (contentId) {
				const updatedContent = await db
					.update(generatedContents)
					.set({ content: revisedContent })
					.where(
						and(
							eq(generatedContents.id, contentId),
							eq(generatedContents.userId, ctx.userId),
						),
					)
					.returning();

				if (updatedContent.length === 0) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Content not found or you don't have permission to update it",
					});
				}
			}

			return revisedContent;
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

			// Get the original profile with user verification
			const originalProfile = await db.query.psyProfiles.findFirst({
				where: and(eq(psyProfiles.id, profileId), eq(psyProfiles.userId, ctx.userId)),
			});

			if (!originalProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Psychology profile not found or you don't have permission to access it",
				});
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

			return newProfile[0];
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

			// Get the original profile with user verification
			const originalProfile = await db.query.writingProfiles.findFirst({
				where: and(eq(writingProfiles.id, profileId), eq(writingProfiles.userId, ctx.userId)),
			});

			if (!originalProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Writing profile not found or you don't have permission to access it",
				});
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

			return newProfile[0];
		}),
	regenerateProfiles: t.procedure
		.input(z.object({ 
			ghostwriterId: z.number().min(1, "Ghostwriter ID is required"),
			psyProfileName: z.string().min(1, "Psychology profile name is required"),
			writingProfileName: z.string().min(1, "Writing profile name is required"),
		}))
		.mutation(async ({ input: { ghostwriterId, psyProfileName, writingProfileName }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Verify the ghostwriter exists and belongs to the user
			const ghostwriter = await db.query.ghostwriters.findFirst({
				where: and(eq(ghostwriters.id, ghostwriterId), eq(ghostwriters.userId, ctx.userId)),
				with: {
					originalContents: {
						columns: { content: true },
					},
				},
			});

			if (!ghostwriter) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Ghostwriter not found or you don't have permission to access it",
				});
			}

			if (ghostwriter.originalContents.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No original content found for this ghostwriter",
				});
			}

			// Get the API key
			const apiKey = await ctx.crypto.getApiKey("gemini");

			if (!apiKey) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "API key not configured. Please add your Gemini API key in settings.",
				});
			}

			// Extract content array
			const contentArray = ghostwriter.originalContents.map(item => item.content);

			// Generate both profiles in parallel
			const [analyzedPsyProfile, analyzedWritingProfile] = await Promise.all([
				analyzePsychology(apiKey, contentArray),
				analyzeWritingStyle(apiKey, contentArray),
			]);

			// Get current profile IDs for deletion
			const oldPsyProfileId = ghostwriter.psyProfileId;
			const oldWritingProfileId = ghostwriter.writingProfileId;

			// Create new profiles
			const [psyProfile, writingProfile] = await Promise.all([
				db.insert(psyProfiles).values({
					userId: ctx.userId,
					ghostwriterId: ghostwriterId,
					name: psyProfileName,
					content: analyzedPsyProfile,
				}).returning(),
				db.insert(writingProfiles).values({
					userId: ctx.userId,
					ghostwriterId: ghostwriterId,
					name: writingProfileName,
					content: analyzedWritingProfile,
				}).returning(),
			]);

			// Update the ghostwriter with new profile IDs
			await db
				.update(ghostwriters)
				.set({
					psyProfileId: psyProfile[0].id,
					writingProfileId: writingProfile[0].id,
				})
				.where(eq(ghostwriters.id, ghostwriterId));

			// Delete old profiles if they existed (with proper cleanup)
			if (oldPsyProfileId || oldWritingProfileId) {
				const cleanupOperations = [];

				if (oldPsyProfileId) {
					// Nullify references in generatedContents before deletion
					cleanupOperations.push(
						db
							.update(generatedContents)
							.set({ psyProfileId: null })
							.where(
								and(
									eq(generatedContents.psyProfileId, oldPsyProfileId),
									eq(generatedContents.userId, ctx.userId),
								),
							),
					);
				}

				if (oldWritingProfileId) {
					// Nullify references in generatedContents before deletion
					cleanupOperations.push(
						db
							.update(generatedContents)
							.set({ writingProfileId: null })
							.where(
								and(
									eq(generatedContents.writingProfileId, oldWritingProfileId),
									eq(generatedContents.userId, ctx.userId),
								),
							),
					);
				}

				// Execute cleanup operations first
				if (cleanupOperations.length > 0) {
					await Promise.all(cleanupOperations);
				}

				// Now delete the old profiles
				const deleteOperations = [];
				if (oldPsyProfileId) {
					deleteOperations.push(
						db.delete(psyProfiles).where(eq(psyProfiles.id, oldPsyProfileId))
					);
				}
				if (oldWritingProfileId) {
					deleteOperations.push(
						db.delete(writingProfiles).where(eq(writingProfiles.id, oldWritingProfileId))
					);
				}

				if (deleteOperations.length > 0) {
					await Promise.all(deleteOperations);
				}
			}

			return {
				psyProfile: psyProfile[0],
				writingProfile: writingProfile[0],
			};
		}),
	extractPersonaFromContent: t.procedure
		.input(z.object({
			ghostwriterId: z.number().min(1, "Ghostwriter ID is required"),
			personaName: z.string().min(1, "Persona name is required"),
			setAsBasePersona: z.boolean().default(false),
		}))
		.mutation(async ({ input: { ghostwriterId, personaName, setAsBasePersona }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Get API key
			const apiKey = await ctx.crypto.getApiKey("gemini");
			if (!apiKey) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "API key not configured. Please add your Gemini API key in settings.",
				});
			}

			// Verify the ghostwriter exists and belongs to the user, and get original content
			const ghostwriter = await db.query.ghostwriters.findFirst({
				where: and(eq(ghostwriters.id, ghostwriterId), eq(ghostwriters.userId, ctx.userId)),
				with: {
					originalContents: {
						columns: { content: true },
					},
				},
			});

			if (!ghostwriter) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Ghostwriter not found or you don't have permission to access it",
				});
			}

			if (ghostwriter.originalContents.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No original content found for this ghostwriter. Add some original content first.",
				});
			}

			// Extract content array
			const contentArray = ghostwriter.originalContents.map(item => item.content);

			// Extract persona using AI
			const extractedPersonaContent = await extractPersona(apiKey, contentArray);

			// Create the persona
			const persona = await db
				.insert(personas)
				.values({
					userId: ctx.userId,
					name: personaName,
					description: `Persona extracted from ${ghostwriter.name}'s original content`,
					content: extractedPersonaContent,
				})
				.returning();

			// Optionally set as base persona for the ghostwriter
			if (setAsBasePersona) {
				await db
					.update(ghostwriters)
					.set({ basePersonaId: persona[0].id })
					.where(eq(ghostwriters.id, ghostwriterId));
			}

			return {
				persona: persona[0],
				setAsBase: setAsBasePersona,
			};
		}),
});
