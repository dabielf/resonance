# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Backend**: Cloudflare Workers + Hono + TRPC
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Auth**: Clerk

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
│   └── migrations/   # SQL migration files
└── agents/           # AI agent-related logic
```

### Key Architectural Patterns

1. **Dual API Architecture**: The worker exposes both TRPC (`/trpc/*`) for type-safe RPC and Hono (`/api/*`) for REST endpoints.

2. **Frontend Routing**: Uses TanStack Router with file-based routing. Routes are defined in `/src/routes/` and automatically generate the route tree.

3. **Database Access**: All database operations go through Drizzle ORM. The schema is defined in `worker/db/schema.ts`.

4. **Type Safety**: TRPC provides end-to-end type safety between frontend and backend. Types are shared automatically.

5. **Authentication**: Clerk handles authentication. Protected routes check auth state via Clerk's React hooks.

### Development Workflow

1. **Adding a new API endpoint**:
   - For TRPC: Create a new file in `worker/trpc/routes/` and add it to `worker/trpc/router.ts`
   - For REST: Add routes to the appropriate file in `worker/hono/`

2. **Adding a new page**:
   - Create a new file in `src/routes/` following the naming convention
   - The router will automatically pick it up

3. **Database changes**:
   - Modify schema in `worker/db/schema.ts`
   - Run `pnpm db:generate` to create a migration
   - Run `pnpm db:migrate:local` to apply locally
   - Run `pnpm db:migrate` to apply to production

4. **Adding UI components**:
   - Use `npx shadcn@latest add <component>` to add shadcn/ui components
   - Custom components go in `src/components/`

### Environment Variables

Required environment variables:
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication key (frontend)
- Cloudflare account and database IDs are configured in `wrangler.jsonc`

### Important Notes

- The project uses PNPM as the package manager
- TypeScript path aliases are configured: `@/*` maps to `src/*`, `@worker/*` maps to `worker/*`
- The worker runs in Node.js compatibility mode
- Static assets are served from the worker with SPA routing enabled
- No testing framework is currently set up