<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { auth } from '$lib/stores/auth';
	import { preferencesApi, userApi } from '$lib/api';
	import { onMount } from 'svelte';
	import AttributeManager from '$lib/components/AttributeManager.svelte';
	import * as icons from 'lucide-svelte';

	// Simplified theme options (only dark/light/auto)
	const themeOptions = [
		{ name: 'Light', value: 'light', description: 'Light theme for all times' },
		{ name: 'Dark', value: 'dark', description: 'Dark theme for all times' },
		{ name: 'Auto', value: 'auto', description: 'Follows your system preference' }
	];

	let preferences: Record<string, string> = {};
	let loading = false;
	let saveMessage = '';
	let messageType: 'success' | 'error' = 'success';
	let userAttributes: Array<{ id: string; key: string; value: string }> = [];
	let userData: any = null;
	let activeTab = 'appearance';

	// Form data for user class
	let memberClassName = '';
	let memberClassDescription = '';

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
			userData = response.user;
			userAttributes = response.user.attributes || [];
			memberClassName = response.user.className || '';
			memberClassDescription = response.user.classDescription || '';
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
			showSaveMessage('Failed to save preference', 'error');
		}
	}

	async function selectTheme(selectedTheme: string) {
		const isAuthenticated = $auth.user !== null;
		await theme.setTheme(selectedTheme as any, isAuthenticated);
		await savePreference('theme', selectedTheme);
	}

	async function handleAddUserAttribute(key: string, value: string) {
		try {
			await userApi.addAttribute({ key, value });
			await loadUserData();
			showSaveMessage('Attribute added');
		} catch (error) {
			console.error('Failed to add user attribute:', error);
			throw error;
		}
	}

	async function handleClassUpdate() {
		try {
			await userApi.updateProfile({
				className: memberClassName || undefined,
				classDescription: memberClassDescription || undefined
			});
			userData.className = memberClassName;
			userData.classDescription = memberClassDescription;
			showSaveMessage('Character class updated');
		} catch (error) {
			console.error('Failed to update class information:', error);
			showSaveMessage('Failed to update class information', 'error');
		}
	}

	function showSaveMessage(message: string, type: 'success' | 'error' = 'success') {
		saveMessage = message;
		messageType = type;
		setTimeout(() => {
			saveMessage = '';
		}, 3000);
	}

	function setActiveTab(tab: string) {
		activeTab = tab;
	}
</script>

<svelte:head>
	<title>Settings - LifeQuest</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-6 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="mb-2 text-2xl font-bold text-neutral-900">Settings</h1>
		<p class="text-neutral-600">Customize your LifeQuest experience</p>
	</div>

	{#if saveMessage}
		<div
			class="mb-6 bg-{messageType === 'success' ? 'green' : 'red'}-50 border border-{messageType ===
			'success'
				? 'green'
				: 'red'}-200 rounded-lg p-4"
		>
			<div class="flex items-start space-x-3">
				<svelte:component
					this={messageType === 'success' ? icons.CheckCircle : icons.AlertTriangle}
					size={16}
					class="text-{messageType === 'success' ? 'green' : 'red'}-500 mt-0.5 flex-shrink-0"
				/>
				<div class="flex-1">
					<p class="text-sm font-medium text-{messageType === 'success' ? 'green' : 'red'}-900">
						{messageType === 'success' ? 'Success' : 'Error'}
					</p>
					<p class="text-sm text-{messageType === 'success' ? 'green' : 'red'}-700 mt-1">
						{saveMessage}
					</p>
				</div>
				<button
					on:click={() => (saveMessage = '')}
					class="text-{messageType === 'success' ? 'green' : 'red'}-400 hover:text-{messageType ===
					'success'
						? 'green'
						: 'red'}-600 transition-colors"
				>
					<svelte:component this={icons.X} size={14} />
				</button>
			</div>
		</div>
	{/if}

	<!-- Tabs Navigation -->
	<div class="mb-6 rounded-lg border border-neutral-200 bg-white">
		<div class="border-b border-neutral-200">
			<nav class="flex space-x-8 px-6" role="tablist">
				<button
					class="border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
					'appearance'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'}"
					on:click={() => setActiveTab('appearance')}
					role="tab"
					aria-selected={activeTab === 'appearance'}
				>
					<div class="flex items-center space-x-2">
						<svelte:component this={icons.Palette} size={16} />
						<span>Appearance</span>
					</div>
				</button>
				<button
					class="border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
					'location'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'}"
					on:click={() => setActiveTab('location')}
					role="tab"
					aria-selected={activeTab === 'location'}
				>
					<div class="flex items-center space-x-2">
						<svelte:component this={icons.MapPin} size={16} />
						<span>Location</span>
					</div>
				</button>
				<button
					class="border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab === 'profile'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'}"
					on:click={() => setActiveTab('profile')}
					role="tab"
					aria-selected={activeTab === 'profile'}
				>
					<div class="flex items-center space-x-2">
						<svelte:component this={icons.User} size={16} />
						<span>Profile</span>
					</div>
				</button>
				<button
					class="border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
					'character'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'}"
					on:click={() => setActiveTab('character')}
					role="tab"
					aria-selected={activeTab === 'character'}
				>
					<div class="flex items-center space-x-2">
						<svelte:component this={icons.Shield} size={16} />
						<span>Character</span>
					</div>
				</button>
			</nav>
		</div>

		<!-- Tab Content -->
		<div class="p-6">
			{#if activeTab === 'appearance'}
				<!-- Appearance Settings -->
				<div class="space-y-6">
					<div>
						<h3 class="mb-2 text-lg font-semibold text-neutral-900">Theme</h3>
						<p class="mb-4 text-sm text-neutral-600">Choose how LifeQuest looks and feels</p>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						{#each themeOptions as themeOption}
							<button
								class="relative rounded-lg border-2 p-4 transition-all hover:shadow-sm {$theme ===
								themeOption.value
									? 'border-blue-500 bg-blue-50'
									: 'border-neutral-200 hover:border-neutral-300'}"
								on:click={() => selectTheme(themeOption.value)}
							>
								<div class="mb-3 flex items-center space-x-3">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-lg {themeOption.value ===
										'light'
											? 'bg-yellow-100 text-yellow-600'
											: themeOption.value === 'dark'
												? 'bg-purple-100 text-purple-600'
												: 'bg-blue-100 text-blue-600'}"
									>
										<svelte:component
											this={themeOption.value === 'light'
												? icons.Sun
												: themeOption.value === 'dark'
													? icons.Moon
													: icons.Monitor}
											size={16}
										/>
									</div>
									<div class="text-left">
										<div class="font-medium text-neutral-900">{themeOption.name}</div>
										<div class="text-xs text-neutral-500">{themeOption.description}</div>
									</div>
								</div>

								<!-- Theme Preview -->
								<div class="mb-2 flex space-x-1">
									{#if themeOption.value === 'light'}
										<div class="h-4 w-4 rounded border border-neutral-200 bg-white"></div>
										<div class="h-4 w-4 rounded bg-blue-500"></div>
										<div class="h-4 w-4 rounded bg-neutral-300"></div>
									{:else if themeOption.value === 'dark'}
										<div class="h-4 w-4 rounded bg-neutral-900"></div>
										<div class="h-4 w-4 rounded bg-blue-400"></div>
										<div class="h-4 w-4 rounded bg-neutral-700"></div>
									{:else}
										<div class="h-4 w-4 rounded bg-gradient-to-r from-white to-neutral-900"></div>
										<div class="h-4 w-4 rounded bg-blue-500"></div>
										<div class="h-4 w-4 rounded bg-neutral-400"></div>
									{/if}
								</div>

								{#if $theme === themeOption.value}
									<div class="absolute top-2 right-2">
										<svelte:component this={icons.Check} size={16} class="text-blue-600" />
									</div>
								{/if}
							</button>
						{/each}
					</div>

					<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
						<div class="flex items-start space-x-3">
							<svelte:component
								this={icons.Info}
								size={16}
								class="mt-0.5 flex-shrink-0 text-blue-600"
							/>
							<div>
								<p class="text-sm font-medium text-blue-900">About themes</p>
								<p class="mt-1 text-sm text-blue-700">
									Auto theme will switch between light and dark modes based on your system
									preference. You can always override this setting manually.
								</p>
							</div>
						</div>
					</div>
				</div>
			{:else if activeTab === 'location'}
				<!-- Location Settings -->
				<div class="space-y-6">
					<div>
						<h3 class="mb-2 text-lg font-semibold text-neutral-900">Location Context</h3>
						<p class="mb-4 text-sm text-neutral-600">
							Help us generate more relevant tasks based on your location and local weather
						</p>
					</div>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<label
								for="locationDescription"
								class="mb-2 block text-sm font-medium text-neutral-900"
							>
								Location Description
							</label>
							<input
								id="locationDescription"
								type="text"
								placeholder="e.g., Seattle area, NYC, San Francisco"
								class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								bind:value={preferences.locationDescription}
								on:blur={() =>
									savePreference('locationDescription', preferences.locationDescription || '')}
							/>
							<p class="mt-1 text-xs text-neutral-500">
								A general description of your area for context
							</p>
						</div>

						<div>
							<label for="zipCode" class="mb-2 block text-sm font-medium text-neutral-900">
								Zip Code
							</label>
							<input
								id="zipCode"
								type="text"
								placeholder="e.g., 98101"
								class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								bind:value={preferences.zipCode}
								on:blur={() => savePreference('zipCode', preferences.zipCode || '')}
							/>
							<p class="mt-1 text-xs text-neutral-500">
								For weather-based task suggestions (optional)
							</p>
						</div>
					</div>

					<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
						<div class="flex items-start space-x-3">
							<svelte:component
								this={icons.Info}
								size={16}
								class="mt-0.5 flex-shrink-0 text-blue-600"
							/>
							<div>
								<p class="text-sm font-medium text-blue-900">How we use your location</p>
								<p class="mt-1 text-sm text-blue-700">
									Your location helps us suggest outdoor activities on nice days, indoor activities
									during bad weather, and consider weekend vs. weekday schedules. Your data is kept
									private and secure.
								</p>
							</div>
						</div>
					</div>
				</div>
			{:else if activeTab === 'profile'}
				<!-- Profile Settings -->
				<div class="space-y-6">
					<div>
						<h3 class="mb-2 text-lg font-semibold text-neutral-900">Personal Attributes</h3>
						<p class="mb-4 text-sm text-neutral-600">
							Define your values, interests, skills, and other personal attributes
						</p>
					</div>

					{#if userData}
						<AttributeManager
							attributes={userAttributes}
							onAddAttribute={handleAddUserAttribute}
							title="My Attributes"
							emptyMessage="Start building your personal profile with values, interests, skills, or any other attributes that define you"
						/>
					{:else}
						<div class="flex justify-center py-8">
							<div class="flex items-center space-x-3 text-neutral-500">
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600"
								></div>
								<span class="text-sm">Loading profile...</span>
							</div>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'character'}
				<!-- Character Settings -->
				<div class="space-y-6">
					<div>
						<h3 class="mb-2 text-lg font-semibold text-neutral-900">Character Class</h3>
						<p class="mb-4 text-sm text-neutral-600">
							Define your RPG-style character class and backstory
						</p>
					</div>

					{#if userData}
						<div class="space-y-6">
							<!-- Class Selection -->
							<div>
								<label for="characterClass" class="mb-2 block text-sm font-medium text-neutral-900">
									Character Class
								</label>
								<select
									id="characterClass"
									bind:value={memberClassName}
									class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								>
									<option value="">No class selected</option>
									<optgroup label="Warriors & Protectors">
										<option value="Paladin">Paladin - Noble defender of justice</option>
										<option value="Guardian">Guardian - Protective and steadfast</option>
										<option value="Knight">Knight - Honorable and courageous</option>
										<option value="Berserker">Berserker - Fierce and passionate</option>
									</optgroup>
									<optgroup label="Scholars & Wise">
										<option value="Scholar">Scholar - Loves learning and knowledge</option>
										<option value="Sage">Sage - Wise and thoughtful</option>
										<option value="Wizard">Wizard - Creative and analytical</option>
										<option value="Librarian">Librarian - Organized and detail-oriented</option>
									</optgroup>
									<optgroup label="Adventurers & Free Spirits">
										<option value="Explorer">Explorer - Curious and adventurous</option>
										<option value="Ranger">Ranger - Independent and nature-loving</option>
										<option value="Bard">Bard - Creative and social</option>
										<option value="Rogue">Rogue - Clever and resourceful</option>
									</optgroup>
									<optgroup label="Creators & Builders">
										<option value="Artisan">Artisan - Skilled craftsperson</option>
										<option value="Engineer">Engineer - Problem solver and builder</option>
										<option value="Chef">Chef - Nurturing through food</option>
										<option value="Architect">Architect - Visionary planner</option>
									</optgroup>
									<optgroup label="Leaders & Supporters">
										<option value="Leader">Leader - Natural organizer</option>
										<option value="Healer">Healer - Caring and supportive</option>
										<option value="Diplomat">Diplomat - Peacemaker and communicator</option>
										<option value="Mentor">Mentor - Guides and teaches others</option>
									</optgroup>
								</select>
							</div>

							<!-- Class Description -->
							{#if memberClassName}
								<div>
									<label
										for="classDescription"
										class="mb-2 block text-sm font-medium text-neutral-900"
									>
										Character Backstory
									</label>
									<textarea
										id="classDescription"
										bind:value={memberClassDescription}
										placeholder="Describe your character's background, personality, approach to life, or any other details that make them unique..."
										rows="4"
										class="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
									></textarea>
									<p class="mt-1 text-xs text-neutral-500">
										Tell your character's story - their motivations, quirks, values, or what drives
										them
									</p>
								</div>

								{#if memberClassDescription}
									<div class="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
										<div class="flex items-start space-x-3">
											<div
												class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100"
											>
												<svelte:component this={icons.Shield} size={16} class="text-purple-600" />
											</div>
											<div class="flex-1">
												<h5 class="mb-1 text-sm font-medium text-neutral-900">{memberClassName}</h5>
												<p class="text-sm text-neutral-700 italic">"{memberClassDescription}"</p>
											</div>
										</div>
									</div>
								{/if}
							{/if}

							<!-- Save Button -->
							<div class="flex justify-end border-t border-neutral-200 pt-4">
								<button
									on:click={handleClassUpdate}
									class="rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
								>
									Save Character
								</button>
							</div>
						</div>
					{:else}
						<div class="flex justify-center py-8">
							<div class="flex items-center space-x-3 text-neutral-500">
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600"
								></div>
								<span class="text-sm">Loading character...</span>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
