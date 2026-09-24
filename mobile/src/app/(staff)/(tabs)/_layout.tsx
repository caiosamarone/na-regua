import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';

import { TabBarContainer, TabButton } from '@/components/ui/tab-bar';
import { useStaffSession } from '@/lib/auth';

// The role comes from the API (POST /auth/login) and decides which tabs exist.
const BARBER_TABS = [
  { name: 'agenda', href: '/agenda', label: 'Agenda' },
  { name: 'earnings', href: '/earnings', label: 'Faturamento' },
] as const;

const ADMIN_TABS = [
  { name: 'dashboard', href: '/dashboard', label: 'Painel' },
  { name: 'agenda', href: '/agenda', label: 'Agenda' },
  { name: 'team', href: '/team', label: 'Equipe' },
  { name: 'services', href: '/services', label: 'Serviços' },
  { name: 'hours', href: '/hours', label: 'Horários' },
] as const;

export default function StaffTabsLayout() {
  const user = useStaffSession();
  const tabs = user.role === 'BARBER' ? BARBER_TABS : ADMIN_TABS;

  return (
    <Tabs>
      <TabSlot />
      <TabList style={{ display: 'none' }}>
        {tabs.map((t) => (
          <TabTrigger key={t.name} name={t.name} href={t.href} />
        ))}
      </TabList>
      <TabBarContainer>
        {tabs.map((t) => (
          <TabTrigger key={t.name} name={t.name} asChild>
            <TabButton label={t.label} />
          </TabTrigger>
        ))}
      </TabBarContainer>
    </Tabs>
  );
}
