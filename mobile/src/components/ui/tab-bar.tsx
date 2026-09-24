import type { TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

/** Text-only tab button from the design: accent when focused, muted otherwise. */
export const TabButton = forwardRef<View, TabTriggerSlotProps & { label: string }>(function TabButton(
  { label, isFocused, ...props },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={styles.button}>
      <AppText style={[styles.label, { color: isFocused ? Colors.accent : Colors.muted }]} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
});

export function TabBarContainer({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.lineStrong,
    backgroundColor: Colors.background,
    paddingTop: 4,
  },
  button: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  label: { fontFamily: Fonts.bold, fontSize: 12 },
});
