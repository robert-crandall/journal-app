// Task 4.4: Implement API response validation and error utilities - Middleware
import type { ApiResponse, ApiError } from './client';

// Error handling interceptor for API responses
export class ApiResponseHandler {
	static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
		try {
			// Check if response is JSON
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				throw new Error(`Invalid response type: ${contentType}`);
			}

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error || data.message || `HTTP ${response.status}: ${response.statusText}`
				);
			}

			// Validate response structure
			if (typeof data !== 'object' || data === null) {
				throw new Error('Invalid response format');
			}

			return data as ApiResponse<T>;
		} catch (error) {
			// Re-throw as ApiError with additional context
			throw {
				name: 'ApiError',
				message: error instanceof Error ? error.message : 'Unknown error',
				status: response.status,
				response: response
			};
		}
	}

	// Generic error handler for API operations
	static handleError(error: any): never {
		if (error.name === 'ApiError') {
			throw error;
		}

		// Handle network errors
		if (error instanceof TypeError && error.message.includes('fetch')) {
			throw {
				name: 'ApiError',
				message: 'Network error: Unable to connect to server',
				status: 0
			};
		}

		// Handle other errors
		throw {
			name: 'ApiError',
			message: error.message || 'An unexpected error occurred',
			status: error.status || 500
		};
	}
}

// Request interceptor for adding common headers and authentication
export class ApiRequestHandler {
	static getDefaultHeaders(): Record<string, string> {
		return {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		};
	}

	static addAuthHeader(headers: Record<string, string>, token?: string): Record<string, string> {
		if (token) {
			return {
				...headers,
				Authorization: `Bearer ${token}`
			};
		}
		return headers;
	}

	static prepareRequest(
		endpoint: string,
		options: RequestInit = {},
		token?: string
	): { url: string; options: RequestInit } {
		const baseHeaders = ApiRequestHandler.getDefaultHeaders();
		const authHeaders = ApiRequestHandler.addAuthHeader(baseHeaders, token);

		return {
			url: endpoint,
			options: {
				...options,
				headers: {
					...authHeaders,
					...(options.headers || {})
				}
			}
		};
	}
}

// Retry mechanism for failed requests
export class ApiRetryHandler {
	static async retryRequest<T>(
		requestFn: () => Promise<ApiResponse<T>>,
		maxRetries: number = 3,
		baseDelay: number = 1000
	): Promise<ApiResponse<T>> {
		let lastError: any;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await requestFn();
			} catch (error: any) {
				lastError = error;

				// Don't retry client errors (4xx) except 429 (rate limit)
				if (error.status >= 400 && error.status < 500 && error.status !== 429) {
					throw error;
				}

				// Don't retry on the last attempt
				if (attempt === maxRetries) {
					break;
				}

				// Calculate delay with exponential backoff
				const delay = baseDelay * Math.pow(2, attempt);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		throw lastError;
	}
}

// Loading state manager for components
export class LoadingStateManager {
	private loadingStates = new Map<string, boolean>();
	private callbacks = new Map<string, Set<(isLoading: boolean) => void>>();

	setLoading(key: string, isLoading: boolean): void {
		this.loadingStates.set(key, isLoading);
		const callbacks = this.callbacks.get(key);
		if (callbacks) {
			callbacks.forEach((callback) => callback(isLoading));
		}
	}

	isLoading(key: string): boolean {
		return this.loadingStates.get(key) || false;
	}

	subscribe(key: string, callback: (isLoading: boolean) => void): () => void {
		if (!this.callbacks.has(key)) {
			this.callbacks.set(key, new Set());
		}
		this.callbacks.get(key)!.add(callback);

		// Return unsubscribe function
		return () => {
			const callbacks = this.callbacks.get(key);
			if (callbacks) {
				callbacks.delete(callback);
				if (callbacks.size === 0) {
					this.callbacks.delete(key);
				}
			}
		};
	}

	clear(): void {
		this.loadingStates.clear();
		this.callbacks.clear();
	}
}

// Global loading state manager instance
export const loadingManager = new LoadingStateManager();
