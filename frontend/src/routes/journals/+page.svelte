<script lang="ts">
	import { onMount } from 'svelte';
	import { journalsApi } from '$lib/api';
	
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
		<button class="btn btn-primary" onclick={openCreateForm}>
			<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Entry
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center p-8">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else}
		<div class="space-y-6">
			{#each journals as journal}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<div class="flex justify-between items-start mb-4">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="text-lg font-semibold">
										{formatDate(journal.date)}
									</h3>
									<div class="badge badge-outline text-xs">
										{formatDateTime(journal.createdAt)}
									</div>
								</div>
								<div class="prose max-w-none">
									<p class="whitespace-pre-wrap text-base-content/80">
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
			
			{#if journals.length === 0}
				<div class="text-center py-12">
					<div class="mb-4">
						<svg class="w-16 h-16 mx-auto text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
						</svg>
					</div>
					<p class="text-lg text-base-content/70">No journal entries yet</p>
					<p class="text-base-content/50">Start your reflection journey by writing your first entry!</p>
				</div>
			{/if}
		</div>
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
