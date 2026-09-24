import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  invalid?: boolean;
  /** Rendered inside the field, on the right (e.g. "Mostrar" for passwords). */
  accessory?: ReactNode;
  height?: number;
  mono?: boolean;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, invalid, accessory, height = 52, mono, style, ...props },
  ref,
) {
  const field = (
    <View style={[styles.box, { height, borderColor: invalid ? Colors.dangerBorder : Colors.border }]}>
      <TextInput
        ref={ref}
        placeholderTextColor={Colors.faint}
        {...props}
        style={[styles.input, mono && { fontFamily: Fonts.monoMedium }, style]}
      />
      {accessory}
    </View>
  );
  if (!label) return field;
  return (
    <View style={styles.labelWrap}>
      <AppText style={styles.label}>{label}</AppText>
      {field}
    </View>
  );
});

const styles = StyleSheet.create({
  labelWrap: { gap: 6 },
  label: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.muted },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: Colors.surface,
    paddingLeft: 16,
    paddingRight: 6,
  },
  input: { flex: 1, height: '100%', fontFamily: Fonts.regular, fontSize: 16, color: Colors.ink },
});
