export interface ConversationMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

export interface JournalEntryWithTags {
	id: string;
	userId: string;
	title: string | null;
	synopsis: string | null;
	summary: string | null;
	conversationData: ConversationMessage[];
	isProcessed: boolean;
	createdAt: Date;
	updatedAt: Date;
	contentTags: { id: string; name: string }[];
	toneTags: { id: string; name: string }[];
	characterTags: { id: string; name: string; xpGained: number }[];
	experiments: { id: string; title: string }[];
}

export interface Experiment {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	startDate: Date | string;
	endDate: Date | string;
	isActive: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface ExperimentWithTasks extends Experiment {
	tasks: ExperimentTaskWithCompletions[];
}

export interface ExperimentTaskWithCompletions {
	id: string;
	experimentId: string;
	title: string;
	description: string | null;
	targetCompletions: number;
	xpRewards: Record<string, number>;
	createdAt: Date;
	completions: TaskCompletionData[];
}

export interface TaskCompletionData {
	id: string;
	taskId: string;
	userId: string;
	completedAt: Date;
}

export interface CharacterStat {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	currentXp: number;
	createdAt: Date | string;
	updatedAt: Date | string;
	level: number;
	progress: number;
	xpToNextLevel: number;
}

export interface CharacterStatWithProgress extends CharacterStat {
	journalEntries?: {
		id: string;
		title: string | null;
		createdAt: Date | string;
		xpGained: number;
	}[];
}

export interface GPTProcessingResult {
	title: string;
	synopsis: string;
	summary: string;
	contentTags: string[];
	toneTags: string[];
	characterTags: string[];
}
