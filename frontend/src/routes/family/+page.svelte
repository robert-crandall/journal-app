<script lang="ts">
	import { onMount } from 'svelte';
	import { familyApi } from '$lib/api';
	import AttributeManager from '$lib/components/AttributeManager.svelte';
	import * as icons from 'lucide-svelte';

	let familyMembers: any[] = [];
	let loading = true;
	let error = '';
	let showCreateForm = false;
	let editingMember: any = null;

	// Form data
	let memberName = '';
	let memberAge: number | null = null;
	let memberClassName = '';
	let memberClassDescription = '';
	let openDropdownId: string | null = null;

	onMount(async () => {
		await loadFamilyMembers();
	});

	async function loadFamilyMembers() {
		try {
			loading = true;
			error = '';
			const response = await familyApi.getAll();
			familyMembers = response.familyMembers;
		} catch (err: any) {
			error = err.message || 'Failed to load family members';
		} finally {
			loading = false;
		}
	}

	function openCreateForm() {
		memberName = '';
		memberAge = null;
		memberClassName = '';
		memberClassDescription = '';
		editingMember = null;
		showCreateForm = true;
	}

	function openEditForm(member: any) {
		memberName = member.name;
		memberAge = member.age || null;
		memberClassName = member.className || '';
		memberClassDescription = member.classDescription || '';
		editingMember = member;
		showCreateForm = true;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		try {
			const memberData = {
				name: memberName,
				age: memberAge || undefined,
				className: memberClassName || undefined,
				classDescription: memberClassDescription || undefined
			};

			if (editingMember) {
				await familyApi.update(editingMember.id, memberData);
			} else {
				await familyApi.create(memberData);
			}

			showCreateForm = false;
			await loadFamilyMembers();
		} catch (err: any) {
			error = err.message || 'Failed to save family member';
		}
	}

	async function deleteMember(memberId: string) {
		if (confirm('Are you sure you want to delete this family member?')) {
			try {
				await familyApi.delete(memberId);
				await loadFamilyMembers();
			} catch (err: any) {
				error = err.message || 'Failed to delete family member';
			}
		}
	}

	async function handleAddAttribute(memberId: string, key: string, value: string) {
		try {
			await familyApi.addAttribute(memberId, { key, value });
			await loadFamilyMembers(); // Reload to get updated attributes
		} catch (err: any) {
			error = err.message || 'Failed to add attribute';
			throw err; // Re-throw to let AttributeManager handle the error
		}
	}

	function handleClassUpdate(className: string, classDescription: string) {
		memberClassName = className;
		memberClassDescription = classDescription;
	}

	function closeCreateForm() {
		showCreateForm = false;
		editingMember = null;
	}

	function toggleDropdown(memberId: string) {
		openDropdownId = openDropdownId === memberId ? null : memberId;
	}

	function closeDropdown() {
		openDropdownId = null;
	}

	// Close dropdown when clicking outside
	function handleOutsideClick(event: MouseEvent) {
		const target = event.target as Element;
		if (openDropdownId && !target.closest('.dropdown-container')) {
			closeDropdown();
		}
	}

	// Derived stats
	$: totalMembers = familyMembers.length;
	$: membersWithClasses = familyMembers.filter((m) => m.className).length;
	$: totalAttributes = familyMembers.reduce((sum, m) => sum + (m.attributes?.length || 0), 0);
</script>

<svelte:head>
	<title>Family - LifeQuest</title>
</svelte:head>

{#if showCreateForm}
	<!-- Create/Edit Member Modal - Atlassian Style -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12 backdrop-blur-sm"
	>
		<div
			class="bg-base-100 max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-lg shadow-2xl dark:bg-neutral-800"
		>
			<!-- Modal Header -->
			<div class="border-base-300 bg-base-200 border-b px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
							<svelte:component this={icons.Users} size={16} class="text-info" />
						</div>
						<h3 class="text-base-content text-lg font-semibold">
							{editingMember ? 'Edit family member' : 'Add family member'}
						</h3>
					</div>
					<button
						on:click={closeCreateForm}
						class="hover:bg-base-300 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
					>
						<svelte:component this={icons.X} size={16} class="text-base-content/60" />
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="max-h-[calc(85vh-140px)] overflow-y-auto px-6 py-6">
				{#if error}
					<div class="border-error/20 bg-error/10 mb-6 rounded-lg border p-4">
						<div class="flex items-start space-x-3">
							<svelte:component
								this={icons.AlertTriangle}
								size={16}
								class="mt-0.5 flex-shrink-0 text-red-500"
							/>
							<div class="flex-1">
								<p class="text-sm font-medium text-red-900">Error</p>
								<p class="text-error mt-1 text-sm">{error}</p>
							</div>
							<button
								on:click={() => (error = '')}
								class="hover:text-error text-red-400 transition-colors"
							>
								<svelte:component this={icons.X} size={14} />
							</button>
						</div>
					</div>
				{/if}

				<form on:submit={handleSubmit} class="space-y-6">
					<!-- Basic Information -->
					<div class="space-y-4">
						<div>
							<label for="memberName" class="text-base-content mb-2 block text-sm font-medium">
								Name <span class="text-red-500">*</span>
							</label>
							<input
								id="memberName"
								type="text"
								bind:value={memberName}
								placeholder="Enter family member's name"
								required
								class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<div>
							<label for="memberAge" class="text-base-content mb-2 block text-sm font-medium">
								Age
							</label>
							<input
								id="memberAge"
								type="number"
								bind:value={memberAge}
								placeholder="Enter age (optional)"
								min="0"
								max="150"
								class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>
					</div>

					<!-- RPG Class Section -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div>
								<h4 class="text-base-content text-sm font-medium">RPG Class</h4>
								<p class="text-base-content/70 mt-1 text-xs">
									Choose a character class that represents their personality
								</p>
							</div>
							{#if memberClassName}
								<button
									type="button"
									on:click={() => {
										memberClassName = '';
										memberClassDescription = '';
										handleClassUpdate('', '');
									}}
									class="text-base-content/60 hover:text-error text-xs transition-colors"
								>
									Clear
								</button>
							{/if}
						</div>

						<div>
							<label for="classSelect" class="text-base-content/80 mb-2 block text-sm font-medium">
								Class
							</label>
							<select
								id="classSelect"
								bind:value={memberClassName}
								on:change={() => handleClassUpdate(memberClassName, memberClassDescription)}
								class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							>
								<option value="">No class selected</option>
								<optgroup label="Warriors & Protectors">
									<option value="Paladin">Paladin - Noble defender of justice</option>
									<option value="Guardian">Guardian - Protective and steadfast</option>
									<option value="Knight">Knight - Honorable and courageous</option>
									<option value="Berserker">Berserker - Fierce and passionate</option>
								</optgroup>
								<optgroup label="Scholars & Wise">
									<option value="Scholar">Scholar - Loves learning and knowledge</option>
									<option value="Sage">Sage - Wise and thoughtful</option>
									<option value="Wizard">Wizard - Creative and analytical</option>
									<option value="Librarian">Librarian - Organized and detail-oriented</option>
								</optgroup>
								<optgroup label="Adventurers & Free Spirits">
									<option value="Explorer">Explorer - Curious and adventurous</option>
									<option value="Ranger">Ranger - Independent and nature-loving</option>
									<option value="Bard">Bard - Creative and social</option>
									<option value="Rogue">Rogue - Clever and resourceful</option>
								</optgroup>
								<optgroup label="Creators & Builders">
									<option value="Artisan">Artisan - Skilled craftsperson</option>
									<option value="Engineer">Engineer - Problem solver and builder</option>
									<option value="Chef">Chef - Nurturing through food</option>
									<option value="Architect">Architect - Visionary planner</option>
								</optgroup>
								<optgroup label="Leaders & Supporters">
									<option value="Leader">Leader - Natural organizer</option>
									<option value="Healer">Healer - Caring and supportive</option>
									<option value="Diplomat">Diplomat - Peacemaker and communicator</option>
									<option value="Mentor">Mentor - Guides and teaches others</option>
								</optgroup>
							</select>
						</div>

						{#if memberClassName}
							<div class="border-primary/20 bg-primary/5 rounded-lg border p-4">
								<div class="flex items-start space-x-3">
									<div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
										<svelte:component this={icons.Shield} size={16} class="text-info" />
									</div>
									<div class="flex-1">
										<h5 class="text-sm font-medium text-blue-900">{memberClassName}</h5>
										<p class="text-primary mt-1 text-xs">
											{#if memberClassName === 'Paladin'}
												A noble defender who values justice, honor, and protecting others
											{:else if memberClassName === 'Guardian'}
												Protective and steadfast, always looking out for family
											{:else if memberClassName === 'Knight'}
												Honorable and courageous, follows a strong moral code
											{:else if memberClassName === 'Berserker'}
												Fierce and passionate, approaches life with intensity
											{:else if memberClassName === 'Scholar'}
												Loves learning and knowledge, always curious about the world
											{:else if memberClassName === 'Sage'}
												Wise and thoughtful, often sought for advice
											{:else if memberClassName === 'Wizard'}
												Creative and analytical, loves solving complex problems
											{:else if memberClassName === 'Librarian'}
												Organized and detail-oriented, values knowledge and order
											{:else if memberClassName === 'Explorer'}
												Curious and adventurous, always seeking new experiences
											{:else if memberClassName === 'Ranger'}
												Independent and nature-loving, values freedom and outdoor life
											{:else if memberClassName === 'Bard'}
												Creative and social, brings joy and stories to others
											{:else if memberClassName === 'Rogue'}
												Clever and resourceful, finds creative solutions
											{:else if memberClassName === 'Artisan'}
												Skilled craftsperson who creates beautiful and useful things
											{:else if memberClassName === 'Engineer'}
												Problem solver and builder, loves making things work
											{:else if memberClassName === 'Chef'}
												Nurturing through food, brings people together with meals
											{:else if memberClassName === 'Architect'}
												Visionary planner who designs and organizes spaces
											{:else if memberClassName === 'Leader'}
												Natural organizer who helps coordinate and guide others
											{:else if memberClassName === 'Healer'}
												Caring and supportive, helps others feel better
											{:else if memberClassName === 'Diplomat'}
												Peacemaker and communicator, resolves conflicts gracefully
											{:else if memberClassName === 'Mentor'}
												Guides and teaches others, shares wisdom generously
											{:else}
												A unique character class with their own special traits
											{/if}
										</p>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Backstory Section -->
					{#if memberClassName}
						<div class="space-y-4">
							<div>
								<h4 class="text-base-content mb-1 text-sm font-medium">Backstory</h4>
								<p class="text-base-content/70 text-xs">Tell their unique story and personality</p>
							</div>

							<div>
								<label
									for="classDescription"
									class="text-base-content/80 mb-2 block text-sm font-medium"
								>
									Personal story
								</label>
								<textarea
									id="classDescription"
									bind:value={memberClassDescription}
									on:input={() => handleClassUpdate(memberClassName, memberClassDescription)}
									placeholder="What makes them special? What are their quirks, interests, or memorable traits?"
									rows="4"
									class="border-base-300 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								></textarea>
								<p class="text-base-content/60 mt-1 text-xs">
									Describe their personality, hobbies, funny habits, or what makes them unique
								</p>
							</div>

							{#if memberClassDescription}
								<div class="border-base-300 bg-base-200 rounded-lg border p-4">
									<div class="flex items-start space-x-3">
										<div class="bg-base-200 flex h-6 w-6 items-center justify-center rounded">
											<svelte:component this={icons.User} size={12} class="text-base-content/70" />
										</div>
										<div class="flex-1">
											<p class="text-base-content text-sm italic">"{memberClassDescription}"</p>
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/if}

					<div class="border-base-300 flex justify-end space-x-3 border-t pt-4">
						<button
							type="button"
							on:click={closeCreateForm}
							class="border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200 rounded-lg border px-4 py-2 text-sm font-medium transition-colors dark:bg-neutral-800"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="bg-primary text-primary-content hover:bg-primary/90 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors"
						>
							{editingMember ? 'Update member' : 'Add member'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{:else}
	<!-- Main Family Page - Atlassian Style -->
	<div class="mx-auto max-w-7xl px-6 py-8" on:click={handleOutsideClick}>
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h1 class="text-base-content text-2xl font-bold">Family Members</h1>
					<p class="text-base-content/70 mt-1">Manage your family and their unique attributes</p>
				</div>
				<button
					on:click={openCreateForm}
					class="bg-primary text-primary-content hover:bg-primary/90 inline-flex items-center rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors"
				>
					<svelte:component this={icons.Plus} size={16} class="mr-2" />
					Add member
				</button>
			</div>

			{#if error}
				<div class="border-error/20 bg-error/10 mb-6 rounded-lg border p-4">
					<div class="flex items-start space-x-3">
						<svelte:component
							this={icons.AlertTriangle}
							size={16}
							class="mt-0.5 flex-shrink-0 text-red-500"
						/>
						<div class="flex-1">
							<p class="text-sm font-medium text-red-900">Error</p>
							<p class="text-error mt-1 text-sm">{error}</p>
						</div>
						<button
							on:click={() => (error = '')}
							class="hover:text-error text-red-400 transition-colors"
						>
							<svelte:component this={icons.X} size={14} />
						</button>
					</div>
				</div>
			{/if}

			<!-- Quick Stats -->
			{#if familyMembers.length > 0}
				<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
								<svelte:component this={icons.Users} size={16} class="text-info" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{totalMembers}</div>
								<div class="text-base-content/70 text-xs">Family members</div>
							</div>
						</div>
					</div>
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="bg-secondary/10 flex h-8 w-8 items-center justify-center rounded-lg">
								<svelte:component this={icons.Crown} size={16} class="text-secondary" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{membersWithClasses}</div>
								<div class="text-base-content/70 text-xs">With classes</div>
							</div>
						</div>
					</div>
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="bg-success/10 flex h-8 w-8 items-center justify-center rounded-lg">
								<svelte:component this={icons.Tags} size={16} class="text-success" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{totalAttributes}</div>
								<div class="text-base-content/70 text-xs">Total attributes</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		{#if loading}
			<div class="flex justify-center py-16">
				<div class="text-base-content/60 flex items-center space-x-3">
					<div
						class="border-base-300 h-5 w-5 animate-spin rounded-full border-2 border-t-blue-600"
					></div>
					<span class="text-sm">Loading family members...</span>
				</div>
			</div>
		{:else if familyMembers.length === 0}
			<div class="py-16 text-center">
				<div
					class="border-base-300 bg-base-100 mx-auto max-w-md rounded-lg border p-12 dark:bg-neutral-800"
				>
					<div
						class="bg-base-200 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
					>
						<svelte:component this={icons.Users} size={24} class="text-base-content/50" />
					</div>
					<h3 class="text-base-content mb-2 text-lg font-semibold">No family members yet</h3>
					<p class="text-base-content/70 mb-6 text-sm">
						Add your first family member to start tracking their journey
					</p>
					<button
						on:click={openCreateForm}
						class="bg-primary text-primary-content hover:bg-primary/90 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors"
					>
						Add your first member
					</button>
				</div>
			</div>
		{:else}
			<!-- Family Members Grid -->
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each familyMembers as member}
					<div
						class="border-base-300 bg-base-100 rounded-lg border p-6 transition-shadow hover:shadow-sm dark:bg-neutral-800"
					>
						<!-- Member Header -->
						<div class="mb-4 flex items-start justify-between">
							<div class="flex-1">
								<div class="mb-2 flex items-center space-x-3">
									<div
										class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full"
									>
										<svelte:component this={icons.User} size={20} class="text-info" />
									</div>
									<h3 class="text-base-content text-lg font-semibold">{member.name}</h3>
								</div>

								{#if member.className}
									<div class="mb-2 flex items-center space-x-2">
										<div class="bg-secondary/10 flex h-6 w-6 items-center justify-center rounded">
											<svelte:component this={icons.Crown} size={12} class="text-secondary" />
										</div>
										<span class="text-secondary text-sm font-medium">{member.className}</span>
									</div>
									{#if member.classDescription}
										<p class="text-base-content/70 pl-8 text-xs italic">
											"{member.classDescription}"
										</p>
									{/if}
								{/if}
							</div>

							<!-- Actions Menu -->
							<div class="dropdown-container relative">
								<button
									class="group hover:bg-base-200 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
									on:click={() => toggleDropdown(member.id)}
								>
									<svelte:component
										this={icons.MoreVertical}
										size={16}
										class="text-base-content/60 group-hover:text-base-content/80"
									/>
								</button>
								{#if openDropdownId === member.id}
									<div
										class="border-base-300 bg-base-100 absolute right-0 z-10 mt-1 w-48 rounded-lg border shadow-lg dark:bg-neutral-800"
									>
										<button
											on:click={() => {
												openEditForm(member);
												closeDropdown();
											}}
											class="text-base-content/80 hover:bg-base-200 flex w-full items-center space-x-3 px-4 py-2 text-left text-sm transition-colors"
										>
											<svelte:component this={icons.Edit2} size={14} />
											<span>Edit profile</span>
										</button>
										<button
											on:click={() => {
												deleteMember(member.id);
												closeDropdown();
											}}
											class="text-error hover:bg-error/10 flex w-full items-center space-x-3 px-4 py-2 text-left text-sm transition-colors"
										>
											<svelte:component this={icons.Trash2} size={14} />
											<span>Delete</span>
										</button>
									</div>
								{/if}
							</div>
						</div>

						<!-- Attributes Section -->
						<div class="border-base-300 border-t pt-4">
							<AttributeManager
								attributes={member.attributes || []}
								onAddAttribute={(key, value) => handleAddAttribute(member.id, key, value)}
								title="Attributes"
								emptyMessage="No attributes yet - add sections like Values, Interests, or Skills"
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
