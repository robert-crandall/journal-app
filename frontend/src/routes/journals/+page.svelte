<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { journalsApi } from '$lib/api';
	import {
		Bot,
		Plus,
		MessageCircle,
		Calendar,
		Clock,
		CheckCircle,
		Play,
		Edit,
		Trash2,
		BookOpen,
		Sparkles,
		PenTool,
		Search,
		Filter
	} from 'lucide-svelte';

	let journals: any[] = [];
	let loading = true;
	let showCreateForm = false;
	let editingJournal: any = null;
	let searchQuery = '';
	let filterType = 'all'; // all, ai, quick
	let selectedTag = ''; // for tag filtering
	let saveMessage = '';

	// Form data
	let formData = {
		content: '',
		date: ''
	};

	// Enhanced computed properties
	$: filteredJournals = journals
		.filter((journal) => {
			// Search filter - search in content, title, and condensed
			if (searchQuery) {
				const searchLower = searchQuery.toLowerCase();
				const content = journal.content?.toLowerCase() || '';
				const title = journal.title?.toLowerCase() || '';
				const condensed = journal.condensed?.toLowerCase() || '';

				if (
					!content.includes(searchLower) &&
					!title.includes(searchLower) &&
					!condensed.includes(searchLower)
				) {
					return false;
				}
			}

			// Tag filter
			if (selectedTag) {
				const tags = journal.tags || [];
				const moodTags = journal.moodTags || [];
				const allTags = [...tags, ...moodTags];
				if (!allTags.includes(selectedTag)) {
					return false;
				}
			}

			// Type filter
			if (filterType === 'ai' && !journal.status) return false;
			if (filterType === 'quick' && journal.status) return false;

			return true;
		})
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	$: aiJournals = journals.filter((j) => j.status);
	$: traditionalJournals = journals.filter((j) => !j.status);
	$: recentEntries = journals.slice(0, 3);

	// Get all unique tags from journals
	$: allTags = [
		...new Set(journals.flatMap((j) => [...(j.tags || []), ...(j.moodTags || [])]))
	].sort();

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
				showSaveMessage('Journal updated successfully ✓');
			} else {
				await journalsApi.create(journalData);
				showSaveMessage('New journal entry created ✓');
			}

			showCreateForm = false;
			await loadJournals();
		} catch (error) {
			console.error('Failed to save journal:', error);
		}
	}

	async function deleteJournal(journalId: string) {
		if (
			confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')
		) {
			try {
				await journalsApi.delete(journalId);
				await loadJournals();
				showSaveMessage('Journal entry deleted');
			} catch (error) {
				console.error('Failed to delete journal:', error);
			}
		}
	}

	function showSaveMessage(message: string) {
		saveMessage = message;
		setTimeout(() => (saveMessage = ''), 3000);
	}

	function closeModal(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			showCreateForm = false;
		}
	}

	function resetFilters() {
		searchQuery = '';
		filterType = 'all';
		selectedTag = '';
	}

	function handleTagClick(tag: string) {
		selectedTag = selectedTag === tag ? '' : tag;
	}

	function viewJournalDetail(journalId: string) {
		goto(`/journals/${journalId}`);
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

	function getRelativeDate(dateString: string) {
		const date = new Date(dateString);
		const today = new Date();
		const diffTime = today.getTime() - date.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Journal - Life Quest</title>
</svelte:head>

<!-- Success Message -->
{#if saveMessage}
	<div
		class="border-success/20 bg-base-100 fixed top-6 right-6 z-50 max-w-sm rounded-lg border p-4 shadow-lg"
	>
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<CheckCircle class="text-success h-5 w-5" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-base-content text-sm font-medium">{saveMessage}</p>
			</div>
		</div>
	</div>
{/if}

<div class="bg-base-200 min-h-screen">
	<!-- Hero Header -->
	<div class="text-primary-content bg-gradient-to-br from-purple-600 to-purple-700">
		<div class="container mx-auto px-6 py-12">
			<div class="max-w-4xl">
				<div class="mb-4 flex items-center gap-4">
					<div class="bg-base-100/10 rounded-lg p-3 backdrop-blur-sm">
						<BookOpen class="h-8 w-8" />
					</div>
					<div>
						<h1 class="mb-2 text-4xl font-bold">Journal</h1>
						<p class="text-lg text-purple-100">Reflect, grow, and capture your journey</p>
					</div>
				</div>

				<!-- Hero Stats -->
				<div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
					<div class="bg-base-100/10 rounded-lg p-4 backdrop-blur-sm">
						<div class="mb-1 flex items-center gap-2">
							<Bot class="h-4 w-4 text-purple-200" />
							<span class="text-sm text-purple-200">AI Sessions</span>
						</div>
						<div class="text-2xl font-bold">{aiJournals.length}</div>
					</div>

					<div class="bg-base-100/10 rounded-lg p-4 backdrop-blur-sm">
						<div class="mb-1 flex items-center gap-2">
							<PenTool class="h-4 w-4 text-purple-200" />
							<span class="text-sm text-purple-200">Quick Entries</span>
						</div>
						<div class="text-2xl font-bold">{traditionalJournals.length}</div>
					</div>

					<div class="bg-base-100/10 col-span-2 rounded-lg p-4 backdrop-blur-sm sm:col-span-1">
						<div class="mb-1 flex items-center gap-2">
							<Calendar class="h-4 w-4 text-purple-200" />
							<span class="text-sm text-purple-200">Total Entries</span>
						</div>
						<div class="text-2xl font-bold">{journals.length}</div>
					</div>
				</div>

				<!-- Quick Actions -->
				<div class="mt-8 flex flex-wrap gap-4">
					<button
						class="group bg-base-100/10 hover:bg-base-100/20 flex items-center gap-3 rounded-lg px-6 py-4 backdrop-blur-sm transition-colors"
						onclick={startAIChat}
					>
						<div class="bg-base-100/10 group-hover:bg-base-100/20 rounded-lg p-2 transition-colors">
							<Bot class="h-5 w-5" />
						</div>
						<div class="text-left">
							<div class="font-semibold">AI Chat Session</div>
							<div class="text-sm text-purple-200">Guided reflection with AI</div>
						</div>
					</button>

					<button
						class="group bg-base-100/10 hover:bg-base-100/20 flex items-center gap-3 rounded-lg px-6 py-4 backdrop-blur-sm transition-colors"
						onclick={openCreateForm}
					>
						<div class="bg-base-100/10 group-hover:bg-base-100/20 rounded-lg p-2 transition-colors">
							<PenTool class="h-5 w-5" />
						</div>
						<div class="text-left">
							<div class="font-semibold">Quick Entry</div>
							<div class="text-sm text-purple-200">Write a brief reflection</div>
						</div>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Controls Section -->
	<div class="border-base-300 bg-base-100 sticky top-0 z-10 border-b">
		<div class="container mx-auto px-6 py-4">
			<div class="flex flex-col items-center gap-4 lg:flex-row">
				<!-- Search -->
				<div class="relative flex-1">
					<Search
						class="text-base-content/50 absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform"
					/>
					<input
						type="text"
						placeholder="Search your journal entries..."
						class="input input-bordered w-full pl-10"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Filters and Actions -->
				<div class="flex flex-wrap items-center gap-3">
					<!-- Type Filter -->
					<div class="relative">
						<select class="select select-bordered pr-10" bind:value={filterType}>
							<option value="all">All Entries</option>
							<option value="ai">AI Sessions</option>
							<option value="quick">Quick Entries</option>
						</select>
						<Filter
							class="text-base-content/50 pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform"
						/>
					</div>

					<!-- Tag Filter -->
					{#if allTags.length > 0}
						<div class="relative">
							<select class="select select-bordered pr-10" bind:value={selectedTag}>
								<option value="">All Tags</option>
								{#each allTags as tag}
									<option value={tag}>{tag}</option>
								{/each}
							</select>
							<Filter
								class="text-base-content/50 pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform"
							/>
						</div>
					{/if}

					<!-- Reset -->
					{#if searchQuery || filterType !== 'all' || selectedTag}
						<button class="btn btn-ghost btn-sm" onclick={resetFilters}> Reset </button>
					{/if}

					<!-- Create Buttons -->
					<button class="btn btn-outline btn-secondary gap-2" onclick={startAIChat}>
						<Bot class="h-4 w-4" />
						<span class="hidden sm:inline">AI Chat</span>
					</button>

					<button class="btn btn-primary gap-2" onclick={openCreateForm}>
						<Plus class="h-4 w-4" />
						<span>Quick Entry</span>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="container mx-auto px-6 py-8">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div class="flex flex-col items-center gap-4">
					<div
						class="h-10 w-10 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"
					></div>
					<p class="text-base-content/70 font-medium">Loading your journal...</p>
				</div>
			</div>
		{:else if filteredJournals.length === 0}
			<div class="py-20 text-center">
				<div class="border-base-300 bg-base-100 mx-auto max-w-md rounded-xl border p-12 shadow-sm">
					<div
						class="bg-secondary/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
					>
						<BookOpen class="text-secondary h-10 w-10" />
					</div>
					{#if journals.length === 0}
						<h3 class="text-base-content mb-3 text-2xl font-bold">Start Your Journey</h3>
						<p class="text-base-content/70 mb-8 leading-relaxed">
							Begin documenting your thoughts, reflections, and growth. Choose your preferred way to
							start.
						</p>
						<div class="flex flex-col justify-center gap-4 sm:flex-row">
							<button class="btn btn-primary px-6 py-3 text-lg" onclick={startAIChat}>
								<Bot class="mr-2 h-5 w-5" />
								AI Guided Session
							</button>
							<button class="btn btn-outline px-6 py-3" onclick={openCreateForm}>
								<PenTool class="mr-2 inline h-5 w-5" />
								Quick Entry
							</button>
						</div>
					{:else}
						<h3 class="text-base-content mb-3 text-2xl font-bold">No matching entries</h3>
						<p class="text-base-content/70 mb-8 leading-relaxed">
							Try adjusting your search or filter criteria to find what you're looking for.
						</p>
						<button class="btn btn-primary px-6 py-3 text-lg" onclick={resetFilters}>
							<Search class="mr-2 h-5 w-5" />
							Reset Search
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Journal Entries Grid -->
			<div class="grid gap-8">
				{#each filteredJournals as journal (journal.id)}
					{@const typeInfo = getJournalTypeInfo(journal)}
					<div
						class="group border-base-300 bg-base-100 cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
						role="button"
						tabindex="0"
						onclick={() => viewJournalDetail(journal.id)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								viewJournalDetail(journal.id);
							}
						}}
						aria-label={`View journal entry: ${journal.title || formatDate(journal.date)}`}
					>
						<!-- Entry Header -->
						<div
							class="border-b p-6 pb-4 {typeInfo.isAI
								? 'border-primary/20 bg-primary/5'
								: 'border-secondary/20 bg-secondary/5'}"
						>
							<div class="flex items-start justify-between gap-4">
								<div class="flex flex-1 items-center gap-3">
									<div
										class="p-2 {typeInfo.isAI
											? 'bg-primary/10 text-primary'
											: 'bg-secondary/10 text-secondary'} rounded-lg"
									>
										{#if typeInfo.isAI}
											<Bot class="h-5 w-5" />
										{:else}
											<PenTool class="h-5 w-5" />
										{/if}
									</div>
									<div class="flex-1">
										<!-- Title -->
										{#if journal.title}
											<h3 class="text-base-content mb-1 text-lg font-bold">
												{journal.title}
											</h3>
										{/if}

										<div class="mb-2 flex items-center gap-2">
											<span class="text-base-content text-sm font-medium"
												>{formatDate(journal.date)}</span
											>
											<span class="text-base-content/70 text-sm"
												>• {getRelativeDate(journal.date)}</span
											>
										</div>

										<div class="flex flex-wrap items-center gap-2">
											{#if typeInfo.isAI}
												<div
													class="inline-flex items-center gap-1 px-2 py-1 {typeInfo.status ===
													'completed'
														? 'bg-success/10 text-success'
														: typeInfo.status === 'in_progress'
															? 'bg-primary/10 text-primary'
															: 'bg-warning/10 text-warning'} rounded text-xs font-medium"
												>
													{#if typeInfo.status === 'completed'}
														<CheckCircle class="h-3 w-3" />
														Completed
													{:else if typeInfo.status === 'in_progress'}
														<MessageCircle class="h-3 w-3" />
														In Progress ({typeInfo.followupCount}/{typeInfo.maxFollowups})
													{:else}
														<Play class="h-3 w-3" />
														New Session
													{/if}
												</div>
											{:else}
												<div
													class="bg-secondary/10 text-secondary inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
												>
													<PenTool class="h-3 w-3" />
													Quick Entry
												</div>
											{/if}
										</div>
									</div>
								</div>

								<!-- Actions -->
								<div
									class="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100"
									aria-label="Journal actions"
								>
									{#if typeInfo.isAI}
										<button
											class="btn btn-ghost btn-sm text-primary hover:bg-primary/10"
											onclick={(e) => {
												e.stopPropagation();
												continueAIChat(journal.id);
											}}
											title={typeInfo.status === 'completed' ? 'View session' : 'Continue session'}
										>
											{#if typeInfo.status === 'completed'}
												<BookOpen class="h-5 w-5" />
											{:else}
												<MessageCircle class="h-5 w-5" />
											{/if}
										</button>
									{:else}
										<button
											class="btn btn-ghost btn-sm"
											onclick={(e) => {
												e.stopPropagation();
												openEditForm(journal);
											}}
											title="Edit entry"
										>
											<Edit class="h-5 w-5" />
										</button>
									{/if}
									<button
										class="btn btn-ghost btn-sm text-error hover:bg-error/10"
										onclick={(e) => {
											e.stopPropagation();
											deleteJournal(journal.id);
										}}
										title="Delete entry"
									>
										<Trash2 class="h-5 w-5" />
									</button>
								</div>
							</div>
						</div>

						<!-- Entry Content -->
						<div class="p-6">
							<!-- Condensed Summary -->
							{#if journal.condensed}
								<div class="mb-4">
									<p class="text-base-content text-base leading-relaxed font-medium">
										{journal.condensed}
									</p>
								</div>
							{/if}

							<!-- Tags -->
							{#if (journal.tags && journal.tags.length > 0) || (journal.moodTags && journal.moodTags.length > 0)}
								<div class="mb-4">
									<div class="flex flex-wrap gap-2">
										{#each journal.tags || [] as tag}
											<button
												class="bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-3 py-1 text-sm font-medium transition-colors"
												onclick={(e) => {
													e.stopPropagation();
													handleTagClick(tag);
												}}
											>
												#{tag}
											</button>
										{/each}
										{#each journal.moodTags || [] as tag}
											<button
												class="bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-full px-3 py-1 text-sm font-medium transition-colors"
												onclick={(e) => {
													e.stopPropagation();
													handleTagClick(tag);
												}}
											>
												🎭 {tag}
											</button>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Original content preview -->
							<div class="prose max-w-none">
								<p class="text-base-content/70 text-sm leading-relaxed whitespace-pre-wrap">
									{truncateContent(journal.content, 200)}
								</p>
							</div>

							{#if journal.gptSummary}
								<div class="border-primary/20 bg-primary/5 mt-4 rounded-lg border p-4">
									<div class="mb-2 flex items-center gap-2">
										<Sparkles class="text-primary h-4 w-4" />
										<span class="text-primary text-sm font-medium">AI Analysis</span>
									</div>
									<p class="text-base-content/80 text-sm leading-relaxed">
										{truncateContent(journal.gptSummary, 150)}
									</p>
								</div>
							{/if}

							<!-- Mobile Actions -->
							<div class="mt-6 flex gap-3 sm:hidden">
								{#if typeInfo.isAI}
									<button
										class="btn btn-outline btn-primary flex-1"
										onclick={(e) => {
											e.stopPropagation();
											continueAIChat(journal.id);
										}}
									>
										{#if typeInfo.status === 'completed'}
											<BookOpen class="h-4 w-4" />
											View
										{:else}
											<MessageCircle class="h-4 w-4" />
											Continue
										{/if}
									</button>
								{:else}
									<button
										class="btn btn-outline btn-secondary flex-1"
										onclick={(e) => {
											e.stopPropagation();
											openEditForm(journal);
										}}
									>
										<Edit class="h-4 w-4" />
										Edit
									</button>
								{/if}
								<button
									class="btn btn-ghost text-error hover:bg-error/10"
									onclick={(e) => {
										e.stopPropagation();
										deleteJournal(journal.id);
									}}
								>
									<Trash2 class="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Create/Edit Journal Modal -->
{#if showCreateForm}
	<div
		class="modal modal-open"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
		onclick={closeModal}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				showCreateForm = false;
			}
		}}
	>
		<div class="modal-box max-w-3xl">
			<!-- Modal Header -->
			<div class="border-base-300 mb-6 flex items-center justify-between border-b pb-4">
				<div class="flex items-center gap-3">
					<div class="bg-secondary/10 rounded-lg p-2">
						<PenTool class="text-secondary h-5 w-5" />
					</div>
					<div>
						<h2 class="text-base-content text-xl font-semibold" id="modal-title">
							{editingJournal ? 'Edit Journal Entry' : 'New Journal Entry'}
						</h2>
						<p class="text-base-content/70 text-sm">
							{editingJournal ? 'Update your reflection' : 'Capture your thoughts and experiences'}
						</p>
					</div>
				</div>
				<button
					class="btn btn-ghost btn-sm"
					aria-label="Close modal"
					onclick={() => (showCreateForm = false)}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="max-h-[calc(90vh-140px)] overflow-y-auto">
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Date Field -->
					<div class="space-y-2">
						<label for="journalDate" class="label">
							<span class="label-text">Date</span>
						</label>
						<input
							id="journalDate"
							type="date"
							class="input input-bordered w-full"
							bind:value={formData.date}
						/>
					</div>

					<!-- Content Field -->
					<div class="space-y-2">
						<label for="journalContent" class="label">
							<span class="label-text">Your Reflection <span class="text-error">*</span></span>
						</label>
						<p class="text-base-content/70 mb-3 text-sm">
							What happened today? How are you feeling? What did you learn?
						</p>
						<textarea
							id="journalContent"
							class="textarea textarea-bordered min-h-[300px] w-full resize-none"
							bind:value={formData.content}
							placeholder="Write about your day, thoughts, feelings, insights, achievements, challenges, or anything on your mind..."
							required
						></textarea>
					</div>

					<!-- Form Actions -->
					<div class="border-base-300 flex items-center justify-end gap-3 border-t pt-4">
						<button type="button" class="btn btn-ghost" onclick={() => (showCreateForm = false)}>
							Cancel
						</button>
						<button type="submit" class="btn btn-primary">
							{editingJournal ? 'Update Entry' : 'Save Entry'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
