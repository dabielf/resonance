import { contentRouter } from "./routes/content-router";
import { gwRouter } from "./routes/example-table-data";
import { t } from "./trpc-instance";

export const appRouter = t.router({
	contentRouter,
	gwRouter,
});

export type AppRouter = typeof appRouter;
