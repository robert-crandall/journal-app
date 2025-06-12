import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { session } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ cookies, locals }: RequestEvent) {
  try {
    const sessionId = cookies.get('session');
    
    // Skip if no session
    if (!sessionId) {
      return json({ success: true });
    }

    // Delete session from database
    await db.delete(session).where(eq(session.id, sessionId));
    
    // Delete session cookie
    cookies.delete('session', { path: '/' });

    return json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    return json({ error: 'Failed to logout' }, { status: 500 });
  }
}
