import { contentRouter } from "./routes/content-router";
import { gwRouter } from "./routes/example-table-data";
import { userSettingsRouter } from "./routes/user-settings";
import { t } from "./trpc-instance";

export const appRouter = t.router({
	contentRouter,
	gwRouter,
	userSettingsRouter,
});

export type AppRouter = typeof appRouter;
