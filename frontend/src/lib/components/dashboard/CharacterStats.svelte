<!-- Task 5.3: CharacterStats component displaying XP and level progression -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '../../api/client';
	import DashboardCard from './DashboardCard.svelte';
	import type { characters, characterStats } from '../../../../../backend/src/db/schema';
	
	// Types
	type Character = typeof characters.$inferSelect;
	type CharacterStat = typeof characterStats.$inferSelect;
	
	interface StatDisplay extends CharacterStat {
		level: number;
		xpInLevel: number;
		xpToNextLevel: number;
		progressPercentage: number;
		levelDescription: string;
	}

	// State using Svelte 5 runes
	let character = $state<Character | null>(null);
	let stats = $state<StatDisplay[]>([]);
	let isLoading = $state(true);
	let error = $state<string>('');
	let focusedStat = $state<StatDisplay | null>(null);

	// Calculate level and progress from XP (standard D&D progression)
	function calculateLevel(xp: number): { level: number; xpInLevel: number; xpToNextLevel: number } {
		// Simple level progression: each level requires 100 * level XP
		let totalXpNeeded = 0;
		let level = 1;
		
		while (totalXpNeeded + (level * 100) <= xp) {
			totalXpNeeded += level * 100;
			level++;
		}
		
		const xpInLevel = xp - totalXpNeeded;
		const xpToNextLevel = (level * 100) - xpInLevel;
		
		return { level, xpInLevel, xpToNextLevel };
	}

	// Get level description based on level
	function getLevelDescription(level: number, category: string): string {
		if (level >= 10) return `${category} Master - Legendary status achieved!`;
		if (level >= 7) return `${category} Expert - You're excelling!`;
		if (level >= 4) return `${category} Apprentice - Making great progress!`;
		if (level >= 2) return `${category} Novice - Building momentum!`;
		return `${category} Beginner - Just getting started!`;
	}

	// Load character and stats on mount
	onMount(async () => {
		try {
			isLoading = true;
			error = '';
			
			// Get characters first
			const charactersResponse = await api.getCharacters();
			
			if (charactersResponse.success && charactersResponse.data && charactersResponse.data.length > 0) {
				character = charactersResponse.data.find(c => c.isActive) || charactersResponse.data[0] || null;
				
				if (character) {
					// Get character stats
					const statsResponse = await api.getCharacterStats(character.id);
					
					if (statsResponse.success && statsResponse.data) {
						stats = statsResponse.data.map(stat => {
							const levelInfo = calculateLevel(stat.currentXp);
							const progressPercentage = Math.round((levelInfo.xpInLevel / (levelInfo.level * 100)) * 100);
							
							return {
								...stat,
								...levelInfo,
								progressPercentage,
								levelDescription: getLevelDescription(levelInfo.level, stat.category)
							};
						});
						
						// Set the highest level stat as focused by default
						focusedStat = stats.reduce((highest, current) => 
							current.level > (highest?.level || 0) ? current : highest, 
							stats[0] || null
						);
					}
				}
			} else {
				error = charactersResponse.error || 'No character found';
			}
		} catch (err) {
			console.error('Error loading character stats:', err);
			error = 'Failed to load character stats';
		} finally {
			isLoading = false;
		}
	});

	// Get card status based on overall progress
	let cardStatus = $derived(() => {
		if (!focusedStat) return 'neutral';
		if (focusedStat.level >= 5) return 'completed';
		if (focusedStat.level >= 3) return 'active';
		return 'pending';
	});
</script>

<DashboardCard title="Stat Focus" status={cardStatus()} class="character-stats">
	{#if isLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Loading character stats...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-message">{error}</p>
			<button onclick={() => window.location.reload()} class="retry-button">
				Try Again
			</button>
		</div>
	{:else if !character || stats.length === 0}
		<div class="empty-state">
			<p>No character stats available.</p>
			<a href="/character" class="create-link">Create your character →</a>
		</div>
	{:else}
		<div class="character-stats-content">
			{#if focusedStat}
				<!-- Focused Stat Display -->
				<div class="focused-stat">
					<div class="stat-header">
						<h3 class="stat-name">{focusedStat.category}</h3>
						<div class="level-badge">Level {focusedStat.level}</div>
					</div>
					
					<p class="stat-description">{focusedStat.levelDescription}</p>
					
					<!-- XP Progress -->
					<div class="xp-progress">
						<div class="xp-numbers">
							<span class="current-xp">XP</span>
							<span class="xp-values">{focusedStat.xpInLevel} / {focusedStat.level * 100}</span>
						</div>
						
						<div class="progress-bar">
							<div 
								class="progress-fill" 
								style="width: {focusedStat.progressPercentage}%"
							></div>
						</div>
						
						<p class="xp-to-next">"{focusedStat.levelDescription}"</p>
					</div>
					
					<a href="/stats/{focusedStat.id}" class="view-details-link">
						View Details →
					</a>
				</div>
			{/if}

			<!-- All Stats Overview -->
			{#if stats.length > 1}
				<div class="all-stats">
					<h4 class="all-stats-title">Your Stats</h4>
					<div class="stats-grid">
						{#each stats as stat (stat.id)}
							<button 
								class="stat-card" 
								class:focused={focusedStat?.id === stat.id}
								onclick={() => focusedStat = stat}
							>
								<div class="stat-card-header">
									<span class="stat-card-name">{stat.category}</span>
									<span class="stat-card-level">Level {stat.level}</span>
								</div>
								
								<div class="stat-card-description">
									{stat.description || 'Building your skills in this area'}
								</div>
								
								<div class="stat-card-progress">
									<div class="mini-progress-bar">
										<div 
											class="mini-progress-fill" 
											style="width: {stat.progressPercentage}%"
										></div>
									</div>
									<span class="stat-card-xp">XP{stat.xpInLevel} / {stat.level * 100}</span>
								</div>
							</button>
						{/each}
					</div>
					
					<a href="/stats" class="view-all-stats-link">View All →</a>
				</div>
			{/if}
		</div>
	{/if}
</DashboardCard>

<style>
	.loading-state,
	.error-state,
	.empty-state {
		text-align: center;
		padding: 2rem 0;
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid var(--color-base-300, #d1d5db);
		border-top: 2px solid var(--color-primary, #3b82f6);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-message {
		color: var(--color-error, #ef4444);
		margin-bottom: 1rem;
	}

	.retry-button,
	.create-link {
		background: var(--color-primary, #3b82f6);
		color: var(--color-primary-content, #ffffff);
		border: none;
		border-radius: 0.375rem;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-weight: 500;
		text-decoration: none;
		display: inline-block;
		transition: background-color 0.15s ease-in-out;
	}

	.retry-button:hover,
	.create-link:hover {
		background: var(--color-primary-focus, #2563eb);
	}

	.character-stats-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.focused-stat {
		text-align: center;
	}

	.stat-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.stat-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-base-content, #1f2937);
		margin: 0;
	}

	.level-badge {
		background: var(--color-primary, #3b82f6);
		color: var(--color-primary-content, #ffffff);
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
	}

	.stat-description {
		color: var(--color-base-content-secondary, #6b7280);
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
		line-height: 1.4;
	}

	.xp-progress {
		margin-bottom: 1rem;
	}

	.xp-numbers {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.current-xp {
		font-size: 0.875rem;
		color: var(--color-base-content-secondary, #6b7280);
	}

	.xp-values {
		font-size: 1.125rem;
		color: var(--color-base-content, #1f2937);
	}

	.progress-bar {
		width: 100%;
		height: 0.75rem;
		background: var(--color-base-200, #e5e7eb);
		border-radius: 9999px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary, #3b82f6), var(--color-secondary, #8b5cf6));
		border-radius: 9999px;
		transition: width 0.3s ease-in-out;
	}

	.xp-to-next {
		font-size: 0.75rem;
		color: var(--color-base-content-secondary, #6b7280);
		margin: 0;
		font-style: italic;
	}

	.view-details-link {
		color: var(--color-primary, #3b82f6);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
		transition: color 0.15s ease-in-out;
	}

	.view-details-link:hover {
		color: var(--color-primary-focus, #2563eb);
		text-decoration: underline;
	}

	.all-stats-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-base-content, #1f2937);
		margin: 0 0 0.75rem 0;
		text-align: left;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.stat-card {
		background: var(--color-base-50, #f9fafb);
		border: 1px solid var(--color-base-200, #e5e7eb);
		border-radius: 0.5rem;
		padding: 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease-in-out;
		width: 100%;
	}

	.stat-card:hover {
		background: var(--color-base-100, #f3f4f6);
		border-color: var(--color-primary, #3b82f6);
	}

	.stat-card.focused {
		background: var(--color-primary-content, #eff6ff);
		border-color: var(--color-primary, #3b82f6);
		border-width: 2px;
	}

	.stat-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.stat-card-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-base-content, #1f2937);
	}

	.stat-card-level {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary, #3b82f6);
	}

	.stat-card-description {
		font-size: 0.75rem;
		color: var(--color-base-content-secondary, #6b7280);
		margin-bottom: 0.5rem;
		line-height: 1.3;
	}

	.stat-card-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mini-progress-bar {
		flex: 1;
		height: 0.25rem;
		background: var(--color-base-200, #e5e7eb);
		border-radius: 9999px;
		overflow: hidden;
	}

	.mini-progress-fill {
		height: 100%;
		background: var(--color-primary, #3b82f6);
		border-radius: 9999px;
		transition: width 0.3s ease-in-out;
	}

	.stat-card-xp {
		font-size: 0.625rem;
		color: var(--color-base-content-secondary, #6b7280);
		white-space: nowrap;
	}

	.view-all-stats-link {
		color: var(--color-primary, #3b82f6);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
		text-align: center;
		display: block;
		transition: color 0.15s ease-in-out;
	}

	.view-all-stats-link:hover {
		color: var(--color-primary-focus, #2563eb);
		text-decoration: underline;
	}

	/* Mobile optimizations */
	@media (max-width: 767px) {
		.stat-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-card {
			min-height: 44px; /* iOS touch target */
		}
	}

	@media (min-width: 768px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
