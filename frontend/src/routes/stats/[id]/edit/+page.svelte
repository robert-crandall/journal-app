<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { statsApi } from '$lib/api/stats.js';
	import { 
		Edit, 
		ArrowLeft, 
		Save, 
		Plus, 
		Trash2,
		Target,
		Lightbulb
	} from 'lucide-svelte';
	
	// Type definitions
	interface Stat {
		id: string;
		name: string;
		description: string;
		currentLevel: number;
		totalXp: number;
		exampleActivities: Array<{
			description: string;
			suggestedXp: number;
		}>;
	}

	interface EditStatData {
		name: string;
		description: string;
		exampleActivities: Array<{
			description: string;
			suggestedXp: number;
		}>;
	}

	// State
	let stat = $state<Stat | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let submitting = $state(false);
	
	// Form state
	let formData = $state<EditStatData>({
		name: '',
		description: '',
		exampleActivities: [{ description: '', suggestedXp: 10 }]
	});

	// Derived values
	const statId = $derived($page.params.id);
	const isValid = $derived(() => {
		return formData.name.trim().length >= 2 &&
			   formData.description.trim().length >= 10 &&
			   formData.exampleActivities.length > 0 &&
			   formData.exampleActivities.every(activity => 
				   activity.description.trim().length > 0 && 
				   activity.suggestedXp > 0 && 
				   activity.suggestedXp <= 100
			   );
	});
	
	// Functions
	async function loadStat() {
		if (!$authStore.token || !statId) return;
		
		try {
			loading = true;
			error = null;
			stat = await statsApi.getStat(statId);
			
			// Populate form with current stat data
			formData = {
				name: stat.name,
				description: stat.description,
				exampleActivities: stat.exampleActivities.length > 0 
					? [...stat.exampleActivities]
					: [{ description: '', suggestedXp: 10 }]
			};
		} catch (err) {
			console.error('Error loading stat:', err);
			error = 'Failed to load stat details';
		} finally {
			loading = false;
		}
	}

	async function updateStat() {
		if (!stat || !isValid()) return;
		
		try {
			submitting = true;
			error = null;
			
			await statsApi.updateStat(stat.id, {
				name: formData.name.trim(),
				description: formData.description.trim(),
				exampleActivities: formData.exampleActivities.map(activity => ({
					description: activity.description.trim(),
					suggestedXp: activity.suggestedXp
				}))
			});
			
			// Redirect back to stat details
			goto(`/stats/${stat.id}`);
			
		} catch (err) {
			console.error('Error updating stat:', err);
			error = 'Failed to update stat. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function addExampleActivity() {
		formData.exampleActivities = [
			...formData.exampleActivities,
			{ description: '', suggestedXp: 10 }
		];
	}

	function removeExampleActivity(index: number) {
		if (formData.exampleActivities.length > 1) {
			formData.exampleActivities = formData.exampleActivities.filter((_, i) => i !== index);
		}
	}

	function goBack() {
		goto(`/stats/${statId}`);
	}

	// Lifecycle
	onMount(() => {
		if (!$authStore.token) {
			goto('/login');
			return;
		}
		loadStat();
	});
</script>

<!-- Page Header -->
<div class="container mx-auto px-4 py-8 max-w-4xl">
	<!-- Breadcrumb -->
	<div class="breadcrumbs text-sm mb-6">
		<ul>
			<li><a href="/stats" class="text-primary hover:text-primary-focus">Stats</a></li>
			<li>
				<a href="/stats/{statId}" class="text-primary hover:text-primary-focus">
					{stat?.name || 'Loading...'}
				</a>
			</li>
			<li class="text-base-content/60">Edit</li>
		</ul>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="flex items-center justify-center py-20">
			<div class="text-center">
				<span class="loading loading-spinner loading-lg text-primary"></span>
				<p class="mt-4 text-base-content/60">Loading stat details...</p>
			</div>
		</div>
	{:else if error && !stat}
		<!-- Error State -->
		<div class="card bg-error text-error-content shadow-xl">
			<div class="card-body text-center">
				<h2 class="card-title justify-center">
					<Edit size={24} />
					Error Loading Stat
				</h2>
				<p>{error}</p>
				<div class="card-actions justify-center">
					<button onclick={loadStat} class="btn btn-neutral">Try Again</button>
					<a href="/stats" class="btn btn-outline">Back to Stats</a>
				</div>
			</div>
		</div>
	{:else if stat}
		<!-- Main Content -->
		<div class="grid lg:grid-cols-3 gap-8">
			<!-- Edit Form - Spans 2 columns on large screens -->
			<div class="lg:col-span-2">
				<div class="card bg-base-100 shadow-xl border border-base-300">
					<div class="card-body">
						<!-- Header -->
						<div class="flex items-center gap-4 mb-6">
							<button onclick={goBack} class="btn btn-circle btn-outline btn-sm">
								<ArrowLeft size={16} />
							</button>
							<div>
								<h1 class="text-2xl font-bold text-primary flex items-center gap-2">
									<Edit size={24} />
									Edit {stat.name}
								</h1>
								<p class="text-base-content/60">Update your stat's details and example activities</p>
							</div>
						</div>

						<!-- Error Message -->
						{#if error}
							<div class="alert alert-error mb-6">
								<span>{error}</span>
							</div>
						{/if}

						<!-- Edit Form -->
						<form 
							onsubmit={(e) => {
								e.preventDefault();
								updateStat();
							}} 
							class="space-y-6"
						>
							<!-- Stat Name -->
							<div class="form-control">
								<label class="label" for="stat-name">
									<span class="label-text font-medium text-lg">Stat Name *</span>
								</label>
								<input
									id="stat-name"
									type="text"
									class="input input-bordered"
									placeholder="e.g., Programming Skills, Fitness Level, Reading Habit"
									bind:value={formData.name}
									maxlength="100"
									required
									disabled={submitting}
								/>
								<div class="label">
									<span class="label-text-alt">
										{formData.name.length}/100 characters
									</span>
								</div>
							</div>

							<!-- Description -->
							<div class="form-control">
								<label class="label" for="description">
									<span class="label-text font-medium text-lg">Description *</span>
									<span class="label-text-alt text-xs opacity-60">What this stat measures</span>
								</label>
								<textarea
									id="description"
									class="textarea textarea-bordered h-24 resize-none"
									placeholder="Describe what this stat represents and why it's important to you..."
									bind:value={formData.description}
									maxlength="500"
									required
									disabled={submitting}
								></textarea>
								<div class="label">
									<span class="label-text-alt">
										{formData.description.length}/500 characters
									</span>
								</div>
							</div>

							<!-- Example Activities -->
							<div class="form-control">
								<div class="label">
									<span class="label-text font-medium text-lg">Example Activities *</span>
									<span class="label-text-alt text-xs opacity-60">How you'll earn XP</span>
								</div>
								<div class="space-y-4">
									{#each formData.exampleActivities as activity, index}
										<div class="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-base-200 rounded-lg">
											<div class="md:col-span-3">
												<label class="sr-only" for="activity-{index}">Activity {index + 1} description</label>
												<input
													id="activity-{index}"
													type="text"
													placeholder="e.g., Complete a coding challenge, workout for 30 minutes"
													class="input input-bordered w-full"
													bind:value={activity.description}
													maxlength="200"
													required
													disabled={submitting}
												/>
											</div>
											<div class="flex gap-2">
												<div class="flex items-center gap-2 flex-1">
													<label class="sr-only" for="xp-{index}">Suggested XP for activity {index + 1}</label>
													<input
														id="xp-{index}"
														type="number"
														placeholder="XP"
														class="input input-bordered w-20"
														bind:value={activity.suggestedXp}
														min="1"
														max="100"
														required
														disabled={submitting}
													/>
													<span class="text-sm text-base-content/60">XP</span>
												</div>
												{#if formData.exampleActivities.length > 1}
													<button
														type="button"
														class="btn btn-circle btn-sm btn-outline btn-error"
														onclick={() => removeExampleActivity(index)}
														aria-label="Remove activity {index + 1}"
														disabled={submitting}
													>
														<Trash2 size={16} />
													</button>
												{/if}
											</div>
										</div>
									{/each}
									
									<button
										type="button"
										class="btn btn-outline btn-sm gap-2"
										onclick={addExampleActivity}
										disabled={submitting}
									>
										<Plus size={16} />
										Add Activity
									</button>
								</div>
							</div>

							<!-- Submit Button -->
							<div class="form-control pt-4">
								<div class="flex gap-4">
									<button 
										type="button"
										onclick={goBack}
										class="btn btn-outline"
										disabled={submitting}
									>
										Cancel
									</button>
									<button 
										type="submit"
										class="btn btn-primary gap-2 flex-1"
										disabled={!isValid() || submitting}
									>
										{#if submitting}
											<span class="loading loading-spinner loading-sm"></span>
										{:else}
											<Save size={16} />
										{/if}
										Save Changes
									</button>
								</div>
							</div>
						</form>
					</div>
				</div>
			</div>

			<!-- Sidebar - Tips and Current Progress -->
			<div class="space-y-6">
				<!-- Current Progress -->
				<div class="card bg-base-100 shadow-xl border border-base-300">
					<div class="card-body">
						<h3 class="card-title text-lg border-b border-base-300 pb-2 mb-4">
							Current Progress
						</h3>
						<div class="space-y-3">
							<div class="stat py-2">
								<div class="stat-title text-xs">Current Level</div>
								<div class="stat-value text-xl text-primary">{stat.currentLevel}</div>
							</div>
							<div class="stat py-2">
								<div class="stat-title text-xs">Total XP</div>
								<div class="stat-value text-xl text-secondary">{stat.totalXp}</div>
							</div>
							<div class="stat py-2">
								<div class="stat-title text-xs">Created</div>
								<div class="stat-desc text-sm">Your progress won't be lost</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Editing Tips -->
				<div class="card bg-base-100 shadow-xl border border-base-300">
					<div class="card-body">
						<h3 class="card-title text-lg border-b border-base-300 pb-2 mb-4">
							<Lightbulb size={18} />
							Editing Tips
						</h3>
						<div class="space-y-3 text-sm">
							<div class="p-3 bg-info/10 rounded-lg">
								<p class="font-medium text-info">Be specific</p>
								<p class="text-base-content/80">Clear stat names and descriptions help you stay focused on your goals.</p>
							</div>
							<div class="p-3 bg-success/10 rounded-lg">
								<p class="font-medium text-success">Meaningful activities</p>
								<p class="text-base-content/80">Example activities should represent realistic tasks you can complete.</p>
							</div>
							<div class="p-3 bg-warning/10 rounded-lg">
								<p class="font-medium text-warning">Balanced XP values</p>
								<p class="text-base-content/80">Award 1-10 XP for small tasks, 10-25 for moderate efforts, 25+ for major achievements.</p>
							</div>
							<div class="p-3 bg-error/10 rounded-lg">
								<p class="font-medium text-error">Progress preservation</p>
								<p class="text-base-content/80">Your current level and XP will remain unchanged when you save edits.</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Example Activities Tips -->
				<div class="card bg-base-100 shadow-xl border border-base-300">
					<div class="card-body">
						<h3 class="card-title text-lg border-b border-base-300 pb-2 mb-4">
							<Target size={18} />
							Activity Ideas
						</h3>
						<div class="space-y-2 text-sm">
							<div class="p-2 bg-base-200 rounded">
								<strong>Learning:</strong> Read a chapter, complete a tutorial, watch an educational video
							</div>
							<div class="p-2 bg-base-200 rounded">
								<strong>Fitness:</strong> 30-min workout, 5K run, yoga session, strength training
							</div>
							<div class="p-2 bg-base-200 rounded">
								<strong>Creative:</strong> Write 500 words, sketch for 20 minutes, practice instrument
							</div>
							<div class="p-2 bg-base-200 rounded">
								<strong>Professional:</strong> Complete project task, learn new skill, networking event
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
