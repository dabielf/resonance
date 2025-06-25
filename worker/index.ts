import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { getDbUserId } from "./auth";
import app from "./hono/api";
import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/router";

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.pathname.startsWith("/trpc")) {
			const { userId, error } = await getDbUserId(request, env);
			if (error || !userId) {
				return new Response(error, {
					status: 401,
				});
			}
			console.log("USER ID", userId);
			return fetchRequestHandler({
				endpoint: "/trpc",
				req: request,
				router: appRouter,
				createContext: async () =>
					createContext({ req: request, env: env, workerCtx: ctx, userId }),
			});
		}
		return app.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
