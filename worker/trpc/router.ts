import { t } from "./trpc-instance";

const { contentRouter } = await import("./routes/content-router");
const { gwRouter } = await import("./routes/example-table-data");
const { userSettingsRouter } = await import("./routes/user-settings");
const { resourceRouter } = await import("./routes/resource-router");

export const appRouter = t.router({
	contentRouter,
	gwRouter,
	userSettingsRouter,
	resourceRouter,
});

export type AppRouter = typeof appRouter;
