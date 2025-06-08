<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { journalsApi } from '$lib/api';
	import JournalChat from '$lib/components/JournalChat.svelte';
	import { ArrowLeft, Bot, MessageCircle, Calendar, Sparkles } from 'lucide-svelte';

	let journal: any = null;
	let loading = true;
	let completionResults: any = null;

	const journalId = $page.url.searchParams.get('id');

	onMount(async () => {
		if (journalId) {
			await loadJournal();
		} else {
			loading = false;
		}
	});

	async function loadJournal() {
		if (!journalId) return;

		try {
			loading = true;
			const response = await journalsApi.get(journalId);
			journal = response.journal;
		} catch (error) {
			console.error('Failed to load journal:', error);
			// If journal not found, start fresh
			journal = null;
		} finally {
			loading = false;
		}
	}

	function handleJournalCompleted(event: CustomEvent) {
		completionResults = event.detail;
		goto('/journals');
	}

	function goBack() {
		goto('/journals');
	}

	function startNewSession() {
		goto('/journals/chat');
	}
</script>

<svelte:head>
	<title>AI Journal Chat - Life Quest</title>
</svelte:head>

<div class="bg-neutral-25 min-h-screen">
	<!-- Hero Header -->
	<div class="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
		<div class="container mx-auto px-6 py-8">
			<div class="max-w-4xl">
				<div class="mb-4 flex items-center gap-4">
					<button
						onclick={goBack}
						class="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
					>
						<ArrowLeft class="h-6 w-6" />
					</button>
					<div class="flex items-center gap-4">
						<div class="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
							<Bot class="h-8 w-8" />
						</div>
						<div>
							<h1 class="mb-2 text-3xl font-bold">
								{journal ? 'Continue Journal Session' : 'New AI Journal Session'}
							</h1>
							<p class="text-lg text-blue-100">
								{journal
									? `Started on ${new Date(journal.date).toLocaleDateString()}`
									: 'Have a guided conversation with AI about your thoughts and experiences'}
							</p>
						</div>
					</div>
				</div>

				{#if !journal}
					<div class="mt-6 flex items-center gap-4">
						<button
							onclick={goBack}
							class="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
						>
							<ArrowLeft class="mr-2 inline h-4 w-4" />
							View All Journals
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="container mx-auto max-w-6xl px-6 py-8">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div class="flex flex-col items-center gap-4">
					<div
						class="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
					></div>
					<p class="font-medium text-neutral-600">Loading your journal session...</p>
				</div>
			</div>
		{:else}
			<!-- Chat Interface -->
			<div
				class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
				style="height: calc(100vh - 200px);"
			>
				<JournalChat
					{journalId}
					existingJournal={journal}
					on:journalCompleted={handleJournalCompleted}
				/>
			</div>
		{/if}
	</div>
</div>
