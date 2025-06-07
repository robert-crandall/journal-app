<script lang="ts">
	import { onMount } from 'svelte';
	import { familyApi } from '$lib/api';
	import AttributeManager from '$lib/components/AttributeManager.svelte';
	
	let familyMembers: any[] = [];
	let loading = true;
	let showCreateForm = false;
	let editingMember: any = null;
	
	// Form data
	let memberName = '';
	
	onMount(async () => {
		await loadFamilyMembers();
	});
	
	async function loadFamilyMembers() {
		try {
			loading = true;
			const response = await familyApi.getAll();
			familyMembers = response.familyMembers;
		} catch (error) {
			console.error('Failed to load family members:', error);
		} finally {
			loading = false;
		}
	}
	
	function openCreateForm() {
		memberName = '';
		editingMember = null;
		showCreateForm = true;
	}
	
	function openEditForm(member: any) {
		memberName = member.name;
		editingMember = member;
		showCreateForm = true;
	}
	
	async function handleSubmit(event: Event) {
		event.preventDefault();
		try {
			if (editingMember) {
				await familyApi.update(editingMember.id, { name: memberName });
			} else {
				await familyApi.create({ name: memberName });
			}
			
			showCreateForm = false;
			await loadFamilyMembers();
		} catch (error) {
			console.error('Failed to save family member:', error);
		}
	}
	
	async function deleteMember(memberId: string) {
		if (confirm('Are you sure you want to delete this family member?')) {
			try {
				await familyApi.delete(memberId);
				await loadFamilyMembers();
			} catch (error) {
				console.error('Failed to delete family member:', error);
			}
		}
	}
	
	async function handleAddAttribute(memberId: string, key: string, value: string) {
		try {
			await familyApi.addAttribute(memberId, { key, value });
			await loadFamilyMembers(); // Reload to get updated attributes
		} catch (error) {
			console.error('Failed to add attribute:', error);
			throw error; // Re-throw to let AttributeManager handle the error
		}
	}
</script>

<svelte:head>
	<title>Family - Life Quest</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Family Members</h1>
			<p class="text-base-content/70">Manage your family and their attributes</p>
		</div>
		<button class="btn btn-primary" onclick={openCreateForm}>
			<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Family Member
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center p-8">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each familyMembers as member}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<div class="flex justify-between items-start mb-4">
							<h3 class="card-title text-xl">{member.name}</h3>
							<div class="dropdown dropdown-end">
								<button class="btn btn-ghost btn-sm" aria-label="Member options">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
									</svg>
								</button>
								<ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
									<li><button onclick={() => openEditForm(member)}>Edit Name</button></li>
									<li><button onclick={() => deleteMember(member.id)} class="text-error">Delete</button></li>
								</ul>
							</div>
						</div>
						
						<AttributeManager 
							attributes={member.attributes || []}
							onAddAttribute={(key, value) => handleAddAttribute(member.id, key, value)}
							title="Family Member Attributes"
							emptyMessage="No attributes yet - add sections like Values, Interests, or Skills"
						/>
					</div>
				</div>
			{/each}
			
			{#if familyMembers.length === 0}
				<div class="col-span-full text-center py-12">
					<p class="text-lg text-base-content/70">No family members yet</p>
					<p class="text-base-content/50">Add your first family member to get started!</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Create/Edit Member Modal -->
{#if showCreateForm}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				{editingMember ? 'Edit Family Member' : 'Add New Family Member'}
			</h3>
			
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="form-control">
					<label class="label" for="memberName">
						<span class="label-text">Name *</span>
					</label>
					<input 
						id="memberName"
						type="text" 
						class="input input-bordered" 
						bind:value={memberName}
						required
					/>
				</div>
				
				<div class="modal-action">
					<button type="button" class="btn" onclick={() => showCreateForm = false}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						{editingMember ? 'Update' : 'Add'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
