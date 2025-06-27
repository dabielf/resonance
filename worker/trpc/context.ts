import { UserSettingsCrypto } from "../crypto/user-settings-crypto";
import { getDB } from "../db";

export async function createContext({
	req,
	env,
	workerCtx,
	userId,
}: {
	req: Request;
	env: Env;
	workerCtx: ExecutionContext;
	userId: number;
}) {
	const db = getDB(env);
	const crypto = new UserSettingsCrypto();
	
	return {
		req,
		env,
		workerCtx,
		userId,
		db,
		crypto: {
			service: crypto,
			// Helper method to get decrypted API keys
			getApiKey: (keyType: 'gemini' | 'openai' | 'resend') => 
				crypto.getDecryptedApiKey(keyType, userId, db, env),
		},
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
