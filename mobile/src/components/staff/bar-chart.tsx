import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

export type Bar = { label: string; value: number; valueText: string; highlight?: boolean };

/** Vertical bars from the "Faturamento" screen; the current period is highlighted in the accent color. */
export function BarChart({ bars }: { bars: Bar[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <View style={styles.chart} accessibilityRole="image" accessibilityLabel={bars.map((b) => `${b.label}: ${b.valueText || '0'}`).join(', ')}>
      {bars.map((b) => (
        <View key={b.label} style={styles.col}>
          <AppText style={styles.value}>{b.valueText}</AppText>
          <View
            style={[
              styles.bar,
              { height: `${Math.round((b.value / max) * 100) * 0.7}%`, backgroundColor: b.highlight ? Colors.accent : Colors.ink },
            ]}
          />
          <AppText style={styles.label}>{b.label}</AppText>
        </View>
      ))}
    </View>
  );
}

/** Horizontal bars from the admin "Painel" reports. */
export function HBarList({ rows, color }: { rows: { label: string; value: number; valueText: string }[]; color: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <View style={{ gap: 10 }}>
      {rows.map((r) => (
        <View key={r.label} style={{ gap: 5 }}>
          <View style={styles.hRow}>
            <AppText style={{ fontFamily: Fonts.semibold, fontSize: 14, flexShrink: 1 }} numberOfLines={1}>
              {r.label}
            </AppText>
            <AppText style={{ fontFamily: Fonts.monoMedium, fontSize: 12, color: Colors.muted }}>{r.valueText}</AppText>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round((r.value / max) * 100)}%`, backgroundColor: color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 6 },
  value: { fontFamily: Fonts.monoMedium, fontSize: 10, color: Colors.muted },
  bar: { width: '100%', minHeight: 2, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  label: { fontFamily: Fonts.semibold, fontSize: 12 },
  hRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  track: { height: 8, borderRadius: 4, backgroundColor: Colors.fill },
  fill: { height: '100%', borderRadius: 4 },
});
