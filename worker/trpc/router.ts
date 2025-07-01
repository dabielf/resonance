import { t } from "./trpc-instance";

const { contentRouter } = await import("./routes/content-router");
const { gwRouter } = await import("./routes/example-table-data");
const { userSettingsRouter } = await import("./routes/user-settings");

export const appRouter = t.router({
	contentRouter,
	gwRouter,
	userSettingsRouter,
});

export type AppRouter = typeof appRouter;
