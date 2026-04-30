/**
 * In-memory cache with TTL for contribution data
 */

import type { ContributionGraph } from './types';

interface CacheEntry {
	data: ContributionGraph;
	expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

export function getCachedContributions(
	username: string
): ContributionGraph | null {
	const entry = cache.get(username);

	if (!entry) {
		return null;
	}

	// Check if entry has expired
	if (Date.now() > entry.expiresAt) {
		cache.delete(username);
		return null;
	}

	return entry.data;
}

export function setCachedContributions(
	username: string,
	data: ContributionGraph
): void {
	cache.set(username, {
		data,
		expiresAt: Date.now() + TTL_MS,
	});
}

export function clearCache(): void {
	cache.clear();
}

export function getCacheStats(): { size: number; entries: string[] } {
	return {
		size: cache.size,
		entries: Array.from(cache.keys()),
	};
}
