import {
	type ClerkClient,
	createClerkClient,
	verifyToken,
} from "@clerk/backend";
import { eq } from "drizzle-orm";
import { getDB } from "./db";
import { users } from "./db/schema";
import { KeyManager } from "./crypto/key-manager";

type VerifyTokenResponse = {
	userId: string | null;
	error: string | null;
	clerkClient: ClerkClient;
};

type VerifyAuthResponse = {
	userId: number | null;
	error: string | null;
};

async function getClerkUserId(
	request: Request,
	env: Env,
): Promise<VerifyTokenResponse> {
	const secretKey = env.CLERK_SECRET_KEY;
	const publishableKey = env.CLERK_PUBLIC_KEY;
	const jwtKey = env.CLERK_JWT_KEY;

	const clerkClient = createClerkClient({
		secretKey,
		publishableKey,
	});

	try {
		const { token } = await clerkClient.authenticateRequest(request, {
			jwtKey,
		});

		if (!token) {
			return { userId: null, error: "Token not found", clerkClient };
		}

		const verifiedToken = await verifyToken(token, {
			jwtKey,
		});

		return { userId: verifiedToken.sub, error: null, clerkClient };
	} catch (error) {
		return { userId: null, error: (error as Error).message, clerkClient };
	}
}

export async function getDbUserId(
	request: Request,
	env: Env,
): Promise<VerifyAuthResponse> {
	const { userId, error, clerkClient } = await getClerkUserId(request, env);

	if (error || !userId) {
		return { userId: null, error };
	}

	const db = getDB(env);
	const user = await db.query.users.findFirst({
		where: eq(users.identityToken, userId),
	});

	if (!user) {
		console.log("User not found");
		const clerkUser = await clerkClient.users.getUser(userId);
		console.log("Clerk User", clerkUser);
		
		// Generate encryption key for the new user
		const keyManager = new KeyManager();
		const userKey = await keyManager.generateUserKey();
		const masterKey = await keyManager.deriveKeyFromSecret(env.MASTER_ENCRYPTION_KEY);
		const encryptedUserKey = await keyManager.encryptUserKey(userKey, masterKey);
		
		const dbUser = await db
			.insert(users)
			.values({
				email: clerkUser.emailAddresses[0].emailAddress,
				name: clerkUser.firstName,
				identityToken: userId as string,
				encryptionKey: encryptedUserKey,
			})
			.returning();
		console.log("Created User", dbUser);
		return { userId: dbUser[0].id, error: null };
	}

	return { userId: user.id, error: null };
}
