<script lang="ts">
	import { onMount } from 'svelte';
	import { statsApi, userApi } from '$lib/api';
	import * as icons from 'lucide-svelte';
	import { STAT_LIBRARY, findStatByName, getStatsByCategory } from '$lib/data/stats';
	import { findClassByName } from '$lib/data/classes';

	let stats: any[] = [];
	let userData: any = null;
	let loading = true;
	let error = '';
	let showCreateForm = false;
	let editingStat: any = null;

	// Form state
	let formData = {
		name: '',
		description: '',
		icon: '',
		category: 'body' as 'body' | 'mind' | 'connection' | 'shadow' | 'spirit' | 'legacy',
		enabled: true
	};



	const categoryOptions = [
		{ value: 'body', label: 'Body', description: 'Physical health, energy, and resilience' },
		{ value: 'mind', label: 'Mind', description: 'Mental clarity, wisdom, and intellectual growth' },
		{ value: 'connection', label: 'Connection', description: 'Social bonds, emotional presence, and relationships' },
		{ value: 'shadow', label: 'Shadow', description: 'Patterns that drain or sabotage - track for healing' },
		{ value: 'spirit', label: 'Spirit', description: 'Inner alignment, intuition, and existential clarity' },
		{ value: 'legacy', label: 'Legacy', description: 'Impact on others and long-term contributions' }
	];

	// Available Lucide icons for stats
	const availableIcons = [
		'dumbbell', 'move', 'heart-pulse', 'battery', 'brain', 'book-open', 'check-circle', 'target',
		'megaphone', 'handshake', 'shield', 'hammer', 'radar', 'arrow-left', 'zap', 'flame', 'ban',
		'compass', 'moon', 'infinity', 'lightbulb', 'users', 'tree-deciduous', 'archive'
	];

	// Icon display function
	function getIconComponent(iconName: string) {
		const iconMap: Record<string, any> = {
			'dumbbell': icons.Dumbbell,
			'move': icons.Move,
			'heart-pulse': icons.HeartPulse,
			'battery': icons.Battery,
			'brain': icons.Brain,
			'book-open': icons.BookOpen,
			'check-circle': icons.CheckCircle,
			'target': icons.Target,
			'megaphone': icons.Megaphone,
			'handshake': icons.Handshake,
			'shield': icons.Shield,
			'hammer': icons.Hammer,
			'radar': icons.Radar,
			'arrow-left': icons.ArrowLeft,
			'zap': icons.Zap,
			'flame': icons.Flame,
			'ban': icons.Ban,
			'compass': icons.Compass,
			'moon': icons.Moon,
			'infinity': icons.Infinity,
			'lightbulb': icons.Lightbulb,
			'users': icons.Users,
			'tree-deciduous': icons.TreeDeciduous,
			'archive': icons.Archive
		};
		return iconMap[iconName] || icons.Circle;
	}

	onMount(async () => {
		await Promise.all([loadStats(), loadUserData()]);
	});

	async function loadStats() {
		try {
			loading = true;
			stats = await statsApi.getAll();
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function loadUserData() {
		try {
			const response = await userApi.getMe();
			userData = response.user;
		} catch (err: any) {
			console.error('Failed to load user data:', err);
		}
	}

	// Get class recommendations for current user
	function getClassRecommendations() {
		if (!userData?.className) return [];
		const classDef = findClassByName(userData.className);
		return classDef?.recommended_stats || [];
	}

	// Check if a stat is recommended for current class
	function isStatRecommended(statName: string) {
		return getClassRecommendations().includes(statName);
	}

	// Get stats that are recommended but not yet added
	function getRecommendedStats() {
		const recommended = getClassRecommendations();
		const existingStatNames = stats.map(s => s.name);
		return recommended.filter(name => !existingStatNames.includes(name));
	}

	// Add a stat from the library
	function addStatFromLibrary(statName: string) {
		const statDef = findStatByName(statName);
		if (statDef) {
			formData = {
				name: statDef.name,
				description: statDef.description,
				icon: statDef.icon || '',
				category: statDef.category,
				enabled: true
			};
		}
	}

	function resetForm() {
		formData = {
			name: '',
			description: '',
			icon: '',
			category: 'body',
			enabled: true
		};
		showCreateForm = false;
		editingStat = null;
	}

	function startEdit(stat: any) {
		editingStat = stat;
		formData = { ...stat };
		showCreateForm = true;
	}

	async function handleSubmit() {
		try {
			if (editingStat) {
				await statsApi.update(editingStat.id, formData);
			} else {
				await statsApi.create(formData);
			}
			resetForm();
			await loadStats();
		} catch (err: any) {
			error = err.message;
		}
	}

	async function incrementStat(statId: string, amount = 1) {
		try {
			await statsApi.increment(statId, amount);
			await loadStats();
		} catch (err: any) {
			error = err.message;
		}
	}

	async function levelUpStat(statId: string) {
		try {
			await statsApi.levelUp(statId);
			await loadStats();
		} catch (err: any) {
			error = err.message;
		}
	}

	function getProgressWidth(stat: any) {
		// Progress based on XP towards next level
		const currentLevelXp = (stat.level - 1) * 100;
		const nextLevelXp = stat.level * 100;
		const progressXp = stat.xp - currentLevelXp;
		const levelXpRange = nextLevelXp - currentLevelXp;
		return Math.min(100, Math.max(0, (progressXp / levelXpRange) * 100));
	}

	function canLevelUp(stat: any) {
		return stat.xp > (stat.level - 1) * 100;
	}

	function getXpToNextLevel(stat: any) {
		const nextLevelXp = stat.level * 100;
		return Math.max(0, nextLevelXp + 1 - stat.xp);
	}

	async function toggleStatEnabled(stat: any) {
		try {
			await statsApi.update(stat.id, { enabled: !stat.enabled });
			await loadStats();
		} catch (err: any) {
			error = err.message;
		}
	}

	async function deleteStat(statId: string) {
		if (confirm('Are you sure you want to delete this stat?')) {
			try {
				await statsApi.delete(statId);
				await loadStats();
			} catch (err: any) {
				error = err.message;
			}
		}
	}

	async function restoreDefaults() {
		if (!confirm('This will add any missing default stats to your collection. Are you sure?')) {
			return;
		}
		
		try {
			const result = await statsApi.restoreDefaults();
			await loadStats();
			error = '';
			alert(`Successfully restored ${result.createdCount} default stats!`);
		} catch (err: any) {
			error = err.message;
		}
	}



	function groupStatsByCategory(stats: any[]) {
		const grouped: Record<string, any[]> = {};
		stats.forEach(stat => {
			const category = stat.category || 'uncategorized';
			if (!grouped[category]) {
				grouped[category] = [];
			}
			grouped[category].push(stat);
		});
		return grouped;
	}

	$: groupedStats = groupStatsByCategory(stats);
</script>

<svelte:head>
	<title>Stats - LifeQuest</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold text-theme">Character Stats</h1>
		<div class="flex gap-2">
			<button 
				class="px-4 py-2 border border-theme-primary text-theme-primary rounded-md hover:bg-theme-primary hover:text-white transition-colors"
				on:click={restoreDefaults}
			>
				🔄 Restore Defaults
			</button>
			<button 
				class="px-4 py-2 bg-theme-primary text-white rounded-md hover:bg-theme-primary-dark transition-colors"
				on:click={() => showCreateForm = true}
			>
				+ New Stat
			</button>
		</div>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 flex items-center justify-between">
			<span>{error}</span>
			<button class="text-red-500 hover:text-red-700 transition-colors" on:click={() => error = ''}>✕</button>
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
		</div>
	{:else if stats.length === 0}
		<div class="text-center py-12">
			<p class="text-lg text-theme-muted mb-4">No stats yet</p>
			<div class="flex justify-center gap-4">
				<button 
					class="px-4 py-2 bg-theme-primary text-white rounded-md hover:bg-theme-primary-dark transition-colors"
					on:click={() => showCreateForm = true}
				>
					Create Your First Stat
				</button>
			</div>
		</div>
	{:else}
		{#each Object.entries(groupedStats) as [category, categoryStats]}
			<div class="mb-8">
				<h2 class="text-xl font-semibold mb-4 capitalize flex items-center gap-2 text-theme">
					{#if category === 'body'}
						💪 Body
					{:else if category === 'mind'}
						🧠 Mind
					{:else if category === 'connection'}
						💝 Connection
					{:else if category === 'shadow'}
						🌑 Shadow
					{:else if category === 'spirit'}
						🌟 Spirit
					{:else if category === 'legacy'}
						🏛️ Legacy
					{:else}
						📊 {category}
					{/if}
				</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each categoryStats as stat}
						<div class="bg-theme border border-theme rounded-lg shadow-md p-6 {!stat.enabled ? 'opacity-60' : ''}">
							{#if !stat.enabled}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mb-2">Disabled</span>
							{/if}
							<div class="flex justify-between items-start mb-4">
								<div class="flex items-center gap-2">
									{#if stat.icon}
										<div class="text-2xl {!stat.enabled ? 'grayscale' : ''}">
											<svelte:component this={getIconComponent(stat.icon)} size={24} />
										</div>
									{:else}
										<div class="text-2xl {!stat.enabled ? 'grayscale' : ''}">
											<svelte:component this={icons.Circle} size={24} />
										</div>
									{/if}
									<h2 class="text-lg font-semibold {!stat.enabled ? 'text-theme-muted' : 'text-theme'}">{stat.name}</h2>
									{#if stat.systemDefault}
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-theme-primary text-white" title="System Default">SYS</span>
									{/if}
								</div>
								<div class="relative">
									<button class="text-theme-muted hover:text-theme p-1 rounded transition-colors" onclick="this.nextElementSibling.classList.toggle('hidden')">
										⋮
									</button>
									<div class="hidden absolute right-0 mt-2 w-48 bg-theme border border-theme rounded-md shadow-lg z-10">
										<button class="block w-full text-left px-4 py-2 text-sm text-theme hover:bg-theme-secondary transition-colors" on:click={() => startEdit(stat)}>Edit</button>
										<button class="block w-full text-left px-4 py-2 text-sm text-theme hover:bg-theme-secondary transition-colors" on:click={() => toggleStatEnabled(stat)}>
											{stat.enabled ? 'Disable' : 'Re-enable'} Stat
										</button>
										<button class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-theme-secondary transition-colors" on:click={() => deleteStat(stat.id)}>
											Delete
										</button>
									</div>
								</div>
							</div>

							{#if stat.description}
								<p class="text-sm {stat.enabled ? 'text-theme-muted' : 'text-gray-400'} mb-4">{stat.description}</p>
							{/if}

							<div class="mb-4">
								<div class="flex justify-between items-center mb-2">
									<span class="text-sm font-medium {!stat.enabled ? 'text-gray-400' : 'text-theme'}">Level {stat.level}</span>
									<span class="text-xs text-theme-muted">{stat.xp} XP</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-3">
									<div 
										class="bg-theme-primary h-3 rounded-full transition-all duration-300 {!stat.enabled ? 'opacity-40' : ''}"
										style="width: {getProgressWidth(stat)}%"
									></div>
								</div>
								{#if canLevelUp(stat)}
									<div class="text-xs text-green-600 mt-1">
										Ready to level up! 🎉
									</div>
								{:else}
									<div class="text-xs text-theme-muted mt-1">
										{getXpToNextLevel(stat)} XP to level {stat.level + 1}
									</div>
								{/if}
							</div>

							{#if stat.enabled}
								<div class="flex justify-between items-center">
									<div class="flex gap-1">
										{#if canLevelUp(stat)}
											<button 
												class="px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
												on:click={() => levelUpStat(stat.id)}
											>
												Level Up! 🎉
											</button>
										{:else}
											<button 
												class="px-2 py-1 border border-theme-primary text-theme-primary text-xs rounded-md hover:bg-theme-primary hover:text-white transition-colors"
												on:click={() => incrementStat(stat.id, 1)}
											>
												+25 XP
											</button>
											<button 
												class="px-2 py-1 border border-theme-primary text-theme-primary text-xs rounded-md hover:bg-theme-primary hover:text-white transition-colors"
												on:click={() => incrementStat(stat.id, 5)}
											>
												+125 XP
											</button>
										{/if}
									</div>
									<button 
										class="px-2 py-1 border border-theme-primary text-theme-primary text-xs rounded-md hover:bg-theme-primary hover:text-white transition-colors"
										on:click={() => startEdit(stat)}
									>
										Edit
									</button>
								</div>
							{:else}
								<div class="flex justify-center">
									<button 
										class="px-4 py-2 border border-theme-primary text-theme-primary rounded-md hover:bg-theme-primary hover:text-white transition-colors"
										on:click={() => toggleStatEnabled(stat)}
									>
										Re-enable Stat
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}

	<div class="mt-4">
		<button class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors" on:click={restoreDefaults}>
			Restore Default Stats
		</button>
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showCreateForm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<form class="bg-theme rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" on:submit|preventDefault={handleSubmit}>
			<h3 class="font-bold text-lg mb-4 text-theme">
				{editingStat ? 'Edit Stat' : 'Create New Stat'}
			</h3>
			
			<!-- Class Recommendations (only show for new stats) -->
			{#if !editingStat && userData?.className}
				{@const classDef = findClassByName(userData.className)}
				{@const recommendedStats = getRecommendedStats()}
				
				{#if classDef && recommendedStats.length > 0}
					<div class="bg-theme-secondary rounded-lg p-4 mb-4">
						<h4 class="font-medium text-base mb-2 flex items-center gap-2 text-theme">
							<span class="text-lg">🎭</span>
							Recommended for {userData.className}
						</h4>
						<p class="text-sm text-theme-muted mb-3">
							These stats complement your class. Click to add one:
						</p>
						<div class="flex flex-wrap gap-2">
							{#each recommendedStats as statName}
								{@const statDef = findStatByName(statName)}
								{#if statDef}
									<button
										type="button"
										class="px-3 py-1 border border-theme-primary text-theme-primary rounded-md text-sm hover:bg-theme-primary hover:text-white transition-colors"
										on:click={() => addStatFromLibrary(statName)}
									>
										{statName}
									</button>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			{/if}
			
			<!-- Stat Library Browser (only for new stats) -->
			{#if !editingStat}
				<div class="border border-theme rounded-lg mb-4">
					<details class="group">
						<summary class="px-4 py-3 cursor-pointer text-sm font-medium text-theme hover:bg-theme-secondary transition-colors">
							📚 Browse Stat Library
						</summary>
						<div class="px-4 pb-4">
							<div class="space-y-3">
								{#each Object.entries(getStatsByCategory()) as [category, categoryStats]}
									<div>
										<h5 class="font-medium text-sm mb-2 capitalize text-theme">{category}</h5>
										<div class="grid grid-cols-1 gap-2">
											{#each categoryStats as stat}
												{@const isAlreadyAdded = stats.some(s => s.name === stat.name)}
												<button
													type="button"
													class="px-3 py-2 border border-theme rounded-md text-left text-sm hover:bg-theme-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed {isAlreadyAdded ? 'bg-gray-100' : ''}"
													on:click={() => !isAlreadyAdded && addStatFromLibrary(stat.name)}
													disabled={isAlreadyAdded}
												>
													<div class="flex-1 min-w-0">
														<div class="flex items-center gap-2">
															<span class="font-medium text-theme">{stat.name}</span>
															{#if isStatRecommended(stat.name)}
																<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-theme-primary text-white">Recommended</span>
															{/if}
															{#if isAlreadyAdded}
																<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Added</span>
															{/if}
														</div>
														<div class="text-xs text-theme-muted truncate">
															{stat.description}
														</div>
													</div>
												</button>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</details>
				</div>
				
				<div class="flex items-center my-4">
					<div class="flex-1 border-t border-theme"></div>
					<span class="px-3 text-sm text-theme-muted">Or create a custom stat</span>
					<div class="flex-1 border-t border-theme"></div>
				</div>
			{/if}
			
			<div class="mb-4">
				<label class="block text-sm font-medium text-theme mb-2" for="name">
					Name
				</label>
				<input 
					type="text" 
					id="name"
					class="w-full px-3 py-2 border border-theme rounded-md bg-theme text-theme placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary" 
					bind:value={formData.name}
					required
				/>
			</div>

			<div class="mb-4">
				<label class="block text-sm font-medium text-theme mb-2" for="description">
					Description
				</label>
				<textarea 
					id="description"
					class="w-full px-3 py-2 border border-theme rounded-md bg-theme text-theme placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary resize-none" 
					bind:value={formData.description}
					placeholder="What this stat represents..."
					rows="3"
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4 mb-4">
				<div>
					<label class="block text-sm font-medium text-theme mb-2" for="icon">
						Icon
					</label>
					<select 
						id="icon"
						class="w-full px-3 py-2 border border-theme rounded-md bg-theme text-theme focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary" 
						bind:value={formData.icon}
					>
						<option value="">Select an icon...</option>
						{#each availableIcons as iconName}
							<option value={iconName}>
								{iconName}
							</option>
						{/each}
					</select>
					{#if formData.icon}
						<div class="mt-2 flex items-center gap-2">
							<span class="text-sm text-theme-muted">Preview:</span>
							<svelte:component this={getIconComponent(formData.icon)} size={20} />
						</div>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-theme mb-2" for="category">
						Category
					</label>
					<select 
						id="category"
						class="w-full px-3 py-2 border border-theme rounded-md bg-theme text-theme focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary" 
						bind:value={formData.category}
					>
						{#each categoryOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="form-control mb-6">
				<label class="label cursor-pointer">
					<span class="label-text">Enabled</span>
					<input 
						type="checkbox" 
						class="checkbox" 
						bind:checked={formData.enabled}
					/>
				</label>
			</div>

			<div class="form-control mb-4">
				<label class="label" for="icon">
					<span class="label-text">Icon</span>
				</label>
				<div class="flex flex-wrap gap-2">
					{#each availableIcons as iconName}
						<div class="form-control w-10 h-10" title={iconName}>
							<label class="cursor-pointer">
								<input 
									type="radio" 
									name="icon" 
									class="hidden" 
									bind:group={formData.icon}
									value={iconName}
								/>
								<div class="w-full h-full flex items-center justify-center rounded-lg border transition-all duration-200 
									{formData.icon === iconName ? 'border-blue-500' : 'border-gray-300'}
								">
									<svelte:component this={getIconComponent(iconName)} size={16} />
								</div>
							</label>
						</div>
					{/each}
				</div>
			</div>

			<div class="modal-action">
				<button type="button" class="btn" on:click={resetForm}>Cancel</button>
				<button type="submit" class="btn btn-primary">
					{editingStat ? 'Update' : 'Create'}
				</button>
			</div>
		</form>
	</div>
{/if}
