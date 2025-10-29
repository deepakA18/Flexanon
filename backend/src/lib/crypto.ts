import crypto from 'crypto';

/**
 * Hash a wallet address to create owner identifier
 */
export function hashWalletAddress(address: string): string {
  return crypto.createHash('sha256').update(address.toLowerCase()).digest('hex');
}

/**
 * Generate a short random token (for share URLs)
 */
export function generateShortToken(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    token += chars[randomBytes[i] % chars.length];
  }
  
  return token;
}

/**
 * Generate a random nonce for wallet signature
 */
export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a signing message for wallet verification
 */
export function createSignMessage(nonce: string, timestamp: number): string {
  return `Flexanon Verification\n\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nSign this message to prove ownership of your wallet.`;
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(data: string, key: string): { encrypted: string; iv: string; tag: string } {
  // Ensure key is 32 bytes
  const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encrypted: string, key: string, iv: string, tag: string): string {
  // Ensure key is 32 bytes
  const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  const ivBuffer = Buffer.from(iv, 'hex');
  const tagBuffer = Buffer.from(tag, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
  decipher.setAuthTag(tagBuffer);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash arbitrary data
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Time-safe string comparison (prevents timing attacks)
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  return crypto.timingSafeEqual(bufA, bufB);
}
