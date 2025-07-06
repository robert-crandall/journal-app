import { marked } from 'marked';

/**
 * Configure marked with sensible defaults for the application
 */
export function configureMarked() {
  marked.setOptions({
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
  });
}

/**
 * Safely parse markdown content
 */
export function parseMarkdown(content: string): string {
  if (!content?.trim()) return '';

  try {
    const result = marked.parse(content);
    return typeof result === 'string' ? result : '';
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return content; // Fallback to raw content
  }
}

/**
 * Strip markdown formatting and return plain text
 */
export function stripMarkdown(content: string): string {
  if (!content?.trim()) return '';

  return content
    .replace(/#+\s/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/^[-*+]\s/gm, '') // Remove list markers
    .replace(/^\d+\.\s/gm, '') // Remove numbered list markers
    .replace(/\n{2,}/g, '\n') // Multiple newlines to single
    .trim();
}

/**
 * Truncate markdown content to a specific length, preserving word boundaries
 */
export function truncateMarkdown(content: string, maxLength: number = 150): string {
  const plainText = stripMarkdown(content);

  if (plainText.length <= maxLength) return plainText;

  const truncated = plainText.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}
