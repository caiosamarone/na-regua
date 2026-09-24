import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';

import { TabBarContainer, TabButton } from '@/components/ui/tab-bar';

export default function CustomerTabsLayout() {
  return (
    <Tabs>
      <TabSlot />
      <TabList style={{ display: 'none' }}>
        <TabTrigger name="explore" href="/explore" />
        <TabTrigger name="bookings" href="/bookings" />
      </TabList>
      <TabBarContainer>
        <TabTrigger name="explore" asChild>
          <TabButton label="Explorar" />
        </TabTrigger>
        <TabTrigger name="bookings" asChild>
          <TabButton label="Agendamentos" />
        </TabTrigger>
      </TabBarContainer>
    </Tabs>
  );
}
