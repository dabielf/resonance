/**
 * EncryptionService - Core encryption utilities using Web Crypto API
 * 
 * Uses AES-256-GCM for authenticated encryption, providing both confidentiality
 * and integrity. Each encryption operation generates a random IV to ensure
 * the same plaintext encrypts to different ciphertexts.
 */
export class EncryptionService {
  private readonly algorithm = 'AES-GCM';
  private readonly ivLength = 12; // 96 bits for GCM
  
  /**
   * Encrypts plaintext using AES-GCM with the provided key
   * @param plaintext - String to encrypt
   * @param key - CryptoKey for encryption
   * @returns Base64-encoded string in format: version:iv:authTag:ciphertext
   */
  async encrypt(plaintext: string, key: CryptoKey): Promise<string> {
    try {
      // Generate random IV (12 bytes for GCM)
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      // Convert plaintext to bytes
      const plaintextBytes = new TextEncoder().encode(plaintext);
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        key,
        plaintextBytes
      );
      
      // Extract auth tag (last 16 bytes) and ciphertext
      const encryptedArray = new Uint8Array(encrypted);
      const authTag = encryptedArray.slice(-16);
      const ciphertext = encryptedArray.slice(0, -16);
      
      // Encode components as base64
      const ivB64 = this.arrayBufferToBase64(iv);
      const authTagB64 = this.arrayBufferToBase64(authTag);
      const ciphertextB64 = this.arrayBufferToBase64(ciphertext);
      
      // Return versioned format for future compatibility
      return `v1:${ivB64}:${authTagB64}:${ciphertextB64}`;
    } catch {
      throw new Error('Encryption failed');
    }
  }
  
  /**
   * Decrypts data that was encrypted with the encrypt method
   * @param encryptedData - Base64-encoded string from encrypt method
   * @param key - CryptoKey for decryption
   * @returns Original plaintext string
   */
  async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    try {
      // Parse the versioned format
      const parts = encryptedData.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
      }
      
      const [version, ivB64, authTagB64, ciphertextB64] = parts;
      
      // Check version compatibility
      if (version !== 'v1') {
        throw new Error('Unsupported encryption version');
      }
      
      // Decode components from base64
      const iv = this.base64ToArrayBuffer(ivB64);
      const authTag = this.base64ToArrayBuffer(authTagB64);
      const ciphertext = this.base64ToArrayBuffer(ciphertextB64);
      
      // Combine ciphertext and auth tag for decryption
      const encryptedBytes = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
      encryptedBytes.set(new Uint8Array(ciphertext));
      encryptedBytes.set(new Uint8Array(authTag), ciphertext.byteLength);
      
      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: new Uint8Array(iv),
        },
        key,
        encryptedBytes
      );
      
      // Convert bytes back to string
      return new TextDecoder().decode(decrypted);
    } catch {
      throw new Error('Decryption failed');
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