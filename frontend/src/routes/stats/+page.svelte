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
		enabled: true
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
	const availableIcons = availableIconsList.map((iconName) => {
		// Create friendly labels from icon names
		const label = iconName
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
				color: 'text-base-content/70 dark:text-neutral-300'
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

<div class="bg-base-200 min-h-screen dark:bg-neutral-900 dark:bg-neutral-900">
	<!-- Hero Section -->
	<div
		class="border-base-300 bg-base-100 border-b dark:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-800"
	>
		<div class="mx-auto max-w-6xl px-4 py-8">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1
						class="text-base-content dark:text-primary-content dark:text-primary-content mb-2 text-3xl font-bold"
					>
						Character Stats
					</h1>
					<p class="text-base-content/70 text-sm dark:text-neutral-300 dark:text-neutral-300">
						Track your growth across different areas of life
					</p>
				</div>
				<button
					class="bg-primary text-primary-content hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary flex items-center gap-2 self-start rounded-md px-4 py-2 text-sm font-medium transition-colors md:self-auto"
					on:click={() => (showCreateForm = true)}
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
					class="border-base-300 bg-base-100 rounded-md border p-4 shadow-sm dark:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-800"
				>
					<div
						class="text-base-content dark:text-primary-content dark:text-primary-content text-2xl font-bold"
					>
						{enabledStats.length}
					</div>
					<div class="text-base-content/70 text-sm dark:text-neutral-300 dark:text-neutral-300">
						Active Stats
					</div>
				</div>
				<div
					class="border-base-300 bg-base-100 rounded-md border p-4 shadow-sm dark:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-800"
				>
					<div
						class="text-base-content dark:text-primary-content dark:text-primary-content text-2xl font-bold"
					>
						{totalLevel}
					</div>
					<div class="text-base-content/70 text-sm dark:text-neutral-300 dark:text-neutral-300">
						Total Levels
					</div>
				</div>
				<div
					class="border-base-300 bg-base-100 rounded-md border p-4 shadow-sm dark:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-800"
				>
					<div
						class="text-base-content dark:text-primary-content dark:text-primary-content text-2xl font-bold"
					>
						{totalXP.toLocaleString()}
					</div>
					<div class="text-base-content/70 text-sm dark:text-neutral-300 dark:text-neutral-300">
						Total XP
					</div>
				</div>
				<div
					class="border-base-300 bg-base-100 rounded-md border p-4 shadow-sm dark:border-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:bg-neutral-800"
				>
					<div
						class="text-base-content dark:text-primary-content dark:text-primary-content text-2xl font-bold"
					>
						{averageLevel}
					</div>
					<div class="text-base-content/70 text-sm dark:text-neutral-300 dark:text-neutral-300">
						Avg Level
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Error Alert -->
	{#if error}
		<div class="mx-auto max-w-6xl px-4">
			<div class="bg-error/10 mb-6 rounded-md border-l-4 border-red-400 p-4">
				<div class="flex items-center">
					<icons.AlertCircle class="mr-3 text-red-400" size={20} />
					<p class="text-error text-sm">{error}</p>
					<button class="hover:text-error ml-auto p-1 text-red-400" on:click={() => (error = '')}>
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
						class="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
					></div>
					<span class="text-base-content/70 text-sm dark:text-neutral-300">Loading stats...</span>
				</div>
			</div>
		{:else if stats.length === 0}
			<div
				class="border-base-300 bg-base-100 rounded-lg border p-12 text-center dark:border-neutral-700 dark:bg-neutral-800"
			>
				<div
					class="bg-base-200 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
				>
					<icons.TrendingUp class="text-base-content/50" size={32} />
				</div>
				<h2 class="text-base-content dark:text-primary-content mb-2 text-xl font-semibold">
					No stats yet
				</h2>
				<p class="text-base-content/70 mx-auto mb-6 max-w-sm text-sm dark:text-neutral-300">
					Start tracking your growth by creating your first character stat
				</p>
				<button
					class="bg-primary text-primary-content hover:bg-primary/90 mx-auto flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
					on:click={() => (showCreateForm = true)}
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
							class="border-base-300 bg-base-100 flex h-10 w-10 items-center justify-center rounded-lg border text-xl dark:border-neutral-700 dark:bg-neutral-800"
						>
							{categoryInfo.icon}
						</div>
						<div>
							<h2 class="text-base-content dark:text-primary-content text-xl font-semibold">
								{categoryInfo.label}
							</h2>
							<p class="text-base-content/70 text-sm dark:text-neutral-300">
								{categoryInfo.description}
							</p>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{#each categoryStats as stat}
							<div
								class="border-base-300 bg-base-100 rounded-lg border shadow-sm transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 {!stat.enabled
									? 'opacity-60'
									: ''}"
							>
								<div class="p-6">
									<!-- Stat Header -->
									<div class="mb-4 flex items-start justify-between">
										<div class="flex items-center gap-3">
											<div
												class="bg-base-200 flex h-10 w-10 items-center justify-center rounded-lg {!stat.enabled
													? 'grayscale'
													: ''}"
											>
												{#if stat.icon}
													<svelte:component
														this={getIconComponent(stat.icon)}
														size={20}
														class="text-base-content/80"
													/>
												{:else}
													<icons.Circle size={20} class="text-base-content/50" />
												{/if}
											</div>
											<div>
												<h3
													class="text-base-content dark:text-primary-content font-semibold {!stat.enabled
														? 'text-base-content/60'
														: ''}"
												>
													{stat.name}
												</h3>
												{#if !stat.enabled}
													<span
														class="bg-base-200 text-base-content/60 mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
													>
														Disabled
													</span>
												{/if}
											</div>
										</div>

										<!-- Actions Menu -->
										<div class="relative">
											<button
												class="text-base-content/50 hover:bg-base-200 hover:text-base-content/70 flex h-8 w-8 items-center justify-center rounded-md transition-colors dark:text-neutral-300"
												on:click={(e) => {
													e.preventDefault();
													const dropdown = e.currentTarget.nextElementSibling;
													dropdown?.classList.toggle('hidden');
												}}
											>
												<icons.MoreVertical size={16} />
											</button>
											<div
												class="border-base-300 bg-base-100 absolute top-full right-0 z-10 mt-1 hidden w-48 rounded-md border shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
											>
												<button
													class="text-base-content/80 hover:bg-base-200 flex w-full items-center gap-2 px-4 py-2 text-left text-sm dark:bg-neutral-900"
													on:click={() => startEdit(stat)}
												>
													<icons.Edit2 size={14} />
													Edit
												</button>
												<button
													class="text-base-content/80 hover:bg-base-200 flex w-full items-center gap-2 px-4 py-2 text-left text-sm dark:bg-neutral-900"
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
												<hr class="my-1" />
												<button
													class="text-error hover:bg-error/10 flex w-full items-center gap-2 px-4 py-2 text-left text-sm"
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
										<p
											class="text-base-content/70 mb-4 text-sm dark:text-neutral-300 {!stat.enabled
												? 'text-base-content/50'
												: ''}"
										>
											{stat.description}
										</p>
									{/if}

									<!-- Level & Progress -->
									<div class="mb-4">
										<div class="mb-2 flex items-center justify-between">
											<span
												class="text-base-content dark:text-primary-content text-sm font-medium {!stat.enabled
													? 'text-base-content/50'
													: ''}"
											>
												Level {stat.level}
											</span>
											<span class="text-base-content/60 text-xs">
												{stat.xp} XP
											</span>
										</div>

										<div class="bg-base-300 h-2 w-full rounded-full">
											<div
												class="bg-primary h-2 rounded-full transition-all duration-300 {!stat.enabled
													? 'opacity-40'
													: ''}"
												style="width: {getProgressWidth(stat)}%"
											></div>
										</div>

										{#if canLevelUp(stat)}
											<div class="text-success mt-2 flex items-center gap-1 text-xs">
												<icons.Star size={12} />
												Ready to level up!
											</div>
										{:else}
											<div class="text-base-content/60 mt-2 text-xs">
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
														class="bg-success text-primary-content hover:bg-success/90 flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
														on:click={() => levelUpStat(stat.id)}
													>
														<icons.Star size={12} />
														Level Up!
													</button>
												{:else}
													<button
														class="bg-base-200 text-base-content/80 hover:bg-base-300 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
														on:click={() => incrementStat(stat.id, 1)}
													>
														+25 XP
													</button>
													<button
														class="bg-base-200 text-base-content/80 hover:bg-base-300 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
														on:click={() => incrementStat(stat.id, 5)}
													>
														+125 XP
													</button>
												{/if}
											</div>
											<button
												class="text-base-content/50 hover:text-base-content/70 p-1 dark:text-neutral-300"
												on:click={() => startEdit(stat)}
											>
												<icons.Settings size={14} />
											</button>
										</div>
									{:else}
										<div class="flex justify-center">
											<button
												class="border-primary/20 bg-primary/5 text-info hover:bg-primary/10 rounded-md border px-4 py-2 text-xs font-medium transition-colors"
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
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div
			class="bg-base-100 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg shadow-xl dark:bg-neutral-800"
		>
			<!-- Modal Header -->
			<div
				class="border-base-300 flex items-center justify-between border-b p-6 dark:border-neutral-700"
			>
				<h2 class="text-base-content dark:text-primary-content text-xl font-semibold">
					{editingStat ? 'Edit Stat' : 'Create New Stat'}
				</h2>
				<button
					class="text-base-content/50 hover:text-base-content/70 p-1 dark:text-neutral-300"
					on:click={resetForm}
				>
					<icons.X size={20} />
				</button>
			</div>

			<form on:submit|preventDefault={handleSubmit} class="space-y-6 p-6">
				<!-- Class Recommendations (only show for new stats) -->
				{#if !editingStat && userData?.className}
					{@const classDef = findClassByName(userData.className)}
					{@const recommendedStats = getRecommendedStats()}

					{#if classDef && recommendedStats.length > 0}
						<div class="border-primary/20 bg-primary/5 rounded-lg border p-4">
							<div class="mb-3 flex items-center gap-2">
								<div class="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
									🎭
								</div>
								<h3 class="font-medium text-blue-900">
									Recommended for {userData.className}
								</h3>
							</div>
							<p class="text-primary mb-3 text-sm">
								These stats complement your class. Click to add one:
							</p>
							<div class="flex flex-wrap gap-2">
								{#each recommendedStats as statName}
									{@const statDef = findStatByName(statName)}
									{#if statDef}
										<button
											type="button"
											class="bg-primary/10 text-primary rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-blue-200"
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
					<div class="border-base-300 rounded-lg border dark:border-neutral-700">
						<button
							type="button"
							class="flex w-full items-center justify-between p-4 text-left"
							on:click={(e) => {
								const content = e.currentTarget.nextElementSibling;
								content?.classList.toggle('hidden');
							}}
						>
							<div class="flex items-center gap-2">
								<icons.BookOpen size={16} class="text-base-content/70 dark:text-neutral-300" />
								<span class="text-base-content dark:text-primary-content font-medium"
									>Browse Stat Library</span
								>
							</div>
							<icons.ChevronDown size={16} class="text-base-content/50" />
						</button>
						<div class="border-base-300 hidden space-y-4 border-t p-4 dark:border-neutral-700">
							{#each Object.entries(getStatsByCategory()) as [category, categoryStats]}
								<div>
									<h4
										class="text-base-content dark:text-primary-content mb-3 text-sm font-medium capitalize"
									>
										{category}
									</h4>
									<div class="space-y-2">
										{#each categoryStats as stat}
											{@const isAlreadyAdded = stats.some((s) => s.name === stat.name)}
											<button
												type="button"
												class="border-base-300 hover:bg-base-200 w-full rounded-md border p-3 text-left transition-colors dark:border-neutral-700 dark:bg-neutral-900 {isAlreadyAdded
													? 'cursor-not-allowed opacity-50'
													: ''}"
												on:click={() => !isAlreadyAdded && addStatFromLibrary(stat.name)}
												disabled={isAlreadyAdded}
											>
												<div class="flex items-center justify-between">
													<div>
														<div class="flex items-center gap-2">
															<span class="text-base-content dark:text-primary-content font-medium"
																>{stat.name}</span
															>
															{#if isStatRecommended(stat.name)}
																<span
																	class="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
																>
																	Recommended
																</span>
															{/if}
															{#if isAlreadyAdded}
																<span
																	class="bg-base-200 text-base-content/60 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
																>
																	Added
																</span>
															{/if}
														</div>
														<p class="text-base-content/70 mt-1 text-sm dark:text-neutral-300">
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
							<div class="border-base-300 w-full border-t dark:border-neutral-700"></div>
						</div>
						<div class="relative flex justify-center">
							<span class="bg-base-100 text-base-content/60 px-3 text-sm dark:bg-neutral-800"
								>Or create a custom stat</span
							>
						</div>
					</div>
				{/if}

				<!-- Form Fields -->
				<div class="space-y-4">
					<div>
						<label class="text-base-content/80 mb-2 block text-sm font-medium">
							Name <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							class="border-base-300 w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							bind:value={formData.name}
							placeholder="e.g. Strength, Wisdom, Charisma"
							required
						/>
					</div>

					<div>
						<label class="text-base-content/80 mb-2 block text-sm font-medium"> Description </label>
						<textarea
							class="border-base-300 w-full resize-none rounded-md border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							bind:value={formData.description}
							placeholder="What this stat represents and why it matters to you..."
							rows="3"
						></textarea>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="text-base-content/80 mb-2 block text-sm font-medium"> Category </label>
							<select
								class="border-base-300 w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								bind:value={formData.category}
							>
								{#each categoryOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label class="text-base-content/80 mb-2 block text-sm font-medium"> Icon </label>
							<IconPicker bind:selectedIcon={formData.icon} {availableIcons} showPreview={false} />
							{#if formData.icon}
								<div class="mt-2 flex items-center gap-2">
									<span class="text-base-content/70 text-sm dark:text-neutral-300">Preview:</span>
									<svelte:component
										this={getIconComponent(formData.icon)}
										size={16}
										class="text-base-content/80"
									/>
								</div>
							{/if}
						</div>
					</div>

					<div class="flex items-center">
						<input
							type="checkbox"
							id="enabled"
							class="border-base-300 text-info h-4 w-4 rounded focus:ring-blue-500"
							bind:checked={formData.enabled}
						/>
						<label for="enabled" class="text-base-content/80 ml-2 block text-sm">
							Enable this stat (you can disable it later)
						</label>
					</div>
				</div>

				<!-- Form Actions -->
				<div
					class="border-base-300 flex items-center justify-end gap-3 border-t pt-4 dark:border-neutral-700"
				>
					<button
						type="button"
						class="border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200 rounded-md border px-4 py-2 text-sm font-medium transition-colors dark:bg-neutral-800 dark:bg-neutral-900"
						on:click={resetForm}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="bg-primary text-primary-content hover:bg-primary/90 rounded-md border border-transparent px-4 py-2 text-sm font-medium transition-colors"
					>
						{editingStat ? 'Update Stat' : 'Create Stat'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
