import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyText, ErrorState, LoadingState } from '@/components/ui/misc';
import { BackHeader, Screen, ScreenTitle } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useBarbershop } from '@/hooks/use-barbershops';
import { errorMessage } from '@/lib/api';
import { brl } from '@/lib/format';

export default function ChooseServiceScreen() {
  const { shopId, barberId } = useLocalSearchParams<{ shopId: string; barberId: string }>();
  const shop = useBarbershop(shopId);
  const barber = shop.data?.staff.find((b) => b.id === barberId);

  return (
    <Screen>
      <BackHeader step="PASSO 2 DE 3" />
      {shop.isLoading ? (
        <LoadingState />
      ) : !shop.data ? (
        <ErrorState message={errorMessage(shop.error)} onRetry={() => void shop.refetch()} />
      ) : (
        <>
          <View style={{ gap: 4 }}>
            <ScreenTitle title="Escolha o serviço" />
            <AppText style={Type.body}>{`com ${barber?.name ?? 'barbeiro'} · ${shop.data.name}`}</AppText>
          </View>
          <View>
            {shop.data.services.map((service) => (
              <Pressable
                key={service.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/book/[shopId]/time',
                    params: { shopId, barberId, serviceId: service.id },
                  })
                }
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
                <View style={styles.rowBody}>
                  <AppText style={Type.rowTitle}>{service.name}</AppText>
                  <AppText style={Type.mono12}>{`${service.durationMinutes} min`}</AppText>
                </View>
                <AppText style={styles.price}>{brl(service.price)}</AppText>
              </Pressable>
            ))}
            {shop.data.services.length === 0 && <EmptyText>Nenhum serviço disponível.</EmptyText>}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  rowBody: { flex: 1, gap: 3 },
  price: { fontFamily: Fonts.semibold, fontSize: 16 },
});
