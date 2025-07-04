import { t } from "./trpc-instance";
import { contentRouter } from "./routes/content-router";
import { gwRouter } from "./routes/example-table-data";
import { userSettingsRouter } from "./routes/user-settings";
import { resourceRouter } from "./routes/resource-router";

export const appRouter = t.router({
	contentRouter,
	gwRouter,
	userSettingsRouter,
	resourceRouter,
});

export type AppRouter = typeof appRouter;
