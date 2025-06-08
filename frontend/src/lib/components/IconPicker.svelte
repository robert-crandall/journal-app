<script lang="ts">
	import * as icons from 'lucide-svelte';

	// Props
	export let selectedIcon: string = '';
	export let availableIcons: Array<{ name: string; label: string }> = [];
	export let placeholder: string = 'Search icons...';
	export let showPreview: boolean = true;
	export let gridCols: number = 6;

	// State
	let searchTerm = '';
	let isOpen = false;

	// Helper function to get icon component
	function getIconComponent(iconName: string) {
		if (!iconName) return icons.Target;

		// Convert kebab-case to PascalCase for Lucide components
		const componentName = iconName
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join('');

		return (icons as any)[componentName] || icons.Target;
	}

	// Filtered icons based on search
	$: filteredIcons = availableIcons.filter(
		(icon) =>
			icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			icon.label.toLowerCase().includes(searchTerm.toLowerCase())
	);

	function selectIcon(iconName: string) {
		selectedIcon = iconName;
		isOpen = false;
		searchTerm = '';
	}

	function togglePicker() {
		isOpen = !isOpen;
		if (!isOpen) {
			searchTerm = '';
		}
	}

	function closePicker() {
		isOpen = false;
		searchTerm = '';
	}
</script>

<div class="relative">
	<!-- Current Selection Display -->
	<button
		type="button"
		onclick={togglePicker}
		class="w-full flex items-center justify-between rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-neutral-400"
	>
		<div class="flex items-center space-x-2">
			{#if selectedIcon}
				<div class="flex h-5 w-5 items-center justify-center">
					<svelte:component this={getIconComponent(selectedIcon)} size={16} class="text-neutral-600" />
				</div>
				<span class="text-neutral-900">
					{availableIcons.find((opt) => opt.name === selectedIcon)?.label || selectedIcon}
				</span>
			{:else}
				<span class="text-neutral-500">Choose an icon...</span>
			{/if}
		</div>
		<svelte:component this={icons.ChevronDown} size={16} class="text-neutral-400" />
	</button>

	<!-- Icon Picker Modal -->
	{#if isOpen}
		<!-- Backdrop -->
		<div class="fixed inset-0 z-40 bg-black bg-opacity-25" onclick={closePicker}></div>

		<!-- Modal -->
		<div class="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
			<!-- Search Bar -->
			<div class="border-b border-neutral-200 p-3">
				<div class="relative">
					<svelte:component this={icons.Search} size={16} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
					<input
						type="text"
						bind:value={searchTerm}
						placeholder={placeholder}
						class="w-full pl-10 pr-3 py-2 text-sm border border-neutral-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						autofocus
					/>
				</div>
			</div>

			<!-- Icons Grid -->
			<div class="max-h-64 overflow-y-auto p-3">
				{#if filteredIcons.length > 0}
					<div class="grid gap-2" style="grid-template-columns: repeat({gridCols}, minmax(0, 1fr))">
						{#each filteredIcons as icon (icon.name)}
							<button
								type="button"
								onclick={() => selectIcon(icon.name)}
								class="group flex flex-col items-center justify-center p-3 rounded-lg border transition-all hover:border-blue-300 hover:bg-blue-50 {selectedIcon === icon.name ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 bg-white'}"
								title={icon.label}
							>
								<div class="flex h-6 w-6 items-center justify-center mb-1">
									<svelte:component 
										this={getIconComponent(icon.name)} 
										size={18} 
										class="transition-colors {selectedIcon === icon.name ? 'text-blue-600' : 'text-neutral-600 group-hover:text-blue-600'}"
									/>
								</div>
								<span class="text-xs text-center text-neutral-600 group-hover:text-blue-600 {selectedIcon === icon.name ? 'text-blue-600 font-medium' : ''} truncate w-full">
									{icon.label}
								</span>
							</button>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-neutral-500">
						<svelte:component this={icons.Search} size={24} class="mx-auto mb-2 text-neutral-400" />
						<p class="text-sm">No icons found</p>
						<p class="text-xs text-neutral-400 mt-1">Try a different search term</p>
					</div>
				{/if}
			</div>

			<!-- Preview Area (if enabled and icon selected) -->
			{#if showPreview && selectedIcon}
				<div class="border-t border-neutral-200 p-3 bg-neutral-50">
					<div class="flex items-center space-x-3">
						<span class="text-sm font-medium text-neutral-700">Selected:</span>
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
							<svelte:component
								this={getIconComponent(selectedIcon)}
								size={18}
								class="text-blue-600"
							/>
						</div>
						<span class="text-sm text-neutral-600">
							{availableIcons.find((opt) => opt.name === selectedIcon)?.label || selectedIcon}
						</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>