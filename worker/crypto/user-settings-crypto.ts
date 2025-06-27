import { eq } from "drizzle-orm";
import { EncryptionService } from "./index";
import { KeyManager } from "./key-manager";
import { users, userSettings } from "../db/schema";
import type { Database } from "../db";

/**
 * UserSettingsCrypto - Handles encryption/decryption of user settings
 * 
 * Provides high-level utilities for encrypting and decrypting user API keys
 * and other sensitive settings data.
 */
export class UserSettingsCrypto {
  private encryptionService: EncryptionService;
  private keyManager: KeyManager;
  
  constructor() {
    this.encryptionService = new EncryptionService();
    this.keyManager = new KeyManager();
  }
  
  /**
   * Encrypts an API key for storage in the database
   * @param apiKey - Plain text API key
   * @param userId - User ID
   * @param db - Database instance
   * @param env - Environment (containing MASTER_ENCRYPTION_KEY)
   * @returns Encrypted API key string
   */
  async encryptApiKey(
    apiKey: string,
    userId: number,
    db: Database,
    env: { MASTER_ENCRYPTION_KEY: string }
  ): Promise<string> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Decrypt user's key using master key
    const masterKey = await this.keyManager.deriveKeyFromSecret(env.MASTER_ENCRYPTION_KEY);
    const userKey = await this.keyManager.decryptUserKey(user.encryptionKey, masterKey);
    
    // Encrypt the API key with user's key
    return await this.encryptionService.encrypt(apiKey, userKey);
  }
  
  /**
   * Decrypts user settings, handling all API keys
   * @param settings - Raw settings from database (with encrypted API keys)
   * @param userId - User ID
   * @param db - Database instance
   * @param env - Environment (containing MASTER_ENCRYPTION_KEY)
   * @returns Settings with decrypted API keys
   */
  async decryptUserSettings(
    settings: any,
    userId: number,
    db: Database,
    env: { MASTER_ENCRYPTION_KEY: string }
  ): Promise<any> {
    if (!settings) {
      return null;
    }
    
    // Get user's encryption key
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Decrypt user's key using master key
    const masterKey = await this.keyManager.deriveKeyFromSecret(env.MASTER_ENCRYPTION_KEY);
    const userKey = await this.keyManager.decryptUserKey(user.encryptionKey, masterKey);
    
    // Decrypt API keys if they exist
    const decryptedSettings = { ...settings };
    
    if (settings.geminiApiKey) {
      try {
        decryptedSettings.geminiApiKey = await this.encryptionService.decrypt(settings.geminiApiKey, userKey);
      } catch {
        // If decryption fails, set to null (might be old unencrypted data or corrupted)
        decryptedSettings.geminiApiKey = null;
      }
    }
    
    if (settings.openAiApiKey) {
      try {
        decryptedSettings.openAiApiKey = await this.encryptionService.decrypt(settings.openAiApiKey, userKey);
      } catch {
        decryptedSettings.openAiApiKey = null;
      }
    }
    
    if (settings.resendApiKey) {
      try {
        decryptedSettings.resendApiKey = await this.encryptionService.decrypt(settings.resendApiKey, userKey);
      } catch {
        decryptedSettings.resendApiKey = null;
      }
    }
    
    return decryptedSettings;
  }
  
  /**
   * Gets a decrypted API key for agent usage
   * @param apiKeyType - Type of API key ('gemini', 'openai', 'resend')
   * @param userId - User ID
   * @param db - Database instance
   * @param env - Environment (containing MASTER_ENCRYPTION_KEY)
   * @returns Decrypted API key string
   */
  async getDecryptedApiKey(
    apiKeyType: 'gemini' | 'openai' | 'resend',
    userId: number,
    db: Database,
    env: { MASTER_ENCRYPTION_KEY: string }
  ): Promise<string | null> {
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId)
    });
    
    if (!settings) {
      return null;
    }
    
    let encryptedKey: string | null = null;
    switch (apiKeyType) {
      case 'gemini':
        encryptedKey = settings.geminiApiKey;
        break;
      case 'openai':
        encryptedKey = settings.openAiApiKey;
        break;
      case 'resend':
        encryptedKey = settings.resendApiKey;
        break;
    }
    
    if (!encryptedKey) {
      return null;
    }
    
    // Get user's encryption key
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Decrypt user's key using master key
    const masterKey = await this.keyManager.deriveKeyFromSecret(env.MASTER_ENCRYPTION_KEY);
    const userKey = await this.keyManager.decryptUserKey(user.encryptionKey, masterKey);
    
    // Decrypt the API key
    try {
      return await this.encryptionService.decrypt(encryptedKey, userKey);
    } catch {
      // If decryption fails, return null
      return null;
    }
  }
}