# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start the development server
- `pnpm build` - Run TypeScript checks and build for production
- `pnpm preview` - Build and preview the production build locally
- `pnpm lint` - Run ESLint to check code quality

### Deployment
- `pnpm deploy` - Build and deploy to Cloudflare Workers (includes TypeScript check)
- `pnpm deploy:force` - Deploy without TypeScript check (faster but less safe)
- `pnpm tunnel` - Start ngrok tunnel for local development testing

### Database Management
- `pnpm db:generate` - Generate new migrations from schema changes
- `pnpm db:push` - Push schema changes directly to the database (development only)
- `pnpm db:migrate` - Apply migrations to remote production database
- `pnpm db:migrate:local` - Apply migrations to local development database
- `pnpm db:studio` - Open Drizzle Studio for visual database management

### Type Generation
- `pnpm cf-typegen` - Generate TypeScript types for Cloudflare bindings

## Architecture Overview

This is a full-stack application deployed as a Cloudflare Worker with a React SPA frontend.

### Technology Stack
- **Frontend**: React 19 + TypeScript + Vite + TanStack Router + TanStack Query
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **Icons**: @tabler/icons-react
- **Backend**: Cloudflare Workers + Hono + TRPC
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Auth**: Clerk
- **Notifications**: Sonner for toast notifications
- **Markdown**: ReactMarkdown for content rendering

### TRPC Usage Patterns
This app uses the **TanStack React Query integration pattern** for TRPC:

**Correct Patterns:**
```typescript
import { trpc } from "@/router";
import { useQuery, useMutation } from "@tanstack/react-query";

// Queries
const { data } = useQuery(trpc.routerName.procedureName.queryOptions());

// Mutations  
const mutation = useMutation(trpc.routerName.procedureName.mutationOptions({
  onSuccess: (data) => { /* ... */ },
  onError: (error) => { /* ... */ }
}));
```

**NEVER use these patterns:**
- ❌ `trpc.routerName.procedureName.useQuery()` 
- ❌ `trpc.routerName.procedureName.useMutation()`

The app uses `createTRPCOptionsProxy` with singleton pattern, not the classic hooks.

### Project Structure

```
/src/                   # Frontend React application
├── routes/            # TanStack Router pages (file-based routing)
├── components/        # Reusable components
│   └── ui/           # shadcn/ui primitives
├── app/              # Feature-specific modules
├── hooks/            # Custom React hooks
└── lib/              # Utilities and shared code

/worker/              # Backend Cloudflare Worker
├── index.ts          # Worker entry point - routes requests to TRPC or Hono
├── trpc/             # TRPC API endpoints
│   ├── router.ts     # Main router combining all routes
│   └── routes/       # Individual route handlers
├── hono/             # REST API endpoints
├── db/               # Database layer
│   ├── schema.ts     # Main database schema
│   ├── schema-ghostwriter.ts # Ghostwriter-specific schema
│   └── migrations/   # SQL migration files
├── agents/           # AI agent-related logic
└── types/            # Comprehensive type definitions
    └── gw.ts         # Main type definitions file
```

## Established UI/UX Patterns

### List Layouts (NO CARDS POLICY)
**IMPORTANT**: This project explicitly avoids card-based layouts. Use simple, divided lists instead.

```typescript
// ✅ Correct: Simple divided list
<div className="divide-y divide-border rounded-lg border bg-background">
  {items.map((item) => (
    <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium leading-none">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button size="sm" variant="outline" onClick={() => handleEdit(item.id)}>
          <IconEdit className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleDelete(item)}>
          <IconTrash className="h-4 w-4 mr-1.5" />
          Delete
        </Button>
      </div>
    </div>
  ))}
</div>

// ❌ Incorrect: Do not use card layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>...</Card>
  ))}
</div>
```

### Button Patterns
- **Primary Actions**: Default variant
- **Secondary Actions**: `variant="outline"`
- **Destructive Actions**: `variant="destructive"`
- **Loading States**: Always disable during pending operations

```typescript
// Standard action button pattern
<div className="flex items-center gap-2">
  <Button size="sm" variant="outline" onClick={() => handleEdit(item.id)}>
    <IconEdit className="h-4 w-4 mr-1.5" />
    Edit
  </Button>
  <Button size="sm" variant="outline" onClick={() => handleDelete(item)}>
    <IconTrash className="h-4 w-4 mr-1.5" />
    Delete
  </Button>
</div>
```

### Icon Usage Standards
- **Edit**: `IconEdit`
- **Delete**: `IconTrash`
- **Add/Create**: `IconPlus`
- **Save**: `IconBookmark`
- **Copy**: `IconCopy`
- **Download**: `IconDownload`
- **Loading**: `IconLoader2` with `animate-spin`
- **Settings**: `IconSettings`
- **Eye/View**: `IconEye`

### Page Header Pattern
```typescript
<div className="flex justify-between items-center">
  <div>
    <h1 className="text-3xl font-bold">Page Title</h1>
    <p className="text-muted-foreground mt-1">
      Description of the page functionality
    </p>
  </div>
  <Button onClick={handleCreate}>
    <IconPlus className="h-4 w-4 mr-2" />
    Add Item
  </Button>
</div>
```

### Loading States
Always use skeleton components for initial loading:

```typescript
if (isLoading) {
  return (
    <div className="container mx-auto p-2 lg:p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="divide-y divide-border rounded-lg border bg-background">
        {[1, 2, 3].map((key) => (
          <div key={key} className="flex items-center justify-between px-6 py-4">
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Confirmation Dialogs
Always use confirmation dialogs for destructive actions:

```typescript
<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Item</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete "{itemToDelete?.name}"? This
        action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
        Cancel
      </Button>
      <Button
        variant="destructive"
        onClick={confirmDelete}
        disabled={deleteItemMutation.isPending}
      >
        {deleteItemMutation.isPending ? "Deleting..." : "Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tab Patterns for Edit/Preview
Use tabs for content that can be edited and previewed:

```typescript
<Tabs value={mode} onValueChange={(value) => setMode(value as ContentMode)}>
  <TabsList className="h-8">
    <TabsTrigger value="edit" className="text-xs">
      <IconEdit className="h-3 w-3 mr-1" />
      Edit
    </TabsTrigger>
    <TabsTrigger value="preview" className="text-xs">
      <IconEye className="h-3 w-3 mr-1" />
      Preview
    </TabsTrigger>
  </TabsList>
</Tabs>

{/* Content area */}
{mode === "edit" ? (
  <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
) : (
  <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto">
    <ReactMarkdown>{content}</ReactMarkdown>
  </div>
)}
```

## TRPC API Development Patterns

All TRPC procedures in this project use **idiomatic TRPC patterns** with direct data returns and proper error handling.

### **Core TRPC Patterns**

#### List Queries (User-Scoped)
```typescript
// Basic list query
listItems: t.procedure.query(async ({ ctx }) => {
  const db = getDB(ctx.env);
  const data = await db.query.items.findMany({
    where: eq(items.userId, ctx.userId), // Always filter by user
    orderBy: [desc(items.createdAt)],
  });
  return data; // Return data directly
}),

// List with complex filtering (soft-deleted items)
listGhostwriters: t.procedure.query(async ({ ctx }) => {
  const db = getDB(ctx.env);
  const writers = await db.query.ghostwriters.findMany({
    where: and(
      eq(ghostwriters.userId, ctx.userId),
      isNull(ghostwriters.deletedAt), // Filter out soft-deleted
    ),
  });
  return writers;
}),

// List with relations
listGeneratedContents: t.procedure.query(async ({ ctx }) => {
  const db = getDB(ctx.env);
  const data = await db.query.generatedContents.findMany({
    where: eq(generatedContents.userId, ctx.userId),
    orderBy: [desc(generatedContents.createdAt)],
    with: {
      writingProfile: { columns: { id: true, name: true } },
      psyProfile: { columns: { id: true, name: true } },
      persona: { columns: { id: true, name: true } },
      ghostwriter: { columns: { id: true, name: true } },
    },
  });
  return data;
}),
```

#### Single Item Queries with Validation
```typescript
// Basic get with NOT_FOUND validation
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

// Get with relations
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
      },
    });
    
    if (!data) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ghostwriter not found or you don't have permission to access it",
      });
    }
    
    return data;
  }),
```

#### Create Operations (Insert)
```typescript
// Basic create
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

// Create with AI processing
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

    // Process content from different sources
    if (content) {
      contentArray = content.split("===").filter((item) => item.trim());
    } else if (gwId) {
      const dbContent = await db
        .select()
        .from(originalContents)
        .where(eq(originalContents.ghostwriterId, gwId));
      contentArray = dbContent.map((item) => item.content);
    }

    // AI processing
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

    // Update related entities if needed
    if (gwId) {
      await db
        .update(ghostwriters)
        .set({ psyProfileId: profile[0].id })
        .where(eq(ghostwriters.id, gwId));
    }

    return profile[0];
  }),
```

#### Update Operations with Validation
```typescript
// Basic update with validation
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

// Partial update with dynamic fields
updateGhostwriter: t.procedure
  .input(z.object({
    id: z.number().min(1, "Ghostwriter ID is required"),
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    psyProfileId: z.number().optional(),
    writingProfileId: z.number().optional(),
  }))
  .mutation(async ({ input: { id, name, description, psyProfileId, writingProfileId }, ctx }) => {
    const db = getDB(ctx.env);
    const updateData: Partial<typeof ghostwriters.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (psyProfileId !== undefined) updateData.psyProfileId = psyProfileId;
    if (writingProfileId !== undefined) updateData.writingProfileId = writingProfileId;

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
  }),
```

#### Delete Operations
```typescript
// Simple delete with verification
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

    await db.delete(personas).where(eq(personas.id, id));
    return id;
  }),

// Soft delete (preserve data with timestamp)
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

// Complex delete with D1 batch operations
deletePsyProfile: t.procedure
  .input(z.object({ id: z.number().min(1, "Psychology profile ID is required") }))
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
        message: "Psychology profile not found or you don't have permission to delete it",
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
```

#### Complex Operations (AI Generation & External APIs)
```typescript
// Content generation with external API
generateContent: t.procedure
  .input(GenerateContentInput)
  .mutation(async ({ input, ctx }) => {
    const db = getDB(ctx.env);
    const apiKey = await ctx.crypto.getApiKey("gemini");

    if (!apiKey) {
      throw new Error("MISSING_API_KEY");
    }

    const { topic, psychologyProfileId, writingProfileId, personaProfileId, insightId } = input;
    
    // Fetch multiple resources in parallel
    const [psychologyProfile, writingProfile, personaProfile, insight] =
      await Promise.all([
        db.query.psyProfiles.findFirst({ where: eq(psyProfiles.id, psychologyProfileId) }),
        db.query.writingProfiles.findFirst({ where: eq(writingProfiles.id, writingProfileId) }),
        personaProfileId
          ? db.query.personas.findFirst({ where: eq(personas.id, personaProfileId) })
          : Promise.resolve(null),
        insightId
          ? db.query.insights.findFirst({ where: eq(insights.id, insightId) })
          : Promise.resolve(null),
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

    // Process and combine inputs
    let completeTopic = "";
    if (insight) completeTopic = insight.rawContent;
    if (topic) completeTopic += `\n\n${topic}`;

    // Call external AI service
    const response = await generateContent({
      apiKey,
      psychologyProfile: psychologyProfile.content,
      writingProfile: writingProfile.content,
      personaProfile: personaProfile?.content,
      topic: completeTopic.trim(),
    });

    return response;
  }),

// AI-powered profile modification
modifyPsyProfile: t.procedure
  .input(z.object({
    profileId: z.number().min(1, "Profile ID is required"),
    newName: z.string().min(1, "New name is required"),
    modifications: z.string().min(1, "Modifications are required"),
  }))
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

    // Generate the modified profile using AI
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
```

### **D1 Database Best Practices**

#### Use Batch Operations Instead of Transactions
```typescript
// ✅ CORRECT: D1 Batch API (atomic operations)
const batchResult = await db.batch([
  db.update(profiles).set({ isActive: false }).where(eq(profiles.userId, userId)),
  db.delete(items).where(eq(items.profileId, profileId)).returning(),
  db.insert(auditLog).values({ action: 'delete', userId, itemId: profileId }),
]);

// ❌ INCORRECT: Transactions (not supported in D1)
await db.transaction(async (tx) => {
  // This will fail in Cloudflare D1
});
```

### **Error Handling Standards**
- Use `TRPCError` with appropriate error codes (`NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR`)
- Automatic error logging with comprehensive context (errorId, requestId, userId)
- Security-aware: no sensitive data in production logs
- User ownership validation for all operations

### **Input Validation**
- All procedures use Zod schemas for input validation
- Common patterns: `z.number().min(1, "ID is required")` for IDs
- Optional fields: `.optional()` suffix
- String validation: `z.string().min(1, "Field is required")`

### Security Patterns
- **ALWAYS** filter database queries by `ctx.userId`
- Never expose data from other users
- Validate all inputs with Zod schemas
- Use secure API key storage with encryption

## State Management Best Practices

### Mutation Patterns with Query Invalidation
```typescript
const deleteItemMutation = useMutation(
  trpc.contentRouter.deleteItem.mutationOptions({
    onSuccess: () => {
      toast.success("Item deleted successfully");
      queryClient.invalidateQueries({
        queryKey: trpc.contentRouter.listItems.queryKey(),
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete item");
    },
  }),
);
```

### Navigation After Operations
Always redirect after successful create/update operations:

```typescript
const createItemMutation = useMutation(
  trpc.contentRouter.saveItem.mutationOptions({
    onSuccess: () => {
      toast.success("Item created successfully");
      queryClient.invalidateQueries({
        queryKey: trpc.contentRouter.listItems.queryKey(),
      });
      navigate({ to: "/app/items" }); // Redirect to list
    },
  }),
);
```

### Loading State Management
```typescript
// Query loading
const { data, isLoading, error } = useQuery(
  trpc.contentRouter.listItems.queryOptions(),
);

// Mutation loading
const mutation = useMutation(trpc.contentRouter.saveItem.mutationOptions({...}));

// Button with loading state
<Button 
  onClick={handleSubmit}
  disabled={mutation.isPending}
>
  {mutation.isPending ? "Saving..." : "Save"}
</Button>
```

## Content Generation Workflows

### Writer vs Custom Mode Patterns
```typescript
// Generation mode state
const [mode, setMode] = useState<GenerationMode>("writer");

// Parameter collection helper
const getGenerationParams = () => {
  let psychologyProfileId: number;
  let writingProfileId: number;
  let gwId: number | undefined;

  if (mode === "writer") {
    const writer = completeWriters.find(
      (w) => w.id.toString() === selectedWriterId,
    );
    if (!writer || !writer.psyProfileId || !writer.writingProfileId) return null;

    psychologyProfileId = writer.psyProfileId;
    writingProfileId = writer.writingProfileId;
    gwId = writer.id; // Only available in writer mode
  } else {
    if (!selectedPsyProfileId || !selectedWritingProfileId) return null;
    psychologyProfileId = parseInt(selectedPsyProfileId);
    writingProfileId = parseInt(selectedWritingProfileId);
    // gwId remains undefined in custom mode
  }

  return {
    psychologyProfileId,
    writingProfileId,
    gwId,
    personaProfileId: selectedPersonaId ? parseInt(selectedPersonaId) : undefined,
  };
};
```

### Training Data Conditional Logic
Training data functionality should only be available for writer mode (with gwId):

```typescript
// Conditional rendering in action menu
{mode === "writer" && getGenerationParams()?.gwId && (
  <DropdownMenuItem onClick={handleSaveAsTrainingData}>
    <IconBookmark className="h-4 w-4 mr-2" />
    Save as Training Data
  </DropdownMenuItem>
)}
```

### Content Actions Pattern
```typescript
// Content action handlers
const handleSaveContent = (isTrainingData: boolean, feedback?: string) => {
  if (!generatedContent || !topic.trim()) return;

  const params = getGenerationParams();
  if (!params) return;

  const contentToSave = contentMode === "edit" ? editedContent : generatedContent;

  saveContentMutation.mutate({
    content: contentToSave,
    gwId: params.gwId,
    psyProfileId: params.psychologyProfileId,
    writingProfileId: params.writingProfileId,
    personaProfileId: params.personaProfileId,
    prompt: topic.trim(),
    userFeedback: feedback,
    isTrainingData,
  });
};

const handleCopyToClipboard = async () => {
  if (!generatedContent) return;
  const contentToCopy = contentMode === "edit" ? editedContent : generatedContent;

  try {
    await navigator.clipboard.writeText(contentToCopy);
    toast.success("Content copied to clipboard");
  } catch (error) {
    console.error("Copy failed:", error);
    toast.error("Failed to copy content");
  }
};

const handleDownloadMarkdown = () => {
  if (!generatedContent) return;
  const contentToDownload = contentMode === "edit" ? editedContent : generatedContent;
  
  // Create sanitized filename
  const sanitizedTopic = topic.trim().slice(0, 50).replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const filename = `content-${sanitizedTopic || 'generated'}-${Date.now()}.md`;

  // Create and trigger download
  const blob = new Blob([contentToDownload], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast.success("Content downloaded as markdown file");
};
```

## Database Design Patterns

### Schema Organization
- **Main schema** (`worker/db/schema.ts`): Core application entities
- **Feature schemas** (`worker/db/schema-ghostwriter.ts`): Domain-specific entities
- **Relationships**: Properly defined foreign keys and relations

### User-Scoped Data Design
All user data must be properly scoped:

```typescript
// Table definition with user reference
export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index("item_user_id_idx").on(table.userId),
]);
```

### Migration Patterns
- Modify schema files
- Run `pnpm db:generate` to create migrations
- Test with `pnpm db:migrate:local`
- Deploy with `pnpm db:migrate`

## Security and Authorization

### Database Security
```typescript
// ✅ Correct: Always filter by user
const data = await db.query.items.findMany({
  where: eq(items.userId, ctx.userId),
});

// ❌ Incorrect: Never query without user filtering
const data = await db.query.items.findMany();
```

### API Key Management
- Store API keys encrypted in database
- Use secure retrieval methods
- Never log or expose API keys
- Handle missing API keys gracefully

```typescript
const apiKey = await ctx.crypto.getApiKey("gemini");
if (!apiKey) {
  throw new Error("MISSING_API_KEY");
}
```

## Error Handling and User Experience

### Toast Notification Patterns
```typescript
import { toast } from "sonner";

// Success
toast.success("Operation completed successfully");

// Error
toast.error("Operation failed");

// Custom error handling
.onError: (error) => {
  if (error.message === "MISSING_API_KEY") {
    toast.error("API key required. Please check your settings.");
  } else {
    toast.error("Operation failed");
  }
}
```

### Error Recovery Patterns
```typescript
if (error) {
  return (
    <div className="container mx-auto p-2 lg:p-4">
      <div className="rounded-lg border bg-background p-12 text-center">
        <p className="text-muted-foreground mb-4">
          Failed to load data. Please try again.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  );
}
```

## AI Integration Patterns

### Agent Architecture
- Content generation agents in `worker/agents/`
- Profile analysis workflows (psychology, writing style)
- Secure API integration with error handling

### Content Generation Flow
1. Collect generation parameters (writer or custom profiles)
2. Validate required profiles exist
3. Fetch profiles from database
4. Generate content using AI agents
5. Return structured response

### Profile Analysis Workflow
1. Collect original content samples
2. Process through specialized AI agents
3. Generate structured profile analysis
4. Store results in database
5. Link to ghostwriter entities

## Key Architectural Patterns

1. **Dual API Architecture**: TRPC for type-safe RPC (`/trpc/*`) and Hono for REST (`/api/*`)

2. **Frontend Routing**: TanStack Router with file-based routing in `/src/routes/`

3. **Database Access**: All operations through Drizzle ORM with user-scoped security

4. **Type Safety**: End-to-end type safety with comprehensive type definitions

5. **Authentication**: Clerk integration with protected routes

## Development Workflow

1. **Adding a new API endpoint**:
   - For TRPC: Create procedure in `worker/trpc/routes/` following CRUD patterns
   - Include proper error handling and user scoping
   - Add input validation with Zod schemas

2. **Adding a new page**:
   - Create file in `src/routes/` following naming convention
   - Use established UI patterns (no cards, consistent buttons)
   - Implement proper loading and error states

3. **Database changes**:
   - Modify schema in appropriate schema file
   - Run `pnpm db:generate` to create migration
   - Test locally with `pnpm db:migrate:local`
   - Deploy with `pnpm db:migrate`

4. **Adding UI components**:
   - Use `npx shadcn@latest add <component>` for primitives
   - Follow established patterns for custom components
   - Maintain consistency with icon and button usage

## Environment Variables

Required environment variables:
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication key (frontend)
- `GOOGLE_GENERATIVE_AI_API_KEY` - AI generation (stored encrypted)
- Cloudflare account and database IDs configured in `wrangler.jsonc`


## Important Notes

- The project uses PNPM as the package manager
- TypeScript path aliases: `@/*` maps to `src/*`, `@worker/*` maps to `worker/*`
- The worker runs in Node.js compatibility mode
- Static assets served from worker with SPA routing enabled
- No testing framework currently set up
- **UI Preference**: Always use simple lists, never cards
- **Security**: Always filter database queries by userId
- **UX**: Always provide loading states and user feedback via toasts
- **Code Organization**: Follow established import patterns and component structure
- **Error Logging**: Comprehensive automatic logging with errorId, requestId, and user context

## Development Philosophy
- **Prefer simplicity over complexity** - choose the most straightforward solution that works
- **Avoid premature optimization** - don't add abstractions, patterns, or features until they're actually needed
- **Start with the minimal viable implementation** - we can always refactor later if complexity is justified
- **Question every layer of abstraction** - each one should solve a real, current problem

## Code Style Preferences
- Favor plain functions over classes when possible
- Use direct implementations over design patterns unless the pattern solves a specific problem
- Avoid creating interfaces/abstractions for single implementations
- Don't create configuration systems until you have multiple varying use cases
- Prefer inline logic over extracted functions until the extraction serves a clear purpose

## When Making Decisions
- Ask "What's the simplest thing that could work?" first
- If suggesting architecture, explain why the complexity is necessary
- Default to standard library solutions over external dependencies
- Prefer explicit code over "clever" code