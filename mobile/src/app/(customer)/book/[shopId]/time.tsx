import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlotGrid } from '@/components/booking/slot-grid';
import { SummaryRows } from '@/components/summary-rows';
import { Button } from '@/components/ui/button';
import { DayStrip } from '@/components/ui/day-strip';
import { EmptyText, ErrorState, LoadingState } from '@/components/ui/misc';
import { BackHeader, Screen, ScreenTitle } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useCreateAppointment } from '@/hooks/use-appointments';
import { useBarbershop, useSlots } from '@/hooks/use-barbershops';
import { errorMessage } from '@/lib/api';
import { brl, dayLabel, formatWhenLong, isOpenDay, monthShort, nextDays, todayIn } from '@/lib/format';
import { leadTimeText } from '@/lib/lead-time';
import type { Slot } from '@/types/api';

const DAYS_AHEAD = 7;

export default function ChooseTimeScreen() {
  const { shopId, barberId, serviceId } = useLocalSearchParams<{ shopId: string; barberId: string; serviceId: string }>();
  const insets = useSafeAreaInsets();
  const shop = useBarbershop(shopId);
  const tz = shop.data?.timezone ?? 'America/Sao_Paulo';
  const days = useMemo(() => nextDays(tz, DAYS_AHEAD), [tz]);
  const today = todayIn(tz);

  const [dayIso, setDayIso] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const create = useCreateAppointment();

  // Like the prototype: if nothing is left today, start on the next open day.
  const todaySlots = useSlots(shopId, { barberId, serviceId, date: today.iso });
  const nextOpenDay = shop.data
    ? days.slice(1).find((d) => isOpenDay(shop.data.operatingHours, d.weekday))
    : undefined;
  const todayIsEmpty = todaySlots.isSuccess && todaySlots.data.length === 0;
  const selectedIso = dayIso ?? (todayIsEmpty && nextOpenDay ? nextOpenDay.iso : today.iso);
  const slots = useSlots(shopId, { barberId, serviceId, date: selectedIso });

  if (!shop.data) {
    return (
      <Screen>
        <BackHeader step="PASSO 3 DE 3" />
        {shop.isLoading ? <LoadingState /> : <ErrorState message={errorMessage(shop.error)} onRetry={() => void shop.refetch()} />}
      </Screen>
    );
  }

  const s = shop.data;
  const service = s.services.find((v) => v.id === serviceId);
  const barber = s.staff.find((b) => b.id === barberId);
  const selectedDay = days.find((d) => d.iso === selectedIso) ?? days[0];
  const closed = !isOpenDay(s.operatingHours, selectedDay.weekday);

  const confirm = async () => {
    if (!slot) return;
    try {
      const appointment = await create.mutateAsync({ barbershopId: s.id, barberId, serviceId, startTime: slot.startTimeUtc });
      setConfirmOpen(false);
      router.replace({ pathname: '/book/done', params: { appointmentId: appointment.id, shopId: s.id } });
    } catch {
      // The slot may have been taken meanwhile: refresh the grid, keep the sheet open with the error.
      setSlot(null);
      void slots.refetch();
    }
  };

  const footer = slot ? (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={Type.rowTitle}>
          {`${dayLabel(selectedDay, today)}, ${selectedDay.day} ${monthShort(selectedDay.month)} · ${slot.startTimeLocal}`}
        </AppText>
        <AppText style={Type.small}>{service ? brl(service.price) : ''}</AppText>
      </View>
      <Button
        label="Continuar"
        onPress={() => {
          create.reset();
          setConfirmOpen(true);
        }}
        style={{ paddingHorizontal: 24 }}
      />
    </View>
  ) : null;

  return (
    <Screen footer={footer}>
      <BackHeader step="PASSO 3 DE 3" />
      <View style={{ gap: 4 }}>
        <ScreenTitle title="Escolha o horário" />
        <AppText style={Type.body}>
          {`${service?.name ?? ''} · ${service?.durationMinutes ?? ''} min com ${barber?.name ?? ''}`}
        </AppText>
      </View>
      <DayStrip
        days={days.map((d) => ({
          key: d.iso,
          label: dayLabel(d, today),
          num: d.day,
          closed: !isOpenDay(s.operatingHours, d.weekday),
        }))}
        selected={selectedIso}
        onSelect={(iso) => {
          setDayIso(iso);
          setSlot(null);
        }}
        disableClosed
      />
      {slots.isLoading ? (
        <LoadingState />
      ) : slots.error ? (
        <ErrorState message={errorMessage(slots.error)} onRetry={() => void slots.refetch()} />
      ) : slots.data && slots.data.length > 0 ? (
        <SlotGrid slots={slots.data} selected={slot?.startTimeUtc ?? null} onSelect={setSlot} />
      ) : (
        <EmptyText>{closed ? 'A barbearia não abre neste dia.' : 'Sem horários livres neste dia.'}</EmptyText>
      )}

      <Sheet visible={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <AppText style={Type.sheetTitle}>Confirmar agendamento</AppText>
        {slot && service && (
          <SummaryRows
            dense
            rows={[
              { label: 'Barbearia', value: s.name },
              { label: 'Barbeiro', value: barber?.name ?? '' },
              { label: 'Serviço', value: `${service.name} · ${service.durationMinutes} min` },
              { label: 'Quando', value: formatWhenLong(slot.startTimeUtc, tz) },
              { label: 'Valor', value: brl(service.price) },
            ]}
          />
        )}
        <AppText style={Type.caption}>
          {`Cancelamento gratuito até ${leadTimeText(s.cancellationLeadTimeMinutes)} antes do horário.`}
        </AppText>
        {create.error ? <AppText style={styles.error}>{errorMessage(create.error)}</AppText> : null}
        <Button label="Confirmar" onPress={confirm} loading={create.isPending} disabled={!slot} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lineStrong,
    backgroundColor: Colors.background,
  },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
});
