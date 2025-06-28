<script lang="ts">
	import { PlusCircle, User, Sparkles, Target, ArrowRight } from 'lucide-svelte';
	import StatCard from '$lib/components/StatCard.svelte';

	// Mock character data - this will be replaced with real API calls
	let hasCharacter = false;
	let character = {
		name: '',
		characterClass: '',
		backstory: '',
		stats: [] as Array<{
			name: string;
			level: number;
			currentXP: number;
			totalXP: number;
			nextLevelXP: number;
			title: string;
			canLevelUp?: boolean;
		}>
	};

	// Character creation form state
	let step = 1;
	const totalSteps = 6;
	
	let formData = {
		name: '',
		characterClass: '',
		backstory: '',
		selectedStats: [] as string[]
	};

	// Available character classes
	const characterClasses = [
		{
			name: 'The Achiever',
			description: 'Focused on personal goals and systematic progress',
			icon: Target,
			stats: ['Personal Development', 'Career', 'Skills']
		},
		{
			name: 'The Explorer',
			description: 'Loves new experiences and adventures',
			icon: ArrowRight,
			stats: ['Adventure', 'Travel', 'Learning']
		},
		{
			name: 'The Nurturer',
			description: 'Dedicated to family and community connections',
			icon: User,
			stats: ['Family Time', 'Social', 'Community']
		},
		{
			name: 'The Creator',
			description: 'Driven by creativity and self-expression',
			icon: Sparkles,
			stats: ['Creativity', 'Art', 'Innovation']
		}
	];

	// Available stats for customization
	const availableStats = [
		'Physical Health', 'Mental Health', 'Adventure', 'Family Time', 'Social',
		'Career', 'Learning', 'Creativity', 'Personal Development', 'Community',
		'Spirituality', 'Finance', 'Home', 'Travel', 'Skills', 'Art', 'Innovation'
	];

	function nextStep() {
		if (step < totalSteps) step++;
	}

	function prevStep() {
		if (step > 1) step--;
	}

	function selectClass(selectedClass: typeof characterClasses[0]) {
		formData.characterClass = selectedClass.name;
		formData.selectedStats = [...selectedClass.stats];
		nextStep();
	}

	function toggleStat(stat: string) {
		if (formData.selectedStats.includes(stat)) {
			formData.selectedStats = formData.selectedStats.filter(s => s !== stat);
		} else if (formData.selectedStats.length < 6) {
			formData.selectedStats = [...formData.selectedStats, stat];
		}
	}

	function createCharacter() {
		// Mock character creation - in real app this would call API
		character = {
			name: formData.name,
			characterClass: formData.characterClass,
			backstory: formData.backstory,
			stats: formData.selectedStats.map((stat, index) => ({
				name: stat,
				level: 1,
				currentXP: Math.floor(Math.random() * 80) + 10, // Random progress for demo
				totalXP: Math.floor(Math.random() * 80) + 10,
				nextLevelXP: 100,
				title: 'Novice',
				canLevelUp: Math.random() > 0.7 // 30% chance can level up for demo
			}))
		};
		hasCharacter = true;
	}

	function handleLevelUp(statName: string) {
		if (character.stats) {
			character.stats = character.stats.map(stat => {
				if (stat.name === statName && stat.canLevelUp) {
					const newLevel = stat.level + 1;
					return {
						...stat,
						level: newLevel,
						currentXP: 0,
						totalXP: stat.totalXP + stat.currentXP,
						nextLevelXP: newLevel * 100, // Simplified level progression
						title: generateTitle(newLevel),
						canLevelUp: false
					};
				}
				return stat;
			});
		}
	}

	function generateTitle(level: number): string {
		const titles = [
			'Novice', 'Apprentice', 'Adept', 'Expert', 'Master', 
			'Grandmaster', 'Legend', 'Champion', 'Mythic Hero'
		];
		return titles[Math.min(level - 1, titles.length - 1)] || 'Legendary';
	}

	function startOver() {
		hasCharacter = false;
		step = 1;
		formData = {
			name: '',
			characterClass: '',
			backstory: '',
			selectedStats: []
		};
	}
</script>

<svelte:head>
	<title>Character - D&D Life</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	{#if !hasCharacter}
		<!-- Character Creation Wizard -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-center mb-2" style="color: rgb(var(--color-text-primary))">
				Create Your Character
			</h1>
			<p class="text-center mb-6" style="color: rgb(var(--color-text-secondary))">
				Build your personalized life adventure character
			</p>
			
			<!-- Progress Indicator -->
			<div class="flex justify-center mb-8">
				<div class="flex items-center space-x-2">
					{#each Array(totalSteps) as _, i}
						<div 
							class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
							class:bg-primary-600={i + 1 <= step}
							class:text-white={i + 1 <= step}
							style:background-color={i + 1 <= step ? 'rgb(var(--color-primary-600))' : 'rgb(var(--color-neutral-200))'}
							style:color={i + 1 <= step ? 'white' : 'rgb(var(--color-text-tertiary))'}
						>
							{i + 1}
						</div>
						{#if i < totalSteps - 1}
							<div 
								class="w-8 h-0.5 transition-colors"
								style:background-color={i + 1 < step ? 'rgb(var(--color-primary-600))' : 'rgb(var(--color-neutral-200))'}
							></div>
						{/if}
					{/each}
				</div>
			</div>
		</div>

		<!-- Step Content -->
		<div class="card">
			{#if step === 1}
				<!-- Welcome Step -->
				<div class="text-center">
					<User class="h-16 w-16 mx-auto mb-4" style="color: rgb(var(--color-primary-500))" />
					<h2 class="text-2xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
						Welcome to Your Adventure!
					</h2>
					<p class="text-lg mb-6" style="color: rgb(var(--color-text-secondary))">
						You're about to create a character that represents your real-life journey. 
						This character will level up as you complete tasks and achieve your goals.
					</p>
					<button 
						onclick={nextStep}
						class="btn btn-primary"
					>
						<ArrowRight class="h-4 w-4 mr-2" />
						Get Started
					</button>
				</div>

			{:else if step === 2}
				<!-- Name Input -->
				<div>
					<h2 class="text-2xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
						What's your character's name?
					</h2>
					<p class="mb-6" style="color: rgb(var(--color-text-secondary))">
						This could be your real name, a nickname, or a completely fictional character name.
					</p>
					<input 
						bind:value={formData.name}
						type="text" 
						placeholder="Enter your character name"
						class="w-full p-3 border rounded-lg text-lg"
						style:border-color="rgb(var(--color-border))"
						style:background-color="rgb(var(--color-surface))"
						style:color="rgb(var(--color-text-primary))"
					/>
					<div class="flex justify-between mt-6">
						<button onclick={prevStep} class="btn btn-secondary">
							Back
						</button>
						<button 
							onclick={nextStep} 
							disabled={!formData.name.trim()}
							class="btn btn-primary"
						>
							Continue
							<ArrowRight class="h-4 w-4 ml-2" />
						</button>
					</div>
				</div>

			{:else if step === 3}
				<!-- Class Selection -->
				<div>
					<h2 class="text-2xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
						Choose Your Character Class
					</h2>
					<p class="mb-6" style="color: rgb(var(--color-text-secondary))">
						Select the class that best represents your life focus and goals.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each characterClasses as charClass}
							<button 
								onclick={() => selectClass(charClass)}
								class="card text-left p-4 border-2 hover:border-primary-500 transition-colors"
								style:border-color="rgb(var(--color-border))"
							>
								<div class="flex items-start space-x-3">
									<svelte:component 
										this={charClass.icon} 
										class="h-6 w-6 mt-1 flex-shrink-0" 
										style="color: rgb(var(--color-primary-500))" 
									/>
									<div>
										<h3 class="font-semibold mb-2" style="color: rgb(var(--color-text-primary))">
											{charClass.name}
										</h3>
										<p class="text-sm mb-3" style="color: rgb(var(--color-text-secondary))">
											{charClass.description}
										</p>
										<div class="flex flex-wrap gap-1">
											{#each charClass.stats as stat}
												<span 
													class="text-xs px-2 py-1 rounded"
													style:background-color="rgb(var(--color-primary-100))"
													style:color="rgb(var(--color-primary-700))"
												>
													{stat}
												</span>
											{/each}
										</div>
									</div>
								</div>
							</button>
						{/each}
					</div>
					<div class="flex justify-between mt-6">
						<button onclick={prevStep} class="btn btn-secondary">
							Back
						</button>
					</div>
				</div>

			{:else if step === 4}
				<!-- Stat Customization -->
				<div>
					<h2 class="text-2xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
						Customize Your Stats
					</h2>
					<p class="mb-6" style="color: rgb(var(--color-text-secondary))">
						Choose up to 6 life areas you want to focus on. You started with 3 from your class.
					</p>
					<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
						{#each availableStats as stat}
							<button 
								onclick={() => toggleStat(stat)}
								class="p-3 border rounded-lg text-sm font-medium transition-colors"
								class:selected={formData.selectedStats.includes(stat)}
								style:border-color={formData.selectedStats.includes(stat) ? 'rgb(var(--color-primary-500))' : 'rgb(var(--color-border))'}
								style:background-color={formData.selectedStats.includes(stat) ? 'rgb(var(--color-primary-50))' : 'rgb(var(--color-surface))'}
								style:color={formData.selectedStats.includes(stat) ? 'rgb(var(--color-primary-700))' : 'rgb(var(--color-text-primary))'}
								disabled={!formData.selectedStats.includes(stat) && formData.selectedStats.length >= 6}
							>
								{stat}
							</button>
						{/each}
					</div>
					<p class="text-sm mt-4" style="color: rgb(var(--color-text-tertiary))">
						Selected: {formData.selectedStats.length}/6
					</p>
					<div class="flex justify-between mt-6">
						<button onclick={prevStep} class="btn btn-secondary">
							Back
						</button>
						<button 
							onclick={nextStep} 
							disabled={formData.selectedStats.length === 0}
							class="btn btn-primary"
						>
							Continue
							<ArrowRight class="h-4 w-4 ml-2" />
						</button>
					</div>
				</div>

			{:else if step === 5}
				<!-- Backstory -->
				<div>
					<h2 class="text-2xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
						Write Your Backstory
					</h2>
					<p class="mb-6" style="color: rgb(var(--color-text-secondary))">
						Tell us about your character's background, motivations, and what drives them. This helps personalize your experience.
					</p>
					<textarea 
						bind:value={formData.backstory}
						placeholder="Describe your character's background, goals, and what motivates them..."
						rows="6"
						class="w-full p-3 border rounded-lg resize-none"
						style:border-color="rgb(var(--color-border))"
						style:background-color="rgb(var(--color-surface))"
						style:color="rgb(var(--color-text-primary))"
					></textarea>
					<div class="flex justify-between mt-6">
						<button onclick={prevStep} class="btn btn-secondary">
							Back
						</button>
						<button 
							onclick={nextStep} 
							class="btn btn-primary"
						>
							Continue
							<ArrowRight class="h-4 w-4 ml-2" />
						</button>
					</div>
				</div>

			{:else if step === 6}
				<!-- Review & Create -->
				<div>
					<h2 class="text-2xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
						Review Your Character
					</h2>
					<div class="space-y-4 mb-6">
						<div>
							<h3 class="font-medium" style="color: rgb(var(--color-text-primary))">Name</h3>
							<p style="color: rgb(var(--color-text-secondary))">{formData.name}</p>
						</div>
						<div>
							<h3 class="font-medium" style="color: rgb(var(--color-text-primary))">Class</h3>
							<p style="color: rgb(var(--color-text-secondary))">{formData.characterClass}</p>
						</div>
						<div>
							<h3 class="font-medium" style="color: rgb(var(--color-text-primary))">Stats</h3>
							<div class="flex flex-wrap gap-2 mt-1">
								{#each formData.selectedStats as stat}
									<span 
										class="text-sm px-2 py-1 rounded"
										style:background-color="rgb(var(--color-primary-100))"
										style:color="rgb(var(--color-primary-700))"
									>
										{stat}
									</span>
								{/each}
							</div>
						</div>
						{#if formData.backstory}
							<div>
								<h3 class="font-medium" style="color: rgb(var(--color-text-primary))">Backstory</h3>
								<p style="color: rgb(var(--color-text-secondary))">{formData.backstory}</p>
							</div>
						{/if}
					</div>
					<div class="flex justify-between">
						<button onclick={prevStep} class="btn btn-secondary">
							Back
						</button>
						<button onclick={createCharacter} class="btn btn-primary">
							<Sparkles class="h-4 w-4 mr-2" />
							Create Character
						</button>
					</div>
				</div>
			{/if}
		</div>

	{:else}
		<!-- Character Display -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-6">
				<h1 class="text-3xl font-bold" style="color: rgb(var(--color-text-primary))">
					{character.name}
				</h1>
				<button onclick={startOver} class="btn btn-secondary">
					Create New Character
				</button>
			</div>
			
			<div class="card card-primary mb-6">
				<div class="flex items-start space-x-4">
					<div class="w-16 h-16 rounded-full flex items-center justify-center" style="background-color: rgb(var(--color-primary-100))">
						<User class="h-8 w-8" style="color: rgb(var(--color-primary-600))" />
					</div>
					<div class="flex-1">
						<h2 class="text-xl font-semibold mb-1" style="color: rgb(var(--color-text-primary))">
							{character.characterClass}
						</h2>
						{#if character.backstory}
							<p style="color: rgb(var(--color-text-secondary))">
								{character.backstory}
							</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Character Stats Dashboard -->
			<div class="mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-2xl font-semibold" style="color: rgb(var(--color-text-primary))">
						Character Stats
					</h2>
					<div class="text-sm" style="color: rgb(var(--color-text-tertiary))">
						{character.stats.filter(s => s.canLevelUp).length} stats ready to level up
					</div>
				</div>
				
				<!-- Stats Overview Cards -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
					{#each character.stats as stat}
						<StatCard
							name={stat.name}
							level={stat.level}
							currentXP={stat.currentXP}
							totalXP={stat.totalXP}
							nextLevelXP={stat.nextLevelXP}
							title={stat.title}
							canLevelUp={stat.canLevelUp}
							onLevelUp={() => handleLevelUp(stat.name)}
						/>
					{/each}
				</div>
			</div>

			<!-- Sample Activities Guide -->
			<div class="card">
				<h3 class="text-lg font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
					💡 Sample Activities & XP Guide
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h4 class="font-medium mb-2" style="color: rgb(var(--color-success-600))">
							🏃 Physical Health & Adventure
						</h4>
						<ul class="text-sm space-y-1" style="color: rgb(var(--color-text-secondary))">
							<li>• Morning walk/jog: 15-25 XP</li>
							<li>• Hiking new trail: 50-75 XP</li>
							<li>• Rock climbing session: 60-80 XP</li>
							<li>• Outdoor photography: 30-40 XP</li>
							<li>• Bike ride exploration: 40-60 XP</li>
						</ul>
					</div>
					<div>
						<h4 class="font-medium mb-2" style="color: rgb(var(--color-info-600))">
							🧠 Mental Health & Learning
						</h4>
						<ul class="text-sm space-y-1" style="color: rgb(var(--color-text-secondary))">
							<li>• Read for 30 minutes: 20-30 XP</li>
							<li>• Complete online course: 75-100 XP</li>
							<li>• Meditation session: 15-25 XP</li>
							<li>• Learn new skill: 50-80 XP</li>
							<li>• Journaling reflection: 20-35 XP</li>
						</ul>
					</div>
					<div>
						<h4 class="font-medium mb-2" style="color: rgb(var(--color-danger-600))">
							👨‍👩‍👧‍👦 Family Time & Social
						</h4>
						<ul class="text-sm space-y-1" style="color: rgb(var(--color-text-secondary))">
							<li>• Family game night: 40-60 XP</li>
							<li>• One-on-one time with child: 35-50 XP</li>
							<li>• Date night activity: 45-65 XP</li>
							<li>• Community volunteering: 50-75 XP</li>
							<li>• Call distant relative: 20-30 XP</li>
						</ul>
					</div>
					<div>
						<h4 class="font-medium mb-2" style="color: rgb(var(--color-warning-600))">
							🎨 Creativity & Personal Development
						</h4>
						<ul class="text-sm space-y-1" style="color: rgb(var(--color-text-secondary))">
							<li>• Art/craft project: 30-50 XP</li>
							<li>• Write in creative journal: 25-40 XP</li>
							<li>• Music practice: 20-35 XP</li>
							<li>• Home improvement project: 40-70 XP</li>
							<li>• Try new recipe: 25-40 XP</li>
						</ul>
					</div>
				</div>
				<div class="mt-4 p-3 rounded-lg" style="background-color: rgb(var(--color-info-50))">
					<p class="text-sm" style="color: rgb(var(--color-info-700))">
						<strong>XP Tips:</strong> Difficulty, duration, and stepping outside your comfort zone increase XP rewards. 
						The AI Dungeon Master will adjust XP based on your personal growth and effort!
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
