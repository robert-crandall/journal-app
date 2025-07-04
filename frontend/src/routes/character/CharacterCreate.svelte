<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { characterApi, type Character, type CreateCharacterData } from '../../lib/api/characters';

	const dispatch = createEventDispatcher<{
		characterCreated: Character;
	}>();

	// Form state
	let formData: CreateCharacterData = {
		name: '',
		characterClass: '',
		backstory: '',
		goals: ''
	};

	let loading = false;
	let error: string | null = null;

	// Predefined character classes for easier selection
	const predefinedClasses = [
		// RPG-inspired
		'Warrior',
		'Mage',
		'Rogue',
		'Cleric',
		'Paladin',
		'Ranger',
		'Bard',
		'Druid',
		'Monk',
		'Barbarian',
		// Life-inspired
		'Adventurer',
		'Explorer',
		'Family Person',
		'Outdoor Enthusiast',
		'Fitness Enthusiast',
		'Artist',
		'Scholar',
		'Entrepreneur',
		'Community Builder',
		'Custom' // Special option to enable custom input
	];

	let selectedClass = '';
	let customClass = '';
	let showCustomClass = false;

	// Handle class selection
	function handleClassSelection() {
		if (selectedClass === 'Custom') {
			showCustomClass = true;
			formData.characterClass = customClass;
		} else {
			showCustomClass = false;
			formData.characterClass = selectedClass;
			customClass = '';
		}
	}

	// Handle custom class input
	function handleCustomClassInput() {
		formData.characterClass = customClass;
	}

	// Validate form
	function validateForm(): boolean {
		if (!formData.name.trim()) {
			error = 'Character name is required';
			return false;
		}
		if (!formData.characterClass.trim()) {
			error = 'Character class is required';
			return false;
		}
		if (formData.name.length > 100) {
			error = 'Character name must be 100 characters or less';
			return false;
		}
		if (formData.characterClass.length > 100) {
			error = 'Character class must be 100 characters or less';
			return false;
		}
		return true;
	}

	// Handle form submission
	async function handleSubmit() {
		error = null;

		if (!validateForm()) {
			return;
		}

		try {
			loading = true;

			// Prepare data - only send non-empty optional fields
			const submitData: CreateCharacterData = {
				name: formData.name.trim(),
				characterClass: formData.characterClass.trim()
			};

			if (formData.backstory?.trim()) {
				submitData.backstory = formData.backstory.trim();
			}

			if (formData.goals?.trim()) {
				submitData.goals = formData.goals.trim();
			}

			const character = await characterApi.createCharacter(submitData);
			dispatch('characterCreated', character);
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to create character';
			console.error('Error creating character:', e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title justify-center text-2xl mb-4">Create Your Character</h2>

		<div class="alert alert-info mb-6">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="h-6 w-6 shrink-0 stroke-current"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>
				Create your character to start your gamified life journey. Your character represents who you want to become!
			</span>
		</div>

		{#if error}
			<div class="alert alert-error mb-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{error}</span>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit}>
			<!-- Character Name -->
			<div class="form-control w-full mb-4">
				<label class="label" for="name">
					<span class="label-text">Character Name <span class="text-error">*</span></span>
				</label>
				<input
					id="name"
					type="text"
					placeholder="Enter your character's name"
					class="input input-bordered w-full"
					bind:value={formData.name}
					maxlength="100"
					required
				/>
				<div class="label">
					<span class="label-text-alt">What should we call your character?</span>
					<span class="label-text-alt">{formData.name.length}/100</span>
				</div>
			</div>

			<!-- Character Class -->
			<div class="form-control w-full mb-4">
				<label class="label" for="class">
					<span class="label-text">Character Class <span class="text-error">*</span></span>
				</label>
				<select
					id="class"
					class="select select-bordered w-full"
					bind:value={selectedClass}
					on:change={handleClassSelection}
					required
				>
					<option value="">Choose your character class</option>
					{#each predefinedClasses as classOption}
						<option value={classOption}>{classOption}</option>
					{/each}
				</select>
				{#if showCustomClass}
					<input
						type="text"
						placeholder="Enter your custom class"
						class="input input-bordered w-full mt-2"
						bind:value={customClass}
						on:input={handleCustomClassInput}
						maxlength="100"
						required
					/>
					<div class="label">
						<span class="label-text-alt">Custom class name</span>
						<span class="label-text-alt">{customClass.length}/100</span>
					</div>
				{:else}
					<div class="label">
						<span class="label-text-alt">What type of person do you want to become?</span>
					</div>
				{/if}
			</div>

			<!-- Backstory -->
			<div class="form-control w-full mb-4">
				<label class="label block w-full mb-1" for="backstory">
					<span class="label-text">Backstory</span>
				</label>
				<textarea
					id="backstory"
					class="textarea textarea-bordered h-24 w-full"
					placeholder="Tell us about your character's background and current situation..."
					bind:value={formData.backstory}
				></textarea>
				<div class="label">
					<span class="label-text-alt">Optional: Describe your character's background</span>
				</div>
			</div>

			<!-- Goals -->
			<div class="form-control w-full mb-6">
				<label class="label block w-full mb-1" for="goals">
					<span class="label-text">Goals</span>
				</label>
				<textarea
					id="goals"
					class="textarea textarea-bordered h-24 w-full"
					placeholder="What does your character want to achieve? What are their aspirations?"
					bind:value={formData.goals}
				></textarea>
				<div class="label">
					<span class="label-text-alt">Optional: What are your character's goals and dreams?</span>
				</div>
			</div>

			<!-- Submit Button -->
			<div class="card-actions justify-center">
				<button type="submit" class="btn btn-primary btn-wide" disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner loading-sm"></span>
						Creating Character...
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<path d="m19 8 2 2-2 2" />
							<path d="m17 10 2 2-2 2" />
						</svg>
						Create Character
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
