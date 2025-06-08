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

<div class="min-h-screen bg-neutral-25">
	<!-- Hero Header -->
	<div class="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
		<div class="container mx-auto px-6 py-8">
			<div class="max-w-4xl">
				<div class="flex items-center gap-4 mb-4">
					<button 
						onclick={goBack} 
						class="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
					>
						<ArrowLeft class="w-6 h-6" />
					</button>
					<div class="flex items-center gap-4">
						<div class="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
							<Bot class="w-8 h-8" />
						</div>
						<div>
							<h1 class="text-3xl font-bold mb-2">
								{journal ? 'Continue Journal Session' : 'New AI Journal Session'}
							</h1>
							<p class="text-blue-100 text-lg">
								{journal ? `Started on ${new Date(journal.date).toLocaleDateString()}` : 'Have a guided conversation with AI about your thoughts and experiences'}
							</p>
						</div>
					</div>
				</div>
				
				{#if !journal}
					<div class="flex items-center gap-4 mt-6">
						<button 
							onclick={goBack} 
							class="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors border border-white/20 text-white"
						>
							<ArrowLeft class="w-4 h-4 inline mr-2" />
							View All Journals
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="container mx-auto px-6 py-8 max-w-6xl">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div class="flex flex-col items-center gap-4">
					<div class="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
					<p class="text-neutral-600 font-medium">Loading your journal session...</p>
				</div>
			</div>
		{:else}
			<!-- Chat Interface -->
			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden" style="height: calc(100vh - 200px);">
				<JournalChat 
					journalId={journalId}
					existingJournal={journal}
					on:journalCompleted={handleJournalCompleted}
				/>
			</div>
		{/if}
	</div>
</div>
