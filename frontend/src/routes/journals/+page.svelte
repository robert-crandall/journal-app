<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { journalsApi } from '$lib/api';
	import { Bot, Plus, MessageCircle, Calendar, Clock, CheckCircle, Play, Edit, Trash2, BookOpen, Sparkles, PenTool, Search, Filter } from 'lucide-svelte';
	
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
	$: filteredJournals = journals.filter(journal => {
		// Search filter
		if (searchQuery && !journal.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
		
		// Type filter
		if (filterType === 'ai' && !journal.status) return false;
		if (filterType === 'quick' && journal.status) return false;
		
		return true;
	}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	$: aiJournals = journals.filter(j => j.status);
	$: traditionalJournals = journals.filter(j => !j.status);
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
		if (confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
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
		setTimeout(() => saveMessage = '', 3000);
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
	<div class="fixed top-6 right-6 z-50 bg-white border border-green-200 shadow-lg rounded-lg p-4 max-w-sm">
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<CheckCircle class="w-5 h-5 text-green-600" />
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-neutral-900">{saveMessage}</p>
			</div>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-neutral-25">
	<!-- Hero Header -->
	<div class="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
		<div class="container mx-auto px-6 py-12">
			<div class="max-w-4xl">
				<div class="flex items-center gap-4 mb-4">
					<div class="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
						<BookOpen class="w-8 h-8" />
					</div>
					<div>
						<h1 class="text-4xl font-bold mb-2">Journal</h1>
						<p class="text-purple-100 text-lg">Reflect, grow, and capture your journey</p>
					</div>
				</div>
				
				<!-- Hero Stats -->
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
					<div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
						<div class="flex items-center gap-2 mb-1">
							<Bot class="w-4 h-4 text-purple-200" />
							<span class="text-sm text-purple-200">AI Sessions</span>
						</div>
						<div class="text-2xl font-bold">{aiJournals.length}</div>
					</div>
					
					<div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
						<div class="flex items-center gap-2 mb-1">
							<PenTool class="w-4 h-4 text-purple-200" />
							<span class="text-sm text-purple-200">Quick Entries</span>
						</div>
						<div class="text-2xl font-bold">{traditionalJournals.length}</div>
					</div>
					
					<div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 col-span-2 sm:col-span-1">
						<div class="flex items-center gap-2 mb-1">
							<Calendar class="w-4 h-4 text-purple-200" />
							<span class="text-sm text-purple-200">Total Entries</span>
						</div>
						<div class="text-2xl font-bold">{journals.length}</div>
					</div>
				</div>

				<!-- Quick Actions -->
				<div class="flex flex-wrap gap-4 mt-8">
					<button 
						class="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-6 py-4 transition-colors group"
						onclick={startAIChat}
					>
						<div class="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
							<Bot class="w-5 h-5" />
						</div>
						<div class="text-left">
							<div class="font-semibold">AI Chat Session</div>
							<div class="text-sm text-purple-200">Guided reflection with AI</div>
						</div>
					</button>
					
					<button 
						class="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-6 py-4 transition-colors group"
						onclick={openCreateForm}
					>
						<div class="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
							<PenTool class="w-5 h-5" />
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
	<div class="bg-white border-b border-neutral-200 sticky top-0 z-10">
		<div class="container mx-auto px-6 py-4">
			<div class="flex flex-col lg:flex-row gap-4 items-center">
				<!-- Search -->
				<div class="flex-1 relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
					<input 
						type="text" 
						placeholder="Search your journal entries..." 
						class="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
						bind:value={searchQuery}
					/>
				</div>
				
				<!-- Filters and Actions -->
				<div class="flex flex-wrap gap-3 items-center">
					<!-- Type Filter -->
					<div class="relative">
						<select 
							class="appearance-none bg-white border border-neutral-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
							bind:value={filterType}
						>
							<option value="all">All Entries</option>
							<option value="ai">AI Sessions</option>
							<option value="quick">Quick Entries</option>
						</select>
						<Filter class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
					</div>
					
					<!-- Reset -->
					{#if searchQuery || filterType !== 'all'}
						<button 
							class="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
							onclick={resetFilters}
						>
							Reset
						</button>
					{/if}
					
					<!-- Create Buttons -->
					<button 
						class="px-4 py-3 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 flex items-center gap-2"
						onclick={startAIChat}
					>
						<Bot class="w-4 h-4" />
						<span class="hidden sm:inline">AI Chat</span>
					</button>
					
					<button 
						class="btn-primary flex items-center gap-2"
						onclick={openCreateForm}
					>
						<Plus class="w-4 h-4" />
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
					<div class="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent"></div>
					<p class="text-neutral-600 font-medium">Loading your journal...</p>
				</div>
			</div>
		{:else if filteredJournals.length === 0}
			<div class="text-center py-20">
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 max-w-md mx-auto">
					<div class="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<BookOpen class="w-10 h-10 text-purple-600" />
					</div>
					{#if journals.length === 0}
						<h3 class="text-2xl font-bold text-neutral-900 mb-3">Start Your Journey</h3>
						<p class="text-neutral-600 mb-8 leading-relaxed">Begin documenting your thoughts, reflections, and growth. Choose your preferred way to start.</p>
						<div class="flex flex-col sm:flex-row gap-4 justify-center">
							<button class="btn-primary text-lg px-6 py-3" onclick={startAIChat}>
								<Bot class="w-5 h-5 mr-2" />
								AI Guided Session
							</button>
							<button class="px-6 py-3 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors font-medium" onclick={openCreateForm}>
								<PenTool class="w-5 h-5 mr-2 inline" />
								Quick Entry
							</button>
						</div>
					{:else}
						<h3 class="text-2xl font-bold text-neutral-900 mb-3">No matching entries</h3>
						<p class="text-neutral-600 mb-8 leading-relaxed">Try adjusting your search or filter criteria to find what you're looking for.</p>
						<button class="btn-primary text-lg px-6 py-3" onclick={resetFilters}>
							<Search class="w-5 h-5 mr-2" />
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
					<div class="bg-white rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-200 group overflow-hidden">
						<!-- Entry Header -->
						<div class="p-6 pb-4 {typeInfo.isAI ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100'}">
							<div class="flex items-start justify-between gap-4">
								<div class="flex items-center gap-3">
									<div class="p-2 {typeInfo.isAI ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'} rounded-lg">
										{#if typeInfo.isAI}
											<Bot class="w-5 h-5" />
										{:else}
											<PenTool class="w-5 h-5" />
										{/if}
									</div>
									<div>
										<h3 class="text-lg font-semibold text-neutral-900">
											{formatDate(journal.date)}
										</h3>
										<div class="flex items-center gap-2 mt-1">
											<span class="text-sm text-neutral-600">{getRelativeDate(journal.date)}</span>
											{#if typeInfo.isAI}
												<div class="inline-flex items-center gap-1 px-2 py-1 {
													typeInfo.status === 'completed' ? 'bg-green-100 text-green-700' : 
													typeInfo.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
												} rounded text-xs font-medium">
													{#if typeInfo.status === 'completed'}
														<CheckCircle class="w-3 h-3" />
														Completed
													{:else if typeInfo.status === 'in_progress'}
														<MessageCircle class="w-3 h-3" />
														In Progress ({typeInfo.followupCount}/{typeInfo.maxFollowups})
													{:else}
														<Play class="w-3 h-3" />
														New Session
													{/if}
												</div>
											{:else}
												<div class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
													<PenTool class="w-3 h-3" />
													Quick Entry
												</div>
											{/if}
										</div>
									</div>
								</div>
								
								<!-- Actions -->
								<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
									{#if typeInfo.isAI}
										<button 
											class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
											onclick={() => continueAIChat(journal.id)}
											title={typeInfo.status === 'completed' ? 'View session' : 'Continue session'}
										>
											{#if typeInfo.status === 'completed'}
												<BookOpen class="w-5 h-5" />
											{:else}
												<MessageCircle class="w-5 h-5" />
											{/if}
										</button>
									{:else}
										<button 
											class="p-2 text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
											onclick={() => openEditForm(journal)}
											title="Edit entry"
										>
											<Edit class="w-5 h-5" />
										</button>
									{/if}
									<button 
										class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
										onclick={() => deleteJournal(journal.id)}
										title="Delete entry"
									>
										<Trash2 class="w-5 h-5" />
									</button>
								</div>
							</div>
						</div>
						
						<!-- Entry Content -->
						<div class="p-6">
							<div class="prose max-w-none">
								<p class="text-neutral-700 leading-relaxed whitespace-pre-wrap">
									{truncateContent(journal.content, 300)}
								</p>
							</div>
							
							{#if journal.gptSummary}
								<div class="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
									<div class="flex items-center gap-2 mb-2">
										<Sparkles class="w-4 h-4 text-blue-600" />
										<span class="text-sm font-medium text-blue-900">AI Summary</span>
									</div>
									<p class="text-sm text-blue-800 leading-relaxed">
										{truncateContent(journal.gptSummary, 150)}
									</p>
								</div>
							{/if}
							
							<!-- Mobile Actions -->
							<div class="flex gap-3 mt-6 sm:hidden">
								{#if typeInfo.isAI}
									<button 
										class="flex-1 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 flex items-center justify-center gap-2"
										onclick={() => continueAIChat(journal.id)}
									>
										{#if typeInfo.status === 'completed'}
											<BookOpen class="w-4 h-4" />
											View
										{:else}
											<MessageCircle class="w-4 h-4" />
											Continue
										{/if}
									</button>
								{:else}
									<button 
										class="flex-1 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 flex items-center justify-center gap-2"
										onclick={() => openEditForm(journal)}
									>
										<Edit class="w-4 h-4" />
										Edit
									</button>
								{/if}
								<button 
									class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
									onclick={() => deleteJournal(journal.id)}
								>
									<Trash2 class="w-4 h-4" />
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
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		onclick={closeModal}
	>
		<div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
			<!-- Modal Header -->
			<div class="flex items-center justify-between p-6 border-b border-neutral-200">
				<div class="flex items-center gap-3">
					<div class="p-2 bg-purple-100 rounded-lg">
						<PenTool class="w-5 h-5 text-purple-600" />
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
					class="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
					onclick={() => showCreateForm = false}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			
			<!-- Modal Body -->
			<div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Date Field -->
					<div class="space-y-2">
						<label for="journalDate" class="block text-sm font-medium text-neutral-900">
							Date
						</label>
						<input 
							id="journalDate"
							type="date" 
							class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
							bind:value={formData.date}
						/>
					</div>
					
					<!-- Content Field -->
					<div class="space-y-2">
						<label for="journalContent" class="block text-sm font-medium text-neutral-900">
							Your Reflection <span class="text-red-500">*</span>
						</label>
						<p class="text-sm text-neutral-600 mb-3">
							What happened today? How are you feeling? What did you learn?
						</p>
						<textarea 
							id="journalContent"
							class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm resize-none min-h-[300px]"
							bind:value={formData.content}
							placeholder="Write about your day, thoughts, feelings, insights, achievements, challenges, or anything on your mind..."
							required
						></textarea>
					</div>
					
					<!-- Form Actions -->
					<div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
						<button 
							type="button" 
							class="px-4 py-2 text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
							onclick={() => showCreateForm = false}
						>
							Cancel
						</button>
						<button 
							type="submit" 
							class="btn-primary"
						>
							{editingJournal ? 'Update Entry' : 'Save Entry'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
