import { db } from '../db';
import { simpleTodos } from '../db/schema/todos';
import { add } from 'date-fns';

/**
 * Creates a todo with an expiration time
 * @param userId User ID to associate the todo with
 * @param description Description of the todo
 * @param expirationHours Number of hours until the todo expires (default: 24)
 * @param source Optional source information (e.g., 'journal', 'gpt')
 * @returns The created todo's ID
 */
export async function createTodoWithExpiration(userId: string, description: string, expirationHours = 24, source?: string): Promise<string> {
  try {
    // Calculate expiration time
    const expirationTime = add(new Date(), { hours: expirationHours });

    // Insert the todo with expiration time
    const [newTodo] = await db
      .insert(simpleTodos)
      .values({
        userId,
        description: `${description}${source ? ` [from ${source}]` : ''}`,
        expirationTime,
      })
      .returning({
        id: simpleTodos.id,
      });

    return newTodo.id;
  } catch (error) {
    console.error('Failed to create todo with expiration:', error);
    throw new Error('Failed to create todo with expiration');
  }
}

/**
 * Creates multiple todos with expiration time
 * @param userId User ID to associate the todos with
 * @param descriptions Array of todo descriptions
 * @param expirationHours Number of hours until the todos expire (default: 24)
 * @param source Optional source information (e.g., 'journal', 'gpt')
 * @returns Array of created todo IDs
 */
export async function createTodosWithExpiration(userId: string, descriptions: string[], expirationHours = 24, source?: string): Promise<string[]> {
  if (!descriptions || descriptions.length === 0) {
    return [];
  }

  try {
    const todoIds: string[] = [];

    // Calculate expiration time - same for all todos in batch
    const expirationTime = add(new Date(), { hours: expirationHours });

    // Process each todo description
    for (const description of descriptions) {
      if (description && description.trim()) {
        // Insert the todo with expiration time
        const [newTodo] = await db
          .insert(simpleTodos)
          .values({
            userId,
            description: `${description.trim()}${source ? ` [from ${source}]` : ''}`,
            expirationTime,
          })
          .returning({
            id: simpleTodos.id,
          });

        todoIds.push(newTodo.id);
      }
    }

    return todoIds;
  } catch (error) {
    console.error('Failed to create todos with expiration:', error);
    throw new Error('Failed to create todos with expiration');
  }
}
