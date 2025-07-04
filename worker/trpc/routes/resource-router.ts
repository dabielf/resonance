import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDB } from "../../db";
import {
	insights,
	personas,
	resourceContents,
} from "../../db/schema-ghostwriter";
import {
	TextToResourceSchema,
	ValueExtractorInput,
} from "../../types/gw";
import { t } from "../trpc-instance";

const { epubToString, pdfToString } = await import("../../parsers");
const { extractValue } = await import("../../agents/value-extractor");

export const resourceRouter = t.router({
	// List all resources for the user (without content for performance)
	listResources: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		
		// Get resources with insight counts
		const resources = await db
			.select({
				id: resourceContents.id,
				title: resourceContents.title,
				author: resourceContents.author,
				createdAt: resourceContents.createdAt,
				insightCount: sql<number>`CAST(COUNT(${insights.id}) AS INTEGER)`,
			})
			.from(resourceContents)
			.leftJoin(insights, eq(insights.resourceContentId, resourceContents.id))
			.where(eq(resourceContents.userId, ctx.userId))
			.groupBy(resourceContents.id)
			.orderBy(desc(resourceContents.createdAt));

		return resources;
	}),

	// Get resource metadata and insights (without content for performance)
	getResource: t.procedure
		.input(z.object({ id: z.number().min(1, "Resource ID is required") }))
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Get resource metadata
			const resource = await db.query.resourceContents.findFirst({
				where: and(eq(resourceContents.id, id), eq(resourceContents.userId, ctx.userId)),
				columns: {
					id: true,
					title: true,
					author: true,
					createdAt: true,
					// Explicitly exclude content for performance
				},
			});

			if (!resource) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource not found or you don't have permission to access it",
				});
			}

			// Get insights for this resource
			const resourceInsights = await db.query.insights.findMany({
				where: and(
					eq(insights.resourceContentId, id),
					eq(insights.userId, ctx.userId)
				),
				orderBy: [desc(insights.createdAt)],
				with: {
					persona: {
						columns: { id: true, name: true },
					},
				},
			});

			return {
				...resource,
				insights: resourceInsights,
			};
		}),

	// Get resource content (separate route for when content is explicitly needed)
	getResourceContent: t.procedure
		.input(z.object({ id: z.number().min(1, "Resource ID is required") }))
		.query(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			
			const resource = await db.query.resourceContents.findFirst({
				where: and(eq(resourceContents.id, id), eq(resourceContents.userId, ctx.userId)),
			});

			if (!resource) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource not found or you don't have permission to access it",
				});
			}

			return resource;
		}),

	// Create resource from plain text
	createResource: t.procedure
		.input(TextToResourceSchema)
		.mutation(async ({ input: { title, content }, ctx }) => {
			const db = getDB(ctx.env);
			
			const resource = await db
				.insert(resourceContents)
				.values({
					userId: ctx.userId,
					title,
					content,
				})
				.returning();

			return resource[0];
		}),

	// Upload and parse PDF resource
	uploadPdfResource: t.procedure
		.input(z.instanceof(FormData))
		.mutation(async ({ input: formData, ctx }) => {
			const db = getDB(ctx.env);
			
			try {
				// Extract file and title from FormData
				const pdfFile = formData.get('file') as File;
				const title = formData.get('title') as string;
				
				if (!pdfFile) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No PDF file provided",
					});
				}
				
				if (!title || title.trim().length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Title is required",
					});
				}
				
				// Validate file type
				if (pdfFile.type !== 'application/pdf') {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "File must be a PDF",
					});
				}

				// Parse PDF content
				const content = await pdfToString(pdfFile);
				
				if (!content || content.trim().length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No text content could be extracted from the PDF",
					});
				}

				// Create resource
				const resource = await db
					.insert(resourceContents)
					.values({
						userId: ctx.userId,
						title: title.trim(),
						content,
					})
					.returning();

				return resource[0];
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to process PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	// Upload and parse EPUB resource
	uploadEpubResource: t.procedure
		.input(z.instanceof(FormData))
		.mutation(async ({ input: formData, ctx }) => {
			const db = getDB(ctx.env);
			
			try {
				// Extract file and title from FormData
				const epubFile = formData.get('file') as File;
				const title = formData.get('title') as string;
				
				if (!epubFile) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No EPUB file provided",
					});
				}
				
				if (!title || title.trim().length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Title is required",
					});
				}
				
				// Validate file type by extension (EPUB files might have different MIME types)
				if (!epubFile.name.toLowerCase().endsWith('.epub')) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "File must be an EPUB",
					});
				}

				// Parse EPUB content
				const content = await epubToString(epubFile);
				
				if (!content || content.trim().length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No text content could be extracted from the EPUB",
					});
				}

				// Create resource
				const resource = await db
					.insert(resourceContents)
					.values({
						userId: ctx.userId,
						title: title.trim(),
						content,
					})
					.returning();

				return resource[0];
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to process EPUB: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	// Delete resource
	deleteResource: t.procedure
		.input(z.object({ id: z.number().min(1, "Resource ID is required") }))
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Verify ownership before deletion
			const resource = await db.select().from(resourceContents)
				.where(and(eq(resourceContents.id, id), eq(resourceContents.userId, ctx.userId)))
				.limit(1);

			if (resource.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource not found or you don't have permission to delete it",
				});
			}

			// Use batch API for atomic operations (D1 best practice)
			const batchResult = await db.batch([
				// 1. Delete all insights for this resource (only for this user)
				db
					.delete(insights)
					.where(
						and(
							eq(insights.resourceContentId, id),
							eq(insights.userId, ctx.userId),
						),
					),

				// 2. Delete the resource itself (with user check)
				db
					.delete(resourceContents)
					.where(
						and(eq(resourceContents.id, id), eq(resourceContents.userId, ctx.userId)),
					)
					.returning({ id: resourceContents.id }),
			]);

			// Check if deletion was successful
			const deletedResource = batchResult[1] as { id: number }[];
			if (deletedResource.length === 0) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete resource",
				});
			}

			return deletedResource[0].id;
		}),

	// List insights for a specific persona
	listInsightsForPersona: t.procedure
		.input(z.object({ personaId: z.number().min(1, "Persona ID is required") }))
		.query(async ({ input: { personaId }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Verify persona belongs to user
			const persona = await db.query.personas.findFirst({
				where: and(eq(personas.id, personaId), eq(personas.userId, ctx.userId)),
			});

			if (!persona) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Persona not found or you don't have permission to access it",
				});
			}

			// Get insights for this persona
			const personaInsights = await db.query.insights.findMany({
				where: and(
					eq(insights.personaId, personaId),
					eq(insights.userId, ctx.userId)
				),
				orderBy: [desc(insights.createdAt)],
				with: {
					resourceContent: {
						columns: { id: true, title: true },
					},
				},
			});

			return personaInsights;
		}),

	// Extract insights from resource for a specific persona
	extractInsights: t.procedure
		.input(ValueExtractorInput)
		.mutation(async ({ input: { personaId, resourceId }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Get API key
			const apiKey = await ctx.crypto.getApiKey("gemini");
			if (!apiKey) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "API key not configured. Please add your Gemini API key in settings.",
				});
			}

			// Verify persona and resource belong to user and get data
			const [persona, resource] = await Promise.all([
				db.query.personas.findFirst({
					where: and(eq(personas.id, personaId), eq(personas.userId, ctx.userId)),
				}),
				db.query.resourceContents.findFirst({
					where: and(eq(resourceContents.id, resourceId), eq(resourceContents.userId, ctx.userId)),
				}),
			]);

			if (!persona) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Persona not found or you don't have permission to access it",
				});
			}

			if (!resource) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource not found or you don't have permission to access it",
				});
			}

			try {
				// Extract insights using AI
				const extractedInsights = await extractValue(
					apiKey,
					resource.content,
					persona.content
				);

				// If no insights were extracted, return empty array
				if (!extractedInsights || extractedInsights.length === 0) {
					return [];
				}

				return extractedInsights;
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to extract insights: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	// Save an insight
	saveInsight: t.procedure
		.input(z.object({
			resourceId: z.number().min(1, "Resource ID is required"),
			personaId: z.number().min(1, "Persona ID is required"),
			title: z.string().min(1, "Title is required"),
			keyPoints: z.array(z.string()).min(1, "At least one key point is required"),
			rawContent: z.string().min(1, "Raw content is required"),
		}))
		.mutation(async ({ input: { resourceId, personaId, title, keyPoints, rawContent }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Verify ownership of persona and resource
			const [persona, resource] = await Promise.all([
				db.query.personas.findFirst({
					where: and(eq(personas.id, personaId), eq(personas.userId, ctx.userId)),
				}),
				db.query.resourceContents.findFirst({
					where: and(eq(resourceContents.id, resourceId), eq(resourceContents.userId, ctx.userId)),
				}),
			]);

			if (!persona) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Persona not found or you don't have permission to access it",
				});
			}

			if (!resource) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource not found or you don't have permission to access it",
				});
			}

			// Create insight
			const insight = await db
				.insert(insights)
				.values({
					userId: ctx.userId,
					resourceContentId: resourceId,
					personaId,
					title,
					keyPoints,
					rawContent,
				})
				.returning();

			return insight[0];
		}),

	// Delete insight
	deleteInsight: t.procedure
		.input(z.object({ id: z.number().min(1, "Insight ID is required") }))
		.mutation(async ({ input: { id }, ctx }) => {
			const db = getDB(ctx.env);
			
			// Verify ownership before deletion
			const insight = await db.select().from(insights)
				.where(and(eq(insights.id, id), eq(insights.userId, ctx.userId)))
				.limit(1);

			if (insight.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Insight not found or you don't have permission to delete it",
				});
			}

			await db.delete(insights).where(eq(insights.id, id));
			return id;
		}),
});