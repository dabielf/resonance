/**
 * KeyManager - Handles cryptographic key generation and management
 * 
 * Provides utilities for:
 * - Generating secure user encryption keys
 * - Deriving keys from secret strings using PBKDF2
 * - Encrypting/decrypting user keys with master key
 */
export class KeyManager {
  private readonly keyLength = 256;
  private readonly iterations = 100000; // PBKDF2 iterations for key derivation
  
  /**
   * Generates a new cryptographically secure encryption key for a user
   * @returns Base64-encoded key material
   */
  async generateUserKey(): Promise<string> {
    try {
      // Generate 256-bit random key material
      const keyMaterial = crypto.getRandomValues(new Uint8Array(32));
      
      // Convert to base64 for storage
      return this.arrayBufferToBase64(keyMaterial);
    } catch {
      throw new Error('Failed to generate user key');
    }
  }
  
  /**
   * Derives a CryptoKey from a secret string using PBKDF2
   * Used for converting the master secret into a usable encryption key
   * @param secret - Base64-encoded secret string
   * @returns CryptoKey suitable for AES-GCM operations
   */
  async deriveKeyFromSecret(secret: string): Promise<CryptoKey> {
    try {
      // Decode the secret
      const secretBytes = this.base64ToArrayBuffer(secret);
      
      // Import the secret as raw key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        secretBytes,
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      // Use a fixed salt for master key derivation (in production, you might want to make this configurable)
      const salt = new TextEncoder().encode('resonance-master-key-salt-2024');
      
      // Derive the actual encryption key
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        {
          name: 'AES-GCM',
          length: this.keyLength,
        },
        false, // not extractable for security
        ['encrypt', 'decrypt']
      );
      
      return derivedKey;
    } catch {
      throw new Error('Failed to derive key from secret');
    }
  }
  
  /**
   * Encrypts a user's encryption key with the master key
   * @param userKey - Base64-encoded user key to encrypt
   * @param masterKey - Master CryptoKey for encryption
   * @returns Base64-encoded encrypted key
   */
  async encryptUserKey(userKey: string, masterKey: CryptoKey): Promise<string> {
    try {
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Convert user key to bytes
      const userKeyBytes = new TextEncoder().encode(userKey);
      
      // Encrypt the user key
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        masterKey,
        userKeyBytes
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      // Return as base64
      return this.arrayBufferToBase64(combined);
    } catch {
      throw new Error('Failed to encrypt user key');
    }
  }
  
  /**
   * Decrypts a user's encryption key using the master key
   * @param encryptedUserKey - Base64-encoded encrypted user key
   * @param masterKey - Master CryptoKey for decryption
   * @returns CryptoKey suitable for user data encryption/decryption
   */
  async decryptUserKey(encryptedUserKey: string, masterKey: CryptoKey): Promise<CryptoKey> {
    try {
      // Decode the encrypted data
      const encryptedBytes = this.base64ToArrayBuffer(encryptedUserKey);
      const encryptedArray = new Uint8Array(encryptedBytes);
      
      // Extract IV (first 12 bytes) and ciphertext
      const iv = encryptedArray.slice(0, 12);
      const ciphertext = encryptedArray.slice(12);
      
      // Decrypt the user key
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        masterKey,
        ciphertext
      );
      
      // Convert back to string, then to key material
      const userKeyString = new TextDecoder().decode(decrypted);
      const userKeyBytes = this.base64ToArrayBuffer(userKeyString);
      
      // Import as CryptoKey
      const userKey = await crypto.subtle.importKey(
        'raw',
        userKeyBytes,
        {
          name: 'AES-GCM',
          length: this.keyLength,
        },
        false, // not extractable for security
        ['encrypt', 'decrypt']
      );
      
      return userKey;
    } catch {
      throw new Error('Failed to decrypt user key');
    }
  }
  
  /**
   * Converts ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  /**
   * Converts base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}