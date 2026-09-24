import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

export type DayItem = { key: string; label: string; num: number; closed: boolean };

type Props = { days: DayItem[]; selected: string; onSelect: (key: string) => void; disableClosed?: boolean };

export function DayStrip({ days, selected, onSelect, disableClosed }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
      {days.map((d) => {
        const on = d.key === selected;
        return (
          <Pressable
            key={d.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled: disableClosed && d.closed }}
            accessibilityLabel={`${d.label} ${d.num}${d.closed ? ', fechado' : ''}`}
            disabled={disableClosed && d.closed}
            onPress={() => onSelect(d.key)}
            style={[
              styles.day,
              on
                ? { backgroundColor: Colors.ink, borderColor: Colors.ink }
                : { backgroundColor: 'transparent', borderColor: Colors.borderStrong },
              d.closed && { opacity: 0.4 },
            ]}>
            <AppText style={[styles.label, { color: on ? Colors.onInk : Colors.ink }]}>{d.label}</AppText>
            <AppText style={[styles.num, { color: on ? Colors.onInk : Colors.ink }]}>{d.num}</AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -20, flexGrow: 0 },
  row: { gap: 8, paddingHorizontal: 20, paddingVertical: 2 },
  day: { width: 56, height: 66, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: Fonts.medium, fontSize: 11 },
  num: { fontFamily: Fonts.bold, fontSize: 18 },
});
