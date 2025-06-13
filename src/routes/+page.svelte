<script lang="ts">
	import { BookOpen, Target, BarChart3, Plus } from 'lucide-svelte';
	
	let { data } = $props();
	let recentEntries = $state([]);
	let activeExperiments = $state([]);
	let characterStats = $state([]);
	let loading = $state(true);
	
	$effect(() => {
		loadDashboardData();
	});
	
	async function loadDashboardData() {
		loading = true;
		try {
			// Load dashboard data
			const [entriesRes, experimentsRes, statsRes] = await Promise.all([
				fetch('/api/journal?limit=3'),
				fetch('/api/experiments?active=true&limit=3'),
				fetch('/api/stats?limit=5')
			]);
			
			if (entriesRes.ok) {
				const data = await entriesRes.json();
				recentEntries = data.entries || [];
			}
			
			if (experimentsRes.ok) {
				const data = await experimentsRes.json();
				activeExperiments = data.experiments || [];
			}
			
			if (statsRes.ok) {
				const data = await statsRes.json();
				characterStats = data.stats || [];
			}
		} catch (error) {
			console.error('Error loading dashboard:', error);
		} finally {
			loading = false;
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Dashboard - Journal App</title>
	<meta name="description" content="Your personal journaling dashboard" />
</svelte:head>

<div class="space-y-8">
	<!-- Dashboard for logged-in users -->
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Welcome back, {data.user.username}!</h1>
			<p class="text-base-content/70 mt-1">Ready to reflect on your journey?</p>
		</div>
		<a href="/journal/new" class="btn btn-primary gap-2">
			<Plus size={20} />
			New Journal Entry
		</a>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else}
		<!-- Quick Actions -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<a href="/journal" class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
				<div class="card-body">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-primary/10 rounded-lg">
							<BookOpen size={24} class="text-primary" />
						</div>
						<div>
							<h3 class="font-semibold">Journal</h3>
							<p class="text-sm text-base-content/70">
								{recentEntries.length} recent entries
							</p>
						</div>
					</div>
				</div>
			</a>

				<a href="/experiments" class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
					<div class="card-body">
						<div class="flex items-center gap-3">
							<div class="p-2 bg-secondary/10 rounded-lg">
								<Target size={24} class="text-secondary" />
							</div>
							<div>
								<h3 class="font-semibold">Experiments</h3>
								<p class="text-sm text-base-content/70">
									{activeExperiments.length} active experiments
								</p>
							</div>
						</div>
					</div>
				</a>

				<a href="/stats" class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
					<div class="card-body">
						<div class="flex items-center gap-3">
							<div class="p-2 bg-accent/10 rounded-lg">
								<BarChart3 size={24} class="text-accent" />
							</div>
							<div>
								<h3 class="font-semibold">Character Stats</h3>
								<p class="text-sm text-base-content/70">
									{characterStats.length} stats tracked
								</p>
							</div>
						</div>
					</div>
				</a>
			</div>

			<!-- Recent Activity -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Recent Journal Entries -->
				<div class="card bg-base-100 border border-base-300">
					<div class="card-body">
						<div class="flex items-center justify-between mb-4">
							<h2 class="card-title">Recent Journal Entries</h2>
							<a href="/journal" class="link link-primary text-sm">View all</a>
						</div>
						
						{#if recentEntries.length === 0}
							<div class="text-center py-8">
								<BookOpen size={48} class="mx-auto text-base-content/30 mb-3" />
								<p class="text-base-content/70">No journal entries yet</p>
								<a href="/journal/new" class="btn btn-primary btn-sm mt-3">
									Start journaling
								</a>
							</div>
						{:else}
							<div class="space-y-3">
								{#each recentEntries as entry}
									<a 
										href="/journal/{entry.id}" 
										class="block p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
									>
										<div class="flex justify-between items-start">
											<div class="flex-1">
												<h3 class="font-medium text-sm">
													{entry.title || 'Untitled Entry'}
												</h3>
												{#if entry.synopsis}
													<p class="text-xs text-base-content/70 mt-1 line-clamp-2">
														{entry.synopsis}
													</p>
												{/if}
											</div>
											<span class="text-xs text-base-content/50 ml-3">
												{formatDate(entry.createdAt)}
											</span>
										</div>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Active Experiments -->
				<div class="card bg-base-100 border border-base-300">
					<div class="card-body">
						<div class="flex items-center justify-between mb-4">
							<h2 class="card-title">Active Experiments</h2>
							<a href="/experiments" class="link link-primary text-sm">View all</a>
						</div>
						
						{#if activeExperiments.length === 0}
							<div class="text-center py-8">
								<Target size={48} class="mx-auto text-base-content/30 mb-3" />
								<p class="text-base-content/70">No active experiments</p>
								<a href="/experiments/new" class="btn btn-secondary btn-sm mt-3">
									Start an experiment
								</a>
							</div>
						{:else}
							<div class="space-y-3">
								{#each activeExperiments as experiment}
									<a 
										href="/experiments/{experiment.id}" 
										class="block p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
									>
										<div class="flex justify-between items-start">
											<div class="flex-1">
												<h3 class="font-medium text-sm">{experiment.title}</h3>
												{#if experiment.description}
													<p class="text-xs text-base-content/70 mt-1 line-clamp-2">
														{experiment.description}
													</p>
												{/if}
											</div>
											<span class="text-xs text-base-content/50 ml-3">
												{formatDate(experiment.endDate)}
											</span>
										</div>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Character Stats Preview -->
			{#if characterStats.length > 0}
				<div class="card bg-base-100 border border-base-300">
					<div class="card-body">
						<div class="flex items-center justify-between mb-4">
							<h2 class="card-title">Character Development</h2>
							<a href="/stats" class="link link-primary text-sm">View all</a>
						</div>
						
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each characterStats.slice(0, 6) as stat}
								<div class="p-3 bg-base-200 rounded-lg">
									<div class="flex justify-between items-center mb-2">
										<h3 class="font-medium text-sm">{stat.name}</h3>
										<span class="text-xs text-base-content/70">Lv {stat.level || 1}</span>
									</div>
									<div class="progress progress-primary w-full h-2">
										<div 
											class="progress-bar" 
											style="width: {stat.progress || 0}%"
										></div>
									</div>
									<p class="text-xs text-base-content/50 mt-1">
										{stat.currentXp || 0} XP
									</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		{/if}
	{:else}
		<!-- Landing page for non-logged-in users -->
		<div class="hero min-h-[50vh] bg-base-200 rounded-xl">
			<div class="hero-content text-center">
				<div class="max-w-md">
					<h1 class="text-5xl font-bold">Journal App</h1>
					<p class="py-6">
						Track your personal growth, reflect on your experiences, 
						and gain insights from your daily journal entries.
					</p>
					<div class="flex flex-wrap justify-center gap-4">
						<a href="/auth/login" class="btn btn-primary gap-2">
							<LogIn size={18} />
							Log In
						</a>
						<a href="/auth/register" class="btn btn-outline gap-2">
							Sign Up
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Features -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="card bg-base-100 border border-base-300">
				<div class="card-body">
					<h2 class="card-title flex items-center gap-2">
						<PenLine size={20} />
						Personal Journal
					</h2>
					<p>Write daily reflections and get AI-powered insights to understand patterns in your thoughts and emotions.</p>
				</div>
			</div>
			
			<div class="card bg-base-100 border border-base-300">
				<div class="card-body">
					<h2 class="card-title flex items-center gap-2">
						<Target size={20} />
						Self-Experiments
					</h2>
					<p>Create experiments to test lifestyle changes and track how they affect your wellbeing over time.</p>
				</div>
			</div>
			
			<div class="card bg-base-100 border border-base-300">
				<div class="card-body">
					<h2 class="card-title flex items-center gap-2">
						<Sparkles size={20} />
						Character Stats
					</h2>
					<p>Earn XP and level up your personal attributes by completing tasks and writing journal entries.</p>
				</div>
			</div>
		</div>
	{/if}

			<a href="/experiments" class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
				<div class="card-body">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-secondary/10 rounded-lg">
							<Target size={24} class="text-secondary" />
						</div>
						<div>
							<h3 class="font-semibold">Experiments</h3>
							<p class="text-sm text-base-content/70">
								{activeExperiments.length} active experiments
							</p>
						</div>
					</div>
				</div>
			</a>

			<a href="/stats" class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
				<div class="card-body">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-accent/10 rounded-lg">
							<BarChart3 size={24} class="text-accent" />
						</div>
						<div>
							<h3 class="font-semibold">Character Stats</h3>
							<p class="text-sm text-base-content/70">
								{characterStats.length} stats tracked
							</p>
						</div>
					</div>
				</div>
			</a>
		</div>

		<!-- Recent Activity -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Recent Journal Entries -->
			<div class="card bg-base-100 border border-base-300">
				<div class="card-body">
					<div class="flex items-center justify-between mb-4">
						<h2 class="card-title">Recent Journal Entries</h2>
						<a href="/journal" class="link link-primary text-sm">View all</a>
					</div>
					
					{#if recentEntries.length === 0}
						<div class="text-center py-8">
							<BookOpen size={48} class="mx-auto text-base-content/30 mb-3" />
							<p class="text-base-content/70">No journal entries yet</p>
							<a href="/journal/new" class="btn btn-primary btn-sm mt-3">
								Start journaling
							</a>
						</div>
					{:else}
						<div class="space-y-3">
							{#each recentEntries as entry}
								<a 
									href="/journal/{entry.id}" 
									class="block p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
								>
									<div class="flex justify-between items-start">
										<div class="flex-1">
											<h3 class="font-medium text-sm">
												{entry.title || 'Untitled Entry'}
											</h3>
											{#if entry.synopsis}
												<p class="text-xs text-base-content/70 mt-1 line-clamp-2">
													{entry.synopsis}
												</p>
											{/if}
										</div>
										<span class="text-xs text-base-content/50 ml-3">
											{formatDate(entry.createdAt)}
										</span>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Active Experiments -->
			<div class="card bg-base-100 border border-base-300">
				<div class="card-body">
					<div class="flex items-center justify-between mb-4">
						<h2 class="card-title">Active Experiments</h2>
						<a href="/experiments" class="link link-primary text-sm">View all</a>
					</div>
					
					{#if activeExperiments.length === 0}
						<div class="text-center py-8">
							<Target size={48} class="mx-auto text-base-content/30 mb-3" />
							<p class="text-base-content/70">No active experiments</p>
							<a href="/experiments/new" class="btn btn-secondary btn-sm mt-3">
								Start an experiment
							</a>
						</div>
					{:else}
						<div class="space-y-3">
							{#each activeExperiments as experiment}
								<a 
									href="/experiments/{experiment.id}" 
									class="block p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
								>
									<div class="flex justify-between items-start">
										<div class="flex-1">
											<h3 class="font-medium text-sm">{experiment.title}</h3>
											{#if experiment.description}
												<p class="text-xs text-base-content/70 mt-1 line-clamp-2">
													{experiment.description}
												</p>
											{/if}
										</div>
										<span class="text-xs text-base-content/50 ml-3">
											{formatDate(experiment.endDate)}
										</span>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Character Stats Preview -->
		{#if characterStats.length > 0}
			<div class="card bg-base-100 border border-base-300">
				<div class="card-body">
					<div class="flex items-center justify-between mb-4">
						<h2 class="card-title">Character Development</h2>
						<a href="/stats" class="link link-primary text-sm">View all</a>
					</div>
					
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each characterStats.slice(0, 6) as stat}
							<div class="p-3 bg-base-200 rounded-lg">
								<div class="flex justify-between items-center mb-2">
									<h3 class="font-medium text-sm">{stat.name}</h3>
									<span class="text-xs text-base-content/70">Lv {stat.level || 1}</span>
								</div>
								<div class="progress progress-primary w-full h-2">
									<div 
										class="progress-bar" 
										style="width: {stat.progress || 0}%"
									></div>
								</div>
								<p class="text-xs text-base-content/50 mt-1">
									{stat.currentXp || 0} XP
								</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
