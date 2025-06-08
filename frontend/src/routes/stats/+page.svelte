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
		{ value: 'body', label: 'Body', description: 'Physical health, energy, and resilience', icon: '💪', color: 'border-red-500' },
		{ value: 'mind', label: 'Mind', description: 'Mental clarity, wisdom, and intellectual growth', icon: '🧠', color: 'border-blue-500' },
		{ value: 'connection', label: 'Connection', description: 'Social bonds, emotional presence, and relationships', icon: '💝', color: 'border-pink-500' },
		{ value: 'shadow', label: 'Shadow', description: 'Patterns that drain or sabotage - track for healing', icon: '🌑', color: 'border-purple-500' },
		{ value: 'spirit', label: 'Spirit', description: 'Inner alignment, intuition, and existential clarity', icon: '🌟', color: 'border-yellow-500' },
		{ value: 'legacy', label: 'Legacy', description: 'Impact on others and long-term contributions', icon: '🏛️', color: 'border-green-500' }
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

	function getCategoryInfo(categoryName: string) {
		return categoryOptions.find(cat => cat.value === categoryName) || 
			{ value: categoryName, label: categoryName, description: '', icon: '📊', color: 'text-gray-600' };
	}

	$: groupedStats = groupStatsByCategory(stats);
	$: enabledStats = stats.filter(s => s.enabled);
	$: totalLevel = enabledStats.reduce((sum, stat) => sum + stat.level, 0);
	$: totalXP = enabledStats.reduce((sum, stat) => sum + stat.xp, 0);
	$: averageLevel = enabledStats.length > 0 ? (totalLevel / enabledStats.length).toFixed(1) : '0';
	$: highestLevel = enabledStats.length > 0 ? Math.max(...enabledStats.map(s => s.level)) : 0;
</script>

<svelte:head>
	<title>Stats - LifeQuest</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section -->
	<div class="bg-white border-b border-gray-200">
		<div class="max-w-6xl mx-auto px-4 py-8">
			<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 class="text-3xl font-bold text-gray-900 mb-2">Character Stats</h1>
					<p class="text-sm text-gray-600">Track your growth across different areas of life</p>
				</div>
				<button 
					class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2 self-start md:self-auto"
					on:click={() => showCreateForm = true}
				>
					<icons.Plus size={16} />
					New Stat
				</button>
			</div>
		</div>
	</div>

	<!-- Quick Stats Overview -->
	{#if !loading && enabledStats.length > 0}
		<div class="max-w-6xl mx-auto px-4 py-6">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="bg-white rounded-md shadow-sm border border-gray-200 p-4">
					<div class="text-2xl font-bold text-gray-900">{enabledStats.length}</div>
					<div class="text-sm text-gray-600">Active Stats</div>
				</div>
				<div class="bg-white rounded-md shadow-sm border border-gray-200 p-4">
					<div class="text-2xl font-bold text-gray-900">{totalLevel}</div>
					<div class="text-sm text-gray-600">Total Levels</div>
				</div>
				<div class="bg-white rounded-md shadow-sm border border-gray-200 p-4">
					<div class="text-2xl font-bold text-gray-900">{totalXP.toLocaleString()}</div>
					<div class="text-sm text-gray-600">Total XP</div>
				</div>
				<div class="bg-white rounded-md shadow-sm border border-gray-200 p-4">
					<div class="text-2xl font-bold text-gray-900">{averageLevel}</div>
					<div class="text-sm text-gray-600">Avg Level</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Error Alert -->
	{#if error}
		<div class="max-w-6xl mx-auto px-4">
			<div class="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
				<div class="flex items-center">
					<icons.AlertCircle class="text-red-400 mr-3" size={20} />
					<p class="text-sm text-red-700">{error}</p>
					<button 
						class="ml-auto text-red-400 hover:text-red-600 p-1"
						on:click={() => error = ''}
					>
						<icons.X size={16} />
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Content -->
	<div class="max-w-6xl mx-auto px-4 pb-8">
		{#if loading}
			<div class="flex justify-center py-12">
				<div class="flex items-center gap-3">
					<div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
					<span class="text-sm text-gray-600">Loading stats...</span>
				</div>
			</div>
		{:else if stats.length === 0}
			<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<icons.TrendingUp class="text-gray-400" size={32} />
				</div>
				<h2 class="text-xl font-semibold text-gray-900 mb-2">No stats yet</h2>
				<p class="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
					Start tracking your growth by creating your first character stat
				</p>
				<button 
					class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2 mx-auto"
					on:click={() => showCreateForm = true}
				>
					<icons.Plus size={16} />
					Create Your First Stat
				</button>
			</div>
		{:else}
			<!-- Stats by Category -->
			{#each Object.entries(groupedStats) as [category, categoryStats]}
				{@const categoryInfo = getCategoryInfo(category)}
				<div class="mb-8">
					<div class="flex items-center gap-3 mb-6">
						<div class="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-xl">
							{categoryInfo.icon}
						</div>
						<div>
							<h2 class="text-xl font-semibold text-gray-900">{categoryInfo.label}</h2>
							<p class="text-sm text-gray-600">{categoryInfo.description}</p>
						</div>
					</div>
					
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each categoryStats as stat}
							<div class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow {!stat.enabled ? 'opacity-60' : ''}">
								<div class="p-6">
									<!-- Stat Header -->
									<div class="flex items-start justify-between mb-4">
										<div class="flex items-center gap-3">
											<div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center {!stat.enabled ? 'grayscale' : ''}">
												{#if stat.icon}
													<svelte:component this={getIconComponent(stat.icon)} size={20} class="text-gray-700" />
												{:else}
													<icons.Circle size={20} class="text-gray-400" />
												{/if}
											</div>
											<div>
												<h3 class="font-semibold text-gray-900 {!stat.enabled ? 'text-gray-500' : ''}">{stat.name}</h3>
												{#if !stat.enabled}
													<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 mt-1">
														Disabled
													</span>
												{/if}
											</div>
										</div>
										
										<!-- Actions Menu -->
										<div class="relative">
											<button 
												class="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
												on:click={(e) => {
													e.preventDefault();
													const dropdown = e.currentTarget.nextElementSibling;
													dropdown?.classList.toggle('hidden');
												}}
											>
												<icons.MoreVertical size={16} />
											</button>
											<div class="hidden absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
												<button 
													class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
													on:click={() => startEdit(stat)}
												>
													<icons.Edit2 size={14} />
													Edit
												</button>
												<button 
													class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
													on:click={() => toggleStatEnabled(stat)}
												>
													{#if stat.enabled}
														<icons.EyeOff size={14} />
														Disable
													{:else}
														<icons.Eye size={14} />
														Enable
													{/if}
												</button>
												<hr class="my-1">
												<button 
													class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
													on:click={() => deleteStat(stat.id)}
												>
													<icons.Trash2 size={14} />
													Delete
												</button>
											</div>
										</div>
									</div>

									<!-- Description -->
									{#if stat.description}
										<p class="text-sm text-gray-600 mb-4 {!stat.enabled ? 'text-gray-400' : ''}">{stat.description}</p>
									{/if}

									<!-- Level & Progress -->
									<div class="mb-4">
										<div class="flex items-center justify-between mb-2">
											<span class="text-sm font-medium text-gray-900 {!stat.enabled ? 'text-gray-400' : ''}">
												Level {stat.level}
											</span>
											<span class="text-xs text-gray-500">
												{stat.xp} XP
											</span>
										</div>
										
										<div class="w-full bg-gray-200 rounded-full h-2">
											<div 
												class="bg-blue-600 h-2 rounded-full transition-all duration-300 {!stat.enabled ? 'opacity-40' : ''}"
												style="width: {getProgressWidth(stat)}%"
											></div>
										</div>
										
										{#if canLevelUp(stat)}
											<div class="flex items-center gap-1 text-xs text-green-600 mt-2">
												<icons.Star size={12} />
												Ready to level up!
											</div>
										{:else}
											<div class="text-xs text-gray-500 mt-2">
												{getXpToNextLevel(stat)} XP to level {stat.level + 1}
											</div>
										{/if}
									</div>

									<!-- Action Buttons -->
									{#if stat.enabled}
										<div class="flex items-center justify-between gap-2">
											<div class="flex gap-2">
												{#if canLevelUp(stat)}
													<button 
														class="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
														on:click={() => levelUpStat(stat.id)}
													>
														<icons.Star size={12} />
														Level Up!
													</button>
												{:else}
													<button 
														class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
														on:click={() => incrementStat(stat.id, 1)}
													>
														+25 XP
													</button>
													<button 
														class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
														on:click={() => incrementStat(stat.id, 5)}
													>
														+125 XP
													</button>
												{/if}
											</div>
											<button 
												class="text-gray-400 hover:text-gray-600 p-1"
												on:click={() => startEdit(stat)}
											>
												<icons.Settings size={14} />
											</button>
										</div>
									{:else}
										<div class="flex justify-center">
											<button 
												class="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium px-4 py-2 rounded-md transition-colors border border-blue-200"
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
	</div>
</div>

<!-- Create/Edit Modal - Modern Atlassian Style -->
{#if showCreateForm}
	<!-- Modal Backdrop -->
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
			<!-- Modal Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">
					{editingStat ? 'Edit Stat' : 'Create New Stat'}
				</h2>
				<button 
					class="text-gray-400 hover:text-gray-600 p-1"
					on:click={resetForm}
				>
					<icons.X size={20} />
				</button>
			</div>

			<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
				<!-- Class Recommendations (only show for new stats) -->
				{#if !editingStat && userData?.className}
					{@const classDef = findClassByName(userData.className)}
					{@const recommendedStats = getRecommendedStats()}
					
					{#if classDef && recommendedStats.length > 0}
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div class="flex items-center gap-2 mb-3">
								<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
									🎭
								</div>
								<h3 class="font-medium text-blue-900">
									Recommended for {userData.className}
								</h3>
							</div>
							<p class="text-sm text-blue-700 mb-3">
								These stats complement your class. Click to add one:
							</p>
							<div class="flex flex-wrap gap-2">
								{#each recommendedStats as statName}
									{@const statDef = findStatByName(statName)}
									{#if statDef}
										<button
											type="button"
											class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
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
					<div class="border border-gray-200 rounded-lg">
						<button
							type="button"
							class="w-full flex items-center justify-between p-4 text-left"
							on:click={(e) => {
								const content = e.currentTarget.nextElementSibling;
								content?.classList.toggle('hidden');
							}}
						>
							<div class="flex items-center gap-2">
								<icons.BookOpen size={16} class="text-gray-600" />
								<span class="font-medium text-gray-900">Browse Stat Library</span>
							</div>
							<icons.ChevronDown size={16} class="text-gray-400" />
						</button>
						<div class="hidden border-t border-gray-200 p-4 space-y-4">
							{#each Object.entries(getStatsByCategory()) as [category, categoryStats]}
								<div>
									<h4 class="font-medium text-sm text-gray-900 mb-3 capitalize">{category}</h4>
									<div class="space-y-2">
										{#each categoryStats as stat}
											{@const isAlreadyAdded = stats.some(s => s.name === stat.name)}
											<button
												type="button"
												class="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors {isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''}"
												on:click={() => !isAlreadyAdded && addStatFromLibrary(stat.name)}
												disabled={isAlreadyAdded}
											>
												<div class="flex items-center justify-between">
													<div>
														<div class="flex items-center gap-2">
															<span class="font-medium text-gray-900">{stat.name}</span>
															{#if isStatRecommended(stat.name)}
																<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
																	Recommended
																</span>
															{/if}
															{#if isAlreadyAdded}
																<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
																	Added
																</span>
															{/if}
														</div>
														<p class="text-sm text-gray-600 mt-1">{stat.description}</p>
													</div>
												</div>
											</button>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
					
					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-gray-200"></div>
						</div>
						<div class="relative flex justify-center">
							<span class="bg-white px-3 text-sm text-gray-500">Or create a custom stat</span>
						</div>
					</div>
				{/if}
				
				<!-- Form Fields -->
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Name <span class="text-red-500">*</span>
						</label>
						<input 
							type="text" 
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={formData.name}
							placeholder="e.g. Strength, Wisdom, Charisma"
							required
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Description
						</label>
						<textarea 
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
							bind:value={formData.description}
							placeholder="What this stat represents and why it matters to you..."
							rows="3"
						></textarea>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Category
							</label>
							<select 
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								bind:value={formData.category}
							>
								{#each categoryOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Icon
							</label>
							<select 
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								bind:value={formData.icon}
							>
								<option value="">Select an icon...</option>
								{#each availableIcons as iconName}
									<option value={iconName}>{iconName}</option>
								{/each}
							</select>
							{#if formData.icon}
								<div class="mt-2 flex items-center gap-2">
									<span class="text-sm text-gray-600">Preview:</span>
									<svelte:component this={getIconComponent(formData.icon)} size={16} class="text-gray-700" />
								</div>
							{/if}
						</div>
					</div>

					<div class="flex items-center">
						<input 
							type="checkbox" 
							id="enabled"
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							bind:checked={formData.enabled}
						/>
						<label for="enabled" class="ml-2 block text-sm text-gray-700">
							Enable this stat (you can disable it later)
						</label>
					</div>
				</div>

				<!-- Form Actions -->
				<div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
					<button 
						type="button" 
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
						on:click={resetForm}
					>
						Cancel
					</button>
					<button 
						type="submit" 
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
					>
						{editingStat ? 'Update Stat' : 'Create Stat'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
