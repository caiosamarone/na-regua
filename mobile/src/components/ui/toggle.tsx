import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = { value: boolean; onChange: (value: boolean) => void; disabled?: boolean; label: string };

/** The design's pill switch (46×28, green when on). */
export function Toggle({ value, onChange, disabled, label }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onChange(!value)}
      style={[
        styles.track,
        { backgroundColor: value ? Colors.success : Colors.switchOff, justifyContent: value ? 'flex-end' : 'flex-start' },
        disabled && { opacity: 0.4 },
      ]}>
      <View style={styles.thumb} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 46, height: 28, borderRadius: 14, padding: 3, flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});
