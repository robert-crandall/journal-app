'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { lucia } from '@/lib/auth';

export async function logoutAction() {
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
  
  if (sessionId) {
    await lucia.invalidateSession(sessionId);
    const sessionCookie = lucia.createBlankSessionCookie();
    (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }
  
  redirect('/login');
}

export async function setSessionCookie(sessionId: string) {
  const sessionCookie = lucia.createSessionCookie(sessionId);
  (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
}
