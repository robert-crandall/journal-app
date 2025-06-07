<script lang="ts">
	export let className = '';
	export let classDescription = '';
	export let onUpdate: (className: string, classDescription: string) => void = () => {};

	// Predefined class suggestions grouped by type
	const classSuggestions = {
		Combat: ['Fighter', 'Warrior', 'Paladin', 'Barbarian', 'Ranger'],
		Mystic: ['Wizard', 'Sorcerer', 'Warlock', 'Druid', 'Cleric'],
		Support: ['Bard', 'Healer', 'Support', 'Guardian', 'Protector'],
		Stealth: ['Rogue', 'Assassin', 'Scout', 'Thief', 'Spy'],
		Other: ['Monk', 'Artificer', 'Scholar', 'Merchant', 'Wanderer']
	};

	// Sample descriptions for classes
	const sampleDescriptions: Record<string, string> = {
		'Monk': 'A quiet thinker who moves through the world with graceful intent',
		'Fighter': 'A bold warrior who faces challenges head-on with strength and courage',
		'Wizard': 'A seeker of knowledge who finds power in understanding and wisdom',
		'Bard': 'A charismatic storyteller who connects people through art and emotion',
		'Rogue': 'A clever problem-solver who finds creative paths through obstacles',
		'Druid': 'A nature-connected soul who finds balance and harmony in all things',
		'Paladin': 'A principled defender who stands for justice and protection of others',
		'Barbarian': 'A fierce spirit who embraces raw emotion and authentic expression',
		'Ranger': 'An independent explorer who thrives in freedom and adventure',
		'Sorcerer': 'An intuitive creator who channels natural talent and inspiration',
		'Warlock': 'A determined seeker who pursues power through focus and will',
		'Cleric': 'A devoted healer who serves others with compassion and faith',
		'Healer': 'A caring nurturer who brings comfort and restoration to others',
		'Guardian': 'A loyal protector who shields loved ones from harm',
		'Artificer': 'A skilled craftsperson who creates solutions with hands and mind',
		'Scholar': 'A dedicated learner who pursues truth and understanding',
		'Merchant': 'A resourceful trader who builds connections and opportunities',
		'Wanderer': 'A free spirit who finds meaning in the journey itself'
	};

	let isCustomClass = false;
	let customClassName = '';

	$: {
		// Check if current className is custom (not in predefined list)
		const allClasses = Object.values(classSuggestions).flat();
		
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
		// Auto-fill sample description if available and current description is empty
		if (!classDescription && sampleDescriptions[selectedClass]) {
			classDescription = sampleDescriptions[selectedClass];
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
							<option value={classOption}>{classOption}</option>
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
				<span class="label-text">Class backstory or description</span>
				<span class="label-text-alt">Optional</span>
			</label>
			<textarea
				id="class-description"
				class="textarea textarea-bordered h-24"
				placeholder="Describe your character's background, personality, or approach to life..."
				bind:value={classDescription}
				oninput={updateDescription}
			></textarea>
			
			{#if sampleDescriptions[className] && classDescription !== sampleDescriptions[className]}
				<div class="label">
					<span class="label-text-alt">
						<button 
							class="link link-primary text-xs"
							onclick={() => { classDescription = sampleDescriptions[className]; updateDescription(); }}
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
			</div>
		</div>
	{/if}
</div>