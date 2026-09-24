import { useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/ui/misc';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useBarbershop } from '@/hooks/use-barbershops';
import { useReplaceOperatingHours } from '@/hooks/use-staff-area';
import { errorMessage } from '@/lib/api';
import { useStaffSession } from '@/lib/auth';
import { WEEKDAY_NAMES } from '@/lib/format';
import { leadTimeText } from '@/lib/lead-time';
import type { OperatingHour } from '@/types/api';

// Monday first, like the design.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DEFAULT_DAY: Omit<OperatingHour, 'dayOfWeek'>[] = [{ startTime: '09:00', endTime: '18:00' }];

export default function HoursScreen() {
  const user = useStaffSession();
  const shop = useBarbershop(user.barbershopId);
  const replace = useReplaceOperatingHours(user.barbershopId);
  // Intervals of days switched off in this session, so switching back on restores them.
  const closedIntervals = useRef(new Map<number, OperatingHour[]>());

  if (!shop.data) {
    return (
      <Screen>
        <ScreenTitle title="Horários" />
        {shop.isLoading ? <LoadingState /> : <ErrorState message={errorMessage(shop.error)} onRetry={() => void shop.refetch()} />}
      </Screen>
    );
  }

  const hours = shop.data.operatingHours;
  const lead = shop.data.cancellationLeadTimeMinutes;

  const toggleDay = (dow: number, open: boolean) => {
    let next: OperatingHour[];
    if (open) {
      const restored = closedIntervals.current.get(dow) ?? DEFAULT_DAY.map((h) => ({ ...h, dayOfWeek: dow }));
      next = [...hours, ...restored];
    } else {
      const remaining = hours.filter((h) => h.dayOfWeek !== dow);
      if (remaining.length === 0) {
        Alert.alert('A barbearia precisa abrir pelo menos um dia.');
        return;
      }
      closedIntervals.current.set(
        dow,
        hours.filter((h) => h.dayOfWeek === dow),
      );
      next = remaining;
    }
    replace.mutate(next);
  };

  return (
    <Screen contentStyle={{ gap: 6 }} refreshing={shop.isRefetching} onRefresh={() => void shop.refetch()}>
      <View style={{ marginBottom: 8 }}>
        <ScreenTitle title="Horários" />
      </View>
      {replace.error ? <AppText style={styles.error}>{errorMessage(replace.error)}</AppText> : null}
      {WEEK_ORDER.map((dow) => {
        const intervals = hours
          .filter((h) => h.dayOfWeek === dow)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        const open = intervals.length > 0;
        return (
          <View key={dow} style={styles.row}>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText style={{ fontFamily: Fonts.bold, fontSize: 15 }}>{WEEKDAY_NAMES[dow]}</AppText>
              <AppText style={Type.mono12}>
                {open ? intervals.map((h) => `${h.startTime}–${h.endTime}`).join('  ·  ') : 'Fechado'}
              </AppText>
            </View>
            <Toggle
              label={`${WEEKDAY_NAMES[dow]} aberto`}
              value={open}
              disabled={replace.isPending}
              onChange={(value) => toggleDay(dow, value)}
            />
          </View>
        );
      })}

      <AppText style={[Type.eyebrow, { marginTop: 22 }]}>Cancelamento</AppText>
      <View style={styles.leadRow}>
        <AppText style={{ fontFamily: Fonts.semibold, fontSize: 15 }}>Antecedência mínima</AppText>
        <AppText style={{ fontFamily: Fonts.monoMedium, fontSize: 14 }}>{leadTimeText(lead)}</AppText>
      </View>
      <AppText style={[Type.small, { lineHeight: 19 }]}>
        {`Clientes que cancelarem com menos de ${leadTimeText(lead)} de antecedência veem um aviso de cobrança de 50%.`}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  leadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
});
