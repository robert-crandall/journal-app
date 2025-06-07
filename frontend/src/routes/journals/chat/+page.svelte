<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { journalsApi } from '$lib/api';
	import JournalChat from '$lib/components/JournalChat.svelte';
	import { ArrowLeft, Calendar, Tag, User, TrendingUp } from 'lucide-svelte';

	let journal: any = null;
	let loading = true;
	let showResults = false;
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
		showResults = true;
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
		<!-- Results Modal -->
		{#if showResults && completionResults}
			<div class="modal modal-open">
				<div class="modal-box max-w-2xl">
					<h3 class="font-bold text-lg mb-4">Journal Session Complete! 🎉</h3>
					
					<!-- Summary -->
					{#if completionResults.summary}
						<div class="mb-6">
							<h4 class="font-semibold mb-2 flex items-center gap-2">
								<Calendar size={16} />
								Summary
							</h4>
							<div class="bg-base-200 p-4 rounded-lg">
								<p class="text-sm">{completionResults.summary}</p>
							</div>
						</div>
					{/if}

					<!-- Extracted Tags -->
					{#if completionResults.extractedTags && completionResults.extractedTags.length > 0}
						<div class="mb-6">
							<h4 class="font-semibold mb-2 flex items-center gap-2">
								<Tag size={16} />
								Tags Found
							</h4>
							<div class="flex flex-wrap gap-2">
								{#each completionResults.extractedTags as tag}
									<span class="badge badge-primary">{tag.name}</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Suggested Attributes -->
					{#if completionResults.suggestedAttributes && completionResults.suggestedAttributes.length > 0}
						<div class="mb-6">
							<h4 class="font-semibold mb-2 flex items-center gap-2">
								<User size={16} />
								New Insights
							</h4>
							<div class="space-y-2">
								{#each completionResults.suggestedAttributes as attr}
									<div class="bg-base-200 p-3 rounded-lg">
										<div class="font-medium text-sm">{attr.key}</div>
										<div class="text-xs opacity-70">{attr.value}</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="modal-action">
						<button 
							on:click={() => showResults = false} 
							class="btn btn-ghost"
						>
							Close
						</button>
						<button 
							on:click={startNewSession} 
							class="btn btn-primary"
						>
							Start New Session
						</button>
						<button 
							on:click={goBack} 
							class="btn btn-outline"
						>
							View All Journals
						</button>
					</div>
				</div>
			</div>
		{/if}

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
