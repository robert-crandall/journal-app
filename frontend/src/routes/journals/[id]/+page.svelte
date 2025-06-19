<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { journalsApi } from '$lib/api';
	import * as icons from 'lucide-svelte';

	let journal: any = null;
	let loading = true;
	let error = '';

	const journalId = $page.params.id;

	onMount(async () => {
		if (!journalId) {
			goto('/journals');
			return;
		}

		try {
			loading = true;
			const response = await journalsApi.getById(journalId);
			journal = response.journal;
		} catch (err) {
			console.error('Failed to load journal:', err);
			error = 'Failed to load journal entry';
		} finally {
			loading = false;
		}
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateTime(dateString: string) {
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function handleTagClick(tag: string) {
		goto(`/journals?tag=${encodeURIComponent(tag)}`);
	}

	function continueAIChat() {
		if (journal?.id) {
			goto(`/journals/chat?id=${journal.id}`);
		}
	}

	function editJournal() {
		goto(`/journals?edit=${journal.id}`);
	}

	$: typeInfo = journal ? getJournalTypeInfo(journal) : null;

	function getJournalTypeInfo(journal: any) {
		const isAI = journal.status !== undefined;
		const status = journal.status || 'completed';
		const followupCount = journal.followupCount || 0;
		const maxFollowups = journal.maxFollowups || 3;

		return {
			isAI,
			status,
			followupCount,
			maxFollowups
		};
	}
</script>

<svelte:head>
	<title>{journal?.title || 'Journal Entry'} - LifeQuest</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
	{#if loading}
		<div class="flex min-h-screen items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<div class="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
				<p class="text-base-content/70 font-medium">Loading journal entry...</p>
			</div>
		</div>
	{:else if error}
		<div class="flex min-h-screen items-center justify-center">
			<div class="max-w-md text-center">
				<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
					<icons.AlertCircle class="h-8 w-8 text-error" />
				</div>
				<h2 class="mb-2 text-xl font-bold text-base-content">{error}</h2>
				<p class="mb-4 text-base-content/70">The journal entry could not be found or loaded.</p>
				<button class="btn btn-primary" onclick={() => goto('/journals')}>
					<icons.ArrowLeft class="mr-2 h-4 w-4" />
					Back to Journals
				</button>
			</div>
		</div>
	{:else if journal}
		<!-- Header -->
		<div class="border-b border-base-300 bg-base-100">
			<div class="container mx-auto px-6 py-4">
				<div class="flex items-center gap-4">
					<button 
						class="btn btn-ghost btn-sm"
						onclick={() => goto('/journals')}
					>
						<icons.ArrowLeft class="h-4 w-4" />
					</button>
					<div class="flex items-center gap-3">
						<div class="rounded-lg p-2 {typeInfo?.isAI ? 'bg-primary/10' : 'bg-secondary/10'}">
							{#if typeInfo?.isAI}
								<icons.Bot class="h-5 w-5 text-primary" />
							{:else}
								<icons.PenTool class="h-5 w-5 text-secondary" />
							{/if}
						</div>
						<div>
							<h1 class="text-xl font-bold text-base-content">
								{journal.title || formatDate(journal.date)}
							</h1>
							<p class="text-sm text-base-content/70">
								{formatDateTime(journal.createdAt || journal.date)}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="container mx-auto px-6 py-8">
			<div class="mx-auto max-w-4xl">
				<!-- Journal Entry Card -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<!-- Tags -->
						{#if journal.tags && journal.tags.length > 0}
							<div class="mb-6">
								<h3 class="mb-3 text-sm font-medium text-base-content/70">Tags</h3>
								<div class="flex flex-wrap gap-2">
									{#each journal.tags as tag}
										<button
											class="badge badge-primary badge-outline hover:badge-primary transition-colors"
											onclick={() => handleTagClick(tag)}
										>
											{tag}
										</button>
									{/each}
								</div>
							</div>
						{/if}

						<!-- AI Summary -->
						{#if journal.gptSummary}
							<div class="mb-6 rounded-lg border border-info/20 bg-info/5 p-4">
								<div class="mb-2 flex items-center gap-2">
									<icons.Sparkles class="h-4 w-4 text-info" />
									<span class="text-sm font-medium text-info">AI Summary</span>
								</div>
								<p class="text-sm leading-relaxed text-base-content/80">
									{journal.gptSummary}
								</p>
							</div>
						{/if}

						<!-- Condensed Summary -->
						{#if journal.condensed}
							<div class="mb-6 rounded-lg border border-secondary/20 bg-secondary/5 p-4">
								<div class="mb-2 flex items-center gap-2">
									<icons.FileText class="h-4 w-4 text-secondary" />
									<span class="text-sm font-medium text-secondary">Summary</span>
								</div>
								<p class="text-sm leading-relaxed text-base-content/80">
									{journal.condensed}
								</p>
							</div>
						{/if}

						<!-- Main Content -->
						<div class="prose max-w-none">
							<h3 class="text-base-content mb-4 text-lg font-semibold">Journal Entry</h3>
							<div class="text-base-content/90 whitespace-pre-wrap leading-relaxed">
								{journal.content}
							</div>
						</div>

						<!-- Metadata -->
						<div class="mt-8 flex flex-wrap gap-4 border-t border-base-300 pt-6">
							{#if journal.sentimentScore}
								<div class="flex items-center gap-2">
									<icons.Heart class="h-4 w-4 text-base-content/50" />
									<span class="text-sm text-base-content/70">
										Sentiment: {journal.sentimentScore}/5
									</span>
								</div>
							{/if}
							{#if journal.dayRating}
								<div class="flex items-center gap-2">
									<icons.Star class="h-4 w-4 text-base-content/50" />
									<span class="text-sm text-base-content/70">
										Day Rating: {journal.dayRating}/5
									</span>
								</div>
							{/if}
							{#if journal.moodTags && journal.moodTags.length > 0}
								<div class="flex items-center gap-2">
									<icons.Smile class="h-4 w-4 text-base-content/50" />
									<span class="text-sm text-base-content/70">
										Mood: {journal.moodTags.join(', ')}
									</span>
								</div>
							{/if}
						</div>

						<!-- Actions -->
						<div class="card-actions mt-6 justify-end">
							{#if typeInfo?.isAI}
								<button class="btn btn-primary" onclick={continueAIChat}>
									{#if typeInfo.status === 'completed'}
										<icons.MessageCircle class="mr-2 h-4 w-4" />
										View AI Session
									{:else}
										<icons.Play class="mr-2 h-4 w-4" />
										Continue Session
									{/if}
								</button>
							{:else}
								<button class="btn btn-secondary" onclick={editJournal}>
									<icons.Edit class="mr-2 h-4 w-4" />
									Edit Entry
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
