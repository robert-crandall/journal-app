<script lang="ts">
	import { notifications, removeNotification } from '$lib/stores/notifications';
	import { CheckCircle, AlertTriangle, AlertCircle, Info, X, TrendingUp, TrendingDown } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	const iconConfig = {
		success: CheckCircle,
		warning: AlertTriangle,
		danger: AlertCircle,
		info: Info
	};

	const colorConfig = {
		success: 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900 dark:border-success-700 dark:text-success-200',
		warning: 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900 dark:border-warning-700 dark:text-warning-200',
		danger: 'bg-danger-50 border-danger-200 text-danger-800 dark:bg-danger-900 dark:border-danger-700 dark:text-danger-200',
		info: 'bg-info-50 border-info-200 text-info-800 dark:bg-info-900 dark:border-info-700 dark:text-info-200'
	};

	function handleDismiss(id: string) {
		removeNotification(id);
	}
</script>

<!-- Notification container -->
<div class="notification-overlay">
	{#each $notifications as notification (notification.id)}
		<div
			in:fly={{ x: 300, duration: 300 }}
			out:fly={{ x: 300, duration: 200 }}
			class="mb-3 p-4 rounded-lg border shadow-lg {colorConfig[notification.type]}"
		>
			<div class="flex items-start">
				<!-- Icon -->
				<div class="flex-shrink-0">
					{#if notification.xpGained !== undefined}
						<!-- XP specific icons -->
						{#if notification.xpGained > 0}
							<TrendingUp class="h-5 w-5" />
						{:else}
							<TrendingDown class="h-5 w-5" />
						{/if}
					{:else}
						<!-- Regular notification icons -->
						{@const Icon = iconConfig[notification.type]}
						<Icon class="h-5 w-5" />
					{/if}
				</div>

				<!-- Content -->
				<div class="ml-3 flex-1">
					<h4 class="text-sm font-medium">
						{notification.title}
					</h4>
					{#if notification.message}
						<p class="text-sm mt-1 opacity-90">
							{notification.message}
						</p>
					{/if}
				</div>

				<!-- Dismiss button -->
				<div class="ml-3 flex-shrink-0">
					<button
						onclick={() => handleDismiss(notification.id)}
						class="rounded-md p-1 hover:bg-black hover:bg-opacity-10 transition-colors touch-target"
						aria-label="Dismiss notification"
					>
						<X class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	{/each}
</div>
