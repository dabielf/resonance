import { t } from "./trpc-instance";
import { gwRouter } from "./routes/example-table-data";

export const appRouter = t.router({
  gwRouter,
});

export type AppRouter = typeof appRouter;