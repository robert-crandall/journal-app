<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Calendar, ArrowLeft, Heart } from 'lucide-svelte';
	import { apiCall, apiSimple } from '$lib/api/client';

	// Types based on backend schema
	type FamilyMember = {
		id: string;
		userId: string;
		name: string;
		age?: number;
		interests?: string[];
		interactionFrequency: string;
		lastInteraction?: string;
		createdAt: string;
		updatedAt: string;
	};

	// State
	let familyMember = $state<FamilyMember | null>(null);
	let loading = $state(true);
	let submitting = $state(false);
	let error = $state<string | null>(null);

	// Form state
	let formData = $state({
		feedback: '',
		interactionDate: new Date().toISOString().split('T')[0]
	});

	// Mock user ID - in real app would come from auth store
	const userId = 'b8a9c1e2-f3d4-5e6f-7a8b-9c0d1e2f3a4b'; // Test user ID

	// Get family member ID from URL
	let familyMemberId = $derived($page.params.id);

	onMount(async () => {
		await loadFamilyMember();
	});

	async function loadFamilyMember() {
		loading = true;
		error = null;
		
		const result = await apiCall(apiSimple['family-members'].get(userId));
		if (result.error) {
			error = result.error;
		} else if (result.data?.success) {
			const familyMembers = (result.data as any).data.familyMembers;
			familyMember = familyMembers.find((member: any) => member.id === familyMemberId) || null;
			
			if (!familyMember) {
				error = 'Family member not found';
			}
		}
		
		loading = false;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		
		if (!formData.feedback.trim() || !familyMember) return;

		submitting = true;
		error = null;

		const payload = {
			userId,
			feedback: formData.feedback.trim(),
			interactionDate: formData.interactionDate
		};

		const result = await apiCall(apiSimple['family-members'].interactions.post(familyMember.id, payload));
		if (result.error) {
			error = result.error;
			submitting = false;
		} else if ((result.data as any)?.success) {
			// Redirect back to family page
			goto('/family');
		} else {
			error = 'Failed to record interaction';
			submitting = false;
		}
	}

	function handleCancel() {
		goto('/family');
	}
</script>

<svelte:head>
	<title>Record Interaction - D&D Life</title>
</svelte:head>

<div class="max-w-2xl mx-auto p-4 pb-20">
	<!-- Header -->
	<div class="flex items-center gap-3 mb-6">
		<button
			onclick={handleCancel}
			class="p-2 rounded-lg transition-colors"
			style:color="rgb(var(--color-text-secondary))"
			style:hover:background-color="rgb(var(--color-surface-hover))"
		>
			<ArrowLeft class="h-5 w-5" />
		</button>
		<div class="flex items-center gap-2">
			<Heart class="h-6 w-6" style="color: rgb(var(--color-primary-500))" />
			<h1 class="text-2xl font-bold" style="color: rgb(var(--color-text-primary))">
				Record Interaction
			</h1>
		</div>
	</div>

	{#if loading}
		<div class="text-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" 
				style="border-color: rgb(var(--color-primary-500))"></div>
			<p class="mt-2" style="color: rgb(var(--color-text-secondary))">Loading...</p>
		</div>
	{:else if error && !familyMember}
		<div class="alert alert-error mb-6">
			{error}
		</div>
		<div class="text-center">
			<button onclick={handleCancel} class="btn btn-secondary">
				Back to Family
			</button>
		</div>
	{:else if familyMember}
		<!-- Family Member Info -->
		<div class="card mb-6">
			<div class="card-content">
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 rounded-full flex items-center justify-center"
						style:background-color="rgb(var(--color-primary-100))"
						style:color="rgb(var(--color-primary-700))">
						<Heart class="h-6 w-6" />
					</div>
					<div>
						<h2 class="text-xl font-semibold" style="color: rgb(var(--color-text-primary))">
							{familyMember.name}
						</h2>
						{#if familyMember.age}
							<p class="text-sm" style="color: rgb(var(--color-text-secondary))">
								Age {familyMember.age}
							</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="alert alert-error mb-6">
				{error}
			</div>
		{/if}

		<!-- Form -->
		<form onsubmit={handleSubmit} class="space-y-6">
			<div class="card">
				<div class="card-content space-y-4">
					<!-- Interaction Date -->
					<div>
						<label for="interaction-date" class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-primary))">
							Interaction Date
						</label>
						<input 
							id="interaction-date"
							bind:value={formData.interactionDate}
							type="date" 
							class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							style:border-color="rgb(var(--color-border))"
							style:background-color="rgb(var(--color-surface))"
							style:color="rgb(var(--color-text-primary))"
						/>
					</div>

					<!-- Feedback -->
					<div>
						<label for="feedback" class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-primary))">
							What did you do together? *
						</label>
						<textarea 
							id="feedback"
							bind:value={formData.feedback}
							placeholder="Describe your interaction, activity, or conversation..."
							class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-32 resize-none"
							style:border-color="rgb(var(--color-border))"
							style:background-color="rgb(var(--color-surface))"
							style:color="rgb(var(--color-text-primary))"
							required
						></textarea>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-3">
				<button 
					type="button"
					onclick={handleCancel}
					class="btn btn-secondary flex-1"
					disabled={submitting}
				>
					Cancel
				</button>
				<button 
					type="submit"
					disabled={!formData.feedback.trim() || submitting}
					class="btn btn-primary flex-1"
					data-testid="submit-record-interaction"
				>
					{#if submitting}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
						Recording...
					{:else}
						<Calendar class="h-4 w-4 mr-2" />
						Record Interaction
					{/if}
				</button>
			</div>
		</form>
	{/if}
</div>
