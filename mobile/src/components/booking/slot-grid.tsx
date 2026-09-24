import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';
import type { Slot } from '@/types/api';

const COLUMNS = 4;

type Props = { slots: Slot[]; selected: string | null; onSelect: (slot: Slot) => void };

/** Four-column grid of free times (the API only returns available slots). */
export function SlotGrid({ slots, selected, onSelect }: Props) {
  const rows: Slot[][] = [];
  for (let i = 0; i < slots.length; i += COLUMNS) rows.push(slots.slice(i, i + COLUMNS));

  return (
    <View style={{ gap: 8 }}>
      {rows.map((row) => (
        <View key={row[0].startTimeUtc} style={styles.row}>
          {row.map((slot) => {
            const on = slot.startTimeUtc === selected;
            return (
              <Pressable
                key={slot.startTimeUtc}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => onSelect(slot)}
                style={[
                  styles.slot,
                  on
                    ? { backgroundColor: Colors.ink, borderColor: Colors.ink }
                    : { backgroundColor: Colors.surface, borderColor: 'rgba(28,26,23,0.12)' },
                ]}>
                <AppText style={[styles.label, { color: on ? Colors.onInk : Colors.ink }]}>{slot.startTimeLocal}</AppText>
              </Pressable>
            );
          })}
          {Array.from({ length: COLUMNS - row.length }, (_, i) => (
            <View key={`pad-${i}`} style={styles.pad} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  slot: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pad: { flex: 1 },
  label: { fontFamily: Fonts.monoMedium, fontSize: 14 },
});
