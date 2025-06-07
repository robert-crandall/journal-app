import { auth } from '$lib/stores/auth';

const API_BASE = '/api';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
	const url = `${API_BASE}${endpoint}`;
	
	const config: RequestInit = {
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		...options
	};
	
	const response = await fetch(url, config);
	
	if (response.status === 401) {
		// User is unauthorized, redirect to login
		auth.logout();
		throw new Error('Unauthorized');
	}
	
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
		throw new Error(errorData.error || 'Request failed');
	}
	
	return response.json();
}

// Tasks API
export const tasksApi = {
	async getAll() {
		return apiRequest('/tasks');
	},
	
	async getDailyTasks() {
		return apiRequest('/tasks/daily');
	},
	
	async create(task: { 
		title: string; 
		description?: string; 
		dueDate?: string; 
		taskDate?: string;
		source?: 'primary' | 'connection';
		linkedStatIds?: string[];
		linkedFamilyMemberIds?: string[];
		focusId?: string; 
		statId?: string; 
		familyMemberId?: string 
	}) {
		return apiRequest('/tasks', {
			method: 'POST',
			body: JSON.stringify(task)
		});
	},
	
	async update(id: string, task: { 
		title: string; 
		description?: string; 
		dueDate?: string; 
		taskDate?: string;
		source?: 'primary' | 'connection';
		linkedStatIds?: string[];
		linkedFamilyMemberIds?: string[];
		focusId?: string; 
		statId?: string; 
		familyMemberId?: string 
	}) {
		return apiRequest(`/tasks/${id}`, {
			method: 'PUT',
			body: JSON.stringify(task)
		});
	},
	
	async complete(id: string, options?: { 
		status: 'complete' | 'skipped' | 'failed';
		completionSummary?: string;
		feedback?: string;
		emotionTag?: string;
		moodScore?: number;
	}) {
		return apiRequest(`/tasks/${id}/complete`, {
			method: 'POST',
			body: JSON.stringify(options || { status: 'complete' })
		});
	},
	
	async delete(id: string) {
		return apiRequest(`/tasks/${id}`, {
			method: 'DELETE'
		});
	}
};

// Focuses API
export const focusesApi = {
	async getAll() {
		return apiRequest('/focuses');
	},
	
	async create(focus: { name: string; description?: string; icon?: string; color?: string; dayOfWeek?: string; sampleActivities?: string[]; statId?: string; gptContext?: any }) {
		return apiRequest('/focuses', {
			method: 'POST',
			body: JSON.stringify(focus)
		});
	},
	
	async update(id: string, focus: { name: string; description?: string; icon?: string; color?: string; dayOfWeek?: string; sampleActivities?: string[]; statId?: string; gptContext?: any }) {
		return apiRequest(`/focuses/${id}`, {
			method: 'PUT',
			body: JSON.stringify(focus)
		});
	},
	
	async delete(id: string) {
		return apiRequest(`/focuses/${id}`, {
			method: 'DELETE'
		});
	},
	
	async createLevel(focusId: string, level: { name: string; description?: string }) {
		return apiRequest(`/focuses/${focusId}/levels`, {
			method: 'POST',
			body: JSON.stringify(level)
		});
	}
};

// Family API
export const familyApi = {
	async getAll() {
		return apiRequest('/family');
	},
	
	async create(member: { name: string; className?: string; classDescription?: string }) {
		return apiRequest('/family', {
			method: 'POST',
			body: JSON.stringify(member)
		});
	},
	
	async update(id: string, member: { name: string; className?: string; classDescription?: string }) {
		return apiRequest(`/family/${id}`, {
			method: 'PUT',
			body: JSON.stringify(member)
		});
	},
	
	async delete(id: string) {
		return apiRequest(`/family/${id}`, {
			method: 'DELETE'
		});
	},
	
	async addAttribute(id: string, attribute: { key: string; value: string }) {
		return apiRequest(`/family/${id}/attributes`, {
			method: 'POST',
			body: JSON.stringify(attribute)
		});
	}
};

// Journals API
export const journalsApi = {
	async getAll() {
		return apiRequest('/journals');
	},
	
	async create(journal: { content: string; date?: string }) {
		return apiRequest('/journals', {
			method: 'POST',
			body: JSON.stringify(journal)
		});
	},
	
	async update(id: string, journal: { content: string; date?: string }) {
		return apiRequest(`/journals/${id}`, {
			method: 'PUT',
			body: JSON.stringify(journal)
		});
	},
	
	async delete(id: string) {
		return apiRequest(`/journals/${id}`, {
			method: 'DELETE'
		});
	},

	// GPT-powered journal endpoints
	async start(journal: { content: string; date?: string }) {
		return apiRequest('/journals/start', {
			method: 'POST',
			body: JSON.stringify(journal)
		});
	},

	async getFollowup(id: string) {
		return apiRequest(`/journals/${id}/followup`);
	},

	async addFollowupResponse(id: string, response: string) {
		return apiRequest(`/journals/${id}/followup`, {
			method: 'POST',
			body: JSON.stringify({ response })
		});
	},

	async submit(id: string) {
		return apiRequest(`/journals/${id}/submit`, {
			method: 'POST'
		});
	},

	async get(id: string) {
		return apiRequest(`/journals/${id}`);
	}
};

// Potions API
export const potionsApi = {
	async getAll() {
		return apiRequest('/potions');
	},
	
	async create(potion: { title: string; hypothesis?: string; startDate: string; endDate?: string }) {
		return apiRequest('/potions', {
			method: 'POST',
			body: JSON.stringify(potion)
		});
	},
	
	async update(id: string, potion: { title: string; hypothesis?: string; startDate: string; endDate?: string }) {
		return apiRequest(`/potions/${id}`, {
			method: 'PUT',
			body: JSON.stringify(potion)
		});
	},
	
	async end(id: string) {
		return apiRequest(`/potions/${id}/end`, {
			method: 'POST'
		});
	},
	
	async delete(id: string) {
		return apiRequest(`/potions/${id}`, {
			method: 'DELETE'
		});
	},
	
	async analyze(id: string) {
		return apiRequest(`/potions/${id}/analyze`, {
			method: 'POST'
		});
	},
	
	async getAnalysis(id: string) {
		return apiRequest(`/potions/${id}/analysis`);
	},
	
	async analyzeAll() {
		return apiRequest('/potions/analyze-all', {
			method: 'POST'
		});
	}
};

// Stats API
export const statsApi = {
	async getAll() {
		return apiRequest('/stats');
	},
	
	async get(id: string) {
		return apiRequest(`/stats/${id}`);
	},
	
	async create(stat: { name: string; description?: string; icon?: string; color?: string; category?: string; enabled?: boolean }) {
		return apiRequest('/stats', {
			method: 'POST',
			body: JSON.stringify(stat)
		});
	},
	
	async update(id: string, stat: { name?: string; description?: string; icon?: string; color?: string; category?: string; enabled?: boolean; xp?: number; level?: number }) {
		return apiRequest(`/stats/${id}`, {
			method: 'PUT',
			body: JSON.stringify(stat)
		});
	},
	
	async increment(id: string, amount = 1) {
		return apiRequest(`/stats/${id}/increment`, {
			method: 'POST',
			body: JSON.stringify({ amount })
		});
	},
	
	async addXp(id: string, amount = 25) {
		return apiRequest(`/stats/${id}/add-xp`, {
			method: 'POST',
			body: JSON.stringify({ amount })
		});
	},
	
	async levelUp(id: string) {
		return apiRequest(`/stats/${id}/level-up`, {
			method: 'POST'
		});
	},
	
	async delete(id: string) {
		return apiRequest(`/stats/${id}`, {
			method: 'DELETE'
		});
	},
	
	async restoreDefaults() {
		return apiRequest('/stats/restore-defaults', {
			method: 'POST'
		});
	}
};

// Preferences API
export const preferencesApi = {
	async getAll() {
		return apiRequest('/preferences');
	},
	
	async set(key: string, value: string) {
		return apiRequest(`/preferences/${key}`, {
			method: 'PUT',
			body: JSON.stringify({ value })
		});
	},
	
	async setMultiple(preferences: Record<string, string>) {
		return apiRequest('/preferences', {
			method: 'PUT',
			body: JSON.stringify({ preferences })
		});
	},
	
	async delete(key: string) {
		return apiRequest(`/preferences/${key}`, {
			method: 'DELETE'
		});
	}
};

// User API
export const userApi = {
	async getMe() {
		return apiRequest('/auth/me');
	},
	
	async updateProfile(data: { name?: string; className?: string; classDescription?: string }) {
		return apiRequest('/auth/me', {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	},
	
	async addAttribute(attribute: { key: string; value: string }) {
		return apiRequest('/auth/me/attributes', {
			method: 'POST',
			body: JSON.stringify(attribute)
		});
	}
};
