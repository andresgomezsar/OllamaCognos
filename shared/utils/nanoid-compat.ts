/**
 * This is a compatibility layer for nanoid to work with both ESM and CommonJS modules
 * It handles the module format differences to prevent TypeScript compilation errors
 */

// Import nanoid using dynamic import to avoid ESM vs CommonJS issues
let nanoidFunc: (size?: number) => string;
let customAlphabetFunc: (alphabet: string, size: number) => () => string;

// Try to load nanoid in a way that works with both ESM and CommonJS
try {
  // For ESM
  const nanoid = require('nanoid');
  nanoidFunc = (size?: number) => {
    if (size !== undefined) {
      return nanoid.customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', size)();
    }
    return nanoid.nanoid();
  };
  customAlphabetFunc = nanoid.customAlphabet;
} catch (err) {
  // Fallback implementation if module loading fails
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  nanoidFunc = (size: number = 21) => {
    let id = '';
    for (let i = 0; i < size; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
  };
  
  customAlphabetFunc = (chars: string, size: number) => {
    return () => {
      let id = '';
      for (let i = 0; i < size; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
      }
      return id;
    };
  };
}

/**
 * Generate a nanoid string
 * @param size Optional length of the ID (default: 21)
 * @returns A random ID string
 */
export function nanoid(size?: number): string {
  return nanoidFunc(size);
}

/**
 * Create a custom nanoid generator with specified alphabet and size
 * @param alphabet String with custom alphabet
 * @param size Length of the ID
 * @returns Function that generates random IDs
 */
export function customAlphabet(alphabet: string, size: number): () => string {
  return customAlphabetFunc(alphabet, size);
}
