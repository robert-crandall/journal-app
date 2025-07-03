import { authStore } from '$lib/stores/auth';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { get } from 'svelte/store';

// List of public routes that don't require authentication
const publicRoutes: string[] = [
	'/', // Home page
	'/login', // Login page
	'/register' // Registration page
	// Add other public routes here if needed
];

/**
 * Checks if a route is public and doesn't require authentication
 * @param path The current path
 * @returns True if the route is public and doesn't require auth
 */
export function isPublicRoute(path: string): boolean {
	// Check if the path exactly matches any of the public routes
	return publicRoutes.some((route) => path === route);
}

/**
 * Checks if a route is protected and requires authentication
 * Using "protected by default" approach - all routes except public ones require auth
 * @param path The current path
 * @returns True if the route requires authentication
 */
export function isProtectedRoute(path: string): boolean {
	// By default, all routes except public ones are protected
	return !isPublicRoute(path);
}

/**
 * Handles navigation to protected routes by checking authentication
 * Uses a "protected by default" approach - all routes except public ones require auth
 * @param path The current path
 * @returns True if navigation should proceed, false if redirected
 */
export function handleProtectedRoute(path: string): boolean {
	// Only run in browser
	if (!browser) return true;

	// If route is public, allow navigation regardless of auth state
	if (isPublicRoute(path)) return true;

	// For all other routes (protected by default)
	// Get authentication state
	const { token, initialized } = get(authStore);

	// If authenticated, allow navigation
	if (token && initialized) return true;

	// If authentication is initialized and there's no token, redirect to login
	if (initialized) {
		goto(`/login?redirectTo=${encodeURIComponent(path)}`);
		return false;
	}

	return true;
}
