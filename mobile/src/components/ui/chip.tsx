import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: Colors.ink, borderColor: Colors.ink }
          : { backgroundColor: 'transparent', borderColor: Colors.borderStrong },
      ]}>
      <AppText style={[styles.label, { color: selected ? Colors.onInk : Colors.ink }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, justifyContent: 'center' },
  label: { fontFamily: Fonts.semibold, fontSize: 13 },
});
