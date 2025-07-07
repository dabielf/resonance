import { z } from "zod";


// =====================================================
// CORE ENTITY SCHEMAS
// =====================================================

export const GhostwriterSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable(),
	userId: z.number(),
	psyProfileId: z.number().nullable(),
	writingProfileId: z.number().nullable(),
	basePersonaId: z.number().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const PsyProfileSchema = z.object({
	id: z.number(),
	name: z.string(),
	content: z.string(),
	userId: z.number(),
	ghostwriterId: z.number().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const WritingProfileSchema = z.object({
	id: z.number(),
	name: z.string(),
	content: z.string(),
	userId: z.number(),
	ghostwriterId: z.number().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const PersonaSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable(),
	content: z.string(),
	userId: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const OriginalContentSchema = z.object({
	id: z.number(),
	content: z.string(),
	ghostwriterId: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const GeneratedContentSchema = z.object({
	id: z.number(),
	content: z.string(),
	prompt: z.string(),
	userId: z.number(),
	ghostwriterId: z.number().nullable(),
	writingProfileId: z.number(),
	psyProfileId: z.number(),
	personaId: z.number().nullable(),
	userFeedBack: z.string().nullable(),
	isTrainingData: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const ResourceContentSchema = z.object({
	id: z.number(),
	title: z.string(),
	content: z.string(),
	userId: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const InsightSchema = z.object({
	id: z.number(),
	title: z.string(),
	keyPoints: z.string(),
	rawContent: z.string(),
	userId: z.number(),
	personaId: z.number(),
	resourceContentId: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// =====================================================
// INPUT SCHEMAS - FRONTEND/TRPC
// =====================================================

export const CreateGhostwriterInput = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});

export const CreateWriterWithProfilesInput = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	psyProfileId: z.number().min(1, "Psychology profile ID is required"),
	writingProfileId: z.number().min(1, "Writing profile ID is required"),
	basePersonaId: z.number().optional(),
});

export const CreateOriginalContentInput = z.object({
	content: z.string().min(1, "Content is required"),
	gwId: z.number().optional(),
});

export const CreateProfileInput = z.object({
	name: z.string().min(1, "Name is required"),
	content: z.string().optional(),
	gwId: z.number().optional(),
});

export const SaveProfileInput = z.object({
	name: z.string().min(1, "Name is required"),
	content: z.string().min(1, "Content is required"),
});

export const UpdateProfileInput = z.object({
	id: z.number().min(1, "Profile ID is required"),
	name: z.string().optional(),
	content: z.string().optional(),
});

export const GenerateContentInput = z
	.object({
		psychologyProfileId: z.number().min(1, "Psychology profile ID is required"),
		writingProfileId: z.number().min(1, "Writing profile ID is required"),
		personaProfileId: z.number().optional(),
		gwId: z.number().optional(),
		topic: z.string().optional(),
		insightId: z.number().optional(),
	})
	.refine((data) => data.topic || data.insightId, {
		message: "Either topic or insightId is required",
	});

export const ContentHistorySchema = z.object({
	contentGenerated: z.string(),
	revisionAsked: z.string().optional(),
});

export const ReviseContentInput = z.object({
	contentToRevise: z.string().min(1, "Content to revise is required"),
	revisionRequest: z.string().min(1, "Revision instructions are required"),
	psychologyProfileId: z.number().min(1, "Psychology profile ID is required"),
	writingProfileId: z.number().min(1, "Writing profile ID is required"),
	personaProfileId: z.number().optional(),
	contentHistory: z.array(ContentHistorySchema).optional(),
	contentId: z.number().optional(),
});

export const SaveContentInput = z.object({
	content: z.string().min(1, "Content is required"),
	gwId: z.number().optional(),
	psyProfileId: z.number().min(1, "Psychology profile ID is required"),
	writingProfileId: z.number().min(1, "Writing profile ID is required"),
	personaProfileId: z.number().optional(),
	prompt: z.string().min(1, "Prompt is required"),
	userFeedback: z.string().optional(),
	isTrainingData: z.boolean().optional(),
	insightId: z.number().optional(),
});

export const UpdateInsightInput = z.object({
	id: z.number().min(1, "Insight ID is required"),
	generatedContentId: z.number().optional(),
});

export const CreatePersonaInput = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	content: z.string().min(1, "Content is required"),
});

export const UpdatePersonaInput = z.object({
	id: z.number().min(1, "Persona ID is required"),
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	content: z.string().min(1, "Content is required"),
});

export const ValueExtractorInput = z.object({
	personaId: z.number().min(1, "Persona ID is required"),
	resourceId: z.number().min(1, "Resource ID is required"),
	topic: z.string().optional(),
});

export const UpdateGeneratedContentInput = z.object({
	content: z.string().optional(),
	prompt: z.string().optional(),
	userFeedBack: z.string().optional(),
	isTrainingData: z.boolean().optional(),
});






// Profile customization schemas
export const CustomizeProfileInput = z.object({
	modifications: z.string().min(1, "Modifications are required"),
});

// File conversion schemas - Simplified for TRPC file handling
export const PdfToTxtSchema = z.object({
	pdfFile: z.any(), // Accept any file object - validation happens in the parser
	title: z.string().min(1, "Title is required"),
	maxPages: z.number().int().positive().optional(),
	encoding: z.enum(["utf-8", "utf-16", "ascii"]).optional().default("utf-8"),
});

export const EpubToTxtSchema = z.object({
	epubFile: z.any(), // Accept any file object - validation happens in the parser
	title: z.string().min(1, "Title is required"),
	includeMetadata: z.boolean().optional().default(false),
	chapterSeparator: z.string().optional().default("\n\n===\n\n"),
});

export const TextToResourceSchema = z.object({
	content: z.string().min(1, "Content is required"),
	title: z.string().min(1, "Title is required"),
});

// =====================================================
// PARTIAL SCHEMAS FOR LIST VIEWS
// =====================================================

export const GhostwriterListSchema = GhostwriterSchema.pick({
	id: true,
	name: true,
	psyProfileId: true,
	writingProfileId: true,
});

export const PsyProfileListSchema = PsyProfileSchema.pick({
	id: true,
	name: true,
});

export const WritingProfileListSchema = WritingProfileSchema.pick({
	id: true,
	name: true,
});

export const PersonaListSchema = PersonaSchema.pick({
	id: true,
	name: true,
	description: true,
	createdAt: true,
});

export const ResourceContentListSchema = ResourceContentSchema.pick({
	id: true,
	title: true,
}).extend({
	insightCount: z.number(),
});

// ListAll response schema
export const ListAllResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	createdAt: z.string(),
	ghostwriters: z.array(GhostwriterListSchema).optional(),
	psyProfiles: z.array(PsyProfileListSchema).optional(),
	writingProfiles: z.array(WritingProfileListSchema).optional(),
	personas: z.array(PersonaListSchema).optional(),
	resourceContents: z.array(ResourceContentListSchema).optional(),
});

// Insight with relations for list views
export const InsightWithRelationsSchema = InsightSchema.extend({
	persona: z.object({ id: z.number(), name: z.string() }).optional(),
	resourceContent: z.object({ id: z.number(), title: z.string() }).optional(),
});

// Psychology profile with relations
export const PsyProfileWithRelationsSchema = PsyProfileSchema.extend({
	ghostwriter: z.object({ id: z.number(), name: z.string() }).optional(),
});

// Writing profile with relations
export const WritingProfileWithRelationsSchema = WritingProfileSchema.extend({
	ghostwriter: z.object({ id: z.number(), name: z.string() }).optional(),
});

// Generated content with relations for list views
export const GeneratedContentWithRelationsSchema =
	GeneratedContentSchema.extend({
		writingProfile: z.object({ id: z.number(), name: z.string() }).optional(),
		psyProfile: z.object({ id: z.number(), name: z.string() }).optional(),
		persona: z.object({ id: z.number(), name: z.string() }).optional(),
		ghostwriter: z.object({ id: z.number(), name: z.string() }).optional(),
	});


// Generate content response schema
export const GenerateContentResponseSchema = z.object({
	content: z.string(),
	writingProfileId: z.number(),
	psychologyProfileId: z.number(),
	topic: z.string().optional(),
	gwId: z.number().optional(),
	personaProfileId: z.number().optional(),
});

// Create ghostwriter response schema
export const CreateGhostwriterResponseSchema = z.object({
	ghostwriter: GhostwriterSchema,
	originalContents: z.array(OriginalContentSchema),
});

// =====================================================
// TYPE EXPORTS
// =====================================================

// Entity types
export type Ghostwriter = z.infer<typeof GhostwriterSchema>;
export type PsyProfile = z.infer<typeof PsyProfileSchema>;
export type WritingProfile = z.infer<typeof WritingProfileSchema>;
export type Persona = z.infer<typeof PersonaSchema>;
export type OriginalContent = z.infer<typeof OriginalContentSchema>;
export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;
export type ResourceContent = z.infer<typeof ResourceContentSchema>;
export type Insight = z.infer<typeof InsightSchema>;

// List types
export type GhostwriterList = z.infer<typeof GhostwriterListSchema>;
export type PsyProfileList = z.infer<typeof PsyProfileListSchema>;
export type WritingProfileList = z.infer<typeof WritingProfileListSchema>;
export type PersonaList = z.infer<typeof PersonaListSchema>;
export type ResourceContentList = z.infer<typeof ResourceContentListSchema>;
export type ListAllResponse = z.infer<typeof ListAllResponseSchema>;
export type InsightWithRelations = z.infer<typeof InsightWithRelationsSchema>;
export type PsyProfileWithRelations = z.infer<typeof PsyProfileWithRelationsSchema>;
export type WritingProfileWithRelations = z.infer<typeof WritingProfileWithRelationsSchema>;
export type GeneratedContentWithRelations = z.infer<
	typeof GeneratedContentWithRelationsSchema
>;

// Input types
export type CreateGhostwriterData = z.infer<typeof CreateGhostwriterInput>;
export type CreateWriterWithProfilesData = z.infer<typeof CreateWriterWithProfilesInput>;
export type CreateOriginalContentData = z.infer<
	typeof CreateOriginalContentInput
>;
export type GenerateContentData = z.infer<typeof GenerateContentInput>;
export type ReviseContentData = z.infer<typeof ReviseContentInput>;
export type ContentHistory = z.infer<typeof ContentHistorySchema>;
export type SaveContentData = z.infer<typeof SaveContentInput>;
export type SaveProfileData = z.infer<typeof CreateProfileInput>;
export type CreatePersonaData = z.infer<typeof CreatePersonaInput>;
export type UpdateGeneratedContentData = z.infer<
	typeof UpdateGeneratedContentInput
>;
export type CustomizeProfileData = z.infer<typeof CustomizeProfileInput>;

// Response types
export type GenerateContentResponse = z.infer<
	typeof GenerateContentResponseSchema
>;
export type CreateGhostwriterResponse = z.infer<
	typeof CreateGhostwriterResponseSchema
>;
