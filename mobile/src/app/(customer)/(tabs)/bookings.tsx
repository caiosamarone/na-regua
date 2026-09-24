import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SignOutButton } from '@/components/sign-out-button';
import { Button } from '@/components/ui/button';
import { EmptyText, ErrorState, LoadingState, Notice } from '@/components/ui/misc';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useCancelAppointment, useMyAppointments } from '@/hooks/use-appointments';
import { useBarbershops } from '@/hooks/use-barbershops';
import { useNow } from '@/hooks/use-now';
import { errorMessage } from '@/lib/api';
import { brl, dayLabel, dayOf, formatShortDate, formatTime, formatWhenLong, todayIn } from '@/lib/format';
import { leadTimeText } from '@/lib/lead-time';
import type { Appointment, BarbershopProfile } from '@/types/api';

const FALLBACK_TZ = 'America/Sao_Paulo';

export default function BookingsScreen() {
  const appointments = useMyAppointments();
  const shopIds = [...new Set((appointments.data ?? []).map((a) => a.barbershopId))];
  const { byId: shops } = useBarbershops(shopIds);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const now = useNow();
  const all = appointments.data ?? [];
  const upcoming = all
    .filter((a) => a.status === 'BOOKED' && new Date(a.startTime).getTime() > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const past = all
    .filter((a) => !upcoming.includes(a))
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
  const toCancel = upcoming.find((a) => a.id === cancelId);

  return (
    <Screen
      contentStyle={{ gap: 6 }}
      refreshing={appointments.isRefetching}
      onRefresh={() => void appointments.refetch()}>
      <View style={styles.titleRow}>
        <ScreenTitle title="Agendamentos" />
        <SignOutButton />
      </View>

      {appointments.isLoading ? (
        <LoadingState />
      ) : appointments.error ? (
        <ErrorState message={errorMessage(appointments.error)} onRetry={() => void appointments.refetch()} />
      ) : (
        <>
          <AppText style={[Type.eyebrow, { marginTop: 16 }]}>Próximos</AppText>
          {upcoming.map((a) => (
            <UpcomingRow key={a.id} appointment={a} shop={shops.get(a.barbershopId)} onPress={() => setCancelId(a.id)} />
          ))}
          {upcoming.length === 0 && <EmptyText>Nenhum agendamento marcado.</EmptyText>}

          <AppText style={[Type.eyebrow, { marginTop: 20 }]}>Anteriores</AppText>
          {past.map((a) => (
            <PastRow key={a.id} appointment={a} shop={shops.get(a.barbershopId)} />
          ))}
          {past.length === 0 && <EmptyText>Nada por aqui ainda.</EmptyText>}
        </>
      )}

      <CancelSheet
        now={now}
        appointment={toCancel}
        shop={toCancel ? shops.get(toCancel.barbershopId) : undefined}
        onClose={() => setCancelId(null)}
      />
    </Screen>
  );
}

function UpcomingRow({ appointment: a, shop, onPress }: { appointment: Appointment; shop?: BarbershopProfile; onPress: () => void }) {
  const tz = shop?.timezone ?? FALLBACK_TZ;
  const day = dayOf(a.startTime, tz);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { paddingVertical: 14 }, pressed && { opacity: 0.6 }]}>
      <View style={styles.dateBox}>
        <AppText style={styles.dateLabel}>{dayLabel(day, todayIn(tz))}</AppText>
        <AppText style={styles.dateNum}>{day.day}</AppText>
      </View>
      <View style={styles.rowBody}>
        <AppText style={Type.rowTitle}>{`${formatTime(a.startTime, tz)} · ${a.serviceName}`}</AppText>
        <AppText style={Type.small} numberOfLines={1}>
          {`${a.barber?.name ?? ''} · ${shop?.name ?? ''}`}
        </AppText>
      </View>
      <AppText style={styles.chevron}>›</AppText>
    </Pressable>
  );
}

const STATUS = {
  DONE: { label: 'Concluído', color: Colors.success },
  CANCELLED: { label: 'Cancelado', color: Colors.danger },
  BOOKED: { label: 'Agendado', color: Colors.muted },
};

function PastRow({ appointment: a, shop }: { appointment: Appointment; shop?: BarbershopProfile }) {
  const status = STATUS[a.status];
  return (
    <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 14 }]}>
      <View style={styles.rowBody}>
        <AppText style={{ fontFamily: Fonts.semibold, fontSize: 15 }}>{a.serviceName}</AppText>
        <AppText style={Type.small}>
          {`${formatShortDate(a.startTime, shop?.timezone ?? FALLBACK_TZ)} · ${a.barber?.name ?? ''} · ${shop?.name ?? ''}`}
        </AppText>
      </View>
      <AppText style={{ fontFamily: Fonts.semibold, fontSize: 12, color: status.color }}>{status.label}</AppText>
    </View>
  );
}

function CancelSheet({
  appointment: a,
  shop,
  now,
  onClose,
}: {
  appointment?: Appointment;
  shop?: BarbershopProfile;
  now: number;
  onClose: () => void;
}) {
  const cancel = useCancelAppointment();
  const tz = shop?.timezone ?? FALLBACK_TZ;
  const leadMinutes = shop?.cancellationLeadTimeMinutes ?? 180;
  const late = a ? new Date(a.startTime).getTime() - now < leadMinutes * 60 * 1000 : false;

  const close = () => {
    cancel.reset();
    onClose();
  };
  const confirm = async () => {
    if (!a) return;
    try {
      await cancel.mutateAsync({ id: a.id });
      close();
    } catch {
      // Error message rendered in the sheet.
    }
  };

  return (
    <Sheet visible={!!a} onClose={close}>
      {a && (
        <>
          <AppText style={Type.sheetTitle}>{`${formatTime(a.startTime, tz)} · ${a.serviceName}`}</AppText>
          <AppText style={Type.body}>
            {`${formatWhenLong(a.startTime, tz)} · ${a.barber?.name ?? ''} · ${shop?.name ?? ''}`}
          </AppText>
          <Notice tone={late ? 'warning' : 'neutral'}>
            {late
              ? `Faltam menos de ${leadTimeText(leadMinutes)}. Cancelar agora pode gerar cobrança de 50% (${brl(a.priceAtBooking / 2)}).`
              : `Cancelamento gratuito até ${leadTimeText(leadMinutes)} antes do horário.`}
          </Notice>
          {cancel.error ? <AppText style={styles.error}>{errorMessage(cancel.error)}</AppText> : null}
          <Button
            label={late ? 'Cancelar mesmo assim' : 'Cancelar agendamento'}
            variant="danger"
            onPress={confirm}
            loading={cancel.isPending}
          />
          <Button label="Manter agendamento" variant="ghost" onPress={close} height={48} />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 2 },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  dateBox: {
    width: 56,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  dateLabel: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.muted },
  dateNum: { fontFamily: Fonts.bold, fontSize: 18 },
  chevron: { fontSize: 20, color: Colors.muted },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
});
