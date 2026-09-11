/**
 * Security Lock Utility
 * Manages SHA-256 salted PIN protection for App Lock and WhatsApp-style Chat Lock.
 */

const PIN_SALT = 'liquid_chat_lock_salt_2026_';
const PIN_HASH_KEY = 'liquid_security_pin_hash';
const APP_LOCK_KEY = 'liquid_app_lock_enabled';
const LOCKED_CHATS_KEY = 'liquid_locked_chats_v1';

// In-memory unlock sessions (cleared on tab close/refresh for maximum security)
let isAppSessionUnlocked = false;
let isLockedChatsSessionUnlocked = false;

// Compute SHA-256 hash using Web Crypto API
export async function hashPin(pin: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    let hash = 0;
    const str = PIN_SALT + pin;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  const enc = new TextEncoder();
  const data = enc.encode(PIN_SALT + pin);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isPinConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(PIN_HASH_KEY));
}

export async function setSecurityPin(pin: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const hash = await hashPin(pin);
  localStorage.setItem(PIN_HASH_KEY, hash);
  isAppSessionUnlocked = true;
  isLockedChatsSessionUnlocked = true;
}

export async function verifySecurityPin(pin: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const storedHash = localStorage.getItem(PIN_HASH_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPin(pin);
  const matches = storedHash === inputHash;
  if (matches) {
    isAppSessionUnlocked = true;
  }
  return matches;
}

export function removeSecurityPin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(APP_LOCK_KEY);
  localStorage.removeItem(LOCKED_CHATS_KEY);
  isAppSessionUnlocked = true;
  isLockedChatsSessionUnlocked = true;
}

// App Lock Status
export function isAppLockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return isPinConfigured() && localStorage.getItem(APP_LOCK_KEY) === 'true';
}

export function setAppLockEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(APP_LOCK_KEY, enabled ? 'true' : 'false');
  if (!enabled) {
    isAppSessionUnlocked = true;
  }
}

export function isAppUnlockedForSession(): boolean {
  if (!isAppLockEnabled()) return true;
  return isAppSessionUnlocked;
}

export function lockAppSession(): void {
  isAppSessionUnlocked = false;
  isLockedChatsSessionUnlocked = false;
}

export function unlockAppSession(): void {
  isAppSessionUnlocked = true;
}

// Chat Lock (Individual Chats)
export function getLockedChatIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCKED_CHATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function isChatLocked(chatId: string): boolean {
  if (!chatId) return false;
  const lockedIds = getLockedChatIds();
  return lockedIds.includes(chatId);
}

export function lockChat(chatId: string): void {
  if (typeof window === 'undefined' || !chatId) return;
  const current = getLockedChatIds();
  if (!current.includes(chatId)) {
    current.push(chatId);
    localStorage.setItem(LOCKED_CHATS_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('liquid_locks_updated'));
  }
}

export function unlockChatPermanently(chatId: string): void {
  if (typeof window === 'undefined' || !chatId) return;
  const current = getLockedChatIds();
  const next = current.filter(id => id !== chatId);
  localStorage.setItem(LOCKED_CHATS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('liquid_locks_updated'));
}

// Session state for the "Locked Chats" folder in chat list
export function isLockedChatsFolderUnlocked(): boolean {
  return isLockedChatsSessionUnlocked;
}

export function setLockedChatsFolderUnlocked(unlocked: boolean): void {
  isLockedChatsSessionUnlocked = unlocked;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('liquid_locks_updated'));
  }
}

