import { UserSettingsCrypto } from "./user-settings-crypto";
import type { Database } from "../db";

/**
 * Simple helper function for agents to get decrypted API keys
 * This function provides a clean interface for agents to access user API keys
 * without needing to understand the encryption implementation details.
 */
export async function getDecryptedGeminiKey(
  userId: number,
  db: Database,
  env: { MASTER_ENCRYPTION_KEY: string }
): Promise<string | null> {
  const crypto = new UserSettingsCrypto();
  return await crypto.getDecryptedApiKey('gemini', userId, db, env);
}

export async function getDecryptedOpenAiKey(
  userId: number,
  db: Database,
  env: { MASTER_ENCRYPTION_KEY: string }
): Promise<string | null> {
  const crypto = new UserSettingsCrypto();
  return await crypto.getDecryptedApiKey('openai', userId, db, env);
}

export async function getDecryptedResendKey(
  userId: number,
  db: Database,
  env: { MASTER_ENCRYPTION_KEY: string }
): Promise<string | null> {
  const crypto = new UserSettingsCrypto();
  return await crypto.getDecryptedApiKey('resend', userId, db, env);
}

/**
 * Generic helper that agents can use to get any API key type
 */
export async function getDecryptedApiKey(
  keyType: 'gemini' | 'openai' | 'resend',
  userId: number,
  db: Database,
  env: { MASTER_ENCRYPTION_KEY: string }
): Promise<string | null> {
  const crypto = new UserSettingsCrypto();
  return await crypto.getDecryptedApiKey(keyType, userId, db, env);
}