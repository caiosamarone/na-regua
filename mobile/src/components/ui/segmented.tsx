import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

type Props<K extends string> = { options: { key: K; label: string }[]; value: K; onChange: (key: K) => void };

export function Segmented<K extends string>({ options, value, onChange }: Props<K>) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={[styles.item, on && styles.itemOn]}>
            <AppText style={styles.label}>{o.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 4, padding: 4, backgroundColor: Colors.fill, borderRadius: 12 },
  item: { flex: 1, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  itemOn: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: { fontFamily: Fonts.semibold, fontSize: 13 },
});
