<script lang="ts">
	import { formatDistanceToNow } from 'date-fns';
	import { User, Bot } from 'lucide-svelte';
	
	interface JournalEntry {
		id: string;
		content: string;
		role: 'user' | 'assistant';
		createdAt: string;
	}
	
	let { message }: { message: JournalEntry } = $props();
	
	function formatTime(timestamp: string): string {
		try {
			return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
		} catch {
			return 'Just now';
		}
	}
</script>

<div class="flex gap-3 {message.role === 'user' ? 'justify-end' : 'justify-start'}">
	{#if message.role === 'assistant'}
		<div class="flex-shrink-0">
			<div class="w-8 h-8 rounded-full flex items-center justify-center" 
				 style="background-color: rgb(var(--color-primary-100));">
				<Bot class="h-4 w-4" style="color: rgb(var(--color-primary-600))" />
			</div>
		</div>
	{/if}
	
	<div class="flex flex-col max-w-[75%] md:max-w-[65%]">
		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-medium" style="color: rgb(var(--color-text-secondary))">
				{message.role === 'user' ? 'You' : 'AI Companion'}
			</span>
			<span class="text-xs" style="color: rgb(var(--color-text-tertiary))">
				{formatTime(message.createdAt)}
			</span>
		</div>
		
		<div class="px-4 py-3 rounded-2xl {message.role === 'user' 
			? 'rounded-br-md' 
			: 'rounded-bl-md'}"
			style="{message.role === 'user' 
				? 'background-color: rgb(var(--color-primary-600)); color: white;' 
				: 'background-color: white; color: rgb(var(--color-text-primary)); border: 1px solid rgb(var(--color-neutral-200));'}"
		>
			<div class="text-sm leading-relaxed whitespace-pre-wrap">
				{message.content}
			</div>
		</div>
	</div>
	
	{#if message.role === 'user'}
		<div class="flex-shrink-0">
			<div class="w-8 h-8 rounded-full flex items-center justify-center" 
				 style="background-color: rgb(var(--color-primary-600));">
				<User class="h-4 w-4 text-white" />
			</div>
		</div>
	{/if}
</div>
