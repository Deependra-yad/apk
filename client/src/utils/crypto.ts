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
export const encryptFile = async (sharedKey: CryptoKey, file: File | Blob) => {
  const arrayBuffer = await file.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    sharedKey,
    arrayBuffer
  );

  const ciphertextBuffer = new Uint8Array(ciphertext);
  return {
    encryptedBlob: new Blob([ciphertextBuffer], { type: 'application/octet-stream' }),
    iv: btoa(String.fromCharCode(...iv))
  };
};

export const decryptFile = async (sharedKey: CryptoKey, encryptedBuffer: ArrayBuffer, base64Iv: string, mimeType: string = 'application/octet-stream') => {
  try {
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
      encryptedBuffer
    );

    return new Blob([decrypted], { type: mimeType });
  } catch (error) {
    console.error('File decryption failed:', error);
    throw error;
  }
};

export const generateSafetyNumber = async (key1: string, key2: string): Promise<string> => {
  const sorted = [key1, key2].sort().join(':');
  const encoder = new TextEncoder();
  const data = encoder.encode(sorted);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convert into 12 5-digit segments (60 digits total like Signal & WhatsApp)
  let numericString = '';
  for (let i = 0; i < hashArray.length; i += 2) {
    const val = (hashArray[i] << 8) | (hashArray[i + 1] || 0);
    numericString += String(val % 100000).padStart(5, '0');
  }

  const chunks = numericString.slice(0, 60).match(/.{1,5}/g) || [];
  return chunks.join(' ');
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

export const deleteKeyFromIDB = async (userId: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(userId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {}
};

export const clearCryptoDB = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.indexedDB) {
      window.indexedDB.deleteDatabase(DB_NAME);
    }
  } catch (e) {}
};

// Dual-layer key persistence (IndexedDB + localStorage fallback)
export const saveKeyToIDBAndLocalStorage = async (userId: string, keyPair: CryptoKeyPair) => {
  try {
    await saveKeyToIDB(userId, keyPair);
  } catch (e) {
    console.warn('Could not save key to IDB:', e);
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const privJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
      const pubJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      window.localStorage.setItem(`liquid_crypto_key_${userId}`, JSON.stringify({ privJwk, pubJwk }));
    }
  } catch (e) {
    console.warn('Could not save key to localStorage:', e);
  }
};

export const getKeyFromIDBOrLocalStorage = async (userId: string): Promise<CryptoKeyPair | null> => {
  try {
    const fromIdb = await getKeyFromIDB(userId);
    if (fromIdb && fromIdb.privateKey && fromIdb.publicKey) {
      return fromIdb;
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`liquid_crypto_key_${userId}`);
      if (raw) {
        const { privJwk, pubJwk } = JSON.parse(raw);
        if (privJwk && pubJwk) {
          const privateKey = await window.crypto.subtle.importKey(
            'jwk',
            privJwk,
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveKey', 'deriveBits']
          );
          const publicKey = await window.crypto.subtle.importKey(
            'jwk',
            pubJwk,
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            []
          );
          const pair: CryptoKeyPair = { privateKey, publicKey };
          saveKeyToIDB(userId, pair).catch(() => {});
          return pair;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to read key from localStorage:', e);
  }
  return null;
};

// PBKDF2 Key Derivation from User Password
const deriveKeyFromPassword = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Zero-Knowledge Backup: Encrypt user's private key with password-derived AES key and send to server
export const backupKeyWithPassword = async (
  userId: string,
  password: string,
  keyPair: CryptoKeyPair,
  token?: string
): Promise<boolean> => {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const aesKey = await deriveKeyFromPassword(password, salt);

    const privJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const pubJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const serialized = JSON.stringify({ privJwk, pubJwk });

    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encoder.encode(serialized)
    );

    const ciphertextBuffer = new Uint8Array(ciphertext);
    const encryptedPrivateKey = `${btoa(String.fromCharCode(...iv))}:${btoa(String.fromCharCode(...ciphertextBuffer))}`;
    const keyBackupSalt = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);

    // Persist locally
    await saveKeyToIDBAndLocalStorage(userId, keyPair);

    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('liquid_token') : null);
    if (authToken) {
      const axios = (await import('axios')).default;
      await axios.put('/api/users/key-backup', {
        encryptedPrivateKey,
        keyBackupSalt,
        publicKey: publicKeyBase64
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('Zero-knowledge private key safely backed up to server');
    }
    return true;
  } catch (err) {
    console.error('Failed to backup key with password:', err);
    return false;
  }
};

// Zero-Knowledge Restore: Decrypt server-stored private key using password
export const restoreKeyWithPassword = async (
  userId: string,
  password: string,
  encryptedPrivateKey: string,
  keyBackupSalt: string
): Promise<CryptoKeyPair | null> => {
  try {
    if (!encryptedPrivateKey || !keyBackupSalt || !encryptedPrivateKey.includes(':')) {
      return null;
    }
    const [ivB64, cipherB64] = encryptedPrivateKey.split(':');
    const saltBytes = new Uint8Array(keyBackupSalt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const aesKey = await deriveKeyFromPassword(password, saltBytes);

    const ivStr = atob(ivB64);
    const iv = new Uint8Array(ivStr.length);
    for (let i = 0; i < ivStr.length; i++) iv[i] = ivStr.charCodeAt(i);

    const cipherStr = atob(cipherB64);
    const cipherBytes = new Uint8Array(cipherStr.length);
    for (let i = 0; i < cipherStr.length; i++) cipherBytes[i] = cipherStr.charCodeAt(i);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      cipherBytes
    );

    const decoder = new TextDecoder();
    const parsed = JSON.parse(decoder.decode(decrypted));
    if (!parsed.privJwk) return null;

    const privateKey = await window.crypto.subtle.importKey(
      'jwk',
      parsed.privJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    let publicKey: CryptoKey;
    if (parsed.pubJwk) {
      publicKey = await window.crypto.subtle.importKey(
        'jwk',
        parsed.pubJwk,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
      );
    } else {
      const { d, key_ops, ...pubJwkOnly } = parsed.privJwk;
      pubJwkOnly.key_ops = [];
      publicKey = await window.crypto.subtle.importKey(
        'jwk',
        pubJwkOnly,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
      );
    }

    const keyPair: CryptoKeyPair = { privateKey, publicKey };
    await saveKeyToIDBAndLocalStorage(userId, keyPair);
    console.log('Zero-knowledge private key successfully restored from server backup');
    return keyPair;
  } catch (err) {
    console.error('Failed to restore key with password:', err);
    return null;
  }
};

export const ensureUserKeyPair = async (userId: string, token?: string, password?: string): Promise<CryptoKeyPair | null> => {
  if (typeof window === 'undefined') return null;
  try {
    let keyPair = await getKeyFromIDBOrLocalStorage(userId);
    const authToken = token || localStorage.getItem('liquid_token');

    // If key not found locally, try restoring from server backup if password available
    if (!keyPair && authToken && password) {
      try {
        const axios = (await import('axios')).default;
        const backupRes = await axios.get('/api/users/key-backup', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (backupRes.data?.encryptedPrivateKey && backupRes.data?.keyBackupSalt) {
          keyPair = await restoreKeyWithPassword(
            userId,
            password,
            backupRes.data.encryptedPrivateKey,
            backupRes.data.keyBackupSalt
          );
        }
      } catch (e) {
        console.warn('Key restore attempt failed:', e);
      }
    }

    if (!keyPair) {
      keyPair = await generateKeyPair();
      await saveKeyToIDBAndLocalStorage(userId, keyPair);
      const pubKeyBase64 = await exportPublicKey(keyPair.publicKey);
      
      if (authToken) {
        const axios = (await import('axios')).default;
        // Check if server already has a public key for user
        let hasExistingKey = false;
        try {
          const userRes = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (userRes.data?.user?.publicKey) {
            hasExistingKey = true;
          }
        } catch (e) {}

        // Only upload new public key if user did NOT have one previously registered
        if (!hasExistingKey) {
          await axios.put('/api/users/public-key', { publicKey: pubKeyBase64 }, {
            headers: { Authorization: `Bearer ${authToken}` }
          }).catch(err => console.warn('Failed to sync generated public key to server:', err));
        }

        if (password) {
          await backupKeyWithPassword(userId, password, keyPair, authToken);
        }
      }
    } else {
      const authToken = token || localStorage.getItem('liquid_token');
      if (authToken) {
        const pubKeyBase64 = await exportPublicKey(keyPair.publicKey);
        const axios = (await import('axios')).default;
        axios.put('/api/users/public-key', { publicKey: pubKeyBase64 }, {
          headers: { Authorization: `Bearer ${authToken}` }
        }).catch(() => {});

        // If password is known and user has no server backup yet, back it up now
        if (password) {
          try {
            const backupRes = await axios.get('/api/users/key-backup', {
              headers: { Authorization: `Bearer ${authToken}` }
            });
            if (!backupRes.data?.encryptedPrivateKey) {
              await backupKeyWithPassword(userId, password, keyPair, authToken);
            }
          } catch (e) {}
        }
      }
    }
    return keyPair;
  } catch (err) {
    console.error('Error ensuring user key pair:', err);
    return null;
  }
};

export const isBase64Ciphertext = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.length < 24) return false;
  if (/\s/.test(trimmed)) return false;
  if (trimmed.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed);
};

// Zero-Knowledge Local Decrypted Message Cache
export const cacheDecryptedMessage = (userId: string, msgId: string, data: { text?: string; fileUrl?: string }) => {
  if (typeof window === 'undefined' || !userId || !msgId) return;
  try {
    const key = `liquid_msg_cache_${userId}_${msgId}`;
    localStorage.setItem(key, JSON.stringify({
      text: data.text,
      fileUrl: data.fileUrl,
      timestamp: Date.now()
    }));
  } catch (e) {}
};

export const getCachedDecryptedMessage = (userId: string, msgId: string): { text?: string; fileUrl?: string } | null => {
  if (typeof window === 'undefined' || !userId || !msgId) return null;
  try {
    const key = `liquid_msg_cache_${userId}_${msgId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
};



