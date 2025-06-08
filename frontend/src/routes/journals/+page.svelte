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
	let saveMessage = '';

	// Form data
	let formData = {
		content: '',
		date: ''
	};

	// Enhanced computed properties
	$: filteredJournals = journals
		.filter((journal) => {
			// Search filter
			if (searchQuery && !journal.content.toLowerCase().includes(searchQuery.toLowerCase()))
				return false;

			// Type filter
			if (filterType === 'ai' && !journal.status) return false;
			if (filterType === 'quick' && journal.status) return false;

			return true;
		})
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	$: aiJournals = journals.filter((j) => j.status);
	$: traditionalJournals = journals.filter((j) => !j.status);
	$: recentEntries = journals.slice(0, 3);

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
		class="fixed top-6 right-6 z-50 max-w-sm rounded-lg border border-green-200 bg-white p-4 shadow-lg"
	>
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<CheckCircle class="h-5 w-5 text-green-600" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-neutral-900">{saveMessage}</p>
			</div>
		</div>
	</div>
{/if}

<div class="bg-neutral-25 min-h-screen">
	<!-- Hero Header -->
	<div class="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
		<div class="container mx-auto px-6 py-12">
			<div class="max-w-4xl">
				<div class="mb-4 flex items-center gap-4">
					<div class="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
						<BookOpen class="h-8 w-8" />
					</div>
					<div>
						<h1 class="mb-2 text-4xl font-bold">Journal</h1>
						<p class="text-lg text-purple-100">Reflect, grow, and capture your journey</p>
					</div>
				</div>

				<!-- Hero Stats -->
				<div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
					<div class="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
						<div class="mb-1 flex items-center gap-2">
							<Bot class="h-4 w-4 text-purple-200" />
							<span class="text-sm text-purple-200">AI Sessions</span>
						</div>
						<div class="text-2xl font-bold">{aiJournals.length}</div>
					</div>

					<div class="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
						<div class="mb-1 flex items-center gap-2">
							<PenTool class="h-4 w-4 text-purple-200" />
							<span class="text-sm text-purple-200">Quick Entries</span>
						</div>
						<div class="text-2xl font-bold">{traditionalJournals.length}</div>
					</div>

					<div class="col-span-2 rounded-lg bg-white/10 p-4 backdrop-blur-sm sm:col-span-1">
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
						class="group flex items-center gap-3 rounded-lg bg-white/10 px-6 py-4 backdrop-blur-sm transition-colors hover:bg-white/20"
						onclick={startAIChat}
					>
						<div class="rounded-lg bg-white/10 p-2 transition-colors group-hover:bg-white/20">
							<Bot class="h-5 w-5" />
						</div>
						<div class="text-left">
							<div class="font-semibold">AI Chat Session</div>
							<div class="text-sm text-purple-200">Guided reflection with AI</div>
						</div>
					</button>

					<button
						class="group flex items-center gap-3 rounded-lg bg-white/10 px-6 py-4 backdrop-blur-sm transition-colors hover:bg-white/20"
						onclick={openCreateForm}
					>
						<div class="rounded-lg bg-white/10 p-2 transition-colors group-hover:bg-white/20">
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
	<div class="sticky top-0 z-10 border-b border-neutral-200 bg-white">
		<div class="container mx-auto px-6 py-4">
			<div class="flex flex-col items-center gap-4 lg:flex-row">
				<!-- Search -->
				<div class="relative flex-1">
					<Search
						class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-neutral-400"
					/>
					<input
						type="text"
						placeholder="Search your journal entries..."
						class="w-full rounded-lg border border-neutral-300 bg-white py-3 pr-4 pl-10 shadow-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Filters and Actions -->
				<div class="flex flex-wrap items-center gap-3">
					<!-- Type Filter -->
					<div class="relative">
						<select
							class="appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-10 shadow-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
							bind:value={filterType}
						>
							<option value="all">All Entries</option>
							<option value="ai">AI Sessions</option>
							<option value="quick">Quick Entries</option>
						</select>
						<Filter
							class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-neutral-400"
						/>
					</div>

					<!-- Reset -->
					{#if searchQuery || filterType !== 'all'}
						<button
							class="rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
							onclick={resetFilters}
						>
							Reset
						</button>
					{/if}

					<!-- Create Buttons -->
					<button
						class="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-purple-700 transition-colors hover:bg-purple-100"
						onclick={startAIChat}
					>
						<Bot class="h-4 w-4" />
						<span class="hidden sm:inline">AI Chat</span>
					</button>

					<button class="btn-primary flex items-center gap-2" onclick={openCreateForm}>
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
					<p class="font-medium text-neutral-600">Loading your journal...</p>
				</div>
			</div>
		{:else if filteredJournals.length === 0}
			<div class="py-20 text-center">
				<div class="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-12 shadow-sm">
					<div
						class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100"
					>
						<BookOpen class="h-10 w-10 text-purple-600" />
					</div>
					{#if journals.length === 0}
						<h3 class="mb-3 text-2xl font-bold text-neutral-900">Start Your Journey</h3>
						<p class="mb-8 leading-relaxed text-neutral-600">
							Begin documenting your thoughts, reflections, and growth. Choose your preferred way to
							start.
						</p>
						<div class="flex flex-col justify-center gap-4 sm:flex-row">
							<button class="btn-primary px-6 py-3 text-lg" onclick={startAIChat}>
								<Bot class="mr-2 h-5 w-5" />
								AI Guided Session
							</button>
							<button
								class="rounded-lg bg-neutral-100 px-6 py-3 font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
								onclick={openCreateForm}
							>
								<PenTool class="mr-2 inline h-5 w-5" />
								Quick Entry
							</button>
						</div>
					{:else}
						<h3 class="mb-3 text-2xl font-bold text-neutral-900">No matching entries</h3>
						<p class="mb-8 leading-relaxed text-neutral-600">
							Try adjusting your search or filter criteria to find what you're looking for.
						</p>
						<button class="btn-primary px-6 py-3 text-lg" onclick={resetFilters}>
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
						class="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
					>
						<!-- Entry Header -->
						<div
							class="p-6 pb-4 {typeInfo.isAI
								? 'border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50'
								: 'border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50'}"
						>
							<div class="flex items-start justify-between gap-4">
								<div class="flex items-center gap-3">
									<div
										class="p-2 {typeInfo.isAI
											? 'bg-blue-100 text-blue-600'
											: 'bg-purple-100 text-purple-600'} rounded-lg"
									>
										{#if typeInfo.isAI}
											<Bot class="h-5 w-5" />
										{:else}
											<PenTool class="h-5 w-5" />
										{/if}
									</div>
									<div>
										<h3 class="text-lg font-semibold text-neutral-900">
											{formatDate(journal.date)}
										</h3>
										<div class="mt-1 flex items-center gap-2">
											<span class="text-sm text-neutral-600">{getRelativeDate(journal.date)}</span>
											{#if typeInfo.isAI}
												<div
													class="inline-flex items-center gap-1 px-2 py-1 {typeInfo.status ===
													'completed'
														? 'bg-green-100 text-green-700'
														: typeInfo.status === 'in_progress'
															? 'bg-blue-100 text-blue-700'
															: 'bg-amber-100 text-amber-700'} rounded text-xs font-medium"
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
													class="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700"
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
								>
									{#if typeInfo.isAI}
										<button
											class="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
											onclick={() => continueAIChat(journal.id)}
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
											class="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-50"
											onclick={() => openEditForm(journal)}
											title="Edit entry"
										>
											<Edit class="h-5 w-5" />
										</button>
									{/if}
									<button
										class="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
										onclick={() => deleteJournal(journal.id)}
										title="Delete entry"
									>
										<Trash2 class="h-5 w-5" />
									</button>
								</div>
							</div>
						</div>

						<!-- Entry Content -->
						<div class="p-6">
							<div class="prose max-w-none">
								<p class="leading-relaxed whitespace-pre-wrap text-neutral-700">
									{truncateContent(journal.content, 300)}
								</p>
							</div>

							{#if journal.gptSummary}
								<div
									class="mt-4 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4"
								>
									<div class="mb-2 flex items-center gap-2">
										<Sparkles class="h-4 w-4 text-blue-600" />
										<span class="text-sm font-medium text-blue-900">AI Summary</span>
									</div>
									<p class="text-sm leading-relaxed text-blue-800">
										{truncateContent(journal.gptSummary, 150)}
									</p>
								</div>
							{/if}

							<!-- Mobile Actions -->
							<div class="mt-6 flex gap-3 sm:hidden">
								{#if typeInfo.isAI}
									<button
										class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 transition-colors hover:bg-blue-100"
										onclick={() => continueAIChat(journal.id)}
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
										class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-purple-700 transition-colors hover:bg-purple-100"
										onclick={() => openEditForm(journal)}
									>
										<Edit class="h-4 w-4" />
										Edit
									</button>
								{/if}
								<button
									class="flex items-center justify-center rounded-lg px-4 py-2 text-red-600 transition-colors hover:bg-red-50"
									onclick={() => deleteJournal(journal.id)}
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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		onclick={closeModal}
	>
		<div class="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-neutral-200 p-6">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-purple-100 p-2">
						<PenTool class="h-5 w-5 text-purple-600" />
					</div>
					<div>
						<h2 class="text-xl font-semibold text-neutral-900">
							{editingJournal ? 'Edit Journal Entry' : 'New Journal Entry'}
						</h2>
						<p class="text-sm text-neutral-600">
							{editingJournal ? 'Update your reflection' : 'Capture your thoughts and experiences'}
						</p>
					</div>
				</div>
				<button
					class="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
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
			<div class="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Date Field -->
					<div class="space-y-2">
						<label for="journalDate" class="block text-sm font-medium text-neutral-900">
							Date
						</label>
						<input
							id="journalDate"
							type="date"
							class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 shadow-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
							bind:value={formData.date}
						/>
					</div>

					<!-- Content Field -->
					<div class="space-y-2">
						<label for="journalContent" class="block text-sm font-medium text-neutral-900">
							Your Reflection <span class="text-red-500">*</span>
						</label>
						<p class="mb-3 text-sm text-neutral-600">
							What happened today? How are you feeling? What did you learn?
						</p>
						<textarea
							id="journalContent"
							class="min-h-[300px] w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-3 shadow-sm focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
							bind:value={formData.content}
							placeholder="Write about your day, thoughts, feelings, insights, achievements, challenges, or anything on your mind..."
							required
						></textarea>
					</div>

					<!-- Form Actions -->
					<div class="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
						<button
							type="button"
							class="rounded-lg border border-neutral-300 px-4 py-2 text-neutral-700 transition-colors hover:bg-neutral-50"
							onclick={() => (showCreateForm = false)}
						>
							Cancel
						</button>
						<button type="submit" class="btn-primary">
							{editingJournal ? 'Update Entry' : 'Save Entry'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
