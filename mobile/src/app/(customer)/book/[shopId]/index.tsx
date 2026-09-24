import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { NextSlotText } from '@/components/booking/next-slot-text';
import { Avatar, EmptyText, ErrorState, LoadingState, PhotoPlaceholder } from '@/components/ui/misc';
import { BackHeader, Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useBarbershop } from '@/hooks/use-barbershops';
import { errorMessage } from '@/lib/api';
import { openingStatus } from '@/lib/opening-status';

export default function ChooseBarberScreen() {
  const { shopId, distance } = useLocalSearchParams<{ shopId: string; distance?: string }>();
  const shop = useBarbershop(shopId);

  if (shop.isLoading) return <Screen><BackHeader step="PASSO 1 DE 3" /><LoadingState /></Screen>;
  if (!shop.data) {
    return (
      <Screen>
        <BackHeader step="PASSO 1 DE 3" />
        <ErrorState message={errorMessage(shop.error)} onRetry={() => void shop.refetch()} />
      </Screen>
    );
  }

  const s = shop.data;
  const status = openingStatus(s.operatingHours, s.timezone);
  // Shortest service gives the earliest possible "next slot" hint.
  const probeService = [...s.services].sort((a, b) => a.durationMinutes - b.durationMinutes)[0];

  return (
    <Screen>
      <BackHeader step="PASSO 1 DE 3" />
      <PhotoPlaceholder uri={s.logoUrl} label="foto da fachada" style={styles.cover} />
      <View style={{ gap: 4 }}>
        <AppText style={styles.name} accessibilityRole="header">
          {s.name}
        </AppText>
        <AppText style={Type.body}>{[s.address, distance].filter(Boolean).join(' · ')}</AppText>
        <AppText style={[styles.status, { color: status.open ? Colors.success : Colors.muted }]}>{status.text}</AppText>
      </View>
      <AppText style={[Type.eyebrow, { marginTop: 8 }]}>Escolha o barbeiro</AppText>
      <View>
        {s.staff.map((barber) => (
          <Pressable
            key={barber.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/book/[shopId]/service', params: { shopId: s.id, barberId: barber.id } })
            }
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
            <Avatar name={barber.name} uri={barber.avatarUrl} size={52} />
            <View style={styles.rowBody}>
              <AppText style={Type.rowTitle}>{barber.name}</AppText>
              <NextSlotText shopId={s.id} barberId={barber.id} serviceId={probeService?.id} timeZone={s.timezone} />
            </View>
            <AppText style={styles.chevron}>›</AppText>
          </Pressable>
        ))}
        {s.staff.length === 0 && <EmptyText>Nenhum barbeiro disponível para agendamento.</EmptyText>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 150, borderRadius: 16 },
  name: { fontFamily: Fonts.extrabold, fontSize: 26, lineHeight: 29, letterSpacing: -0.52 },
  status: { fontFamily: Fonts.semibold, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  rowBody: { flex: 1, gap: 3 },
  chevron: { fontSize: 20, color: Colors.muted },
});
