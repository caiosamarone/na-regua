import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';

export type SummaryRow = { label: string; value: string };

/** Key/value list used in the booking confirmation sheet and the "Agendado" card. */
export function SummaryRows({ rows, dense }: { rows: SummaryRow[]; dense?: boolean }) {
  return (
    <View>
      {rows.map((r, i) => (
        <View
          key={r.label}
          style={[
            styles.row,
            { paddingVertical: dense ? 10 : 12 },
            i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.line },
          ]}>
          <AppText style={Type.body}>{r.label}</AppText>
          <AppText style={styles.value}>{r.value}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  value: { fontFamily: Fonts.semibold, fontSize: 14, textAlign: 'right', flexShrink: 1 },
});
