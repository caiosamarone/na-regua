import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

type Props = { value: string; onDecrement: () => void; onIncrement: () => void; disabled?: boolean; label: string };

export function Stepper({ value, onDecrement, onIncrement, disabled, label }: Props) {
  return (
    <View style={styles.row}>
      <StepButton text="−" onPress={onDecrement} disabled={disabled} label={`Diminuir ${label}`} />
      <AppText style={styles.value}>{value}</AppText>
      <StepButton text="+" onPress={onIncrement} disabled={disabled} label={`Aumentar ${label}`} />
    </View>
  );
}

function StepButton({ text, onPress, disabled, label }: { text: string; onPress: () => void; disabled?: boolean; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={[styles.button, disabled && { opacity: 0.3 }]}>
      <AppText style={styles.buttonText}>{text}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontFamily: Fonts.monoMedium, fontSize: 14, width: 40, textAlign: 'center' },
  button: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontFamily: Fonts.semibold, fontSize: 16 },
});
