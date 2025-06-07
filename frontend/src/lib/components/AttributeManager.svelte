<script lang="ts">
	export let attributes: Array<{ id: string; key: string; value: string }> = [];
	export let onAddAttribute: (key: string, value: string) => Promise<void>;
	export let title = 'Attributes';
	export let emptyMessage = 'No attributes yet';

	let newKeyMode = false;
	let newKey = '';
	let newValueInputs: Record<string, string> = {};
	let addingValueFor: string | null = null;

	// Group attributes by key and track virtual keys
	let virtualKeys: Record<string, boolean> = {};
	
	$: groupedAttributes = attributes.reduce((groups, attr) => {
		if (!groups[attr.key]) {
			groups[attr.key] = [];
		}
		groups[attr.key].push(attr.value);
		return groups;
	}, {} as Record<string, string[]>);

	// Get unique keys (including virtual ones)
	$: keys = [...new Set([...Object.keys(groupedAttributes), ...Object.keys(virtualKeys)])].sort();

	function startNewKey() {
		newKeyMode = true;
		newKey = '';
	}

	function cancelNewKey() {
		newKeyMode = false;
		newKey = '';
	}

	async function addNewKey() {
		if (!newKey.trim()) return;
		
		try {
			// Create a virtual key that will show up in the UI
			virtualKeys[newKey.trim()] = true;
			addingValueFor = newKey.trim();
			newValueInputs[newKey.trim()] = '';
			newKeyMode = false;
			newKey = '';
		} catch (error) {
			console.error('Failed to add key:', error);
		}
	}

	function startAddValue(key: string) {
		addingValueFor = key;
		newValueInputs[key] = '';
	}

	function cancelAddValue(key: string) {
		addingValueFor = null;
		delete newValueInputs[key];
		// If this was a virtual key with no values, remove it
		if (virtualKeys[key] && (!groupedAttributes[key] || groupedAttributes[key].length === 0)) {
			delete virtualKeys[key];
		}
	}

	async function addValue(key: string) {
		const value = newValueInputs[key]?.trim();
		if (!value) return;

		// Check for duplicates
		if (groupedAttributes[key]?.includes(value)) {
			alert('This value already exists for this attribute');
			return;
		}

		try {
			await onAddAttribute(key, value);
			addingValueFor = null;
			delete newValueInputs[key];
			// Remove from virtual keys since it now exists in the database
			delete virtualKeys[key];
		} catch (error) {
			console.error('Failed to add value:', error);
		}
	}

	function handleKeyKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addNewKey();
		} else if (event.key === 'Escape') {
			cancelNewKey();
		}
	}

	function handleValueKeydown(event: KeyboardEvent, key: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addValue(key);
		} else if (event.key === 'Escape') {
			cancelAddValue(key);
		}
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-lg font-semibold">{title}</h3>
		<button 
			class="btn btn-sm btn-primary" 
			onclick={startNewKey}
			disabled={newKeyMode}
		>
			<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Section
		</button>
	</div>

	{#if newKeyMode}
		<div class="bg-base-200 rounded-lg p-4">
			<div class="flex gap-2">
				<input
					type="text"
					class="input input-bordered flex-1"
					placeholder="Enter section name (e.g., Values, Interests, Skills)"
					bind:value={newKey}
					onkeydown={handleKeyKeydown}
				/>
				<button class="btn btn-primary btn-sm" onclick={addNewKey}>Add</button>
				<button class="btn btn-ghost btn-sm" onclick={cancelNewKey}>Cancel</button>
			</div>
		</div>
	{/if}

	{#if keys.length > 0}
		<div class="space-y-4">
			{#each keys as key}
				<div class="bg-base-100 border border-base-300 rounded-lg p-4">
					<div class="flex justify-between items-center mb-3">
						<h4 class="font-semibold text-base flex items-center">
							<span class="text-lg mr-2">🏷️</span>
							{key}
						</h4>
						<button 
							class="btn btn-xs btn-ghost"
							onclick={() => startAddValue(key)}
							disabled={addingValueFor === key}
						>
							<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							Add
						</button>
					</div>

					<div class="space-y-2">
						{#each (groupedAttributes[key] || []).filter(v => v.trim()) as value}
							<div class="bg-base-200 rounded px-3 py-2 text-sm">
								<span class="text-base-content">- {value}</span>
							</div>
						{/each}

						{#if addingValueFor === key}
							<div class="flex gap-2">
								<input
									type="text"
									class="input input-bordered input-sm flex-1"
									placeholder="Enter new value"
									bind:value={newValueInputs[key]}
									onkeydown={(e) => handleValueKeydown(e, key)}
								/>
								<button class="btn btn-primary btn-xs" onclick={() => addValue(key)}>Add</button>
								<button class="btn btn-ghost btn-xs" onclick={() => cancelAddValue(key)}>Cancel</button>
							</div>
						{/if}

						{#if !groupedAttributes[key] || groupedAttributes[key].filter(v => v.trim()).length === 0}
							<p class="text-base-content/50 text-sm italic">No values yet - click Add to get started</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-8">
			<p class="text-base-content/70 mb-4">{emptyMessage}</p>
			<button class="btn btn-primary" onclick={startNewKey}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Create Your First Section
			</button>
		</div>
	{/if}
</div>
