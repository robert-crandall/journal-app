<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { journalsApi } from '$lib/api';
	import { Bot, Plus, MessageCircle, Calendar, Clock, CheckCircle, Play } from 'lucide-svelte';
	
	let journals: any[] = [];
	let loading = true;
	let showCreateForm = false;
	let editingJournal: any = null;
	
	// Form data
	let formData = {
		content: '',
		date: ''
	};
	
	onMount(async () => {
		await loadJournals();
		// Set today's date as default
		formData.date = new Date().toISOString().split('T')[0];
	});
	
	async function loadJournals() {
		try {
			loading = true;
			const response = await journalsApi.getAll();
			journals = response.journals;
		} catch (error) {
			console.error('Failed to load journals:', error);
		} finally {
			loading = false;
		}
	}
	
	function startAIChat() {
		goto('/journals/chat');
	}

	function continueAIChat(journalId: string) {
		goto(`/journals/chat?id=${journalId}`);
	}
	
	function openCreateForm() {
		formData = {
			content: '',
			date: new Date().toISOString().split('T')[0]
		};
		editingJournal = null;
		showCreateForm = true;
	}
	
	function openEditForm(journal: any) {
		formData = {
			content: journal.content,
			date: journal.date ? journal.date.split('T')[0] : new Date().toISOString().split('T')[0]
		};
		editingJournal = journal;
		showCreateForm = true;
	}
	
	async function handleSubmit(event: Event) {
		event.preventDefault();
		try {
			const journalData = {
				content: formData.content,
				date: formData.date || undefined
			};
			
			if (editingJournal) {
				await journalsApi.update(editingJournal.id, journalData);
			} else {
				await journalsApi.create(journalData);
			}
			
			showCreateForm = false;
			await loadJournals();
		} catch (error) {
			console.error('Failed to save journal:', error);
		}
	}
	
	async function deleteJournal(journalId: string) {
		if (confirm('Are you sure you want to delete this journal entry?')) {
			try {
				await journalsApi.delete(journalId);
				await loadJournals();
			} catch (error) {
				console.error('Failed to delete journal:', error);
			}
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	function formatDateTime(dateString: string) {
		return new Date(dateString).toLocaleString();
	}
	
	function truncateContent(content: string, maxLength = 200) {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}

	function getJournalTypeInfo(journal: any) {
		if (journal.status) {
			return {
				isAI: true,
				status: journal.status,
				followupCount: journal.followupCount || 0,
				maxFollowups: journal.maxFollowups || 3
			};
		}
		return { isAI: false };
	}

	// Separate AI and traditional journals
	$: aiJournals = journals.filter(j => j.status);
	$: traditionalJournals = journals.filter(j => !j.status);
</script>

<svelte:head>
	<title>Journal - Life Quest</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Journal</h1>
			<p class="text-base-content/70">Reflect on your journey and growth</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-primary" onclick={startAIChat}>
				<Bot class="w-5 h-5 mr-2" />
				AI Chat Session
			</button>
			<button class="btn btn-outline" onclick={openCreateForm}>
				<Plus class="w-5 h-5 mr-2" />
				Quick Entry
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center p-8">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else}
		<!-- AI Journal Sessions -->
		{#if aiJournals.length > 0}
			<div class="mb-8">
				<h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
					<Bot size={20} />
					AI Chat Sessions
				</h2>
				<div class="grid gap-4">
					{#each aiJournals as journal}
						{@const typeInfo = getJournalTypeInfo(journal)}
						<div class="card bg-base-100 shadow-sm border-l-4 {
							typeInfo.status === 'completed' ? 'border-l-success' : 
							typeInfo.status === 'in_progress' ? 'border-l-primary' : 'border-l-warning'
						}">
							<div class="card-body p-4">
								<div class="flex justify-between items-start">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<h3 class="font-semibold">
												{formatDate(journal.date)}
											</h3>
											<div class="badge {
												typeInfo.status === 'completed' ? 'badge-success' : 
												typeInfo.status === 'in_progress' ? 'badge-primary' : 'badge-warning'
											} gap-1">
												{#if typeInfo.status === 'completed'}
													<CheckCircle size={12} />
													Completed
												{:else if typeInfo.status === 'in_progress'}
													<MessageCircle size={12} />
													In Progress ({typeInfo.followupCount}/{typeInfo.maxFollowups})
												{:else}
													<Play size={12} />
													New
												{/if}
											</div>
										</div>
										<div class="prose max-w-none">
											<p class="text-sm text-base-content/80 whitespace-pre-wrap">
												{truncateContent(journal.content, 150)}
											</p>
										</div>
										{#if journal.gptSummary}
											<div class="mt-3 p-3 bg-base-200 rounded-lg">
												<p class="text-xs font-medium mb-1">AI Summary:</p>
												<p class="text-xs text-base-content/70">
													{truncateContent(journal.gptSummary, 100)}
												</p>
											</div>
										{/if}
									</div>
									<div class="flex gap-2 ml-4">
										{#if typeInfo.status !== 'completed'}
											<button 
												class="btn btn-sm btn-primary" 
												onclick={() => continueAIChat(journal.id)}
											>
												Continue
											</button>
										{:else}
											<button 
												class="btn btn-sm btn-ghost" 
												onclick={() => continueAIChat(journal.id)}
											>
												View
											</button>
										{/if}
										<button 
											class="btn btn-sm btn-error btn-outline" 
											onclick={() => deleteJournal(journal.id)}
											aria-label="Delete journal entry"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Traditional Journal Entries -->
		{#if traditionalJournals.length > 0}
			<div class="mb-8">
				<h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
					<Calendar size={20} />
					Quick Entries
				</h2>
				<div class="space-y-4">
					{#each traditionalJournals as journal}
						<div class="card bg-base-100 shadow-sm">
							<div class="card-body p-4">
								<div class="flex justify-between items-start">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<h3 class="font-semibold">
												{formatDate(journal.date)}
											</h3>
										</div>
										<div class="prose max-w-none">
											<p class="text-sm text-base-content/80 whitespace-pre-wrap">
												{truncateContent(journal.content)}
											</p>
										</div>
									</div>
									<div class="flex gap-2 ml-4">
										<button 
											class="btn btn-sm btn-ghost" 
											onclick={() => openEditForm(journal)}
											aria-label="Edit journal entry"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</button>
										<button 
											class="btn btn-sm btn-error btn-outline" 
											onclick={() => deleteJournal(journal.id)}
											aria-label="Delete journal entry"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		{#if journals.length === 0}
			<div class="text-center py-12">
				<div class="mb-6">
					<Bot class="w-16 h-16 mx-auto text-base-content/30 mb-4" />
					<p class="text-lg text-base-content/70 mb-2">No journal entries yet</p>
					<p class="text-base-content/50 mb-6">Start your reflection journey!</p>
				</div>
				<div class="flex gap-4 justify-center">
					<button class="btn btn-primary" onclick={startAIChat}>
						<Bot class="w-5 h-5 mr-2" />
						Start AI Chat Session
					</button>
					<button class="btn btn-outline" onclick={openCreateForm}>
						<Plus class="w-5 h-5 mr-2" />
						Write Quick Entry
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Create/Edit Journal Modal -->
{#if showCreateForm}
	<div class="modal modal-open">
		<div class="modal-box w-11/12 max-w-3xl">
			<h3 class="font-bold text-lg mb-4">
				{editingJournal ? 'Edit Journal Entry' : 'New Journal Entry'}
			</h3>
			
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="form-control">
					<label class="label" for="journalDate">
						<span class="label-text">Date</span>
					</label>
					<input 
						id="journalDate"
						type="date" 
						class="input input-bordered" 
						bind:value={formData.date}
					/>
				</div>
				
				<div class="form-control">
					<label class="label" for="journalContent">
						<span class="label-text">Your Reflection *</span>
						<span class="label-text-alt">What happened today? How are you feeling? What did you learn?</span>
					</label>
					<textarea 
						id="journalContent"
						class="textarea textarea-bordered min-h-[300px]" 
						bind:value={formData.content}
						placeholder="Write about your day, thoughts, feelings, insights, achievements, challenges, or anything on your mind..."
						required
					></textarea>
				</div>
				
				<div class="modal-action">
					<button type="button" class="btn" onclick={() => showCreateForm = false}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						{editingJournal ? 'Update Entry' : 'Save Entry'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
