<script lang="ts">
	import { goto } from '$app/navigation';
	import { Plus, ArrowLeft, Users } from 'lucide-svelte';
	import { apiCall, apiSimple } from '$lib/api/client';

	// Form state
	let formData = $state({
		name: '',
		age: '',
		interests: '',
		interactionFrequency: 'weekly'
	});

	let loading = $state(false);
	let error = $state<string | null>(null);

	// Mock user ID - in real app would come from auth store
	const userId = 'b8a9c1e2-f3d4-5e6f-7a8b-9c0d1e2f3a4b'; // Test user ID

	async function handleSubmit(event: Event) {
		event.preventDefault();
		console.log('handleSubmit called');
		
		if (!formData.name.trim()) {
			error = 'Name is required';
			return;
		}

		loading = true;
		error = null;

		const payload = {
			userId,
			name: formData.name.trim(),
			age: formData.age ? parseInt(formData.age) : undefined,
			interests: formData.interests 
				? formData.interests.split(',').map(i => i.trim()).filter(i => i)
				: [],
			interactionFrequency: formData.interactionFrequency
		};

		console.log('Submitting payload:', payload);
		const result = await apiCall(apiSimple['family-members'].post(payload));
		console.log('API result:', result);
		
		if (result.error) {
			console.error('API error:', result.error);
			error = result.error;
			loading = false;
		} else if (result.data?.success) {
			console.log('Success, navigating to /family');
			// Redirect back to family page
			goto('/family');
		} else {
			console.error('Unexpected result structure:', result);
			error = 'Failed to create family member';
			loading = false;
		}
	}

	function handleCancel() {
		goto('/family');
	}
</script>

<svelte:head>
	<title>Add Family Member - D&D Life</title>
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
			<Users class="h-6 w-6" style="color: rgb(var(--color-primary-500))" />
			<h1 class="text-2xl font-bold" style="color: rgb(var(--color-text-primary))">
				Add Family Member
			</h1>
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
				<!-- Name -->
				<div>
					<label for="name" class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-primary))">
						Name *
					</label>
					<input 
						id="name"
						aria-label="Name *"
						bind:value={formData.name}
						type="text" 
						placeholder="Enter name"
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						style:border-color="rgb(var(--color-border))"
						style:background-color="rgb(var(--color-surface))"
						style:color="rgb(var(--color-text-primary))"
						required
					/>
				</div>

				<!-- Age -->
				<div>
					<label for="age" class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-primary))">
						Age
					</label>
					<input 
						id="age"
						aria-label="Age"
						bind:value={formData.age}
						type="number" 
						placeholder="Enter age"
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						style:border-color="rgb(var(--color-border))"
						style:background-color="rgb(var(--color-surface))"
						style:color="rgb(var(--color-text-primary))"
						min="0"
						max="150"
					/>
				</div>

				<!-- Interests -->
				<div>
					<label for="interests" class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-primary))">
						Interests
					</label>
					<input 
						id="interests"
						aria-label="Interests"
						bind:value={formData.interests}
						type="text" 
						placeholder="Enter interests separated by commas"
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						style:border-color="rgb(var(--color-border))"
						style:background-color="rgb(var(--color-surface))"
						style:color="rgb(var(--color-text-primary))"
					/>
					<p class="text-sm mt-1" style="color: rgb(var(--color-text-secondary))">
						e.g., cooking, reading, sports
					</p>
				</div>

				<!-- Interaction Frequency -->
				<div>
					<label for="frequency" class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-primary))">
						Interaction Frequency
					</label>
					<select 
						id="frequency"
						aria-label="Interaction Frequency"
						bind:value={formData.interactionFrequency} 
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						style:border-color="rgb(var(--color-border))"
						style:background-color="rgb(var(--color-surface))"
						style:color="rgb(var(--color-text-primary))"
					>
						<option value="daily">Daily</option>
						<option value="weekly">Weekly</option>
						<option value="biweekly">Every 2 weeks</option>
						<option value="monthly">Monthly</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-3">
			<button 
				type="button"
				onclick={handleCancel}
				class="btn btn-secondary flex-1"
				disabled={loading}
				aria-label="Cancel"
			>
				Cancel
			</button>
			<button 
				type="submit"
				disabled={!formData.name.trim() || loading}
				data-testid="submit-add-family-member"
				class="btn btn-primary flex-1"
				aria-label="Add Family Member"
			>
				{#if loading}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
					Creating...
				{:else}
					<Plus class="h-4 w-4 mr-2" />
					Add Family Member
				{/if}
			</button>
		</div>
	</form>
</div>
