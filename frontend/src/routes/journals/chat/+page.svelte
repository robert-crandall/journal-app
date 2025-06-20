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
	<!-- Content -->
	<div class="container mx-auto max-w-6xl px-4 py-4 md:px-6 md:py-8">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div class="flex flex-col items-center gap-4">
					<div
						class="border-primary h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
					></div>
					<p class="text-base-content/70 font-medium">Loading your journal session...</p>
				</div>
			</div>
		{:else}
			<!-- Chat Interface -->
			<div
				class="border-base-300 bg-base-100 overflow-hidden rounded-xl border shadow-sm"
				style="height: calc(100vh - 120px); min-height: 500px;"
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
