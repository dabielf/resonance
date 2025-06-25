import { eq } from "drizzle-orm";
import z from "zod";
import { getDB } from "../../db";
import { userSettings } from "../../db/schema";
import { t } from "../trpc-instance";

export const userSettingsRouter = t.router({
	getUserSettings: t.procedure.query(async ({ ctx }) => {
		const db = getDB(ctx.env);
		const userSettings = await db.query.userSettings.findFirst({
			where: eq(userSettings.userId, ctx.userId),
		});
		return userSettings;
	}),
	setUserGeminiKey: t.procedure
		.input(z.object({ geminiApiKey: z.string() }))
		.mutation(async ({ input: { geminiApiKey }, ctx }) => {
			const db = getDB(ctx.env);
			await db
				.update(userSettings)
				.set({ geminiApiKey })
				.where(eq(userSettings.userId, ctx.userId));
		}),
});
