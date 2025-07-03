import { get } from 'svelte/store';
import { authStore } from '../../lib/stores/auth';
import { goto } from '$app/navigation';

/** @type {import('./$types').PageLoad} */
export function load() {
	// Check authentication status
	const { token, initialized } = get(authStore);

	// If authenticated, continue to page
	if (token && initialized) {
		return {};
	}

	// If not authenticated, redirect to login
	if (initialized) {
		goto('/login');
	}

	return {};
}
