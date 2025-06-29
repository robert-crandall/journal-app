<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Calendar, AlertTriangle, Users, Clock, Trash2, Heart } from 'lucide-svelte';
	import type { 
		familyMembers as familyMembersSchema, 
		familyMemberInteractions 
	} from '../../../../backend/src/db/schema';
	import { apiCall, apiSimple } from '$lib/api/client';

	// Types based on backend schema
	type FamilyMember = typeof familyMembersSchema.$inferSelect;
	type FamilyMemberInteraction = typeof familyMemberInteractions.$inferSelect;
	
	// Extended type for list view with stats
	type FamilyMemberWithStats = FamilyMember & {
		recentInteractions: number;
		daysSinceLastInteraction: number | null;
		isOverdue: boolean;
	};

	type InteractionAlert = {
		familyMember: FamilyMember;
		alertType: 'overdue' | 'never_interacted';
		severity: 'low' | 'medium' | 'high';
		message: string;
	};

	// State management using Svelte 5 runes
	let familyMembersList = $state<FamilyMemberWithStats[]>([]);
	let alerts = $state<InteractionAlert[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showAddForm = $state(false);
	let selectedMember = $state<FamilyMemberWithStats | null>(null);
	let showInteractionForm = $state(false);

	// Form states
	let addFormData = $state({
		name: '',
		age: '',
		interests: '',
		interactionFrequency: 'weekly' as 'daily' | 'weekly' | 'biweekly' | 'monthly'
	});

	let interactionFormData = $state({
		feedback: '',
		interactionDate: new Date().toISOString().split('T')[0]
	});

	// Mock user ID - in real app would come from auth store
	const userId = 'b8a9c1e2-f3d4-5e6f-7a8b-9c0d1e2f3a4b'; // Test user ID

	onMount(async () => {
		await loadFamilyMembers();
		await loadAlerts();
	});

	async function loadFamilyMembers() {
		loading = true;
		error = null;
		
		const result = await apiCall(apiSimple['family-members'].get(userId));
		if (result.error) {
			error = result.error;
		} else if (result.data?.success) {
			familyMembersList = result.data.data.familyMembers;
		}
		
		loading = false;
	}

	async function loadAlerts() {
		const result = await apiCall(apiSimple['family-members']['interaction-alerts'].get(userId));
		if (result.data?.success) {
			alerts = result.data.data.alerts;
		}
	}

	async function createFamilyMember() {
		if (!addFormData.name.trim()) return;

		const payload = {
			userId,
			name: addFormData.name.trim(),
			age: addFormData.age ? parseInt(addFormData.age) : undefined,
			interests: addFormData.interests 
				? addFormData.interests.split(',').map(i => i.trim()).filter(i => i)
				: [],
			interactionFrequency: addFormData.interactionFrequency
		};

		const result = await apiCall(apiSimple['family-members'].post(payload));
		if (result.error) {
			error = result.error;
		} else if (result.data?.success) {
			showAddForm = false;
			addFormData = { name: '', age: '', interests: '', interactionFrequency: 'weekly' };
			await loadFamilyMembers();
			await loadAlerts();
		}
	}

	async function recordInteraction(familyMemberId: string) {
		if (!interactionFormData.feedback.trim()) return;

		const payload = {
			userId,
			feedback: interactionFormData.feedback.trim(),
			interactionDate: interactionFormData.interactionDate
		};

		const result = await apiCall(apiSimple['family-members'].interactions.post(familyMemberId, payload));
		if (result.error) {
			error = result.error;
		} else if (result.data?.success) {
			showInteractionForm = false;
			selectedMember = null;
			interactionFormData = { 
				feedback: '', 
				interactionDate: new Date().toISOString().split('T')[0] 
			};
			await loadFamilyMembers();
			await loadAlerts();
		}
	}

	async function deleteFamilyMember(familyMemberId: string) {
		if (!confirm('Are you sure you want to delete this family member?')) return;

		const result = await apiCall(apiSimple['family-members'].delete(familyMemberId, userId));
		if (result.error) {
			error = result.error;
		} else if (result.data?.success) {
			await loadFamilyMembers();
			await loadAlerts();
		}
	}

	function getSeverityColor(severity: string) {
		switch (severity) {
			case 'high': return 'rgb(var(--color-danger-500))';
			case 'medium': return 'rgb(var(--color-warning-500))';
			case 'low': return 'rgb(var(--color-info-500))';
			default: return 'rgb(var(--color-text-secondary))';
		}
	}

	function getFrequencyLabel(frequency: string) {
		switch (frequency) {
			case 'daily': return 'Daily';
			case 'weekly': return 'Weekly';
			case 'biweekly': return 'Every 2 weeks';
			case 'monthly': return 'Monthly';
			default: return frequency;
		}
	}

	function formatLastInteraction(member: FamilyMemberWithStats) {
		if (!member.lastInteraction) return 'Never';
		if (member.daysSinceLastInteraction === 0) return 'Today';
		if (member.daysSinceLastInteraction === 1) return 'Yesterday';
		return `${member.daysSinceLastInteraction} days ago`;
	}
</script>

<svelte:head>
	<title>Family Management - D&D Life</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold flex items-center gap-3" style="color: rgb(var(--color-text-primary))">
				<Users class="h-8 w-8" style="color: rgb(var(--color-primary-500))" />
				Family Management
			</h1>
			<p class="mt-2" style="color: rgb(var(--color-text-secondary))">
				Track and nurture your relationships with family members
			</p>
		</div>
		<button 
			onclick={() => showAddForm = true}
			class="btn btn-primary"
		>
			<Plus class="h-4 w-4 mr-2" />
			Add Family Member
		</button>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="alert alert-error">
			<AlertTriangle class="h-5 w-5" />
			{error}
		</div>
	{/if}

	<!-- Alerts Section -->
	{#if alerts.length > 0}
		<div class="card">
			<div class="card-header">
				<h2 class="text-xl font-semibold flex items-center gap-2">
					<AlertTriangle class="h-5 w-5" style="color: rgb(var(--color-warning-500))" />
					Interaction Alerts
				</h2>
				<p style="color: rgb(var(--color-text-secondary))">
					Family members who need your attention
				</p>
			</div>
			<div class="card-content space-y-3">
				{#each alerts as alert}
					<div class="flex items-center justify-between p-3 rounded-lg border"
						style:border-color="rgb(var(--color-border))"
						style:background-color="rgb(var(--color-surface))">
						<div class="flex items-center gap-3">
							<div class="w-3 h-3 rounded-full" 
								style:background-color={getSeverityColor(alert.severity)}></div>
							<div>
								<p class="font-medium" style="color: rgb(var(--color-text-primary))">
									{alert.familyMember.name}
								</p>
								<p class="text-sm" style="color: rgb(var(--color-text-secondary))">
									{alert.message}
								</p>
							</div>
						</div>
						<button 
							onclick={() => {
								selectedMember = familyMembersList.find(m => m.id === alert.familyMember.id) || null;
								showInteractionForm = true;
							}}
							class="btn btn-sm btn-primary"
						>
							Record Interaction
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Family Members Grid -->
	{#if loading}
		<div class="text-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" 
				style="border-color: rgb(var(--color-primary-500))"></div>
			<p class="mt-2" style="color: rgb(var(--color-text-secondary))">Loading family members...</p>
		</div>
	{:else if familyMembersList.length === 0}
		<div class="text-center py-12">
			<Users class="h-16 w-16 mx-auto mb-4" style="color: rgb(var(--color-text-muted))" />
			<h3 class="text-xl font-semibold mb-2" style="color: rgb(var(--color-text-primary))">
				No family members yet
			</h3>
			<p class="mb-6" style="color: rgb(var(--color-text-secondary))">
				Add your first family member to start tracking interactions
			</p>
			<button 
				onclick={() => showAddForm = true}
				class="btn btn-primary"
			>
				<Plus class="h-4 w-4 mr-2" />
				Add Family Member
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each familyMembersList as member}
				<div class="card">
					<div class="card-content">
						<!-- Member Header -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex items-center gap-3">
								<div class="w-12 h-12 rounded-full flex items-center justify-center"
									style:background-color="rgb(var(--color-primary-100))"
									style:color="rgb(var(--color-primary-700))">
									<Heart class="h-6 w-6" />
								</div>
								<div>
									<h3 class="font-semibold text-lg" style="color: rgb(var(--color-text-primary))">
										{member.name}
									</h3>
									{#if member.age}
										<p class="text-sm" style="color: rgb(var(--color-text-secondary))">
											Age {member.age}
										</p>
									{/if}
								</div>
							</div>
							
							<!-- Status indicator -->
							{#if member.isOverdue}
								<div class="w-3 h-3 rounded-full" 
									style:background-color="rgb(var(--color-danger-500))"
									title="Overdue for interaction"></div>
							{:else}
								<div class="w-3 h-3 rounded-full" 
									style:background-color="rgb(var(--color-success-500))"
									title="Up to date"></div>
							{/if}
						</div>

						<!-- Interaction Info -->
						<div class="space-y-2 mb-4">
							<div class="flex items-center gap-2 text-sm">
								<Calendar class="h-4 w-4" style="color: rgb(var(--color-text-muted))" />
								<span style="color: rgb(var(--color-text-secondary))">
									{getFrequencyLabel(member.interactionFrequency)} 
								</span>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Clock class="h-4 w-4" style="color: rgb(var(--color-text-muted))" />
								<span style="color: rgb(var(--color-text-secondary))">
									Last: {formatLastInteraction(member)}
								</span>
							</div>
						</div>

						<!-- Interests -->
						{#if member.interests && member.interests.length > 0}
							<div class="mb-4">
								<p class="text-sm font-medium mb-2" style="color: rgb(var(--color-text-primary))">
									Interests:
								</p>
								<div class="flex flex-wrap gap-1">
									{#each member.interests as interest}
										<span class="px-2 py-1 text-xs rounded-full"
											style:background-color="rgb(var(--color-primary-100))"
											style:color="rgb(var(--color-primary-700))">
											{interest}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Action Buttons -->
						<div class="flex gap-2">
							<button 
								onclick={() => {
									selectedMember = member;
									showInteractionForm = true;
								}}
								class="btn btn-sm btn-primary flex-1"
							>
								<Calendar class="h-4 w-4 mr-1" />
								Record Interaction
							</button>
							<button 
								onclick={() => deleteFamilyMember(member.id)}
								class="btn btn-sm btn-secondary"
								title="Delete family member"
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

<!-- Add Family Member Modal -->
{#if showAddForm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6 border-b">
				<h2 class="text-xl font-semibold">Add Family Member</h2>
			</div>
			<div class="p-6 space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium mb-2">Name *</label>
					<input 
						id="name"
						bind:value={addFormData.name}
						type="text" 
						placeholder="Enter name"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label for="age" class="block text-sm font-medium mb-2">Age</label>
					<input 
						id="age"
						bind:value={addFormData.age}
						type="number" 
						placeholder="Enter age"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						min="0"
						max="150"
					/>
				</div>

				<div>
					<label for="interests" class="block text-sm font-medium mb-2">Interests</label>
					<input 
						id="interests"
						bind:value={addFormData.interests}
						type="text" 
						placeholder="Enter interests separated by commas"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<p class="text-sm text-gray-500 mt-1">e.g., cooking, reading, sports</p>
				</div>

				<div>
					<label for="frequency" class="block text-sm font-medium mb-2">Interaction Frequency</label>
					<select 
						id="frequency"
						bind:value={addFormData.interactionFrequency} 
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="daily">Daily</option>
						<option value="weekly">Weekly</option>
						<option value="biweekly">Every 2 weeks</option>
						<option value="monthly">Monthly</option>
					</select>
				</div>
			</div>
			<div class="p-6 border-t flex gap-3 justify-end">
				<button 
					onclick={() => showAddForm = false}
					class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
				>
					Cancel
				</button>
				<button 
					onclick={createFamilyMember}
					disabled={!addFormData.name.trim()}
					data-testid="submit-add-family-member"
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Plus class="h-4 w-4 mr-2 inline" />
					Add Family Member
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Record Interaction Modal -->
{#if showInteractionForm && selectedMember}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6 border-b">
				<h2 class="text-xl font-semibold">Record Interaction with {selectedMember.name}</h2>
			</div>
			<div class="p-6 space-y-4">
				<div>
					<label for="interaction-date" class="block text-sm font-medium mb-2">Interaction Date</label>
					<input 
						id="interaction-date"
						bind:value={interactionFormData.interactionDate}
						type="date" 
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label for="feedback" class="block text-sm font-medium mb-2">What did you do together? *</label>
					<textarea 
						id="feedback"
						bind:value={interactionFormData.feedback}
						placeholder="Describe your interaction, activity, or conversation..."
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
					></textarea>
				</div>
			</div>
			<div class="p-6 border-t flex gap-3 justify-end">
				<button 
					onclick={() => {
						showInteractionForm = false;
						selectedMember = null;
					}}
					class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
				>
					Cancel
				</button>
				<button 
					onclick={() => selectedMember && recordInteraction(selectedMember.id)}
					disabled={!interactionFormData.feedback.trim()}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Calendar class="h-4 w-4 mr-2 inline" />
					Record Interaction
				</button>
			</div>
		</div>
	</div>
{/if}
