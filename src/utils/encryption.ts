// Simple AES encryption using Web Crypto API
export async function encryptMessage(message: string, key?: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Use a simple key derivation - in production, use a proper key management system
    const keyMaterial = key || 'leaveanote-secret-key';
    const keyData = encoder.encode(keyMaterial.padEnd(32, '0'));
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    return message; // Fallback to unencrypted
  }
}

export async function decryptMessage(encryptedMessage: string, key?: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    const keyMaterial = key || 'leaveanote-secret-key';
    const keyData = encoder.encode(keyMaterial.padEnd(32, '0'));
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedMessage; // Fallback to encrypted text
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
