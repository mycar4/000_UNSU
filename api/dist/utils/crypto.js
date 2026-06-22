import crypto from 'crypto';
const ALGORITHM = 'aes-256-gcm';
// Derived 32-byte key from environment secret or a secure fallback for local testing
const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY || 'unsu-platform-secure-secret-key-2026';
const SECRET_KEY = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32);
/**
 * Encrypts plain text using AES-256-GCM
 */
export function encrypt(text) {
    if (!text)
        return text;
    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        // Combine iv, authTag, and ciphertext using colons
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }
    catch (err) {
        console.error('[Crypto] Encryption failed, returning plain text:', err);
        return text;
    }
}
/**
 * Decrypts AES-256-GCM encrypted text.
 * Safely falls back to plain text if the input is not encrypted.
 */
export function decrypt(encryptedText) {
    if (!encryptedText)
        return encryptedText;
    try {
        const parts = encryptedText.split(':');
        // If the format is not iv:authTag:ciphertext, treat it as unencrypted legacy data
        if (parts.length !== 3) {
            return encryptedText;
        }
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (err) {
        console.warn('[Crypto] Decryption failed, assuming unencrypted format:', err);
        return encryptedText;
    }
}
/**
 * Generates a SHA-256 hash of the hometax ID for secure de-duplication and withdrawal validation.
 */
export function hashHometaxId(id) {
    if (!id)
        return '';
    return crypto.createHash('sha256').update(id).digest('hex');
}
