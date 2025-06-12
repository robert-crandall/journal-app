<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft, Book, Calendar, Tag, Award, Edit } from 'lucide-svelte';
	import type { JournalEntryWithTags } from '$lib/types';
	import StatDisplay from '$lib/components/stats/StatDisplay.svelte';
	
	let entry = $state<JournalEntryWithTags | null>(null);
	let loading = $state(true);
	let error = $state('');
	
	onMount(async () => {
		await loadEntry();
	});
	
	async function loadEntry() {
		try {
			loading = true;
			error = '';
			const entryId = $page.params.id;
			
			const response = await fetch(`/api/journal/${entryId}`);
			
			if (response.ok) {
				const data = await response.json();
				entry = data.entry;
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to load journal entry';
			}
		} catch (err) {
			console.error('Error loading journal entry:', err);
			error = 'An error occurred while loading the journal entry';
		} finally {
			loading = false;
		}
	}
	
	function formatDate(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	function formatTime(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<svelte:head>
	<title>{entry ? entry.title || 'Journal Entry' : 'Loading...'} - Journal App</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/journal" class="btn btn-ghost btn-sm">
				<ArrowLeft size={16} />
				Back to Journal
			</a>
			<div class="divider divider-horizontal"></div>
			<div>
				<h1 class="text-2xl font-bold">{entry?.title || 'Journal Entry'}</h1>
				{#if entry}
					<div class="text-base-content/60 text-sm flex items-center gap-1 mt-1">
						<Calendar size={14} />
						{formatDate(entry.createdAt)}
					</div>
				{/if}
			</div>
		</div>
		
		{#if entry}
			<a href={`/journal/${entry.id}/edit`} class="btn btn-ghost btn-sm">
				<Edit size={16} />
				Edit
			</a>
		{/if}
	</div>
	
	{#if loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error}
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-sm" on:click={loadEntry}>Retry</button>
		</div>
	{:else if entry}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-6">
				{#if entry.summary}
					<div class="card bg-base-100 border border-base-300">
						<div class="card-body">
							<h2 class="card-title">Summary</h2>
							<p class="whitespace-pre-line">{entry.summary}</p>
						</div>
					</div>
				{/if}
				
				<!-- Conversation -->
				<div class="card bg-base-100 border border-base-300">
					<div class="card-body">
						<h2 class="card-title flex items-center gap-2">
							<Book size={18} />
							Journal Conversation
						</h2>
						
						<div class="p-2 space-y-4 mt-2">
							{#each entry.conversationData as message}
								<div class="chat chat-{message.role === 'user' ? 'end' : 'start'}">
									<div class="chat-header">
										{message.role === 'user' ? 'You' : 'Journal'}
										<time class="text-xs opacity-50 ml-2">{formatTime(message.timestamp)}</time>
									</div>
									<div class="chat-bubble chat-bubble-{message.role === 'user' ? 'primary' : 'neutral'}">
										{#each message.content.split('\n') as line}
											{line}
											<br />
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
			
			<!-- Sidebar -->
			<div class="space-y-4">
				<!-- Character Stats -->
				{#if entry.characterTags && entry.characterTags.length > 0}
					<div class="card bg-base-100 border border-base-300">
						<div class="card-body">
							<h2 class="card-title flex items-center gap-2">
								<Award size={18} />
								Character Stats
							</h2>
							<div class="space-y-4 mt-2">
								{#each entry.characterTags as tag}
									<div class="bg-base-200 rounded-lg p-3">
										<div class="flex items-center justify-between mb-2">
											<a href="/stats/{tag.id}" class="font-medium hover:underline">
												{tag.name}
											</a>
											<div class="badge badge-primary">+{tag.xpGained} XP</div>
										</div>
										
										<a href="/stats/{tag.id}" class="btn btn-sm btn-ghost w-full">
											View Stat Details
										</a>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
				
				<!-- Tags -->
				{#if entry.contentTags && entry.contentTags.length > 0}
					<div class="card bg-base-100 border border-base-300">
						<div class="card-body">
							<h2 class="card-title flex items-center gap-2">
								<Tag size={18} />
								Tags
							</h2>
							<div class="flex flex-wrap gap-2 mt-2">
								{#each entry.contentTags as tag}
									<div class="badge badge-outline">{tag.name}</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
				
				<!-- Tone Tags -->
				{#if entry.toneTags && entry.toneTags.length > 0}
					<div class="card bg-base-100 border border-base-300">
						<div class="card-body">
							<h2 class="card-title flex items-center gap-2">
								<Tag size={18} />
								Tone
							</h2>
							<div class="flex flex-wrap gap-2 mt-2">
								{#each entry.toneTags as tag}
									<div class="badge">{tag.name}</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
				
				<!-- Linked Experiments -->
				{#if entry.experiments && entry.experiments.length > 0}
					<div class="card bg-base-100 border border-base-300">
						<div class="card-body">
							<h2 class="card-title">Linked Experiments</h2>
							<ul class="list-disc pl-5 mt-2">
								{#each entry.experiments as experiment}
									<li>
										<a href="/experiments/{experiment.id}" class="link">
											{experiment.title}
										</a>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="alert alert-error">
			<span>Journal entry not found</span>
		</div>
	{/if}
</div>
