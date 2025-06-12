<script lang="ts">
	import { goto } from '$app/navigation';
	import { BarChart3, HelpCircle, Award } from 'lucide-svelte';
	
	let name = $state('');
	let description = $state('');
	let submitting = $state(false);
	let error = $state('');
	let showHelpModal = $state(false);
	
	const statExamples = [
		{
			name: 'Creativity',
			description: 'Ability to think outside the box and generate novel solutions to problems'
		},
		{
			name: 'Focus',
			description: 'Capacity to concentrate deeply on tasks without distraction'
		},
		{
			name: 'Resilience',
			description: 'Mental fortitude to bounce back from setbacks and maintain equilibrium'
		},
		{
			name: 'Mindfulness',
			description: 'Present awareness and ability to observe thoughts and feelings without judgment'
		},
		{
			name: 'Physical Vitality',
			description: 'Energy levels, physical strength and overall bodily wellbeing'
		}
	];
	
	async function handleSubmit() {
		if (!name) {
			error = 'Name is required';
			return;
		}
		
		try {
			submitting = true;
			error = '';
			const response = await fetch('/api/stats', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name,
					description
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create character stat');
			}
			
			const data = await response.json();
			goto(`/stats/${data.stat.id}`);
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'An unknown error occurred';
			}
		} finally {
			submitting = false;
		}
	}
	
	function useExample(example: { name: string; description: string }) {
		name = example.name;
		description = example.description;
	}
</script>

<svelte:head>
	<title>New Character Stat - Journal App</title>
</svelte:head>

<div class="space-y-6 max-w-2xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-base-content flex items-center gap-2">
				<BarChart3 size={28} /> New Character Stat
			</h1>
			<p class="text-base-content/70 mt-1">Create a new personal attribute to track your growth</p>
		</div>
		<button class="btn btn-ghost btn-circle" on:click={() => showHelpModal = true}>
			<HelpCircle size={20} />
		</button>
	</div>
	
	<div class="grid grid-cols-1 lg:grid-cols-7 gap-6">
		<!-- Form -->
		<div class="lg:col-span-4">
			<div class="card bg-base-100 border border-base-300">
				<div class="card-body">
					<h2 class="card-title">Stat Details</h2>
					<form on:submit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
						{#if error}
							<div class="alert alert-error">
								<span>{error}</span>
							</div>
						{/if}
						
						<div class="form-control">
							<label for="name" class="label">
								<span class="label-text">Stat Name</span>
							</label>
							<input
								type="text"
								id="name"
								class="input input-bordered w-full"
								placeholder="e.g. Creativity, Focus, Resilience"
								bind:value={name}
								required
							/>
							<label class="label">
								<span class="label-text-alt text-base-content/60">Choose a name that represents a personal trait or ability</span>
							</label>
						</div>
						
						<div class="form-control">
							<label for="description" class="label">
								<span class="label-text">Description</span>
							</label>
							<textarea
								id="description"
								class="textarea textarea-bordered h-24"
								placeholder="What does this attribute mean to you? How do you plan to develop it?"
								bind:value={description}
							></textarea>
							<label class="label">
								<span class="label-text-alt text-base-content/60">A clear description helps you track the right activities for this stat</span>
							</label>
						</div>
						
						<div class="pt-4 flex gap-2 justify-end">
							<a href="/stats" class="btn">Cancel</a>
							<button type="submit" class="btn btn-primary" disabled={submitting}>
								{#if submitting}
									<span class="loading loading-spinner loading-sm"></span>
									Creating...
								{:else}
									Create Stat
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
		
		<!-- Examples Panel -->
		<div class="lg:col-span-3">
			<div class="card bg-base-200 border border-base-300">
				<div class="card-body">
					<h2 class="card-title flex items-center gap-2">
						<Award size={18} />
						Example Stats
					</h2>
					<p class="text-sm text-base-content/70 mb-2">
						Click on an example to use it as a starting point
					</p>
					
					<div class="space-y-2">
						{#each statExamples as example}
							<div 
								class="bg-base-100 p-3 rounded-lg border border-base-300 cursor-pointer hover:border-primary transition-colors"
								on:click={() => useExample(example)}
								on:keydown={(e) => e.key === 'Enter' && useExample(example)}
								tabindex="0"
								role="button"
							>
								<div class="font-medium">{example.name}</div>
								<div class="text-sm text-base-content/70">{example.description}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Help Modal -->
{#if showHelpModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg">About Character Stats</h3>
			<div class="py-4 space-y-4">
				<p>
					Character Stats represent personal traits, skills, or qualities that you want to develop over time. Think of them as attributes in a role-playing game, but for your real life.
				</p>
				<div>
					<h4 class="font-semibold">How do they work?</h4>
					<ul class="list-disc pl-6 mt-2 space-y-1">
						<li>Each stat starts at Level 1 with 0 XP</li>
						<li>You gain XP by linking journal entries to stats</li>
						<li>You can also manually add XP for activities not captured in journal entries</li>
						<li>As you accumulate XP, your stats level up, representing your growth</li>
					</ul>
				</div>
				<div>
					<h4 class="font-semibold">Tips for creating effective stats:</h4>
					<ul class="list-disc pl-6 mt-2 space-y-1">
						<li>Choose attributes that are meaningful to you personally</li>
						<li>Be specific about what the stat represents in your description</li>
						<li>Consider creating stats for different life areas (mental, physical, social, creative)</li>
						<li>Avoid creating too many stats at once - start with 3-5 key attributes</li>
					</ul>
				</div>
			</div>
			<div class="modal-action">
				<button class="btn" on:click={() => showHelpModal = false}>Got it</button>
			</div>
		</div>
	</div>
{/if}
