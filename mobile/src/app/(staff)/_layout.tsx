import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function StaffLayout() {
  const { session } = useAuth();
  // On sign-out the session clears a render before the root guard unmounts this group;
  // stop here so screens relying on useStaffSession never render without a staff session.
  if (session?.kind !== 'staff') return null;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }} />;
}
