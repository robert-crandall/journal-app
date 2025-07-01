// Task 4.1: Set up Hono client with proper TypeScript configuration
// Task 4.2: Import backend types directly from backend/src/db/schema.ts
import { hc } from 'hono/client';
import { TokenManager } from '../utils/auth';

// Import backend types
import type { AppType } from '../../../../backend/src/index';
import type {
	users,
	characters,
	characterStats,
	tasks,
	taskCompletions,
	quests,
	experiments,
	journalConversations,
	journalEntries,
	familyMembers,
	familyMemberInteractions,
	dailyFocuses,
	goals,
	projects
} from '../../../../backend/src/db/schema';

// Import middleware and caching
import {
	ApiResponseHandler,
	ApiRequestHandler,
	ApiRetryHandler,
	loadingManager
} from './middleware';
import { apiCache, CacheKeys, CacheConfig, type CacheEntry } from './cache';

// Task 4.4: Implement API response validation and error utilities
export class ApiError extends Error {
	constructor(
		message: string,
		public status?: number,
		public code?: string,
		public details?: any
	) {
		super(message);
		this.name = 'ApiError';
	}
}

// Type-safe API response interfaces using backend types
export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface AuthResponse {
	user: typeof users.$inferSelect;
	token: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
}

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// API client configuration
const API_BASE_URL = isBrowser
	? (import.meta.env ? import.meta.env.VITE_API_URL : undefined) || 'http://localhost:3000'
	: 'http://localhost:3000';

// Task 4.6: Add request/response interceptors for JWT token handling
export class TypeSafeApiClient {
	private client: ReturnType<typeof hc<AppType>>;
	private baseUrl: string;

	constructor() {
		this.baseUrl = API_BASE_URL;
		this.client = hc<AppType>(this.baseUrl);
	}

	// Task 4.6: JWT token handling
	private getAuthHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		if (isBrowser) {
			const token = TokenManager.getValidToken();
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
		}

		return headers;
	}

	// Task 4.4: API response validation and error utilities with caching support
	private async handleResponse<T>(
		response: Response,
		cacheKey?: string,
		cacheTTL?: number
	): Promise<ApiResponse<T>> {
		try {
			const data = await response.json();

			if (!response.ok) {
				throw new ApiError(
					data.error || data.message || `HTTP ${response.status}`,
					response.status,
					data.code,
					data
				);
			}

			// Validate response structure
			if (typeof data !== 'object' || data === null) {
				throw new ApiError('Invalid response format', response.status);
			}

			// Cache successful responses if cache key is provided
			if (cacheKey && data.success && data.data) {
				apiCache.set(cacheKey, data, cacheTTL);
			}

			return data as ApiResponse<T>;
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}

			throw new ApiError(error instanceof Error ? error.message : 'Unknown error', response.status);
		}
	}

	// Generic request method with caching, retry, and loading states
	private async makeRequest<T>(
		endpoint: string,
		options: RequestInit = {},
		cacheKey?: string,
		cacheTTL?: number,
		loadingKey?: string
	): Promise<ApiResponse<T>> {
		// Check cache first for GET requests
		if (cacheKey && (!options.method || options.method === 'GET')) {
			const cached = apiCache.get<ApiResponse<T>>(cacheKey);
			if (cached) {
				return cached;
			}
		}

		// Set loading state
		if (loadingKey) {
			loadingManager.setLoading(loadingKey, true);
		}

		try {
			const { url, options: requestOptions } = ApiRequestHandler.prepareRequest(
				`${this.baseUrl}${endpoint}`,
				options,
				isBrowser ? TokenManager.getValidToken() || undefined : undefined
			);

			// Use retry mechanism for the request
			const result = await ApiRetryHandler.retryRequest(async () => {
				const response = await fetch(url, requestOptions);
				return this.handleResponse<T>(response, cacheKey, cacheTTL);
			});

			// Invalidate related cache entries for write operations
			if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
				this.invalidateRelatedCache(endpoint);
			}

			return result;
		} finally {
			// Clear loading state
			if (loadingKey) {
				loadingManager.setLoading(loadingKey, false);
			}
		}
	}

	// Task 4.5: Cache invalidation strategy
	private invalidateRelatedCache(endpoint: string): void {
		if (endpoint.includes('/tasks')) {
			apiCache.invalidatePattern('tasks:.*');
			apiCache.invalidate(CacheKeys.dashboard());
		} else if (endpoint.includes('/characters')) {
			apiCache.invalidatePattern('character.*');
			apiCache.invalidate(CacheKeys.dashboard());
		} else if (endpoint.includes('/journal')) {
			apiCache.invalidatePattern('journal:.*');
		} else if (endpoint.includes('/quests')) {
			apiCache.invalidatePattern('quest.*');
			apiCache.invalidate(CacheKeys.dashboard());
		} else if (endpoint.includes('/family')) {
			apiCache.invalidatePattern('family:.*');
		} else if (endpoint.includes('/goals')) {
			apiCache.invalidatePattern('goals:.*');
		} else if (endpoint.includes('/projects')) {
			apiCache.invalidatePattern('projects:.*');
		}
	}

	// Task 4.5: Create authentication API methods (no caching for auth operations)
	async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
		return this.makeRequest<AuthResponse>(
			'/api/auth/register',
			{
				method: 'POST',
				body: JSON.stringify(data)
			},
			undefined,
			undefined,
			'auth:register'
		);
	}

	async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
		return this.makeRequest<AuthResponse>(
			'/api/auth/login',
			{
				method: 'POST',
				body: JSON.stringify(data)
			},
			undefined,
			undefined,
			'auth:login'
		);
	}

	async logout(): Promise<ApiResponse<void>> {
		// Clear all cache on logout
		apiCache.clear();
		return this.makeRequest<void>(
			'/api/auth/logout',
			{
				method: 'POST'
			},
			undefined,
			undefined,
			'auth:logout'
		);
	}

	async getCurrentUser(): Promise<ApiResponse<typeof users.$inferSelect>> {
		return this.makeRequest<typeof users.$inferSelect>(
			'/api/auth/me',
			{},
			CacheKeys.user(),
			CacheConfig.user.ttl,
			'auth:getCurrentUser'
		);
	}

	// Dashboard API methods with caching
	async getDashboard(): Promise<ApiResponse<any>> {
		return this.makeRequest(
			'/api/dashboard',
			{},
			CacheKeys.dashboard(),
			CacheConfig.dashboard.ttl,
			'dashboard:get'
		);
	}

	// Character API methods with caching
	async getCharacters(): Promise<ApiResponse<(typeof characters.$inferSelect)[]>> {
		return this.makeRequest<(typeof characters.$inferSelect)[]>(
			'/api/characters',
			{},
			CacheKeys.characters(),
			CacheConfig.characters.ttl,
			'characters:getAll'
		);
	}

	async createCharacter(data: {
		name: string;
		class: string;
		backstory?: string;
	}): Promise<ApiResponse<typeof characters.$inferSelect>> {
		return this.makeRequest<typeof characters.$inferSelect>(
			'/api/characters',
			{
				method: 'POST',
				body: JSON.stringify(data)
			},
			undefined,
			undefined,
			'characters:create'
		);
	}

	async getCharacterStats(
		characterId: string
	): Promise<ApiResponse<(typeof characterStats.$inferSelect)[]>> {
		return this.makeRequest<(typeof characterStats.$inferSelect)[]>(
			`/api/characters/${characterId}/stats`,
			{},
			CacheKeys.characterStats(characterId),
			CacheConfig.characterStats.ttl,
			`characters:getStats:${characterId}`
		);
	}

	// Task API methods with short caching
	async getTasks(): Promise<ApiResponse<(typeof tasks.$inferSelect)[]>> {
		return this.makeRequest<(typeof tasks.$inferSelect)[]>(
			'/api/tasks',
			{},
			CacheKeys.tasks(),
			CacheConfig.tasks.ttl,
			'tasks:getAll'
		);
	}

	async completeTask(taskId: string, feedback?: string): Promise<ApiResponse<any>> {
		return this.makeRequest(
			`/api/tasks/${taskId}/complete`,
			{
				method: 'POST',
				body: JSON.stringify({ feedback })
			},
			undefined,
			undefined,
			`tasks:complete:${taskId}`
		);
	}

	// Journal API methods with minimal caching
	async getJournalConversations(): Promise<
		ApiResponse<(typeof journalConversations.$inferSelect)[]>
	> {
		return this.makeRequest<(typeof journalConversations.$inferSelect)[]>(
			'/api/journal/conversations',
			{},
			CacheKeys.journalConversations(),
			CacheConfig.journalConversations.ttl,
			'journal:getConversations'
		);
	}

	async startJournalConversation(): Promise<ApiResponse<typeof journalConversations.$inferSelect>> {
		return this.makeRequest<typeof journalConversations.$inferSelect>(
			'/api/journal/quick-start',
			{
				method: 'POST'
			},
			undefined,
			undefined,
			'journal:startConversation'
		);
	}

	async addJournalMessage(
		conversationId: string,
		content: string
	): Promise<ApiResponse<typeof journalEntries.$inferSelect>> {
		return this.makeRequest<typeof journalEntries.$inferSelect>(
			`/api/journal/conversations/${conversationId}/messages`,
			{
				method: 'POST',
				body: JSON.stringify({ content })
			},
			undefined,
			undefined,
			`journal:addMessage:${conversationId}`
		);
	}

	async getJournalHistory(search?: string): Promise<ApiResponse<any[]>> {
		const query = search ? `?search=${encodeURIComponent(search)}` : '';
		return this.makeRequest(
			`/api/journal/history${query}`,
			{},
			CacheKeys.journalHistory(undefined, search),
			CacheConfig.journalHistory.ttl,
			'journal:getHistory'
		);
	}

	async endJournalConversation(conversationId: string): Promise<ApiResponse<any>> {
		return this.makeRequest(
			`/api/journal/conversations/${conversationId}/end`,
			{
				method: 'PUT'
			},
			undefined,
			undefined,
			`journal:endConversation:${conversationId}`
		);
	}

	// Quest API methods with caching
	async getQuests(): Promise<ApiResponse<(typeof quests.$inferSelect)[]>> {
		return this.makeRequest<(typeof quests.$inferSelect)[]>(
			'/api/quests',
			{},
			CacheKeys.quests(),
			CacheConfig.quests.ttl,
			'quests:getAll'
		);
	}

	async createQuest(data: {
		title: string;
		description?: string;
		goalDescription?: string;
		endDate?: string;
	}): Promise<ApiResponse<typeof quests.$inferSelect>> {
		return this.makeRequest<typeof quests.$inferSelect>(
			'/api/quests',
			{
				method: 'POST',
				body: JSON.stringify(data)
			},
			undefined,
			undefined,
			'quests:create'
		);
	}

	async getQuest(questId: string): Promise<ApiResponse<typeof quests.$inferSelect>> {
		return this.makeRequest<typeof quests.$inferSelect>(
			`/api/quests/${questId}`,
			{},
			CacheKeys.quest(questId),
			CacheConfig.quest.ttl,
			`quests:get:${questId}`
		);
	}

	async updateQuest(
		questId: string,
		data: Partial<{
			title: string;
			description: string;
			goalDescription: string;
			status: string;
			endDate: string;
		}>
	): Promise<ApiResponse<typeof quests.$inferSelect>> {
		return this.makeRequest<typeof quests.$inferSelect>(
			`/api/quests/${questId}`,
			{
				method: 'PUT',
				body: JSON.stringify(data)
			},
			undefined,
			undefined,
			`quests:update:${questId}`
		);
	}

	// Family Members API methods with caching
	async getFamilyMembers(): Promise<ApiResponse<(typeof familyMembers.$inferSelect)[]>> {
		return this.makeRequest<(typeof familyMembers.$inferSelect)[]>(
			'/api/family-members',
			{},
			CacheKeys.familyMembers(),
			CacheConfig.familyMembers.ttl,
			'family:getAll'
		);
	}

	async createFamilyMember(data: {
		name: string;
		age?: number;
		interests?: string[];
		interactionFrequency?: string;
	}): Promise<ApiResponse<typeof familyMembers.$inferSelect>> {
		return this.makeRequest<typeof familyMembers.$inferSelect>(
			'/api/family-members',
			{
				method: 'POST',
				body: JSON.stringify(data)
			},
			undefined,
			undefined,
			'family:create'
		);
	}

	async updateFamilyMember(
		memberId: string,
		data: Partial<{
			name: string;
			age: number;
			interests: string[];
			interactionFrequency: string;
		}>
	): Promise<ApiResponse<typeof familyMembers.$inferSelect>> {
		return this.makeRequest<typeof familyMembers.$inferSelect>(
			`/api/family-members/${memberId}`,
			{
				method: 'PUT',
				body: JSON.stringify(data)
			},
			undefined,
			undefined,
			`family:update:${memberId}`
		);
	}

	// Goals API methods with caching
	async getGoals(): Promise<ApiResponse<(typeof goals.$inferSelect)[]>> {
		return this.makeRequest<(typeof goals.$inferSelect)[]>(
			'/api/goals',
			{},
			CacheKeys.goals(),
			CacheConfig.goals.ttl,
			'goals:getAll'
		);
	}

	async createGoal(data: {
		title: string;
		description?: string;
		targetDate?: string;
		priority?: string;
		relatedStats?: string[];
	}): Promise<ApiResponse<typeof goals.$inferSelect>> {
		return this.makeRequest<typeof goals.$inferSelect>(
			'/api/goals',
			{
				method: 'POST',
				body: JSON.stringify(data)
			},
			undefined,
			undefined,
			'goals:create'
		);
	}

	// Projects API methods with caching
	async getProjects(): Promise<ApiResponse<(typeof projects.$inferSelect)[]>> {
		return this.makeRequest<(typeof projects.$inferSelect)[]>(
			'/api/projects',
			{},
			CacheKeys.projects(),
			CacheConfig.projects.ttl,
			'projects:getAll'
		);
	}

	async createProject(data: {
		title: string;
		description?: string;
		dueDate?: string;
	}): Promise<ApiResponse<typeof projects.$inferSelect>> {
		return this.makeRequest<typeof projects.$inferSelect>(
			'/api/projects',
			{
				method: 'POST',
				body: JSON.stringify(data)
			},
			undefined,
			undefined,
			'projects:create'
		);
	}

	// Health check endpoint (no caching)
	async healthCheck(): Promise<
		ApiResponse<{ message: string; status: string; timestamp: string }>
	> {
		return this.makeRequest('/api/health', {}, undefined, undefined, 'health:check');
	}

	// Cache management utilities
	getCacheStats(): { size: number; keys: string[] } {
		return apiCache.getStats();
	}

	clearCache(): void {
		apiCache.clear();
	}

	invalidateCache(pattern: string): void {
		apiCache.invalidatePattern(pattern);
	}

	// Loading state utilities
	isLoading(key: string): boolean {
		return loadingManager.isLoading(key);
	}

	subscribeToLoading(key: string, callback: (isLoading: boolean) => void): () => void {
		return loadingManager.subscribe(key, callback);
	}
}

// Task 4.3: Create singleton instance
export const api = new TypeSafeApiClient();

// Legacy export for backward compatibility
export const apiClient = api;
