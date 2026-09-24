import { validateResult } from './validateResult.js';

export function encodeSharedSet(result) {
  const bytes = new TextEncoder().encode(JSON.stringify({ topic: result.topic, blocks: result.blocks }));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeSharedSet(encoded) {
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const json = new TextDecoder().decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)));
    return validateResult(JSON.parse(json));
  } catch { return null; }
}
