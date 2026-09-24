import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BarChart, type Bar } from '@/components/staff/bar-chart';
import { EmptyText, ErrorState, LoadingState } from '@/components/ui/misc';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useBarbershop } from '@/hooks/use-barbershops';
import { useMyCommissions } from '@/hooks/use-staff-area';
import { errorMessage } from '@/lib/api';
import { useStaffSession } from '@/lib/auth';
import { addDays, brl, calendarDay, dayOf, formatTime, todayIn, type CalendarDay } from '@/lib/format';
import type { BarberCommissions } from '@/types/api';

type Period = 'today' | 'week' | 'month';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
];
const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function periodStart(period: Period, today: CalendarDay) {
  if (period === 'today') return today;
  if (period === 'week') return addDays(today, -((today.weekday + 6) % 7)); // Monday
  return calendarDay(today.year, today.month, 1);
}

export default function EarningsScreen() {
  const user = useStaffSession();
  const shop = useBarbershop(user.barbershopId);
  const tz = shop.data?.timezone ?? 'America/Sao_Paulo';
  const today = todayIn(tz);
  const [period, setPeriod] = useState<Period>('today');
  const start = periodStart(period, today);
  const commissions = useMyCommissions({ from: start.iso, to: today.iso });

  const periodLabel = period === 'today' ? 'hoje' : period === 'week' ? 'esta semana' : MONTH_NAMES[today.month - 1];

  return (
    <Screen contentStyle={{ gap: 16 }} refreshing={commissions.isRefetching} onRefresh={() => void commissions.refetch()}>
      <ScreenTitle eyebrow={user.name} title="Faturamento" />
      <Segmented options={PERIODS} value={period} onChange={setPeriod} />
      {commissions.isLoading ? (
        <LoadingState />
      ) : !commissions.data ? (
        <ErrorState message={errorMessage(commissions.error)} onRetry={() => void commissions.refetch()} />
      ) : (
        <EarningsBody data={commissions.data} period={period} periodLabel={periodLabel} start={start} today={today} timeZone={tz} />
      )}
    </Screen>
  );
}

function EarningsBody({
  data,
  period,
  periodLabel,
  start,
  today,
  timeZone,
}: {
  data: BarberCommissions;
  period: Period;
  periodLabel: string;
  start: CalendarDay;
  today: CalendarDay;
  timeZone: string;
}) {
  const rate = data.commissionPercent;
  const total = data.entries.reduce((sum, e) => sum + e.amount, 0);
  // Entries carry the commission amount only; the service price is derived back from the rate.
  const priceOf = (amount: number) => (rate ? amount / (rate / 100) : null);
  const gross = priceOf(total);

  const byDay = new Map<string, number>();
  data.entries.forEach((e) => {
    const iso = dayOf(e.appointmentDate, timeZone).iso;
    byDay.set(iso, (byDay.get(iso) ?? 0) + e.amount);
  });

  let bars: Bar[] = [];
  if (period === 'week') {
    bars = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const value = byDay.get(d.iso) ?? 0;
      return { label: WEEKDAY_SHORT[d.weekday], value, valueText: value ? brl(value).replace('R$ ', '') : '', highlight: d.iso === today.iso };
    });
  } else if (period === 'month') {
    const weeks = Math.ceil(today.day / 7);
    bars = Array.from({ length: weeks }, (_, w) => {
      let value = 0;
      for (let d = w * 7 + 1; d <= Math.min((w + 1) * 7, today.day); d++) {
        value += byDay.get(calendarDay(today.year, today.month, d).iso) ?? 0;
      }
      return { label: `${w + 1}ª sem`, value, valueText: value ? brl(value).replace('R$ ', '') : '', highlight: w === weeks - 1 };
    });
  }

  return (
    <>
      <View style={styles.card}>
        <View style={{ gap: 4 }}>
          <AppText style={[Type.eyebrow, { color: Colors.onInkMuted }]}>{`Suas comissões · ${periodLabel}`}</AppText>
          <AppText style={styles.big}>{brl(total)}</AppText>
        </View>
        <View style={styles.stats}>
          <Stat label="Faturado" value={gross != null ? brl(gross) : '—'} />
          <Stat label="Atendimentos" value={String(data.entries.length)} />
          <Stat label="Comissão" value={rate != null ? `${rate}%` : '—'} />
        </View>
      </View>

      {period !== 'today' && (
        <View style={{ gap: 10 }}>
          <AppText style={Type.eyebrow}>{period === 'week' ? 'Comissão por dia' : 'Comissão por semana'}</AppText>
          <BarChart bars={bars} />
        </View>
      )}

      {period === 'today' && (
        <View>
          <AppText style={[Type.eyebrow, { marginBottom: 4 }]}>Concluídos hoje</AppText>
          {[...data.entries]
            .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))
            .map((e) => {
              const price = priceOf(e.amount);
              return (
                <View key={e.id} style={styles.row}>
                  <AppText style={styles.time}>{formatTime(e.appointmentDate, timeZone)}</AppText>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <AppText style={{ fontFamily: Fonts.semibold, fontSize: 15 }}>{e.customerName}</AppText>
                    <AppText style={Type.caption}>{price != null ? `${e.serviceName} · ${brl(price)}` : e.serviceName}</AppText>
                  </View>
                  <AppText style={styles.plus}>{`+ ${brl(e.amount)}`}</AppText>
                </View>
              );
            })}
          {data.entries.length === 0 && <EmptyText>Nenhum atendimento concluído ainda.</EmptyText>}
        </View>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <AppText style={{ fontSize: 12, color: Colors.onInkMuted }}>{label}</AppText>
      <AppText style={{ fontFamily: Fonts.semibold, fontSize: 15, color: Colors.onInk }}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.ink, borderRadius: 20, padding: 20, gap: 14 },
  big: { fontFamily: Fonts.extrabold, fontSize: 44, lineHeight: 46, letterSpacing: -0.88, color: Colors.onInk },
  stats: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: Colors.onInkLine, paddingTop: 14 },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  time: { fontFamily: Fonts.monoMedium, fontSize: 13, width: 44 },
  plus: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.success },
});
