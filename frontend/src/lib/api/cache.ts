// Task 4.5: Add request caching for performance optimization
export interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number; // Time to live in milliseconds
}

export class ApiCache {
	private cache = new Map<string, CacheEntry<any>>();
	private defaultTTL = 5 * 60 * 1000; // 5 minutes default

	set<T>(key: string, data: T, ttl?: number): void {
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			ttl: ttl || this.defaultTTL
		};
		this.cache.set(key, entry);
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) {
			return null;
		}

		// Check if entry has expired
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data as T;
	}

	has(key: string): boolean {
		return this.get(key) !== null;
	}

	invalidate(key: string): void {
		this.cache.delete(key);
	}

	invalidatePattern(pattern: string): void {
		const regex = new RegExp(pattern);
		for (const key of this.cache.keys()) {
			if (regex.test(key)) {
				this.cache.delete(key);
			}
		}
	}

	clear(): void {
		this.cache.clear();
	}

	// Get cache stats for debugging
	getStats(): { size: number; keys: string[] } {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys())
		};
	}
}

// Global cache instance
export const apiCache = new ApiCache();

// Cache key generators
export class CacheKeys {
	static user(userId?: string): string {
		return userId ? `user:${userId}` : 'user:current';
	}

	static characters(userId?: string): string {
		return userId ? `characters:${userId}` : 'characters:current';
	}

	static character(characterId: string): string {
		return `character:${characterId}`;
	}

	static characterStats(characterId: string): string {
		return `character:${characterId}:stats`;
	}

	static tasks(userId?: string): string {
		return userId ? `tasks:${userId}` : 'tasks:current';
	}

	static quests(userId?: string): string {
		return userId ? `quests:${userId}` : 'quests:current';
	}

	static quest(questId: string): string {
		return `quest:${questId}`;
	}

	static journalConversations(userId?: string): string {
		return userId ? `journal:conversations:${userId}` : 'journal:conversations:current';
	}

	static journalHistory(userId?: string, search?: string): string {
		const base = userId ? `journal:history:${userId}` : 'journal:history:current';
		return search ? `${base}:${search}` : base;
	}

	static familyMembers(userId?: string): string {
		return userId ? `family:${userId}` : 'family:current';
	}

	static goals(userId?: string): string {
		return userId ? `goals:${userId}` : 'goals:current';
	}

	static projects(userId?: string): string {
		return userId ? `projects:${userId}` : 'projects:current';
	}

	static dashboard(userId?: string): string {
		return userId ? `dashboard:${userId}` : 'dashboard:current';
	}
}

// Cache configuration for different endpoint types
export const CacheConfig = {
	// User data - cache for longer since it changes less frequently
	user: { ttl: 15 * 60 * 1000 }, // 15 minutes

	// Characters - cache for medium duration
	characters: { ttl: 10 * 60 * 1000 }, // 10 minutes
	character: { ttl: 10 * 60 * 1000 }, // 10 minutes
	characterStats: { ttl: 5 * 60 * 1000 }, // 5 minutes

	// Tasks - cache for shorter duration since they change more frequently
	tasks: { ttl: 2 * 60 * 1000 }, // 2 minutes

	// Quests - medium cache duration
	quests: { ttl: 5 * 60 * 1000 }, // 5 minutes
	quest: { ttl: 5 * 60 * 1000 }, // 5 minutes

	// Journal - very short cache since it's frequently updated
	journalConversations: { ttl: 1 * 60 * 1000 }, // 1 minute
	journalHistory: { ttl: 2 * 60 * 1000 }, // 2 minutes

	// Family members - longer cache
	familyMembers: { ttl: 10 * 60 * 1000 }, // 10 minutes

	// Goals and projects - medium cache
	goals: { ttl: 5 * 60 * 1000 }, // 5 minutes
	projects: { ttl: 5 * 60 * 1000 }, // 5 minutes

	// Dashboard - short cache since it aggregates multiple data sources
	dashboard: { ttl: 2 * 60 * 1000 }, // 2 minutes

	// No cache for write operations (POST, PUT, DELETE)
	noCache: { ttl: 0 }
};
