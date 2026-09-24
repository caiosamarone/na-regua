import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { SignOutButton } from '@/components/sign-out-button';
import { HBarList } from '@/components/staff/bar-chart';
import { EmptyText, ErrorState, LoadingState } from '@/components/ui/misc';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useBarbershop } from '@/hooks/use-barbershops';
import { useBarbershopMetrics, useStaffMembers } from '@/hooks/use-staff-area';
import { errorMessage } from '@/lib/api';
import { useStaffSession } from '@/lib/auth';
import { brl, calendarDay, monthShort, todayIn } from '@/lib/format';

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export default function DashboardScreen() {
  const user = useStaffSession();
  const shop = useBarbershop(user.barbershopId);
  const staff = useStaffMembers(user.barbershopId);
  const tz = shop.data?.timezone ?? 'America/Sao_Paulo';
  const today = todayIn(tz);

  // Month to date, compared with the same span of the previous month.
  const monthStart = calendarDay(today.year, today.month, 1);
  const prevStart = calendarDay(today.year, today.month - 1, 1);
  const prevDays = calendarDay(today.year, today.month, 0).day;
  const prevEnd = calendarDay(prevStart.year, prevStart.month, Math.min(today.day, prevDays));
  const metrics = useBarbershopMetrics(user.barbershopId, { from: monthStart.iso, to: today.iso });
  const previous = useBarbershopMetrics(user.barbershopId, { from: prevStart.iso, to: prevEnd.iso });

  const m = metrics.data;
  const count = m ? m.topBarbers.reduce((sum, b) => sum + b.appointmentCount, 0) : 0;
  const prevRevenue = previous.data?.totalRevenue ?? 0;
  const delta = m && prevRevenue > 0 ? Math.round(((m.totalRevenue - prevRevenue) / prevRevenue) * 100) : null;
  const staffName = (id: string) => staff.data?.find((s) => s.id === id)?.name ?? 'Barbeiro';

  return (
    <Screen
      contentStyle={{ gap: 18 }}
      refreshing={metrics.isRefetching}
      onRefresh={() => {
        void metrics.refetch();
        void previous.refetch();
      }}>
      <View style={styles.titleRow}>
        <ScreenTitle eyebrow={`${shop.data?.name ?? ''} · ${MONTH_NAMES[today.month - 1]}`} title="Painel" />
        <SignOutButton />
      </View>
      {metrics.isLoading ? (
        <LoadingState />
      ) : !m ? (
        <ErrorState message={errorMessage(metrics.error)} onRetry={() => void metrics.refetch()} />
      ) : (
        <>
          <View style={styles.grid}>
            <View style={styles.revenue}>
              <AppText style={[Type.eyebrow, { color: Colors.onInkMuted }]}>Receita do mês</AppText>
              <AppText style={styles.revenueValue}>{brl(m.totalRevenue)}</AppText>
              {delta != null ? (
                <AppText style={{ fontSize: 13, color: delta >= 0 ? Colors.successLight : Colors.dangerBg }}>
                  {`${delta >= 0 ? '+' : ''}${delta}% vs ${MONTH_NAMES[prevStart.month - 1]}`}
                </AppText>
              ) : null}
            </View>
            <View style={styles.gridRow}>
              <Tile label="Atendimentos" value={String(count)} />
              <Tile label="Ticket médio" value={count ? brl(m.totalRevenue / count) : '—'} />
            </View>
          </View>

          <Report title="Serviços mais pedidos" empty={m.topServices.length === 0}>
            <HBarList
              color={Colors.ink}
              rows={m.topServices.map((s) => ({ label: s.serviceName, value: s.bookingCount, valueText: String(s.bookingCount) }))}
            />
          </Report>
          <Report title="Receita por barbeiro" empty={m.topBarbers.length === 0}>
            <HBarList
              color={Colors.accent}
              rows={m.topBarbers.map((b) => ({
                label: staffName(b.barberId),
                value: b.revenue,
                valueText: `${brl(b.revenue)} · ${b.appointmentCount}`,
              }))}
            />
          </Report>
          <Report title="Dias mais movimentados" empty={m.busiestDays.length === 0}>
            <HBarList
              color="rgba(28,26,23,0.45)"
              rows={m.busiestDays.slice(0, 6).map((d) => {
                const [y, mo, da] = d.date.slice(0, 10).split('-').map(Number);
                const day = calendarDay(y, mo, da);
                return {
                  label: `${WEEKDAY_SHORT[day.weekday]}, ${day.day} ${monthShort(day.month)}`,
                  value: d.appointmentCount,
                  valueText: String(d.appointmentCount),
                };
              })}
            />
          </Report>
        </>
      )}
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <AppText style={{ fontSize: 12, color: Colors.muted }}>{label}</AppText>
      <AppText style={{ fontFamily: Fonts.bold, fontSize: 22 }}>{value}</AppText>
    </View>
  );
}

function Report({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <AppText style={Type.eyebrow}>{title}</AppText>
      {empty ? <EmptyText>Sem dados neste mês ainda.</EmptyText> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  grid: { gap: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  revenue: { backgroundColor: Colors.ink, borderRadius: 18, padding: 18, gap: 4 },
  revenueValue: { fontFamily: Fonts.extrabold, fontSize: 38, lineHeight: 40, letterSpacing: -0.76, color: Colors.onInk },
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 16,
    padding: 14,
    gap: 2,
  },
});
