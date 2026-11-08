/**
 * Global Polyfills
 * Required for pdfjs-dist 6.x and modern web proposals
 */

export function ensurePromiseTry(): void {
  const pTry = function <T, A extends unknown[]>(
    fn: (...args: A) => T | PromiseLike<T>,
    ...args: A
  ): Promise<T> {
    return new Promise((resolve) => {
      resolve(fn(...args));
    });
  };

  if (typeof Promise !== 'undefined' && typeof (Promise as any).try !== 'function') {
    (Promise as any).try = pTry;
  }
  if (typeof globalThis !== 'undefined' && globalThis.Promise && typeof (globalThis.Promise as any).try !== 'function') {
    (globalThis.Promise as any).try = pTry;
  }
  if (typeof window !== 'undefined' && (window as any).Promise && typeof (window as any).Promise.try !== 'function') {
    (window as any).Promise.try = pTry;
  }
}

// Run immediately upon import
ensurePromiseTry();
