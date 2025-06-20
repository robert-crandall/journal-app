<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { tasksApi, familyApi, focusesApi, statsApi } from '$lib/api';
	import { Calendar, Target, ArrowLeft, Save } from 'lucide-svelte';
	import * as icons from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	// Helper function to get icon component
	function getIconComponent(iconName: string) {
		if (!iconName) return Target;

		// Convert kebab-case to PascalCase for Lucide components
		const componentName = iconName
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join('');

		return (icons as any)[componentName] || Target;
	}

	let task: any = null;
	let familyMembers: any[] = [];
	let focuses: any[] = [];
	let stats: any[] = [];
	let loading = true;
	let saving = false;
	let saveMessage = '';

	// Form data
	let formData = {
		title: '',
		description: '',
		dueDate: '',
		focusId: '',
		levelId: '',
		familyMemberId: '',
		statId: ''
	};

	const taskId = data.taskId;

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			const [taskRes, familyRes, focusesRes, statsRes] = await Promise.all([
				tasksApi.get(taskId),
				familyApi.getAll(),
				focusesApi.getAll(),
				statsApi.getAll()
			]);
			
			task = taskRes.task;
			familyMembers = familyRes.familyMembers;
			focuses = focusesRes.focuses;
			stats = statsRes.stats;

			// Populate form data
			formData = {
				title: task.title,
				description: task.description || '',
				dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
				focusId: task.focusId || '',
				levelId: task.levelId || '',
				familyMemberId: task.familyMemberId || '',
				statId: task.statId || ''
			};
		} catch (error) {
			console.error('Failed to load task data:', error);
			goto('/tasks');
		} finally {
			loading = false;
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		
		if (!formData.title.trim()) {
			showSaveMessage('Please enter a task title');
			return;
		}

		try {
			saving = true;
			const taskData = {
				...formData,
				dueDate: formData.dueDate || undefined,
				focusId: formData.focusId || undefined,
				levelId: formData.levelId || undefined,
				familyMemberId: formData.familyMemberId || undefined,
				statId: formData.statId || undefined
			};

			await tasksApi.update(taskId, taskData);
			showSaveMessage('Task updated successfully ✓');
			
			// Navigate back after a brief delay
			setTimeout(() => {
				goto('/tasks');
			}, 1500);
		} catch (error) {
			console.error('Failed to update task:', error);
			showSaveMessage('Failed to update task');
		} finally {
			saving = false;
		}
	}

	function showSaveMessage(message: string) {
		saveMessage = message;
		setTimeout(() => (saveMessage = ''), 3000);
	}

	function goBack() {
		goto('/tasks');
	}
</script>

<svelte:head>
	<title>Edit Task - Journal App</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div class="loading loading-spinner loading-lg text-primary"></div>
			<p class="text-base-content/70 mt-4">Loading task...</p>
		</div>
	</div>
{:else if task}
	<div class="min-h-screen bg-base-200">
		<!-- Header -->
		<div class="bg-base-100 border-base-300 border-b">
			<div class="container mx-auto px-4 py-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<button
							onclick={goBack}
							class="btn btn-ghost btn-sm"
							title="Back to tasks"
						>
							<ArrowLeft class="h-5 w-5" />
						</button>
						<div class="flex items-center gap-3">
							<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
								<Target class="text-primary h-5 w-5" />
							</div>
							<div>
								<h1 class="text-base-content text-2xl font-bold">Edit Task</h1>
								<p class="text-base-content/60 text-sm">Update your task details</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="container mx-auto px-4 py-8">
			<div class="mx-auto max-w-2xl">
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body p-8">
						<form onsubmit={handleSubmit} class="space-y-8">
							<!-- Essential Fields -->
							<div class="space-y-6">
								<div>
									<h3 class="text-base-content mb-4 flex items-center gap-2 text-lg font-semibold">
										<div class="h-2 w-2 rounded-full bg-primary"></div>
										Task Details
									</h3>

									<!-- Title -->
									<div class="mb-6 space-y-2">
										<label for="title" class="label">
											<span class="label-text font-medium">Task Title *</span>
										</label>
										<input
											id="title"
											type="text"
											class="input input-bordered w-full"
											placeholder="What needs to be done?"
											bind:value={formData.title}
											required
										/>
									</div>

									<!-- Description -->
									<div class="space-y-2">
										<label for="description" class="label">
											<span class="label-text font-medium">Description</span>
										</label>
										<textarea
											id="description"
											class="textarea textarea-bordered w-full resize-none"
											placeholder="Add context, notes, or additional details..."
											bind:value={formData.description}
											rows="4"
										></textarea>
									</div>
								</div>

								<!-- Scheduling -->
								<div>
									<h3 class="text-base-content mb-4 flex items-center gap-2 text-lg font-semibold">
										<div class="h-2 w-2 rounded-full bg-secondary"></div>
										Scheduling
									</h3>

									<div class="space-y-2">
										<label for="dueDate" class="label">
											<span class="label-text font-medium">Due Date</span>
										</label>
										<div class="relative">
											<input
												id="dueDate"
												type="date"
												class="input input-bordered w-full"
												bind:value={formData.dueDate}
											/>
											<Calendar
												class="text-base-content/50 pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform"
											/>
										</div>
									</div>
								</div>

								<!-- Organization -->
								<div>
									<h3 class="text-base-content mb-4 flex items-center gap-2 text-lg font-semibold">
										<div class="h-2 w-2 rounded-full bg-accent"></div>
										Organization
									</h3>

									<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
										<!-- Focus -->
										<div class="space-y-2">
											<label for="focusId" class="label">
												<span class="label-text font-medium">Focus Area</span>
											</label>
											<select
												id="focusId"
												class="select select-bordered w-full"
												bind:value={formData.focusId}
											>
												<option value="">No focus area</option>
												{#each focuses as focus}
													<option value={focus.id}>{focus.name}</option>
												{/each}
											</select>
										</div>

										<!-- Stat -->
										<div class="space-y-2">
											<label for="statId" class="label">
												<span class="label-text font-medium">Stat Category</span>
											</label>
											<select
												id="statId"
												class="select select-bordered w-full"
												bind:value={formData.statId}
											>
												<option value="">No stat category</option>
												{#each stats as stat}
													<option value={stat.id}>
														{stat.name} (Level {stat.level})
													</option>
												{/each}
											</select>
										</div>

										<!-- Family Member -->
										{#if familyMembers.length > 0}
											<div class="space-y-2 md:col-span-2">
												<label for="familyMemberId" class="label">
													<span class="label-text font-medium">Family Member</span>
												</label>
												<select
													id="familyMemberId"
													class="select select-bordered w-full"
													bind:value={formData.familyMemberId}
												>
													<option value="">No family member</option>
													{#each familyMembers as member}
														<option value={member.id}>{member.name}</option>
													{/each}
												</select>
											</div>
										{/if}
									</div>
								</div>
							</div>

							<!-- Form Actions -->
							<div class="flex items-center justify-between border-t border-base-300 pt-6">
								<button
									type="button"
									class="btn btn-ghost"
									onclick={goBack}
									disabled={saving}
								>
									Cancel
								</button>
								<button
									type="submit"
									class="btn btn-primary"
									disabled={saving || !formData.title.trim()}
								>
									{#if saving}
										<span class="loading loading-spinner loading-sm"></span>
										Saving...
									{:else}
										<Save class="h-4 w-4" />
										Update Task
									{/if}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Save Message Toast -->
	{#if saveMessage}
		<div class="toast toast-top toast-end">
			<div class="alert alert-success">
				<span>{saveMessage}</span>
			</div>
		</div>
	{/if}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="text-base-content text-2xl font-bold">Task not found</h1>
			<p class="text-base-content/60 mt-2">The task you're looking for doesn't exist.</p>
			<button onclick={goBack} class="btn btn-primary mt-4">
				Back to Tasks
			</button>
		</div>
	</div>
{/if}
