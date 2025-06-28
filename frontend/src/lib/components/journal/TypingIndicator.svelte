<script lang="ts">
	import { Bot } from 'lucide-svelte';
</script>

<div class="flex gap-3 justify-start">
	<div class="flex-shrink-0">
		<div class="w-8 h-8 rounded-full flex items-center justify-center" 
			 style="background-color: rgb(var(--color-primary-100));">
			<Bot class="h-4 w-4" style="color: rgb(var(--color-primary-600))" />
		</div>
	</div>
	
	<div class="flex flex-col max-w-[75%] md:max-w-[65%]">
		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-medium" style="color: rgb(var(--color-text-secondary))">
				AI Companion
			</span>
			<span class="text-xs" style="color: rgb(var(--color-text-tertiary))">
				typing...
			</span>
		</div>
		
		<div class="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-neutral-200">
			<div class="flex gap-1">
				<div class="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" 
					 style="animation-delay: 0ms;"></div>
				<div class="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" 
					 style="animation-delay: 150ms;"></div>
				<div class="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" 
					 style="animation-delay: 300ms;"></div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes pulse {
		0%, 70%, 100% {
			opacity: 0.4;
			transform: scale(1);
		}
		35% {
			opacity: 1;
			transform: scale(1.1);
		}
	}
	
	.animate-pulse {
		animation: pulse 1.5s ease-in-out infinite;
	}
</style>
