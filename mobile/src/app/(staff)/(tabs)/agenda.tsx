import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SignOutButton } from '@/components/sign-out-button';
import { AppointmentSheet, STATUS_PILL } from '@/components/staff/appointment-sheet';
import { DayStrip } from '@/components/ui/day-strip';
import { EmptyText, ErrorState, LoadingState } from '@/components/ui/misc';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useShopAppointments } from '@/hooks/use-appointments';
import { useBarbershop } from '@/hooks/use-barbershops';
import { useNow } from '@/hooks/use-now';
import { errorMessage } from '@/lib/api';
import { useStaffSession } from '@/lib/auth';
import { addDays, brl, dayLabel, formatTime, isOpenDay, nextDays, todayIn, zonedToUtcIso } from '@/lib/format';
import type { Appointment } from '@/types/api';

export default function AgendaScreen() {
  const user = useStaffSession();
  const shop = useBarbershop(user.barbershopId);
  const tz = shop.data?.timezone ?? 'America/Sao_Paulo';
  const days = useMemo(() => nextDays(tz, 7), [tz]);
  const today = todayIn(tz);
  const [dayIso, setDayIso] = useState(today.iso);
  const [openId, setOpenId] = useState<string | null>(null);
  const now = useNow();

  const day = days.find((d) => d.iso === dayIso) ?? days[0];
  const isAdmin = user.role === 'BARBERSHOP_ADMIN';
  const appointments = useShopAppointments(user.barbershopId, {
    from: zonedToUtcIso(day, 0, tz),
    to: zonedToUtcIso(addDays(day, 1), 0, tz),
    // Barbers only ever get their own appointments (enforced by the API); admins see the whole shop.
    barberId: isAdmin ? undefined : user.id,
  });

  const list = [...(appointments.data ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const active = list.filter((a) => a.status !== 'CANCELLED');
  const summary = `${active.length} atendimentos · ${list.filter((a) => a.status === 'DONE').length} concluídos · ${brl(
    active.reduce((sum, a) => sum + a.priceAtBooking, 0),
  )} previstos`;
  const closed = shop.data ? !isOpenDay(shop.data.operatingHours, day.weekday) : false;

  return (
    <Screen refreshing={appointments.isRefetching} onRefresh={() => void appointments.refetch()}>
      <View style={styles.titleRow}>
        <ScreenTitle eyebrow={`${user.name}${shop.data ? ` · ${shop.data.name}` : ''}`} title="Agenda" />
        <SignOutButton />
      </View>
      <DayStrip
        days={days.map((d) => ({
          key: d.iso,
          label: dayLabel(d, today),
          num: d.day,
          closed: shop.data ? !isOpenDay(shop.data.operatingHours, d.weekday) : false,
        }))}
        selected={day.iso}
        onSelect={setDayIso}
      />
      {appointments.isLoading ? (
        <LoadingState />
      ) : appointments.error ? (
        <ErrorState message={errorMessage(appointments.error)} onRetry={() => void appointments.refetch()} />
      ) : (
        <>
          <AppText style={Type.mono12}>{summary}</AppText>
          <View>
            {list.map((a) => (
              <AgendaRow
                key={a.id}
                appointment={a}
                timeZone={tz}
                now={now}
                showBarber={isAdmin}
                onPress={() => setOpenId(a.id)}
              />
            ))}
            {list.length === 0 && (
              <EmptyText>{closed ? 'Barbearia fechada neste dia.' : 'Nenhum atendimento neste dia.'}</EmptyText>
            )}
          </View>
        </>
      )}
      <AppointmentSheet appointment={list.find((a) => a.id === openId)} timeZone={tz} onClose={() => setOpenId(null)} />
    </Screen>
  );
}

function AgendaRow({
  appointment: a,
  timeZone,
  now,
  showBarber,
  onPress,
}: {
  appointment: Appointment;
  timeZone: string;
  now: number;
  showBarber: boolean;
  onPress: () => void;
}) {
  const isNow = a.status === 'BOOKED' && new Date(a.startTime).getTime() <= now && now < new Date(a.endTime).getTime();
  const cancelled = a.status === 'CANCELLED';
  const pill = STATUS_PILL[a.status];
  const details = [a.serviceName, `${a.durationAtBooking} min`, brl(a.priceAtBooking), showBarber ? a.barber?.name : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, cancelled && { opacity: 0.55 }, pressed && { backgroundColor: 'rgba(28,26,23,0.03)' }]}>
      <View style={styles.timeCol}>
        <AppText style={styles.time}>{formatTime(a.startTime, timeZone)}</AppText>
        {isNow ? <AppText style={styles.now}>AGORA</AppText> : null}
      </View>
      <View style={styles.rowBody}>
        <AppText style={[Type.rowTitle, cancelled && { textDecorationLine: 'line-through' }]}>
          {a.customer?.name ?? 'Cliente'}
        </AppText>
        <AppText style={Type.small}>{details}</AppText>
      </View>
      <View style={[styles.pill, { backgroundColor: pill.bg }]}>
        <AppText style={[styles.pillText, { color: pill.fg }]}>{pill.label}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  timeCol: { width: 48, gap: 2 },
  time: { fontFamily: Fonts.monoMedium, fontSize: 15 },
  now: { fontFamily: Fonts.monoMedium, fontSize: 10, color: Colors.accent },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  pill: { height: 24, paddingHorizontal: 9, borderRadius: 12, justifyContent: 'center' },
  pillText: { fontFamily: Fonts.semibold, fontSize: 11 },
});
