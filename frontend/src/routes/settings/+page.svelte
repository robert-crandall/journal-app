<script lang="ts">
	import { theme, availableThemes } from '$lib/stores/theme';
	import type { Theme } from '$lib/stores/theme';
	import { auth } from '$lib/stores/auth';
	import { preferencesApi, userApi } from '$lib/api';
	import { onMount } from 'svelte';
	import AttributeManager from '$lib/components/AttributeManager.svelte';

	let preferences: Record<string, string> = {};
	let loading = false;
	let saveMessage = '';
	let userAttributes: Array<{ id: string; key: string; value: string }> = [];

	onMount(async () => {
		await loadPreferences();
		await loadUserData();
	});

	async function loadPreferences() {
		loading = true;
		try {
			const response = await preferencesApi.getAll();
			preferences = response.preferences || {};
		} catch (error) {
			console.error('Failed to load preferences:', error);
		} finally {
			loading = false;
		}
	}

	async function loadUserData() {
		try {
			const response = await userApi.getMe();
			userAttributes = response.user.attributes || [];
		} catch (error) {
			console.error('Failed to load user data:', error);
		}
	}

	async function savePreference(key: string, value: string) {
		try {
			await preferencesApi.set(key, value);
			preferences[key] = value;
			showSaveMessage('Preference saved');
		} catch (error) {
			console.error('Failed to save preference:', error);
			showSaveMessage('Failed to save preference', true);
		}
	}

	async function selectTheme(selectedTheme: Theme) {
		const isAuthenticated = $auth.user !== null;
		await theme.setTheme(selectedTheme, isAuthenticated);
		await savePreference('theme', selectedTheme);
	}

	async function handleAddUserAttribute(key: string, value: string) {
		try {
			await userApi.addAttribute({ key, value });
			await loadUserData(); // Reload to get updated attributes
		} catch (error) {
			console.error('Failed to add user attribute:', error);
			throw error; // Re-throw to let AttributeManager handle the error
		}
	}

	function showSaveMessage(message: string, isError = false) {
		saveMessage = message;
		setTimeout(() => {
			saveMessage = '';
		}, 3000);
	}
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-base-content mb-2">Settings</h1>
		<p class="text-base-content/70">Customize your experience</p>
	</div>

	{#if saveMessage}
		<div class="alert alert-success mb-6">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
			<span>{saveMessage}</span>
		</div>
	{/if}

	<div class="grid gap-6">
		<!-- Theme Settings -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z"></path>
					</svg>
					Theme
				</h2>
				<p class="text-base-content/70 mb-4">Choose your preferred theme</p>
				
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{#each availableThemes as themeOption}
						<button
							class="theme-preview-card btn btn-ghost h-auto p-4 flex-col gap-2"
							class:btn-active={$theme === themeOption.value}
							data-theme={themeOption.value}
							onclick={() => selectTheme(themeOption.value)}
						>
							<div class="flex gap-1">
								<div class="bg-primary w-3 h-6 rounded"></div>
								<div class="bg-secondary w-3 h-6 rounded"></div>
								<div class="bg-accent w-3 h-6 rounded"></div>
								<div class="bg-neutral w-3 h-6 rounded"></div>
							</div>
							<span class="text-xs font-medium">{themeOption.name}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- User Attributes -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
					</svg>
					Personal Attributes
				</h2>
				<p class="text-base-content/70 mb-4">Define your values, interests, skills, and other personal attributes</p>
				
				<AttributeManager 
					attributes={userAttributes}
					onAddAttribute={handleAddUserAttribute}
					title="My Attributes"
					emptyMessage="Start building your personal profile with values, interests, skills, or any other attributes that define you"
				/>
			</div>
		</div>

		<!-- Future Settings Sections -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM9 17h5l-5 5v-5zM21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2z"></path>
					</svg>
					Notifications
				</h2>
				<p class="text-base-content/70 mb-4">Manage your notification preferences</p>
				
				<div class="text-center py-8">
					<div class="text-base-content/50">
						<svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
						</svg>
						<p class="text-lg">Coming Soon</p>
						<p class="text-sm">Notification settings will be available in a future update</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.theme-preview-card[data-theme] {
		color: oklch(var(--bc));
		background-color: oklch(var(--b1));
		border: 2px solid oklch(var(--b3));
	}
	
	.theme-preview-card[data-theme]:hover {
		background-color: oklch(var(--b2));
		transform: translateY(-2px);
		box-shadow: 0 8px 25px oklch(var(--b3) / 0.3);
	}
	
	.theme-preview-card.btn-active {
		background-color: oklch(var(--p) / 0.1);
		border-color: oklch(var(--p));
		color: oklch(var(--pc));
	}
	
	.theme-preview-card {
		transition: all 0.2s ease;
	}
</style>
