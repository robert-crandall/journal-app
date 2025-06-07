// Frontend-only Focus Library with suggested focuses
export interface FocusTemplate {
	name: string;
	description: string;
	suggested_day: string;
	icon_id: string;
	suggested_stat: string;
	sample_activities: string[];
}

export const FOCUS_LIBRARY: FocusTemplate[] = [
	{
		name: 'Anchor',
		description: 'Begin the week grounded in movement and emotional clarity',
		suggested_day: 'Monday',
		icon_id: 'anchor',
		suggested_stat: 'Vitality',
		sample_activities: ['Morning walk or run', 'Breathing exercises', 'Stretching routine', 'Cold shower']
	},
	{
		name: 'Creative Fire',
		description: 'Build or express something uniquely yours',
		suggested_day: 'Tuesday',
		icon_id: 'paintbrush',
		suggested_stat: 'Intellect',
		sample_activities: ['Writing or journaling', 'Art or music creation', 'Problem-solving project', 'Learning new skill']
	},
	{
		name: 'Reset',
		description: 'Get into nature, unplug, breathe — let the nervous system soften',
		suggested_day: 'Wednesday',
		icon_id: 'wind',
		suggested_stat: 'Stillness',
		sample_activities: ['Nature walk', 'Meditation', 'Digital detox time', 'Gentle yoga']
	},
	{
		name: 'Bridge',
		description: 'Deepen a connection with someone you care about (or with yourself)',
		suggested_day: 'Thursday',
		icon_id: 'handshake',
		suggested_stat: 'Presence',
		sample_activities: ['Quality time with loved ones', 'Deep conversation', 'Active listening practice', 'Self-reflection']
	},
	{
		name: 'Power',
		description: 'Channel energy into physical intensity and embodied release',
		suggested_day: 'Friday',
		icon_id: 'bolt',
		suggested_stat: 'Strength',
		sample_activities: ['Intense workout', 'Martial arts', 'Heavy lifting', 'Dance or movement']
	},
	{
		name: 'Forge',
		description: 'Fix, tinker, or build something real with your hands (and maybe your kids)',
		suggested_day: 'Saturday',
		icon_id: 'hammer',
		suggested_stat: 'Stewardship',
		sample_activities: ['Home improvement', 'Crafting project', 'Gardening', 'Repair something broken']
	},
	{
		name: 'Mirror',
		description: 'Reflect, journal, visualize — prepare emotionally for what\'s next',
		suggested_day: 'Sunday',
		icon_id: 'mirror',
		suggested_stat: 'Clarity',
		sample_activities: ['Weekly review', 'Goal setting', 'Visualization', 'Journaling session']
	}
];

// Additional suggested focuses for variety
export const EXTENDED_FOCUS_LIBRARY: FocusTemplate[] = [
	...FOCUS_LIBRARY,
	{
		name: 'Flow',
		description: 'Enter a state of deep focus and lose yourself in meaningful work',
		suggested_day: 'Monday',
		icon_id: 'zap',
		suggested_stat: 'Focus',
		sample_activities: ['Deep work session', 'Coding project', 'Writing marathon', 'Skill practice']
	},
	{
		name: 'Explore',
		description: 'Discover something new and expand your horizons',
		suggested_day: 'Tuesday',
		icon_id: 'compass',
		suggested_stat: 'Curiosity',
		sample_activities: ['Visit new place', 'Try new cuisine', 'Learn new topic', 'Meet new people']
	},
	{
		name: 'Nurture',
		description: 'Care for yourself, others, or your environment with gentle attention',
		suggested_day: 'Wednesday',
		icon_id: 'heart',
		suggested_stat: 'Compassion',
		sample_activities: ['Self-care routine', 'Help a friend', 'Tend to plants', 'Cook nourishing meal']
	},
	{
		name: 'Adventure',
		description: 'Step outside your comfort zone and embrace the unknown',
		suggested_day: 'Thursday',
		icon_id: 'mountain',
		suggested_stat: 'Courage',
		sample_activities: ['Try new activity', 'Take calculated risk', 'Explore outdoors', 'Challenge yourself']
	},
	{
		name: 'Celebrate',
		description: 'Acknowledge progress, express gratitude, and find joy in the moment',
		suggested_day: 'Friday',
		icon_id: 'sun',
		suggested_stat: 'Joy',
		sample_activities: ['Acknowledge wins', 'Express gratitude', 'Celebrate with others', 'Dance or play']
	},
	{
		name: 'Restore',
		description: 'Rest deeply and allow your mind and body to recuperate',
		suggested_day: 'Saturday',
		icon_id: 'moon',
		suggested_stat: 'Rest',
		sample_activities: ['Quality sleep', 'Gentle stretching', 'Relaxing bath', 'Mindful breathing']
	},
	{
		name: 'Connect',
		description: 'Strengthen bonds with family, friends, community, or spiritual practice',
		suggested_day: 'Sunday',
		icon_id: 'users',
		suggested_stat: 'Connection',
		sample_activities: ['Family time', 'Friend meetup', 'Community service', 'Spiritual practice']
	}
];

// Helper function to get a focus template by name
export function getFocusTemplate(name: string): FocusTemplate | undefined {
	for (const template of EXTENDED_FOCUS_LIBRARY) {
		if (template.name === name) {
			return template;
		}
	}
	return undefined;
}

// Helper function to get all unique suggested stats
export function getSuggestedStats(): string[] {
	const stats: string[] = [];
	const seen: { [key: string]: boolean } = {};
	
	for (const focus of EXTENDED_FOCUS_LIBRARY) {
		if (!seen[focus.suggested_stat]) {
			stats.push(focus.suggested_stat);
			seen[focus.suggested_stat] = true;
		}
	}
	
	return stats;
}

// Helper function to get focus templates by suggested day
export function getFocusTemplatesByDay(day: string): FocusTemplate[] {
	const templates: FocusTemplate[] = [];
	
	for (const template of EXTENDED_FOCUS_LIBRARY) {
		if (template.suggested_day === day) {
			templates.push(template);
		}
	}
	
	return templates;
}