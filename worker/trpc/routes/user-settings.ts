import { eq } from "drizzle-orm";
import z from "zod";
import { userSettings } from "../../db/schema";
import { t } from "../trpc-instance";

export const userSettingsRouter = t.router({
	getUserSettings: t.procedure.query(async ({ ctx }) => {
		const settings = await ctx.db.query.userSettings.findFirst({
			where: eq(userSettings.userId, ctx.userId),
		});
		
		if (!settings) {
			return {
				hasGeminiApiKey: false,
				hasOpenAiApiKey: false,
				hasResendApiKey: false,
				information: null,
			};
		}
		
		// Return only status information, not the actual decrypted keys
		return {
			hasGeminiApiKey: !!settings.geminiApiKey,
			hasOpenAiApiKey: !!settings.openAiApiKey,
			hasResendApiKey: !!settings.resendApiKey,
			information: settings.information,
		};
	}),
	setUserGeminiKey: t.procedure
		.input(z.object({ geminiApiKey: z.string() }))
		.mutation(async ({ input: { geminiApiKey }, ctx }) => {
			// Encrypt API key using crypto helper from context
			const encryptedApiKey = await ctx.crypto.service.encryptApiKey(geminiApiKey, ctx.userId, ctx.db, ctx.env);
			
			// Check if user settings exist
			const existingSettings = await ctx.db.query.userSettings.findFirst({
				where: eq(userSettings.userId, ctx.userId),
			});
			
			if (existingSettings) {
				// Update existing settings
				await ctx.db
					.update(userSettings)
					.set({ 
						geminiApiKey: encryptedApiKey,
						updatedAt: new Date().toISOString()
					})
					.where(eq(userSettings.userId, ctx.userId));
			} else {
				// Insert new settings record
				await ctx.db
					.insert(userSettings)
					.values({
						userId: ctx.userId,
						geminiApiKey: encryptedApiKey,
					});
			}
		}),
});
