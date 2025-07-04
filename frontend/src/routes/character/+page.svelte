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

<div class="min-h-screen">
	<main class="container mx-auto p-4">
		<div class="hero">
			<div class="hero-content text-center">
				<div class="max-w-4xl w-full">
					<div class="badge badge-primary mb-4">Character System</div>
					<h1 class="mb-6 text-3xl font-bold">Your Character</h1>

					{#if loading}
						<div class="card bg-base-100 mb-6 shadow-xl">
							<div class="card-body items-center">
								<span class="loading loading-spinner loading-lg text-primary"></span>
								<p>Loading character...</p>
							</div>
						</div>
					{:else if error}
						<div class="alert alert-error mb-6">
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
							<span>Error: {error}</span>
							<div>
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

					<div class="card-actions justify-center mt-6">
						<a href="/" class="btn btn-outline">
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
								<path d="m12 19-7-7 7-7" />
								<path d="M19 12H5" />
							</svg>
							Back to Home
						</a>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
