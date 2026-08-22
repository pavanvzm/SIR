import CryptoJS from 'crypto-js';

/**
 * Encrypts sensitive data using AES-256
 */
export function encrypt(text: string, key: string): string {
  if (!key || key.length < 32) {
    throw new Error('Encryption key must be at least 32 characters');
  }
  return CryptoJS.AES.encrypt(text, key).toString();
}

/**
 * Decrypts AES-256 encrypted data
 */
export function decrypt(ciphertext: string, key: string): string {
  if (!key || key.length < 32) {
    throw new Error('Decryption key must be at least 32 characters');
  }
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Generates a secure random API key
 */
export function generateApiKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  
  // Use crypto module for cryptographically secure random values
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
}

/**
 * Hashes a value using SHA-256
 */
export function hash(value: string): string {
  return CryptoJS.SHA256(value).toString();
}

/**
 * Validates API key format
 */
export function isValidApiKey(key: string): boolean {
  const apiKeyRegex = /^[A-Za-z0-9_-]{32,64}$/;
  return apiKeyRegex.test(key);
}
