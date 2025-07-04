<script lang="ts">
	import { onMount } from 'svelte';
	import { characterApi, type Character } from '../../lib/api/characters';
	import { characterStore } from '../../lib/stores/character';
	import CharacterCreate from './CharacterCreate.svelte';
	import CharacterView from './CharacterView.svelte';

	// State variables
	let character: Character | null = null;
	let loading = true;
	let error: string | null = null;

	// Subscribe to character store
	characterStore.subscribe((state) => {
		character = state.character;
		loading = state.loading;
		error = state.error;
	});

	// Load character when component mounts
	onMount(async () => {
		await loadCharacter();
	});

	// Load character from API
	async function loadCharacter() {
		try {
			characterStore.setLoading(true);
			const fetchedCharacter = await characterApi.getCharacter();
			characterStore.setCharacter(fetchedCharacter);
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to load character';
			characterStore.setError(errorMessage);
			console.error('Error loading character:', e);
		}
	}

	// Handle character creation success
	function handleCharacterCreated(event: CustomEvent<Character>) {
		characterStore.setCharacter(event.detail);
	}

	// Handle character updated
	function handleCharacterUpdated(event: CustomEvent<Character>) {
		characterStore.setCharacter(event.detail);
	}

	// Handle character deleted
	function handleCharacterDeleted() {
		characterStore.setCharacter(null);
	}
</script>

<svelte:head>
	<title>Character - Journal App</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
	<main class="container mx-auto px-4 py-8">
		<!-- Header Section -->
		<div class="mb-8 text-center">
			<div class="badge badge-primary badge-lg mb-4">Character System</div>
			<h1 class="text-4xl font-bold text-primary mb-2">Your Character</h1>
			<p class="text-base-content/70 text-lg max-w-2xl mx-auto">
				Create and manage your character to start your gamified life journey
			</p>
		</div>

		<!-- Main Content Area -->
		<div class="max-w-6xl mx-auto">
			{#if loading}
				<div class="flex justify-center items-center min-h-[400px]">
					<div class="text-center">
						<span class="loading loading-spinner loading-lg text-primary mb-4"></span>
						<p class="text-lg">Loading character...</p>
					</div>
				</div>
			{:else if error}
				<div class="max-w-md mx-auto">
					<div class="alert alert-error">
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
						<div>
							<h3 class="font-bold">Error Loading Character</h3>
							<div class="text-xs">{error}</div>
						</div>
						<button class="btn btn-sm btn-outline" on:click={loadCharacter}>
							Try Again
						</button>
					</div>
				</div>
			{:else if character}
				<CharacterView
					{character}
					on:characterUpdated={handleCharacterUpdated}
					on:characterDeleted={handleCharacterDeleted}
				/>
			{:else}
				<CharacterCreate on:characterCreated={handleCharacterCreated} />
			{/if}
		</div>

		<!-- Navigation -->
		<div class="mt-12 text-center">
			<a href="/" class="btn btn-outline btn-lg gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m12 19-7-7 7-7" />
					<path d="M19 12H5" />
				</svg>
				Back to Home
			</a>
		</div>
	</main>
</div>
