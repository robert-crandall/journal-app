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
		class="border-base-300 focus:border-primary focus:ring-primary hover:border-base-content/20 bg-base-100 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
	>
		<div class="flex items-center space-x-2">
			{#if selectedIcon}
				<div class="flex h-5 w-5 items-center justify-center">
					<svelte:component
						this={getIconComponent(selectedIcon)}
						size={16}
						class="text-base-content/60"
					/>
				</div>
				<span class="text-base-content">
					{availableIcons.find((opt) => opt.name === selectedIcon)?.label || selectedIcon}
				</span>
			{:else}
				<span class="text-base-content/50">Choose an icon...</span>
			{/if}
		</div>
		<svelte:component this={icons.ChevronDown} size={16} class="text-base-content/50" />
	</button>

	<!-- Icon Picker Modal -->
	{#if isOpen}
		<!-- Backdrop -->
		<div class="bg-opacity-25 fixed inset-0 z-40 bg-black" onclick={closePicker}></div>

		<!-- Modal -->
		<div
			class="border-base-300 bg-base-100 absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-hidden rounded-lg border shadow-lg"
		>
			<!-- Search Bar -->
			<div class="border-base-300 border-b p-3">
				<div class="relative">
					<svelte:component
						this={icons.Search}
						size={16}
						class="text-base-content/50 absolute top-1/2 left-3 -translate-y-1/2 transform"
					/>
					<input
						type="text"
						bind:value={searchTerm}
						{placeholder}
						class="border-base-300 focus:border-primary focus:ring-primary bg-base-100 text-base-content w-full rounded-md border py-2 pr-3 pl-10 text-sm focus:ring-1 focus:outline-none"
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
								class="group hover:border-primary/50 hover:bg-primary/10 flex flex-col items-center justify-center rounded-lg border p-3 transition-all {selectedIcon ===
								icon.name
									? 'border-primary bg-primary/10'
									: 'border-base-300 bg-base-100'}"
								title={icon.label}
							>
								<div class="mb-1 flex h-6 w-6 items-center justify-center">
									<svelte:component
										this={getIconComponent(icon.name)}
										size={18}
										class="transition-colors {selectedIcon === icon.name
											? 'text-primary'
											: 'text-base-content/60 group-hover:text-primary'}"
									/>
								</div>
								<span
									class="text-base-content/60 group-hover:text-primary text-center text-xs {selectedIcon ===
									icon.name
										? 'text-primary font-medium'
										: ''} w-full truncate"
								>
									{icon.label}
								</span>
							</button>
						{/each}
					</div>
				{:else}
					<div class="text-base-content/50 py-8 text-center">
						<svelte:component
							this={icons.Search}
							size={24}
							class="text-base-content/30 mx-auto mb-2"
						/>
						<p class="text-sm">No icons found</p>
						<p class="text-base-content/30 mt-1 text-xs">Try a different search term</p>
					</div>
				{/if}
			</div>

			<!-- Preview Area (if enabled and icon selected) -->
			{#if showPreview && selectedIcon}
				<div class="border-base-300 bg-base-200 border-t p-3">
					<div class="flex items-center space-x-3">
						<span class="text-base-content/70 text-sm font-medium">Selected:</span>
						<div class="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
							<svelte:component
								this={getIconComponent(selectedIcon)}
								size={18}
								class="text-primary"
							/>
						</div>
						<span class="text-base-content/60 text-sm">
							{availableIcons.find((opt) => opt.name === selectedIcon)?.label || selectedIcon}
						</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
