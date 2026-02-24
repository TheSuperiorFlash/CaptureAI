/**
 * Mock Web Crypto API for Cloudflare Workers tests
 *
 * Provides crypto.subtle, crypto.getRandomValues, crypto.randomUUID
 */

import { webcrypto } from 'crypto';

/**
 * Set up crypto globals matching Cloudflare Workers environment
 */
export function setupCryptoMock() {
  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = webcrypto;
  }

  if (typeof globalThis.crypto.subtle === 'undefined') {
    globalThis.crypto.subtle = webcrypto.subtle;
  }
}
