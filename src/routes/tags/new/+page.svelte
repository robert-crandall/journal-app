<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Tag, Plus, InfoCircle } from 'lucide-svelte';
	
	let name = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');
	
	async function createTag() {
		if (!name.trim()) {
			error = 'Tag name is required';
			return;
		}
		
		loading = true;
		error = '';
		success = '';
		
		try {
			const response = await fetch('/api/tags', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: name.trim()
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				if (data.created) {
					success = 'Tag created successfully!';
				} else {
					success = 'Tag already exists!';
				}
				
				setTimeout(() => {
					goto('/tags');
				}, 1000);
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to create tag';
			}
		} catch (err) {
			console.error('Error creating tag:', err);
			error = 'An error occurred while creating the tag';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Create Tag - Journal App</title>
</svelte:head>

<div class="max-w-lg mx-auto space-y-6">
	<!-- Header -->
	<div>
		<div class="flex items-center gap-3">
			<a href="/tags" class="btn btn-ghost btn-sm">
				<ArrowLeft size={16} />
				Back to Tags
			</a>
		</div>
		<h1 class="text-2xl font-bold mt-2">Create New Tag</h1>
	</div>
	
	<!-- Tag Form -->
	<div class="card bg-base-100 border border-base-300">
		<div class="card-body">
			{#if error}
				<div class="alert alert-error mb-4">
					<span>{error}</span>
				</div>
			{/if}
			
			{#if success}
				<div class="alert alert-success mb-4">
					<span>{success}</span>
				</div>
			{/if}
			
			<form on:submit|preventDefault={createTag} class="space-y-4">
				<div class="form-control">
					<label for="name" class="label">
						<span class="label-text">Tag Name</span>
						<span class="label-text-alt flex items-center gap-1">
							<InfoCircle size={14} />
							Keep it short and descriptive
						</span>
					</label>
					<input 
						type="text" 
						id="name" 
						class="input input-bordered w-full" 
						placeholder="Enter tag name" 
						bind:value={name}
						required
					/>
				</div>
				
				<div class="alert bg-base-200 text-base-content">
					<InfoCircle size={16} />
					<span>
						Tags help you categorize and find your journal entries.
						Use tags like "work", "family", "health", etc.
					</span>
				</div>
				
				<!-- Submit Button -->
				<div class="mt-6">
					<button 
						type="submit" 
						class="btn btn-primary w-full"
						disabled={loading || !name.trim()}
					>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							<Plus size={18} />
						{/if}
						Create Tag
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
