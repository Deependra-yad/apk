// p:\Python\apk\client\src\utils\crypto.ts
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
  return keyPair;
};

export const exportPublicKey = async (key: CryptoKey) => {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  const exportedKeyBuffer = new Uint8Array(exported);
  return btoa(String.fromCharCode(...exportedKeyBuffer));
};

export const importPublicKey = async (base64Key: string) => {
  const binaryString = atob(base64Key);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    'raw',
    bytes,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
};

export const deriveSharedKey = async (privateKey: CryptoKey, publicKey: CryptoKey) => {
  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptMessage = async (sharedKey: CryptoKey, text: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    sharedKey,
    data
  );
  
  const ciphertextBuffer = new Uint8Array(ciphertext);
  return {
    ciphertext: btoa(String.fromCharCode(...ciphertextBuffer)),
    iv: btoa(String.fromCharCode(...iv))
  };
};

export const decryptMessage = async (sharedKey: CryptoKey, base64Ciphertext: string, base64Iv: string) => {
  try {
    const binaryCiphertext = atob(base64Ciphertext);
    const ciphertextBytes = new Uint8Array(binaryCiphertext.length);
    for (let i = 0; i < binaryCiphertext.length; i++) {
      ciphertextBytes[i] = binaryCiphertext.charCodeAt(i);
    }
    
    const binaryIv = atob(base64Iv);
    const ivBytes = new Uint8Array(binaryIv.length);
    for (let i = 0; i < binaryIv.length; i++) {
      ivBytes[i] = binaryIv.charCodeAt(i);
    }

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      sharedKey,
      ciphertextBytes
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Decryption Failed]';
  }
};

// IndexedDB Wrapper for Key Storage
const DB_NAME = 'LiquidChatCryptoDB';
const STORE_NAME = 'keys';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveKeyToIDB = async (userId: string, keyPair: CryptoKeyPair) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(keyPair, userId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getKeyFromIDB = async (userId: string): Promise<CryptoKeyPair | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

