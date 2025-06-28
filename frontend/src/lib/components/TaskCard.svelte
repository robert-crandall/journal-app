<script lang="ts">
	import { CheckCircle, Clock, Target } from 'lucide-svelte';

	interface Props {
		title: string;
		description?: string;
		type: 'ai' | 'quest' | 'experiment' | 'todo' | 'ad-hoc';
		status: 'pending' | 'completed' | 'overdue';
		xpReward?: number;
		targetStats?: string[];
		deadline?: string | null;
		onComplete?: () => void;
		onFeedback?: () => void;
	}

	let {
		title,
		description,
		type,
		status,
		xpReward,
		targetStats = [],
		deadline,
		onComplete,
		onFeedback
	}: Props = $props();

	const typeConfig = {
		ai: { label: 'AI Task', color: 'primary', borderClass: 'card-primary' },
		quest: { label: 'Quest', color: 'warning', borderClass: 'card-warning' },
		experiment: { label: 'Experiment', color: 'info', borderClass: 'card-info' },
		todo: { label: 'Todo', color: 'neutral', borderClass: '' },
		'ad-hoc': { label: 'Ad-hoc', color: 'success', borderClass: 'card-success' }
	};

	const statusConfig = {
		pending: { icon: Clock, color: 'text-text-secondary' },
		completed: { icon: CheckCircle, color: 'text-success-600' },
		overdue: { icon: Clock, color: 'text-danger-600' }
	};

	function handleComplete() {
		if (onComplete && status === 'pending') {
			onComplete();
		}
	}

	function handleFeedback() {
		if (onFeedback && type === 'ai' && status === 'completed') {
			onFeedback();
		}
	}
</script>

<div class="card {typeConfig[type].borderClass}">
	<div class="flex justify-between items-start mb-3">
		<div class="flex-1">
			<!-- Task type and status -->
			<div class="flex items-center gap-2 mb-2">
				<span class="text-xs font-medium uppercase tracking-wide" style="color: rgb(var(--color-text-tertiary))">
					{typeConfig[type].label}
				</span>
				{#if status === 'completed'}
					{@const StatusIcon = statusConfig[status].icon}
					<StatusIcon class="h-4 w-4" style="color: rgb(var(--color-success-600))" />
				{/if}
			</div>

			<!-- Title -->
			<h3 class="text-lg font-semibold mb-1 {status === 'completed' ? 'line-through opacity-70' : ''}" style="color: rgb(var(--color-text-primary))">
				{title}
			</h3>

			<!-- Description -->
			{#if description}
				<p class="text-sm mb-3" style="color: rgb(var(--color-text-secondary))">
					{description}
				</p>
			{/if}

			<!-- Metadata row -->
			<div class="flex flex-wrap items-center gap-4 text-xs" style="color: rgb(var(--color-text-tertiary))">
				<!-- XP Reward -->
				{#if xpReward && xpReward > 0}
					<div class="flex items-center gap-1">
						<Target class="h-3 w-3" />
						<span>+{xpReward} XP</span>
					</div>
				{/if}

				<!-- Target Stats -->
				{#if targetStats.length > 0}
					<div class="flex items-center gap-1">
						<span>Stats:</span>
						<span class="font-medium">{targetStats.join(', ')}</span>
					</div>
				{/if}

				<!-- Deadline -->
				{#if deadline}
					<div class="flex items-center gap-1">
						<Clock class="h-3 w-3" />
						<span>{deadline}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex gap-2 mt-4">
		{#if status === 'pending'}
			<button
				onclick={handleComplete}
				class="btn btn-primary flex-1 touch-target"
			>
				<CheckCircle class="h-4 w-4 mr-2" />
				Complete
			</button>
		{:else if status === 'completed' && type === 'ai'}
			<button
				onclick={handleFeedback}
				class="btn btn-secondary touch-target"
			>
				Provide Feedback
			</button>
		{/if}
	</div>
</div>
