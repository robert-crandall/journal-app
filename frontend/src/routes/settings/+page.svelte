<script lang="ts">
	import { theme, availableThemes } from '$lib/stores/theme';
	import { auth } from '$lib/stores/auth';
	import { preferencesApi, userApi } from '$lib/api';
	import { onMount } from 'svelte';
	import AttributeManager from '$lib/components/AttributeManager.svelte';
	import * as icons from 'lucide-svelte';

	// Map themes to descriptions and icons
	const themeDescriptions: Record<string, { description: string; icon: any }> = {
		auto: { description: 'Follows your system preference', icon: icons.Monitor },
		light: { description: 'Light theme for all times', icon: icons.Sun },
		dark: { description: 'Dark theme for all times', icon: icons.Moon },
		cupcake: { description: 'Sweet and colorful', icon: icons.Heart },
		bumblebee: { description: 'Bright and energetic', icon: icons.Zap },
		emerald: { description: 'Fresh and natural', icon: icons.Leaf },
		corporate: { description: 'Professional and clean', icon: icons.Building },
		synthwave: { description: 'Retro futuristic', icon: icons.Gamepad2 },
		retro: { description: 'Vintage inspired', icon: icons.Radio },
		cyberpunk: { description: 'Neon and futuristic', icon: icons.Cpu },
		valentine: { description: 'Romantic and warm', icon: icons.Heart },
		halloween: { description: 'Spooky and dark', icon: icons.Ghost },
		garden: { description: 'Natural and earthy', icon: icons.TreePine },
		forest: { description: 'Deep and mysterious', icon: icons.Trees },
		aqua: { description: 'Cool and refreshing', icon: icons.Waves },
		lofi: { description: 'Calm and minimal', icon: icons.Music },
		pastel: { description: 'Soft and gentle', icon: icons.Palette },
		fantasy: { description: 'Magical and dreamy', icon: icons.Sparkles },
		wireframe: { description: 'Minimal and structural', icon: icons.Square },
		black: { description: 'Pure and stark', icon: icons.Circle },
		luxury: { description: 'Rich and elegant', icon: icons.Crown },
		dracula: { description: 'Dark and mysterious', icon: icons.Moon },
		cmyk: { description: 'Print inspired', icon: icons.Printer },
		autumn: { description: 'Warm and cozy', icon: icons.Leaf },
		business: { description: 'Professional and modern', icon: icons.Briefcase },
		acid: { description: 'Bold and vibrant', icon: icons.Zap },
		lemonade: { description: 'Fresh and citrusy', icon: icons.Sun },
		night: { description: 'Deep and calming', icon: icons.Moon },
		coffee: { description: 'Warm and rich', icon: icons.Coffee },
		winter: { description: 'Cool and crisp', icon: icons.Snowflake },
		dim: { description: 'Soft and muted', icon: icons.Minus },
		nord: { description: 'Arctic inspired', icon: icons.Mountain },
		sunset: { description: 'Warm and golden', icon: icons.Sunset }
	};

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
	let rpgFlavorEnabled = false;

	onMount(async () => {
		await loadPreferences();
		await loadUserData();
	});

	async function loadPreferences() {
		loading = true;
		try {
			const response = await preferencesApi.getAll();
			preferences = response.preferences || {};
			rpgFlavorEnabled = preferences.rpgFlavorEnabled.toString() === 'true';
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

	async function handleRpgFlavorToggle() {
		try {
			await preferencesApi.set('rpgFlavorEnabled', rpgFlavorEnabled.toString());
			preferences.rpgFlavorEnabled = rpgFlavorEnabled.toString();
			showSaveMessage('RPG flavor setting updated');
		} catch (error) {
			console.error('Failed to update RPG flavor setting:', error);
			showSaveMessage('Failed to update RPG flavor setting', 'error');
			// Revert the checkbox state on error
			rpgFlavorEnabled = !rpgFlavorEnabled;
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
		<h1 class="text-base-content mb-2 text-2xl font-bold">Settings</h1>
		<p class="text-base-content/70">Customize your LifeQuest experience</p>
	</div>

	{#if saveMessage}
		<div
			class="alert mb-6 rounded-lg p-4 {messageType === 'success'
				? 'alert-success'
				: 'alert-error'}"
		>
			<div class="flex items-start space-x-3">
				<svelte:component
					this={messageType === 'success' ? icons.CheckCircle : icons.AlertTriangle}
					size={16}
					class="mt-0.5 flex-shrink-0"
				/>
				<div class="flex-1">
					<p class="text-sm font-medium">
						{messageType === 'success' ? 'Success' : 'Error'}
					</p>
					<p class="mt-1 text-sm">
						{saveMessage}
					</p>
				</div>
				<button onclick={() => (saveMessage = '')} class="transition-opacity hover:opacity-70">
					<svelte:component this={icons.X} size={14} />
				</button>
			</div>
		</div>
	{/if}

	<!-- Tabs Navigation -->
	<div class="border-base-300 bg-base-100 mb-6 rounded-lg border">
		<div class="border-base-300 border-b">
			<nav class="flex space-x-8 px-6">
				<button
					class="border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
					'appearance'
						? 'border-primary text-primary'
						: 'text-base-content/50 hover:border-base-300 hover:text-base-content/70 border-transparent'}"
					onclick={() => setActiveTab('appearance')}
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
						? 'border-primary text-primary'
						: 'text-base-content/50 hover:border-base-300 hover:text-base-content/70 border-transparent'}"
					onclick={() => setActiveTab('location')}
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
						? 'border-primary text-primary'
						: 'text-base-content/50 hover:border-base-300 hover:text-base-content/70 border-transparent'}"
					onclick={() => setActiveTab('profile')}
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
						? 'border-primary text-primary'
						: 'text-base-content/50 hover:border-base-300 hover:text-base-content/70 border-transparent'}"
					onclick={() => setActiveTab('character')}
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
						<h3 class="text-base-content mb-2 text-lg font-semibold">Theme</h3>
						<p class="text-base-content/70 mb-4 text-sm">Choose how LifeQuest looks and feels</p>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{#each availableThemes as themeOption}
							<button
								class="relative rounded-lg border-2 p-4 transition-all hover:shadow-sm {$theme ===
								themeOption.value
									? 'border-primary bg-primary/10'
									: 'border-base-300 hover:border-base-content/20'}"
								onclick={() => selectTheme(themeOption.value)}
							>
								<div class="mb-3 flex items-center space-x-3">
									<div
										class="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-lg"
									>
										{#if themeDescriptions[themeOption.value]?.icon}
											{@const ThemeIcon = themeDescriptions[themeOption.value].icon}
											<ThemeIcon size={16} />
										{:else}
											{@const PaletteIcon = icons.Palette}
											<PaletteIcon size={16} />
										{/if}
									</div>
									<div class="text-left">
										<div class="text-base-content font-medium">{themeOption.name}</div>
										<div class="text-base-content/50 text-xs">
											{themeDescriptions[themeOption.value]?.description || 'Custom theme'}
										</div>
									</div>
								</div>

								<!-- Theme Preview -->
								<div class="mb-2 flex space-x-1">
									<div class="bg-base-100 border-base-300 h-4 w-4 rounded border"></div>
									<div class="bg-primary h-4 w-4 rounded"></div>
									<div class="bg-base-300 h-4 w-4 rounded"></div>
								</div>

								{#if $theme === themeOption.value}
									{@const CheckIcon = icons.Check}
									<div class="absolute top-2 right-2">
										<CheckIcon size={16} class="text-primary" />
									</div>
								{/if}
							</button>
						{/each}
					</div>

					<div class="border-primary/20 bg-primary/5 rounded-lg border p-4">
						<div class="flex items-start space-x-3">
							<svelte:component
								this={icons.Info}
								size={16}
								class="text-info mt-0.5 flex-shrink-0"
							/>
							<div>
								<p class="text-sm font-medium text-blue-900">About themes</p>
								<p class="text-primary mt-1 text-sm">
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
						<h3 class="text-base-content mb-2 text-lg font-semibold">Location Context</h3>
						<p class="text-base-content/70 mb-4 text-sm">
							Help us generate more relevant tasks based on your location and local weather
						</p>
					</div>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<label
								for="locationDescription"
								class="text-base-content mb-2 block text-sm font-medium"
							>
								Location Description
							</label>
							<input
								id="locationDescription"
								type="text"
								placeholder="e.g., Seattle area, NYC, San Francisco"
								class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								bind:value={preferences.locationDescription}
								onblur={() =>
									savePreference('locationDescription', preferences.locationDescription || '')}
							/>
							<p class="text-base-content/60 mt-1 text-xs">
								A general description of your area for context
							</p>
						</div>

						<div>
							<label for="zipCode" class="text-base-content mb-2 block text-sm font-medium">
								Zip Code
							</label>
							<input
								id="zipCode"
								type="text"
								placeholder="e.g., 98101"
								class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								bind:value={preferences.zipCode}
								onblur={() => savePreference('zipCode', preferences.zipCode || '')}
							/>
							<p class="text-base-content/60 mt-1 text-xs">
								For weather-based task suggestions (optional)
							</p>
						</div>
					</div>

					<div class="border-primary/20 bg-primary/5 rounded-lg border p-4">
						<div class="flex items-start space-x-3">
							<svelte:component
								this={icons.Info}
								size={16}
								class="text-info mt-0.5 flex-shrink-0"
							/>
							<div>
								<p class="text-sm font-medium text-blue-900">How we use your location</p>
								<p class="text-primary mt-1 text-sm">
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
						<h3 class="text-base-content mb-2 text-lg font-semibold">Personal Attributes</h3>
						<p class="text-base-content/70 mb-4 text-sm">
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
							<div class="text-base-content/60 flex items-center space-x-3">
								<div
									class="border-base-300 h-5 w-5 animate-spin rounded-full border-2 border-t-blue-600"
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
						<h3 class="text-base-content mb-2 text-lg font-semibold">Character Settings</h3>
						<p class="text-base-content/70 mb-4 text-sm">
							Configure your RPG-style character experience
						</p>
					</div>

					{#if userData}
						<div class="space-y-6">
							<!-- RPG Flavor Toggle -->
							<div class="border-base-300 bg-base-50 rounded-lg border p-4">
								<div class="flex items-start space-x-3">
									<div class="flex items-center">
										<input
											type="checkbox"
											id="rpgFlavorEnabled"
											bind:checked={rpgFlavorEnabled}
											onchange={handleRpgFlavorToggle}
											class="checkbox checkbox-primary"
										/>
									</div>
									<div class="flex-1">
										<label
											for="rpgFlavorEnabled"
											class="text-base-content cursor-pointer text-sm font-medium"
										>
											Enable RPG Flavor
										</label>
										<p class="text-base-content/70 mt-1 text-xs">
											Add fantasy RPG elements to your tasks and descriptions. When enabled, tasks
											will include character class themes and story elements.
										</p>
									</div>
								</div>
							</div>

							<!-- Class Selection -->
							<div>
								<label
									for="characterClass"
									class="text-base-content mb-2 block text-sm font-medium"
								>
									Character Class
									{#if !rpgFlavorEnabled}
										<span class="text-base-content/50 text-xs">(Enable RPG Flavor to use)</span>
									{/if}
								</label>
								<select
									id="characterClass"
									bind:value={memberClassName}
									disabled={!rpgFlavorEnabled}
									class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none {!rpgFlavorEnabled
										? 'cursor-not-allowed opacity-50'
										: ''}"
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
							{#if memberClassName && rpgFlavorEnabled}
								<div>
									<label
										for="classDescription"
										class="text-base-content mb-2 block text-sm font-medium"
									>
										Character Backstory
									</label>
									<textarea
										id="classDescription"
										bind:value={memberClassDescription}
										placeholder="Describe your character's background, personality, approach to life, or any other details that make them unique..."
										rows="4"
										class="border-base-300 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
									></textarea>
									<p class="text-base-content/60 mt-1 text-xs">
										Tell your character's story - their motivations, quirks, values, or what drives
										them
									</p>
								</div>

								{#if memberClassDescription && rpgFlavorEnabled}
									<div class="border-base-300 bg-base-200 rounded-lg border p-4">
										<div class="flex items-start space-x-3">
											<div
												class="bg-secondary/10 flex h-8 w-8 items-center justify-center rounded-lg"
											>
												<svelte:component this={icons.Shield} size={16} class="text-secondary" />
											</div>
											<div class="flex-1">
												<h5 class="text-base-content mb-1 text-sm font-medium">
													{memberClassName}
												</h5>
												<p class="text-base-content/80 text-sm italic">
													"{memberClassDescription}"
												</p>
											</div>
										</div>
									</div>
								{/if}
							{/if}

							<!-- Save Button -->
							<div class="border-base-300 flex justify-end border-t pt-4">
								<button
									onclick={handleClassUpdate}
									class="bg-primary text-primary-content hover:bg-primary/90 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors"
								>
									Save Character
								</button>
							</div>
						</div>
					{:else}
						<div class="flex justify-center py-8">
							<div class="text-base-content/60 flex items-center space-x-3">
								<div
									class="border-base-300 h-5 w-5 animate-spin rounded-full border-2 border-t-blue-600"
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
