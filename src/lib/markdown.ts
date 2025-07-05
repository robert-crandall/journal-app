import { marked } from 'marked';

// Configure marked for security
marked.setOptions({
	breaks: true, // Convert line breaks to <br>
	gfm: true // Enable GitHub Flavored Markdown
});

// Simple sanitization - remove potentially dangerous HTML tags
function sanitizeHtml(html: string): string {
	// Remove script tags and their content
	html = html.replace(/<script[^>]*>.*?<\/script>/gi, '');

	// Remove dangerous attributes
	html = html.replace(/\s(on\w+)="[^"]*"/gi, '');
	html = html.replace(/\s(on\w+)='[^']*'/gi, '');

	// Remove javascript: links
	html = html.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

	return html;
}

/**
 * Convert markdown to safe HTML
 */
export function markdownToHtml(markdown: string): string {
	if (!markdown || typeof markdown !== 'string') {
		return '';
	}

	try {
		const html = marked(markdown) as string;
		return sanitizeHtml(html);
	} catch (error) {
		console.error('Failed to parse markdown:', error);
		// Return escaped text as fallback
		return escapeHtml(markdown);
	}
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Extract plain text from markdown for previews
 */
export function markdownToPlainText(markdown: string, maxLength = 150): string {
	if (!markdown || typeof markdown !== 'string') {
		return '';
	}

	// Remove markdown syntax
	let text = markdown
		.replace(/^#{1,6}\s+/gm, '') // Remove headers
		.replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
		.replace(/\*([^*]+)\*/g, '$1') // Remove italic
		.replace(/`([^`]+)`/g, '$1') // Remove inline code
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
		.replace(/^>\s+/gm, '') // Remove blockquotes
		.replace(/^[-*+]\s+/gm, '') // Remove list items
		.replace(/^\d+\.\s+/gm, '') // Remove numbered lists
		.trim();

	if (text.length > maxLength) {
		text = text.substring(0, maxLength) + '...';
	}

	return text;
}
