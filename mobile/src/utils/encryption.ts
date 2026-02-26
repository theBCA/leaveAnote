import { gcm } from '@noble/ciphers/aes.js';
import * as Crypto from 'expo-crypto';
import { encode as btoa, decode as atob } from 'base-64';

/**
 * AES-GCM encryption compatible with the web app's Web Crypto API implementation.
 * Uses @noble/ciphers for pure-JS AES-GCM that produces byte-identical output.
 */
export async function encryptMessage(message: string, key?: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const keyMaterial = key || 'leaveanote-secret-key';
    const keyData = encoder.encode(keyMaterial.padEnd(32, '0')).slice(0, 32);

    const iv = Crypto.getRandomBytes(12);
    const cipher = gcm(keyData, iv);
    const encryptedData = cipher.encrypt(data);

    const combined = new Uint8Array(iv.length + encryptedData.length);
    combined.set(iv);
    combined.set(encryptedData, iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    return message;
  }
}

export async function decryptMessage(encryptedMessage: string, key?: string): Promise<string> {
  try {
    const encoder = new TextEncoder();

    const combined = Uint8Array.from(atob(encryptedMessage), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const keyMaterial = key || 'leaveanote-secret-key';
    const keyData = encoder.encode(keyMaterial.padEnd(32, '0')).slice(0, 32);

    const decipher = gcm(keyData, iv);
    const decryptedData = decipher.decrypt(encryptedData);

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedMessage;
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function unsanitizeInput(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}
