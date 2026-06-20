// api/src/utils/cache.ts

interface CacheItem<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheItem<any>>();

/**
 * 인메모리 캐싱 유틸리티
 * @param key 캐시 키 (예: 'weather_37.5_126.9')
 * @param ttlSeconds 캐시 유지 시간 (초)
 * @param fetcher 캐시 미스 시 실제 데이터를 가져올 함수
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key);

  // 캐시 히트 & 유효기간 체크
  if (cached && cached.expiry > now) {
    console.log(`[Cache Hit] ${key}`);
    return cached.data;
  }

  console.log(`[Cache Miss] ${key} - Fetching new data...`);
  try {
    const data = await fetcher();
    memoryCache.set(key, {
      data,
      expiry: now + ttlSeconds * 1000,
    });
    return data;
  } catch (error) {
    // 만약 에러가 났고 기존 만료된 캐시라도 있다면, 차라리 그걸 반환 (Stale-while-revalidate 개념 차용)
    if (cached) {
      console.warn(`[Cache Fallback] Fetch failed for ${key}, returning stale cache.`);
      return cached.data;
    }
    throw error;
  }
}

export function clearCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        memoryCache.delete(key);
      }
    }
  }
}
