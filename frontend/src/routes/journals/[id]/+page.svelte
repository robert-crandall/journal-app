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

<div class="bg-base-200 min-h-screen">
	{#if loading}
		<div class="flex min-h-screen items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<div
					class="border-primary h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
				></div>
				<p class="text-base-content/70 font-medium">Loading journal entry...</p>
			</div>
		</div>
	{:else if error}
		<div class="flex min-h-screen items-center justify-center">
			<div class="max-w-md text-center">
				<div
					class="bg-error/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
				>
					<icons.AlertCircle class="text-error h-8 w-8" />
				</div>
				<h2 class="text-base-content mb-2 text-xl font-bold">{error}</h2>
				<p class="text-base-content/70 mb-4">The journal entry could not be found or loaded.</p>
				<button class="btn btn-primary" onclick={() => goto('/journals')}>
					<icons.ArrowLeft class="mr-2 h-4 w-4" />
					Back to Journals
				</button>
			</div>
		</div>
	{:else if journal}
		<!-- Header -->
		<div class="border-base-300 bg-base-100 border-b">
			<div class="container mx-auto px-6 py-4">
				<div class="flex items-center gap-4">
					<button class="btn btn-ghost btn-sm" onclick={() => goto('/journals')}>
						<icons.ArrowLeft class="h-4 w-4" />
					</button>
					<div class="flex items-center gap-3">
						<div class="rounded-lg p-2 {typeInfo?.isAI ? 'bg-primary/10' : 'bg-secondary/10'}">
							{#if typeInfo?.isAI}
								<icons.Bot class="text-primary h-5 w-5" />
							{:else}
								<icons.PenTool class="text-secondary h-5 w-5" />
							{/if}
						</div>
						<div>
							<h1 class="text-base-content text-xl font-bold">
								{journal.title || formatDate(journal.date)}
							</h1>
							<p class="text-base-content/70 text-sm">
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
								<h3 class="text-base-content/70 mb-3 text-sm font-medium">Tags</h3>
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
							<div class="border-info/20 bg-info/5 mb-6 rounded-lg border p-4">
								<div class="mb-2 flex items-center gap-2">
									<icons.Sparkles class="text-info h-4 w-4" />
									<span class="text-info text-sm font-medium">AI Summary</span>
								</div>
								<p class="text-base-content/80 text-sm leading-relaxed">
									{journal.gptSummary}
								</p>
							</div>
						{/if}

						<!-- Condensed Summary -->
						{#if journal.condensed}
							<div class="border-secondary/20 bg-secondary/5 mb-6 rounded-lg border p-4">
								<div class="mb-2 flex items-center gap-2">
									<icons.FileText class="text-secondary h-4 w-4" />
									<span class="text-secondary text-sm font-medium">Summary</span>
								</div>
								<p class="text-base-content/80 text-sm leading-relaxed">
									{journal.condensed}
								</p>
							</div>
						{/if}

						<!-- Main Content -->
						<div class="prose max-w-none">
							<h3 class="text-base-content mb-4 text-lg font-semibold">Journal Entry</h3>
							<div class="text-base-content/90 leading-relaxed whitespace-pre-wrap">
								{#if journal.conversationHistory}
									{#each journal.conversationHistory as msg}
										<div class="mb-4">
											{#if msg.role === 'user'}
												<div class="text-primary mb-1 font-semibold">You:</div>
											{:else}
												<div class="text-secondary mb-1 font-semibold">AI:</div>
											{/if}
											{msg.content}
										</div>
									{/each}
								{:else}
									{journal.content}
								{/if}
							</div>
						</div>

						<!-- Metadata -->
						<div class="border-base-300 mt-8 flex flex-wrap gap-4 border-t pt-6">
							{#if journal.sentimentScore}
								<div class="flex items-center gap-2">
									<icons.Heart class="text-base-content/50 h-4 w-4" />
									<span class="text-base-content/70 text-sm">
										Sentiment: {journal.sentimentScore}/5
									</span>
								</div>
							{/if}
							{#if journal.dayRating}
								<div class="flex items-center gap-2">
									<icons.Star class="text-base-content/50 h-4 w-4" />
									<span class="text-base-content/70 text-sm">
										Day Rating: {journal.dayRating}/5
									</span>
								</div>
							{/if}
							{#if journal.moodTags && journal.moodTags.length > 0}
								<div class="flex items-center gap-2">
									<icons.Smile class="text-base-content/50 h-4 w-4" />
									<span class="text-base-content/70 text-sm">
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
