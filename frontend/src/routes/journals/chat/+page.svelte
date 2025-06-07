<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { journalsApi } from '$lib/api';
	import JournalChat from '$lib/components/JournalChat.svelte';
	import { ArrowLeft, Calendar, Tag, User, TrendingUp } from 'lucide-svelte';

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
	<title>AI Journal Chat</title>
</svelte:head>

<div class="container mx-auto px-4 py-6 max-w-6xl">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-4">
			<button on:click={goBack} class="btn btn-ghost btn-circle">
				<ArrowLeft size={20} />
			</button>
			<div>
				<h1 class="text-2xl font-bold">
					{journal ? 'Continue Journal Session' : 'New AI Journal Session'}
				</h1>
				<p class="text-base-content/70">
					{journal ? `Started on ${new Date(journal.date).toLocaleDateString()}` : 'Have a conversation with AI about your thoughts'}
				</p>
			</div>
		</div>
		
		{#if !journal}
			<button on:click={goBack} class="btn btn-outline">
				View All Journals
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="loading loading-spinner loading-lg"></div>
		</div>
	{:else}
		<!-- Chat Interface -->
		<div class="h-[calc(100vh-12rem)]">
			<JournalChat 
				journalId={journalId}
				existingJournal={journal}
				on:journalCompleted={handleJournalCompleted}
			/>
		</div>
	{/if}
</div>
