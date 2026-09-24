import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';

/** Entry point: sends each kind of user to their home screen. */
export default function Index() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/login" />;
  if (session.kind === 'customer') return <Redirect href="/explore" />;
  return <Redirect href={session.user.role === 'BARBER' ? '/agenda' : '/dashboard'} />;
}
