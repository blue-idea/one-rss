type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
};

export type RequestCache<T> = {
  load: (key: string) => Promise<T>;
  prefetch: (key: string) => Promise<void>;
  peek: (key: string) => T | undefined;
  clear: (key?: string) => void;
};

export function createRequestCache<T>(
  fetcher: (key: string) => Promise<T>,
): RequestCache<T> {
  const entries = new Map<string, CacheEntry<T>>();

  const load = async (key: string) => {
    const existing = entries.get(key);
    if (existing?.data !== undefined) {
      return existing.data;
    }
    if (existing?.promise) {
      return existing.promise;
    }

    const promise = fetcher(key)
      .then((data) => {
        entries.set(key, { data });
        return data;
      })
      .catch((error: unknown) => {
        entries.delete(key);
        throw error;
      });

    entries.set(key, { promise });
    return promise;
  };

  const prefetch = async (key: string) => {
    await load(key);
  };

  const peek = (key: string) => entries.get(key)?.data;

  const clear = (key?: string) => {
    if (key) {
      entries.delete(key);
      return;
    }
    entries.clear();
  };

  return {
    load,
    prefetch,
    peek,
    clear,
  };
}
