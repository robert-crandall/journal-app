<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ArrowLeft, Tag, Save } from 'lucide-svelte';
	
	interface ContentTag {
		id: string;
		userId: string;
		name: string;
		createdAt: string;
	}
	
	let tag = $state<ContentTag | null>(null);
	let name = $state('');
	let loading = $state(true);
	let updating = $state(false);
	let error = $state('');
	let success = $state('');
	
	onMount(async () => {
		await loadTag();
	});
	
	async function loadTag() {
		try {
			loading = true;
			error = '';
			const tagId = $page.params.id;
			
			const response = await fetch(`/api/tags/${tagId}`);
			
			if (response.ok) {
				const data = await response.json();
				tag = data.tag;
				name = tag.name;
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to load tag';
			}
		} catch (err) {
			console.error('Error loading tag:', err);
			error = 'An error occurred while loading the tag';
		} finally {
			loading = false;
		}
	}
	
	async function updateTag() {
		if (!tag) return;
		
		if (!name.trim()) {
			error = 'Tag name is required';
			return;
		}
		
		updating = true;
		error = '';
		success = '';
		
		try {
			const response = await fetch(`/api/tags/${tag.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: name.trim()
				})
			});
			
			if (response.ok) {
				success = 'Tag updated successfully!';
				setTimeout(() => {
					goto(`/tags/${tag.id}`);
				}, 1000);
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to update tag';
			}
		} catch (err) {
			console.error('Error updating tag:', err);
			error = 'An error occurred while updating the tag';
		} finally {
			updating = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Tag - Journal App</title>
</svelte:head>

<div class="max-w-lg mx-auto space-y-6">
	<!-- Header -->
	<div>
		<div class="flex items-center gap-3">
			{#if tag}
				<a href="/tags/{tag.id}" class="btn btn-ghost btn-sm">
					<ArrowLeft size={16} />
					Back to Tag
				</a>
			{:else}
				<a href="/tags" class="btn btn-ghost btn-sm">
					<ArrowLeft size={16} />
					Back to Tags
				</a>
			{/if}
		</div>
		<h1 class="text-2xl font-bold mt-2">Edit Tag</h1>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error && !tag}
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-sm" on:click={loadTag}>Retry</button>
		</div>
	{:else if tag}
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
				
				<form on:submit|preventDefault={updateTag} class="space-y-4">
					<div class="form-control">
						<label for="name" class="label">
							<span class="label-text">Tag Name</span>
						</label>
						<div class="flex items-center gap-2">
							<Tag size={18} class="text-base-content/60" />
							<input 
								type="text" 
								id="name" 
								class="input input-bordered flex-1" 
								placeholder="Enter tag name" 
								bind:value={name}
								required
							/>
						</div>
					</div>
					
					<!-- Submit Button -->
					<div class="mt-6">
						<button 
							type="submit" 
							class="btn btn-primary w-full"
							disabled={updating || !name.trim() || name === tag.name}
						>
							{#if updating}
								<span class="loading loading-spinner loading-sm"></span>
							{:else}
								<Save size={18} />
							{/if}
							Update Tag
						</button>
					</div>
				</form>
			</div>
		</div>
	{:else}
		<div class="alert alert-error">
			<span>Tag not found</span>
			<a href="/tags" class="btn btn-sm">Back to Tags</a>
		</div>
	{/if}
</div>
