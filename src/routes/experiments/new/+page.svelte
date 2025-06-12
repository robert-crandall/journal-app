<script lang="ts">
	import { goto } from '$app/navigation';
	import { Calendar, Target } from 'lucide-svelte';
	
	let title = $state('');
	let description = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let submitting = $state(false);
	let error = $state('');
	
	// Set default dates
	$effect(() => {
		const today = new Date();
		
		// Format date as YYYY-MM-DD
		const formatDate = (date: Date) => {
			return date.toISOString().split('T')[0];
		};
		
		// Default start date to today
		if (!startDate) {
			startDate = formatDate(today);
		}
		
		// Default end date to 30 days from now
		if (!endDate) {
			const thirtyDaysLater = new Date();
			thirtyDaysLater.setDate(today.getDate() + 30);
			endDate = formatDate(thirtyDaysLater);
		}
	});
	
	async function handleSubmit() {
		if (!title) {
			error = 'Title is required';
			return;
		}
		
		if (!startDate || !endDate) {
			error = 'Start and end dates are required';
			return;
		}
		
		const start = new Date(startDate);
		const end = new Date(endDate);
		
		if (end <= start) {
			error = 'End date must be after start date';
			return;
		}
		
		try {
			submitting = true;
			const response = await fetch('/api/experiments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title,
					description,
					startDate,
					endDate
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create experiment');
			}
			
			const data = await response.json();
			goto(`/experiments/${data.experiment.id}`);
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'An unknown error occurred';
			}
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>New Experiment - Journal App</title>
</svelte:head>

<div class="space-y-6 max-w-3xl mx-auto">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold text-base-content flex items-center gap-2">
			<Target size={28} /> New Experiment
		</h1>
		<p class="text-base-content/70 mt-1">Create a new personal experiment to track your growth</p>
	</div>
	
	<!-- Form -->
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
		{#if error}
			<div class="alert alert-error">
				<span>{error}</span>
			</div>
		{/if}
		
		<div class="form-control">
			<label for="title" class="label">
				<span class="label-text">Title</span>
			</label>
			<input
				type="text"
				id="title"
				class="input input-bordered w-full"
				placeholder="e.g. 30 Days of Meditation"
				bind:value={title}
				required
			/>
		</div>
		
		<div class="form-control">
			<label for="description" class="label">
				<span class="label-text">Description</span>
			</label>
			<textarea
				id="description"
				class="textarea textarea-bordered h-24"
				placeholder="What is this experiment about? What are you trying to learn or achieve?"
				bind:value={description}
			></textarea>
		</div>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="form-control">
				<label for="startDate" class="label">
					<span class="label-text">Start Date</span>
				</label>
				<div class="relative">
					<div class="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-70">
						<Calendar size={16} />
					</div>
					<input
						type="date"
						id="startDate"
						class="input input-bordered w-full pl-9"
						bind:value={startDate}
						required
					/>
				</div>
			</div>
			
			<div class="form-control">
				<label for="endDate" class="label">
					<span class="label-text">End Date</span>
				</label>
				<div class="relative">
					<div class="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-70">
						<Calendar size={16} />
					</div>
					<input
						type="date"
						id="endDate"
						class="input input-bordered w-full pl-9"
						bind:value={endDate}
						required
					/>
				</div>
			</div>
		</div>
		
		<div class="pt-4 flex gap-2 justify-end">
			<a href="/experiments" class="btn btn-ghost">Cancel</a>
			<button type="submit" class="btn btn-primary" disabled={submitting}>
				{#if submitting}
					<span class="loading loading-spinner loading-sm"></span>
					Creating...
				{:else}
					Create Experiment
				{/if}
			</button>
		</div>
	</form>
</div>
