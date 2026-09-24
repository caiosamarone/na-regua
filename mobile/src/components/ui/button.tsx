import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'dangerSolid' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  /** Dimmed like the prototype's inactive buttons; still pressable unless `disabled`. */
  dimmed?: boolean;
  disabled?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const VARIANTS: Record<Variant, { bg: string; fg: string; border?: string; font: string; size: number }> = {
  primary: { bg: Colors.ink, fg: Colors.onInk, font: Fonts.bold, size: 16 },
  secondary: { bg: 'transparent', fg: Colors.ink, border: Colors.border, font: Fonts.semibold, size: 16 },
  danger: { bg: 'transparent', fg: Colors.danger, border: Colors.dangerBorder, font: Fonts.bold, size: 16 },
  dangerSolid: { bg: Colors.dangerBorder, fg: '#ffffff', font: Fonts.bold, size: 16 },
  ghost: { bg: 'transparent', fg: Colors.ink, font: Fonts.semibold, size: 15 },
};

export function Button({ label, onPress, variant = 'primary', loading, dimmed, disabled, height = 52, style }: Props) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        { height, backgroundColor: v.bg, borderColor: v.border ?? 'transparent', borderWidth: v.border ? 1 : 0 },
        (dimmed || loading) && { opacity: loading ? 0.6 : 0.4 },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <AppText style={{ fontFamily: v.font, fontSize: v.size, color: v.fg }}>{label}</AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
});
