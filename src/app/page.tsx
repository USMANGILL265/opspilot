import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME } from '@/lib/auth';

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);

  if (session?.value) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
