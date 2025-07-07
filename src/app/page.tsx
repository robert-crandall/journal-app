import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth-utils';

export default async function HomePage() {
  const { user } = await validateRequest();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
