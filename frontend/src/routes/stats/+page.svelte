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
		color: 'blue',
		category: 'body' as 'body' | 'mind' | 'connection' | 'shadow' | 'spirit' | 'legacy',
		enabled: true
	};

	const colorOptions = [
		'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
		'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
		'fuchsia', 'pink', 'rose'
	];

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
				color: statDef.color || 'blue',
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
			color: 'blue',
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
		<h1 class="text-3xl font-bold">Character Stats</h1>
		<div class="flex gap-2">
			<button 
				class="btn btn-outline"
				on:click={restoreDefaults}
			>
				🔄 Restore Defaults
			</button>
			<button 
				class="btn btn-primary"
				on:click={() => showCreateForm = true}
			>
				+ New Stat
			</button>
		</div>
	</div>

	{#if error}
		<div class="alert alert-error mb-4">
			<span>{error}</span>
			<button class="btn btn-sm btn-ghost" on:click={() => error = ''}>✕</button>
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if stats.length === 0}
		<div class="text-center py-12">
			<p class="text-lg text-gray-500 mb-4">No stats yet</p>
			<div class="flex justify-center gap-4">
				<button 
					class="btn btn-primary"
					on:click={() => showCreateForm = true}
				>
					Create Your First Stat
				</button>
			</div>
		</div>
	{:else}
		{#each Object.entries(groupedStats) as [category, categoryStats]}
			<div class="mb-8">
				<h2 class="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
					{#if category === 'body'}
						💪 Body
					{:else if category === 'mind'}
						🧠 Mind
					{:else if category === 'connection'}
						💝 Connection
					{:else if category === 'shadow'}
						�️ Shadow
					{:else if category === 'spirit'}
						🌟 Spirit
					{:else if category === 'legacy'}
						� Legacy
					{:else}
						📊 {category}
					{/if}
				</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each categoryStats as stat}
						<div class="card bg-base-100 shadow-xl border border-base-300 {!stat.enabled ? 'opacity-60 bg-gray-50' : ''}">
							<div class="card-body">
								{#if !stat.enabled}
									<div class="badge badge-ghost badge-sm mb-2">Disabled</div>
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
										<h2 class="card-title text-lg {!stat.enabled ? 'text-gray-500' : ''}">{stat.name}</h2>
										{#if stat.systemDefault}
											<span class="badge badge-xs badge-primary" title="System Default">SYS</span>
										{/if}
									</div>
									<div class="dropdown dropdown-end">
										<div tabindex="0" role="button" class="btn btn-ghost btn-sm">
											⋮
										</div>
										<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
										<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow">
											<li><button on:click={() => startEdit(stat)}>Edit</button></li>
											<li>
												<button on:click={() => toggleStatEnabled(stat)}>
													{stat.enabled ? 'Disable' : 'Re-enable'} Stat
												</button>
											</li>
											<li>
												<button 
													on:click={() => deleteStat(stat.id)} 
													class="text-error"
												>
													Delete
												</button>
											</li>
										</ul>
									</div>
								</div>

								{#if stat.description}
									<p class="text-sm {stat.enabled ? 'text-gray-600' : 'text-gray-400'} mb-4">{stat.description}</p>
								{/if}

								<div class="mb-4">
									<div class="flex justify-between items-center mb-2">
										<span class="text-sm font-medium {!stat.enabled ? 'text-gray-400' : ''}">Level {stat.level}</span>
										<span class="text-xs text-gray-500">{stat.xp} XP</span>
									</div>
									<div class="w-full bg-gray-200 rounded-full h-3">
										<div 
											class="bg-{stat.color}-500 h-3 rounded-full transition-all duration-300 {!stat.enabled ? 'opacity-40' : ''}"
											style="width: {getProgressWidth(stat)}%"
										></div>
									</div>
									{#if canLevelUp(stat)}
										<div class="text-xs text-green-600 mt-1">
											Ready to level up! 🎉
										</div>
									{:else}
										<div class="text-xs text-gray-500 mt-1">
											{getXpToNextLevel(stat)} XP to level {stat.level + 1}
										</div>
									{/if}
								</div>

								{#if stat.enabled}
									<div class="card-actions justify-between">
										<div class="flex gap-1">
											{#if canLevelUp(stat)}
												<button 
													class="btn btn-xs btn-success"
													on:click={() => levelUpStat(stat.id)}
												>
													Level Up! 🎉
												</button>
											{:else}
												<button 
													class="btn btn-xs btn-outline"
													on:click={() => incrementStat(stat.id, 1)}
												>
													+25 XP
												</button>
												<button 
													class="btn btn-xs btn-outline"
													on:click={() => incrementStat(stat.id, 5)}
												>
													+125 XP
												</button>
											{/if}
										</div>
										<button 
											class="btn btn-xs btn-outline btn-{stat.color}"
											on:click={() => startEdit(stat)}
										>
											Edit
										</button>
									</div>
								{:else}
									<div class="card-actions justify-center">
										<button 
											class="btn btn-sm btn-outline btn-primary"
											on:click={() => toggleStatEnabled(stat)}
										>
											Re-enable Stat
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}

	<div class="mt-4">
		<button class="btn btn-secondary" on:click={restoreDefaults}>
			Restore Default Stats
		</button>
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showCreateForm}
	<div class="modal modal-open">
		<form class="modal-box" on:submit|preventDefault={handleSubmit}>
			<h3 class="font-bold text-lg mb-4">
				{editingStat ? 'Edit Stat' : 'Create New Stat'}
			</h3>
			
			<!-- Class Recommendations (only show for new stats) -->
			{#if !editingStat && userData?.className}
				{@const classDef = findClassByName(userData.className)}
				{@const recommendedStats = getRecommendedStats()}
				
				{#if classDef && recommendedStats.length > 0}
					<div class="bg-base-200 rounded-lg p-4 mb-4">
						<h4 class="font-medium text-base mb-2 flex items-center gap-2">
							<span class="text-lg">🎭</span>
							Recommended for {userData.className}
						</h4>
						<p class="text-sm text-base-content/70 mb-3">
							These stats complement your class. Click to add one:
						</p>
						<div class="flex flex-wrap gap-2">
							{#each recommendedStats as statName}
								{@const statDef = findStatByName(statName)}
								{#if statDef}
									<button
										type="button"
										class="btn btn-sm btn-outline btn-primary"
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
				<div class="collapse collapse-arrow bg-base-100 border border-base-300 mb-4">
					<input type="checkbox" />
					<div class="collapse-title text-sm font-medium">
						📚 Browse Stat Library
					</div>
					<div class="collapse-content">
						<div class="space-y-3">
							{#each Object.entries(getStatsByCategory()) as [category, categoryStats]}
								<div>
									<h5 class="font-medium text-sm mb-2 capitalize">{category}</h5>
									<div class="grid grid-cols-1 gap-2">
										{#each categoryStats as stat}
											{@const isAlreadyAdded = stats.some(s => s.name === stat.name)}
											<button
												type="button"
												class="btn btn-sm btn-outline text-left justify-start {isAlreadyAdded ? 'btn-disabled' : ''}"
												on:click={() => !isAlreadyAdded && addStatFromLibrary(stat.name)}
												disabled={isAlreadyAdded}
											>
												<div class="flex-1 min-w-0">
													<div class="flex items-center gap-2">
														<span class="font-medium">{stat.name}</span>
														{#if isStatRecommended(stat.name)}
															<span class="badge badge-primary badge-xs">Recommended</span>
														{/if}
														{#if isAlreadyAdded}
															<span class="badge badge-ghost badge-xs">Added</span>
														{/if}
													</div>
													<div class="text-xs text-left opacity-70 truncate">
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
				</div>
				
				<div class="divider text-sm">Or create a custom stat</div>
			{/if}
			
			<div class="form-control mb-4">
				<label class="label" for="name">
					<span class="label-text">Name</span>
				</label>
				<input 
					type="text" 
					id="name"
					class="input input-bordered" 
					bind:value={formData.name}
					required
				/>
			</div>

			<div class="form-control mb-4">
				<label class="label" for="description">
					<span class="label-text">Description</span>
				</label>
				<textarea 
					id="description"
					class="textarea textarea-bordered" 
					bind:value={formData.description}
					placeholder="What this stat represents..."
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4 mb-4">
				<div class="form-control">
					<label class="label" for="icon">
						<span class="label-text">Icon</span>
					</label>
					<select 
						id="icon"
						class="select select-bordered" 
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
							<span class="text-sm text-gray-600">Preview:</span>
							<svelte:component this={getIconComponent(formData.icon)} size={20} />
						</div>
					{/if}
				</div>

				<div class="form-control">
					<label class="label" for="category">
						<span class="label-text">Category</span>
					</label>
					<select 
						id="category"
						class="select select-bordered" 
						bind:value={formData.category}
					>
						{#each categoryOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="form-control mb-4">
				<label class="label" for="color">
					<span class="label-text">Color</span>
				</label>
				<select 
					id="color"
					class="select select-bordered" 
					bind:value={formData.color}
				>
					{#each colorOptions as color}
						<option value={color}>{color}</option>
					{/each}
				</select>
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
