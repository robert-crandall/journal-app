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
			<button 
				onclick={goBack} 
				class="p-2 hover:bg-theme-secondary rounded-full transition-colors text-theme"
			>
				<ArrowLeft size={20} />
			</button>
			<div>
				<h1 class="text-2xl font-bold text-theme">
					{journal ? 'Continue Journal Session' : 'New AI Journal Session'}
				</h1>
				<p class="text-theme-muted">
					{journal ? `Started on ${new Date(journal.date).toLocaleDateString()}` : 'Have a conversation with AI about your thoughts'}
				</p>
			</div>
		</div>
		
		{#if !journal}
			<button 
				onclick={goBack} 
				class="px-4 py-2 border border-theme-primary text-theme-primary rounded-md hover:bg-theme-primary hover:text-white transition-colors"
			>
				View All Journals
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
		</div>
	{:else}
		<!-- Results Modal -->
		{#if showResults && completionResults}
			<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<div class="bg-theme rounded-md shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
					<div class="p-6">
						<h3 class="font-bold text-lg mb-4 text-theme">Journal Session Complete! 🎉</h3>
						
						<!-- Summary -->
						{#if completionResults.summary}
							<div class="mb-6">
								<h4 class="font-semibold mb-2 flex items-center gap-2 text-theme">
									<Calendar size={16} />
									Summary
								</h4>
								<div class="bg-theme-secondary p-4 rounded-md">
									<p class="text-sm text-theme">{completionResults.summary}</p>
								</div>
							</div>
						{/if}

						<!-- Extracted Tags -->
						{#if completionResults.extractedTags && completionResults.extractedTags.length > 0}
							<div class="mb-6">
								<h4 class="font-semibold mb-2 flex items-center gap-2 text-theme">
									<Tag size={16} />
									Tags Found
								</h4>
								<div class="flex flex-wrap gap-2">
									{#each completionResults.extractedTags as tag}
										<span class="px-2 py-1 bg-theme-primary text-white text-xs rounded-full">{tag.name}</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Suggested Attributes -->
						{#if completionResults.suggestedAttributes && completionResults.suggestedAttributes.length > 0}
							<div class="mb-6">
								<h4 class="font-semibold mb-2 flex items-center gap-2 text-theme">
									<User size={16} />
									New Insights
								</h4>
								<div class="space-y-2">
									{#each completionResults.suggestedAttributes as attr}
										<div class="bg-theme-secondary p-3 rounded-md">
											<div class="font-medium text-sm text-theme">{attr.key}</div>
											<div class="text-xs text-theme-muted">{attr.value}</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<div class="flex justify-end gap-3 pt-4 border-t border-theme">
							<button 
								onclick={() => showResults = false} 
								class="px-4 py-2 text-theme-muted hover:text-theme hover:bg-theme-secondary rounded-md transition-colors"
							>
								Close
							</button>
							<button 
								onclick={startNewSession} 
								class="px-4 py-2 bg-theme-primary text-white rounded-md hover:bg-theme-primary-dark transition-colors"
							>
								Start New Session
							</button>
							<button 
								onclick={goBack} 
								class="px-4 py-2 border border-theme-primary text-theme-primary rounded-md hover:bg-theme-primary hover:text-white transition-colors"
							>
								View All Journals
							</button>
						</div>
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
