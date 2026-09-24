import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SummaryRows } from '@/components/summary-rows';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useAppointment } from '@/hooks/use-appointments';
import { useBarbershop } from '@/hooks/use-barbershops';
import { brl, formatWhenLong } from '@/lib/format';

export default function BookingDoneScreen() {
  const { appointmentId, shopId } = useLocalSearchParams<{ appointmentId: string; shopId: string }>();
  const appointment = useAppointment(appointmentId);
  const shop = useBarbershop(shopId);
  const a = appointment.data;
  const s = shop.data;
  const barberName = a?.barber?.name ?? s?.staff.find((b) => b.id === a?.barberId)?.name ?? '';

  return (
    <Screen bottomInset contentStyle={styles.content}>
      <View style={styles.check}>
        <AppText style={styles.checkText}>✓</AppText>
      </View>
      <View style={{ gap: 6 }}>
        <AppText style={styles.title} accessibilityRole="header">
          Agendado
        </AppText>
        <AppText style={[Type.body, { fontSize: 15 }]}>Enviamos a confirmação para seu e-mail.</AppText>
      </View>
      <View style={styles.card}>
        {a && s ? (
          <SummaryRows
            rows={[
              { label: 'Barbearia', value: s.name },
              { label: 'Barbeiro', value: barberName },
              { label: 'Serviço', value: `${a.serviceName} · ${a.durationAtBooking} min` },
              { label: 'Quando', value: formatWhenLong(a.startTime, s.timezone) },
              { label: 'Valor', value: brl(a.priceAtBooking) },
            ]}
          />
        ) : (
          <LoadingState />
        )}
      </View>
      <View style={styles.actions}>
        <Button label="Ver meus agendamentos" onPress={() => router.dismissTo('/bookings')} />
        <Button label="Voltar ao início" variant="secondary" onPress={() => router.dismissTo('/explore')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 40, paddingHorizontal: 24, gap: 20 },
  check: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { fontFamily: Fonts.bold, fontSize: 26, color: '#ffffff' },
  title: { fontFamily: Fonts.extrabold, fontSize: 32, lineHeight: 34, letterSpacing: -0.64 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  actions: { gap: 8, marginTop: 'auto' },
});
