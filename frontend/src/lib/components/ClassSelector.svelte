<script lang="ts">
	import { CLASS_LIBRARY, getClassesByType, findClassByName } from '$lib/data/classes';
	
	export let className = '';
	export let classDescription = '';
	export let onUpdate: (className: string, classDescription: string) => void = () => {};

	// Use the new class library
	const classSuggestions = getClassesByType();

	// Get class definitions from the library
	function getClassDefinition(name: string) {
		return findClassByName(name);
	}

	let isCustomClass = false;
	let customClassName = '';

	$: {
		// Check if current className is custom (not in predefined list)
		const allClasses = Object.values(classSuggestions).flat().map(c => c.class_name);
		
		// Handle custom class selection
		if (className === '__custom__') {
			isCustomClass = true;
			className = '';
			customClassName = '';
		} else {
			isCustomClass = !!(className && !allClasses.includes(className));
			if (isCustomClass) {
				customClassName = className;
			}
		}
	}

	function selectClass(selectedClass: string) {
		className = selectedClass;
		// Auto-fill description from class library if available and current description is empty
		const classDef = getClassDefinition(selectedClass);
		if (!classDescription && classDef) {
			classDescription = classDef.description;
		}
		isCustomClass = false;
		customClassName = '';
		onUpdate(className, classDescription);
	}

	function selectCustomClass() {
		isCustomClass = true;
		className = customClassName;
		onUpdate(className, classDescription);
	}

	function updateCustomClass() {
		className = customClassName;
		onUpdate(className, classDescription);
	}

	function updateDescription() {
		onUpdate(className, classDescription);
	}

	function clearClass() {
		className = '';
		classDescription = '';
		isCustomClass = false;
		customClassName = '';
		onUpdate(className, classDescription);
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-lg font-semibold">RPG Class</h3>
		{#if className}
			<button class="btn btn-ghost btn-sm" onclick={clearClass}>
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
				Clear
			</button>
		{/if}
	</div>

	<!-- Class Selection -->
	<div class="form-control">
		<label class="label" for="class-select">
			<span class="label-text">Choose your character class</span>
		</label>
		
		{#if !isCustomClass}
			<select
				id="class-select"
				class="select select-bordered w-full"
				bind:value={className}
				onchange={() => onUpdate(className, classDescription)}
			>
				<option value="">Select a class...</option>
				{#each Object.entries(classSuggestions) as [category, classes]}
					<optgroup label={category}>
						{#each classes as classOption}
							<option value={classOption.class_name}>{classOption.class_name}</option>
						{/each}
					</optgroup>
				{/each}
				<option value="__custom__">✏️ Custom Class</option>
			</select>
		{:else}
			<div class="flex gap-2">
				<input
					type="text"
					class="input input-bordered flex-1"
					placeholder="Enter custom class name"
					bind:value={customClassName}
					oninput={updateCustomClass}
				/>
				<button class="btn btn-ghost" onclick={() => { isCustomClass = false; className = ''; onUpdate('', classDescription); }}>
					Back to List
				</button>
			</div>
		{/if}
	</div>

	<!-- Auto-switch to custom if selecting custom option -->
	<!-- This is handled in the reactive statement above -->

	<!-- Class Description -->
	{#if className && className !== '__custom__'}
		<div class="form-control">
			<label class="label" for="class-description">
				<span class="label-text">Backstory</span>
				<span class="label-text-alt">Optional</span>
			</label>
			<textarea
				id="class-description"
				class="textarea textarea-bordered h-24"
				placeholder="Describe your character's background, personality, or approach to life..."
				bind:value={classDescription}
				oninput={updateDescription}
			></textarea>
			
			{#if getClassDefinition(className) && classDescription !== getClassDefinition(className)?.description}
				<div class="label">
					<span class="label-text-alt">
						<button 
							class="link link-primary text-xs"
							onclick={() => { 
								const classDef = getClassDefinition(className);
								if (classDef) {
									classDescription = classDef.description; 
									updateDescription(); 
								}
							}}
						>
							Use sample description for {className}
						</button>
					</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Preview -->
	{#if className && className !== '__custom__'}
		{@const classDef = getClassDefinition(className)}
		<div class="bg-base-200 rounded-lg p-4">
			<h4 class="font-semibold text-base mb-2 flex items-center">
				<span class="text-lg mr-2">🎭</span>
				Class Preview
			</h4>
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<span class="font-medium text-primary">{className}</span>
				</div>
				{#if classDescription}
					<p class="text-sm text-base-content/80 italic">"{classDescription}"</p>
				{:else}
					<p class="text-xs text-base-content/50">Add a description to complete your character profile</p>
				{/if}
				
				<!-- Recommended Stats -->
				{#if classDef && classDef.recommended_stats.length > 0}
					<div class="mt-3 pt-3 border-t border-base-300">
						<h5 class="text-sm font-medium text-base-content/80 mb-2">Recommended Stats:</h5>
						<div class="flex flex-wrap gap-1">
							{#each classDef.recommended_stats as statName}
								<span class="badge badge-outline badge-sm">{statName}</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
