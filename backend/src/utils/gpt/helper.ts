/**
 * Remove code block formatting and parse JSON safely from GPT responses
 */
export function parseJsonResponse(content: string): any {
  let trimmed = content.trim();
  if (trimmed.startsWith('```json')) {
    trimmed = trimmed.replace(/```json/, '').replace(/```/, '').trim();
  } else if (trimmed.startsWith('```')) {
    trimmed = trimmed.replace(/```/, '').replace(/```/, '').trim();
  }
  return JSON.parse(trimmed);
}
