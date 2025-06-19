<script lang="ts">
	import { onMount } from 'svelte';
	import { statsApi, userApi } from '$lib/api';
	import * as icons from 'lucide-svelte';
	import { STAT_LIBRARY, findStatByName, getStatsByCategory } from '$lib/data/stats';
	import { findClassByName } from '$lib/data/classes';
	import IconPicker from '$lib/components/IconPicker.svelte';

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
		enabled: true,
		dayOfWeek: '',
		sampleTasks: [] as string[]
	};

	const categoryOptions = [
		{
			value: 'body',
			label: 'Body',
			description: 'Physical health, energy, and resilience',
			icon: '💪',
			color: 'border-red-500'
		},
		{
			value: 'mind',
			label: 'Mind',
			description: 'Mental clarity, wisdom, and intellectual growth',
			icon: '🧠',
			color: 'border-blue-500'
		},
		{
			value: 'connection',
			label: 'Connection',
			description: 'Social bonds, emotional presence, and relationships',
			icon: '💝',
			color: 'border-pink-500'
		},
		{
			value: 'shadow',
			label: 'Shadow',
			description: 'Patterns that drain or sabotage - track for healing',
			icon: '🌑',
			color: 'border-purple-500'
		},
		{
			value: 'spirit',
			label: 'Spirit',
			description: 'Inner alignment, intuition, and existential clarity',
			icon: '🌟',
			color: 'border-yellow-500'
		},
		{
			value: 'legacy',
			label: 'Legacy',
			description: 'Impact on others and long-term contributions',
			icon: '🏛️',
			color: 'border-green-500'
		}
	];

	// Available Lucide icons for stats
	const availableIconsList = [
		'dumbbell',
		'move',
		'heart-pulse',
		'battery',
		'brain',
		'book-open',
		'check-circle',
		'target',
		'megaphone',
		'handshake',
		'shield',
		'hammer',
		'radar',
		'arrow-left',
		'zap',
		'flame',
		'ban',
		'compass',
		'moon',
		'infinity',
		'lightbulb',
		'users',
		'tree-deciduous',
		'archive'
	];

	// Convert to format expected by IconPicker
	const availableIcons = availableIconsList.map(iconName => {
		// Create friendly labels from icon names
		const label = iconName
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
		return { name: iconName, label };
	});

	// Icon display function
	function getIconComponent(iconName: string) {
		const iconMap: Record<string, any> = {
			dumbbell: icons.Dumbbell,
			move: icons.Move,
			'heart-pulse': icons.HeartPulse,
			battery: icons.Battery,
			brain: icons.Brain,
			'book-open': icons.BookOpen,
			'check-circle': icons.CheckCircle,
			target: icons.Target,
			megaphone: icons.Megaphone,
			handshake: icons.Handshake,
			shield: icons.Shield,
			hammer: icons.Hammer,
			radar: icons.Radar,
			'arrow-left': icons.ArrowLeft,
			zap: icons.Zap,
			flame: icons.Flame,
			ban: icons.Ban,
			compass: icons.Compass,
			moon: icons.Moon,
			infinity: icons.Infinity,
			lightbulb: icons.Lightbulb,
			users: icons.Users,
			'tree-deciduous': icons.TreeDeciduous,
			archive: icons.Archive
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
		const existingStatNames = stats.map((s) => s.name);
		return recommended.filter((name) => !existingStatNames.includes(name));
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
				enabled: true,
				dayOfWeek: '',
				sampleTasks: []
			};
		}
	}

	function resetForm() {
		formData = {
			name: '',
			description: '',
			icon: '',
			category: 'body',
			enabled: true,
			dayOfWeek: '',
			sampleTasks: []
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
		stats.forEach((stat) => {
			const category = stat.category || 'uncategorized';
			if (!grouped[category]) {
				grouped[category] = [];
			}
			grouped[category].push(stat);
		});
		return grouped;
	}

	function getCategoryInfo(categoryName: string) {
		return (
			categoryOptions.find((cat) => cat.value === categoryName) || {
				value: categoryName,
				label: categoryName,
				description: '',
				icon: '📊',
				color: 'text-gray-600 dark:text-neutral-300'
			}
		);
	}

	$: groupedStats = groupStatsByCategory(stats);
	$: enabledStats = stats.filter((s) => s.enabled);
	$: totalLevel = enabledStats.reduce((sum, stat) => sum + stat.level, 0);
	$: totalXP = enabledStats.reduce((sum, stat) => sum + stat.xp, 0);
	$: averageLevel = enabledStats.length > 0 ? (totalLevel / enabledStats.length).toFixed(1) : '0';
	$: highestLevel = enabledStats.length > 0 ? Math.max(...enabledStats.map((s) => s.level)) : 0;
</script>

<svelte:head>
	<title>Stats - LifeQuest</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-neutral-900 dark:bg-neutral-900">
	<!-- Hero Section -->
	<div
		class="border-b border-gray-200 bg-white dark:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-800"
	>
		<div class="mx-auto max-w-6xl px-4 py-8">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white dark:text-white">
						Character Stats
					</h1>
					<p class="text-sm text-gray-600 dark:text-neutral-300 dark:text-neutral-300">
						Track your growth across different areas of life
					</p>
				</div>
				<button
					class="flex items-center gap-2 self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 md:self-auto dark:bg-blue-500 dark:hover:bg-blue-600"
					onclick={() => (showCreateForm = true)}
				>
					<icons.Plus size={16} />
					New Stat
				</button>
			</div>
		</div>
	</div>

	<!-- Quick Stats Overview -->
	{#if !loading && enabledStats.length > 0}
		<div class="mx-auto max-w-6xl px-4 py-6">
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div
					class="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-800"
				>
					<div class="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
						{enabledStats.length}
					</div>
					<div class="text-sm text-gray-600 dark:text-neutral-300 dark:text-neutral-300">
						Active Stats
					</div>
				</div>
				<div
					class="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-800"
				>
					<div class="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
						{totalLevel}
					</div>
					<div class="text-sm text-gray-600 dark:text-neutral-300 dark:text-neutral-300">
						Total Levels
					</div>
				</div>
				<div
					class="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-800"
				>
					<div class="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
						{totalXP.toLocaleString()}
					</div>
					<div class="text-sm text-gray-600 dark:text-neutral-300 dark:text-neutral-300">
						Total XP
					</div>
				</div>
				<div
					class="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-800"
				>
					<div class="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
						{averageLevel}
					</div>
					<div class="text-sm text-gray-600 dark:text-neutral-300 dark:text-neutral-300">
						Avg Level
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Error Alert -->
	{#if error}
		<div class="mx-auto max-w-6xl px-4">
			<div class="mb-6 rounded-md border-l-4 border-red-400 bg-red-50 p-4">
				<div class="flex items-center">
					<icons.AlertCircle class="mr-3 text-red-400" size={20} />
					<p class="text-sm text-red-700">{error}</p>
					<button class="ml-auto p-1 text-red-400 hover:text-red-600" onclick={() => (error = '')}>
						<icons.X size={16} />
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Content -->
	<div class="mx-auto max-w-6xl px-4 pb-8">
		{#if loading}
			<div class="flex justify-center py-12">
				<div class="flex items-center gap-3">
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
					></div>
					<span class="text-sm text-gray-600 dark:text-neutral-300">Loading stats...</span>
				</div>
			</div>
		{:else if stats.length === 0}
			<div
				class="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-800"
			>
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
				>
					<icons.TrendingUp class="text-gray-400" size={32} />
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">No stats yet</h2>
				<p class="mx-auto mb-6 max-w-sm text-sm text-gray-600 dark:text-neutral-300">
					Start tracking your growth by creating your first character stat
				</p>
				<button
					class="mx-auto flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					onclick={() => (showCreateForm = true)}
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
					<div class="mb-6 flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-xl dark:border-neutral-700 dark:bg-neutral-800"
						>
							{categoryInfo.icon}
						</div>
						<div>
							<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
								{categoryInfo.label}
							</h2>
							<p class="text-sm text-gray-600 dark:text-neutral-300">{categoryInfo.description}</p>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{#each categoryStats as stat}
							<div
								class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 {!stat.enabled
									? 'opacity-60'
									: ''}"
							>
								<div class="p-6">
									<!-- Stat Header -->
									<div class="mb-4 flex items-start justify-between">
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 {!stat.enabled
													? 'grayscale'
													: ''}"
											>
												{#if stat.icon}
													<svelte:component
														this={getIconComponent(stat.icon)}
														size={20}
														class="text-gray-700"
													/>
												{:else}
													<icons.Circle size={20} class="text-gray-400" />
												{/if}
											</div>
											<div>
												<h3
													class="font-semibold text-gray-900 dark:text-white {!stat.enabled
														? 'text-gray-500'
														: ''}"
												>
													{stat.name}
												</h3>
												{#if !stat.enabled}
													<span
														class="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500"
													>
														Disabled
													</span>
												{/if}
											</div>
										</div>

										<!-- Actions Menu -->
										<div class="relative">
											<button
												class="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-300"
												onclick={(e) => {
													e.preventDefault();
													const dropdown = e.currentTarget.nextElementSibling;
													dropdown?.classList.toggle('hidden');
												}}
											>
												<icons.MoreVertical size={16} />
											</button>
											<div
												class="absolute top-full right-0 z-10 mt-1 hidden w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
											>
												<button
													class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:bg-neutral-900"
													onclick={() => startEdit(stat)}
												>
													<icons.Edit2 size={14} />
													Edit
												</button>
												<button
													class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:bg-neutral-900"
													onclick={() => toggleStatEnabled(stat)}
												>
													{#if stat.enabled}
														<icons.EyeOff size={14} />
														Disable
													{:else}
														<icons.Eye size={14} />
														Enable
													{/if}
												</button>
												<hr class="my-1" />
												<button
													class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
													onclick={() => deleteStat(stat.id)}
												>
													<icons.Trash2 size={14} />
													Delete
												</button>
											</div>
										</div>
									</div>

									<!-- Description -->
									{#if stat.description}
										<p
											class="mb-4 text-sm text-gray-600 dark:text-neutral-300 {!stat.enabled
												? 'text-gray-400'
												: ''}"
										>
											{stat.description}
										</p>
									{/if}

									<!-- Level & Progress -->
									<div class="mb-4">
										<div class="mb-2 flex items-center justify-between">
											<span
												class="text-sm font-medium text-gray-900 dark:text-white {!stat.enabled
													? 'text-gray-400'
													: ''}"
											>
												Level {stat.level}
											</span>
											<span class="text-xs text-gray-500">
												{stat.xp} XP
											</span>
										</div>

										<div class="h-2 w-full rounded-full bg-gray-200">
											<div
												class="h-2 rounded-full bg-blue-600 transition-all duration-300 {!stat.enabled
													? 'opacity-40'
													: ''}"
												style="width: {getProgressWidth(stat)}%"
											></div>
										</div>

										{#if canLevelUp(stat)}
											<div class="mt-2 flex items-center gap-1 text-xs text-green-600">
												<icons.Star size={12} />
												Ready to level up!
											</div>
										{:else}
											<div class="mt-2 text-xs text-gray-500">
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
														class="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
														onclick={() => levelUpStat(stat.id)}
													>
														<icons.Star size={12} />
														Level Up!
													</button>
												{:else}
													<button
														class="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
														onclick={() => incrementStat(stat.id, 1)}
													>
														+25 XP
													</button>
													<button
														class="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
														onclick={() => incrementStat(stat.id, 5)}
													>
														+125 XP
													</button>
												{/if}
											</div>
											<button
												class="p-1 text-gray-400 hover:text-gray-600 dark:text-neutral-300"
												onclick={() => startEdit(stat)}
											>
												<icons.Settings size={14} />
											</button>
										</div>
									{:else}
										<div class="flex justify-center">
											<button
												class="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
												onclick={() => toggleStatEnabled(stat)}
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
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-xl dark:bg-neutral-800"
		>
			<!-- Modal Header -->
			<div
				class="flex items-center justify-between border-b border-gray-200 p-6 dark:border-neutral-700"
			>
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
					{editingStat ? 'Edit Stat' : 'Create New Stat'}
				</h2>
				<button
					class="p-1 text-gray-400 hover:text-gray-600 dark:text-neutral-300"
					onclick={resetForm}
				>
					<icons.X size={20} />
				</button>
			</div>

			<form onsubmit={preventDefault(handleSubmit)} class="space-y-6 p-6">
				<!-- Class Recommendations (only show for new stats) -->
				{#if !editingStat && userData?.className}
					{@const classDef = findClassByName(userData.className)}
					{@const recommendedStats = getRecommendedStats()}

					{#if classDef && recommendedStats.length > 0}
						<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
							<div class="mb-3 flex items-center gap-2">
								<div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
									🎭
								</div>
								<h3 class="font-medium text-blue-900">
									Recommended for {userData.className}
								</h3>
							</div>
							<p class="mb-3 text-sm text-blue-700">
								These stats complement your class. Click to add one:
							</p>
							<div class="flex flex-wrap gap-2">
								{#each recommendedStats as statName}
									{@const statDef = findStatByName(statName)}
									{#if statDef}
										<button
											type="button"
											class="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200"
											onclick={() => addStatFromLibrary(statName)}
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
					<div class="rounded-lg border border-gray-200 dark:border-neutral-700">
						<button
							type="button"
							class="flex w-full items-center justify-between p-4 text-left"
							onclick={(e) => {
								const content = e.currentTarget.nextElementSibling;
								content?.classList.toggle('hidden');
							}}
						>
							<div class="flex items-center gap-2">
								<icons.BookOpen size={16} class="text-gray-600 dark:text-neutral-300" />
								<span class="font-medium text-gray-900 dark:text-white">Browse Stat Library</span>
							</div>
							<icons.ChevronDown size={16} class="text-gray-400" />
						</button>
						<div class="hidden space-y-4 border-t border-gray-200 p-4 dark:border-neutral-700">
							{#each Object.entries(getStatsByCategory()) as [category, categoryStats]}
								<div>
									<h4 class="mb-3 text-sm font-medium text-gray-900 capitalize dark:text-white">
										{category}
									</h4>
									<div class="space-y-2">
										{#each categoryStats as stat}
											{@const isAlreadyAdded = stats.some((s) => s.name === stat.name)}
											<button
												type="button"
												class="w-full rounded-md border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 {isAlreadyAdded
													? 'cursor-not-allowed opacity-50'
													: ''}"
												onclick={() => !isAlreadyAdded && addStatFromLibrary(stat.name)}
												disabled={isAlreadyAdded}
											>
												<div class="flex items-center justify-between">
													<div>
														<div class="flex items-center gap-2">
															<span class="font-medium text-gray-900 dark:text-white"
																>{stat.name}</span
															>
															{#if isStatRecommended(stat.name)}
																<span
																	class="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
																>
																	Recommended
																</span>
															{/if}
															{#if isAlreadyAdded}
																<span
																	class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500"
																>
																	Added
																</span>
															{/if}
														</div>
														<p class="mt-1 text-sm text-gray-600 dark:text-neutral-300">
															{stat.description}
														</p>
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
							<div class="w-full border-t border-gray-200 dark:border-neutral-700"></div>
						</div>
						<div class="relative flex justify-center">
							<span class="bg-white px-3 text-sm text-gray-500 dark:bg-neutral-800"
								>Or create a custom stat</span
							>
						</div>
					</div>
				{/if}

				<!-- Form Fields -->
				<div class="space-y-4">
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							Name <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							bind:value={formData.name}
							placeholder="e.g. Strength, Wisdom, Charisma"
							required
						/>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700"> Description </label>
						<textarea
							class="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							bind:value={formData.description}
							placeholder="What this stat represents and why it matters to you..."
							rows="3"
						></textarea>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700"> Category </label>
							<select
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								bind:value={formData.category}
							>
								{#each categoryOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700"> Icon </label>
							<IconPicker 
								bind:selectedIcon={formData.icon}
								availableIcons={availableIcons}
								showPreview={false}
							/>
							{#if formData.icon}
								<div class="mt-2 flex items-center gap-2">
									<span class="text-sm text-gray-600 dark:text-neutral-300">Preview:</span>
									<svelte:component
										this={getIconComponent(formData.icon)}
										size={16}
										class="text-gray-700"
									/>
								</div>
							{/if}
						</div>
					</div>

					<!-- Day of Week Assignment -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700"> 
							Day of Week (Optional)
						</label>
						<select
							bind:value={formData.dayOfWeek}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="">No specific day</option>
							<option value="Monday">Monday</option>
							<option value="Tuesday">Tuesday</option>
							<option value="Wednesday">Wednesday</option>
							<option value="Thursday">Thursday</option>
							<option value="Friday">Friday</option>
							<option value="Saturday">Saturday</option>
							<option value="Sunday">Sunday</option>
						</select>
						<p class="mt-1 text-xs text-gray-500">
							Assign this stat to a specific day for GPT task generation
						</p>
					</div>

					<!-- Sample Tasks -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700"> 
							Sample Tasks (Optional)
						</label>
						<div class="space-y-2">
							{#each formData.sampleTasks as task, index}
								<div class="flex gap-2">
									<input
										type="text"
										bind:value={formData.sampleTasks[index]}
										placeholder="Enter a sample task..."
										class="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
									/>
									<button
										type="button"
										onclick={() => {
											formData.sampleTasks = formData.sampleTasks.filter((_, i) => i !== index);
										}}
										class="rounded-lg border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50"
									>
										Remove
									</button>
								</div>
							{/each}
							<button
								type="button"
								onclick={() => {
									formData.sampleTasks = [...formData.sampleTasks, ''];
								}}
								class="rounded-lg border border-gray-300 px-3 py-2 text-gray-600 hover:bg-gray-50"
							>
								+ Add Sample Task
							</button>
						</div>
						<p class="mt-1 text-xs text-gray-500">
							These tasks will inspire GPT when generating daily tasks for this stat
						</p>
					</div>

					<div class="flex items-center">
						<input
							type="checkbox"
							id="enabled"
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							bind:checked={formData.enabled}
						/>
						<label for="enabled" class="ml-2 block text-sm text-gray-700">
							Enable this stat (you can disable it later)
						</label>
					</div>
				</div>

				<!-- Form Actions -->
				<div
					class="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-neutral-700"
				>
					<button
						type="button"
						class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:bg-neutral-800 dark:bg-neutral-900"
						onclick={resetForm}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					>
						{editingStat ? 'Update Stat' : 'Create Stat'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
