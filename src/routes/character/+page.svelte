<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import { markdownToHtml } from '$lib/markdown.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Form state
	let characterClass = $state('');
	let backstory = $state('');
	let motto = $state('');
	let goals = $state('');
	let isSubmitting = $state(false);

	// Initialize form values from user data (only on initial load)
	$effect(() => {
		// Only initialize if the form fields are empty (initial load)
		if (!characterClass && !backstory && !motto && !goals) {
			characterClass = data.user.characterClass || '';
			backstory = data.user.backstory || '';
			motto = data.user.motto || '';
			goals = data.user.goals || '';
		}
	});

	// Handle form submission results
	$effect(() => {
		if (form?.success) {
			console.log('Form submission successful');
		} else if (form?.error) {
			// If there was an error, restore the form values from the failed submission
			characterClass = form.characterClass || characterClass;
			backstory = form.backstory || backstory;
			motto = form.motto || motto;
			goals = form.goals || goals;
			console.log('Form submission failed:', form.error);
		}
	});

	// Predefined character classes for suggestions
	const suggestedClasses = [
		'Ranger',
		'Warrior',
		'Mage',
		'Monk',
		'Paladin',
		'Rogue',
		'Bard',
		'Cleric',
		'Druid',
		'Barbarian'
	];
</script>

<svelte:head>
	<title>Character Profile - Journal App</title>
</svelte:head>

<div class="bg-base-200 min-h-screen">
	<div class="container mx-auto p-6">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="mb-2 text-4xl font-bold">Character Profile</h1>
			<p class="text-base-content/70">
				Define your in-game persona to personalize your journey and AI-generated tasks.
			</p>
		</div>

		<!-- Success Message -->
		{#if form?.success}
			<div class="alert alert-success mb-6" data-testid="success-message">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				<span>Character profile updated successfully!</span>
			</div>
		{/if}

		<!-- Error Message -->
		{#if form?.error}
			<div class="alert alert-error mb-6">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				<span>{form.error}</span>
			</div>
		{/if}

		<div class="grid gap-8 lg:grid-cols-3">
			<!-- Main Form -->
			<div class="lg:col-span-2">
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title mb-6">Character Details</h2>

						<form
							method="POST"
							action="?/update"
							use:enhance={() => {
								isSubmitting = true;
								return async ({ result, update }) => {
									isSubmitting = false;
									await update();
								};
							}}
							class="space-y-6"
						>
							<!-- Character Class -->
							<div class="form-control">
								<label for="characterClass" class="label">
									<span class="label-text font-semibold">Character Class</span>
									<span class="label-text-alt text-error">Required</span>
								</label>
								<input
									type="text"
									id="characterClass"
									name="characterClass"
									bind:value={characterClass}
									placeholder="e.g., Ranger, Warrior, or create your own..."
									class="input input-bordered w-full"
								/>
								<div class="label">
									<span class="label-text-alt">
										Choose from suggestions or create your own unique class
									</span>
								</div>
							</div>

							<!-- Class Suggestions -->
							<div class="form-control">
								<div class="label">
									<span class="label-text">Quick Select</span>
								</div>
								<div class="flex flex-wrap gap-2">
									{#each suggestedClasses as suggestedClass}
										<button
											type="button"
											class="btn btn-sm btn-outline"
											onclick={() => (characterClass = suggestedClass)}
										>
											{suggestedClass}
										</button>
									{/each}
								</div>
							</div>

							<!-- Backstory -->
							<div class="form-control">
								<label for="backstory" class="label">
									<span class="label-text font-semibold">Backstory</span>
								</label>
								<textarea
									id="backstory"
									name="backstory"
									bind:value={backstory}
									placeholder="Tell your story... Who are you? What are your goals? What motivates you?"
									class="textarea textarea-bordered h-32 w-full"
									rows="4"
								></textarea>
								<div class="label">
									<span class="label-text-alt">
										This will help the AI understand you better and generate personalized tasks
									</span>
								</div>
							</div>

							<!-- Personal Motto -->
							<div class="form-control">
								<label for="motto" class="label">
									<span class="label-text font-semibold">Personal Motto</span>
								</label>
								<input
									type="text"
									id="motto"
									name="motto"
									bind:value={motto}
									placeholder="e.g., Be an outdoor adventurer and an engaged dad"
									class="input input-bordered w-full"
								/>
								<div class="label">
									<span class="label-text-alt">
										A guiding principle that defines your aspirations
									</span>
								</div>
							</div>

							<!-- Personal Goals -->
							<div class="form-control">
								<label for="goals" class="label">
									<span class="label-text font-semibold">Personal Goals</span>
								</label>
								<textarea
									id="goals"
									name="goals"
									bind:value={goals}
									placeholder="What are your high-level personal goals? You can use markdown formatting here..."
									class="textarea textarea-bordered h-32 w-full"
									rows="4"
								></textarea>
								<div class="label">
									<span class="label-text-alt">
										Define your high-level goals for personal growth. Supports markdown formatting.
									</span>
								</div>
							</div>

							<!-- Submit Button -->
							<div class="card-actions justify-end pt-4">
								<button
									type="submit"
									class="btn btn-primary"
									data-testid="save-character-btn"
									disabled={isSubmitting}
								>
									{#if isSubmitting}
										<span class="loading loading-spinner loading-sm"></span>
									{:else}
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									{/if}
									{isSubmitting ? 'Saving...' : 'Save Character'}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>

			<!-- Sidebar with Tips and Preview -->
			<div class="space-y-6">
				<!-- Character Preview -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">Character Preview</h3>
						<div class="space-y-4">
							<div>
								<h4 class="text-base-content/70 text-sm font-semibold tracking-wide uppercase">
									Class
								</h4>
								<p class="text-lg font-medium">
									{characterClass || 'Not set'}
								</p>
							</div>
							{#if backstory}
								<div>
									<h4 class="text-base-content/70 text-sm font-semibold tracking-wide uppercase">
										Backstory
									</h4>
									<p class="text-sm leading-relaxed">
										{backstory}
									</p>
								</div>
							{/if}
							{#if motto}
								<div>
									<h4 class="text-base-content/70 text-sm font-semibold tracking-wide uppercase">
										Motto
									</h4>
									<p class="text-sm italic">
										"{motto}"
									</p>
								</div>
							{/if}
							{#if goals}
								<div>
									<h4 class="text-base-content/70 text-sm font-semibold tracking-wide uppercase">
										Goals
									</h4>
									<div class="prose prose-sm max-w-none">
										{@html markdownToHtml(goals)}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Tips -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">Tips</h3>
						<div class="space-y-3 text-sm">
							<div class="flex gap-3">
								<svg
									class="text-primary mt-0.5 h-5 w-5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div>
									<strong>Character Class:</strong> This defines your role-playing identity and influences
									how the AI generates tasks for you.
								</div>
							</div>
							<div class="flex gap-3">
								<svg
									class="text-primary mt-0.5 h-5 w-5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div>
									<strong>Backstory:</strong> Share your real goals and context. The AI uses this to
									create meaningful, personalized daily tasks.
								</div>
							</div>
							<div class="flex gap-3">
								<svg
									class="text-primary mt-0.5 h-5 w-5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div>
									<strong>Motto:</strong> A guiding principle that keeps you focused on what matters
									most to you.
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Coming Soon -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">Coming Soon</h3>
						<div class="text-base-content/70 space-y-2 text-sm">
							<p>• Character stats and leveling</p>
							<p>• XP tracking and progression</p>
							<p>• AI-generated daily tasks</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
