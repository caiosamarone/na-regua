import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';

type Props = {
  children: ReactNode;
  /** Pinned below the scroll area (e.g. the booking "Continuar" bar). */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Tabs screens sit above the tab bar, which already handles the bottom inset. */
  bottomInset?: boolean;
};

export function Screen({ children, footer, contentStyle, refreshing, onRefresh, bottomInset = false }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={bottomInset ? ['top', 'bottom'] : ['top']}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={Colors.muted} /> : undefined
        }>
        {children}
      </ScrollView>
      {footer}
    </SafeAreaView>
  );
}

export function ScreenTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View style={{ gap: 2 }}>
      {eyebrow ? <AppText style={Type.eyebrow}>{eyebrow}</AppText> : null}
      <AppText style={Type.title} accessibilityRole="header">
        {title}
      </AppText>
    </View>
  );
}

/** "‹ Voltar" row with an optional step label on the right ("PASSO 1 DE 3"). */
export function BackHeader({ step, onBack }: { step?: string; onBack?: () => void }) {
  return (
    <View style={styles.backRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={onBack ?? (() => router.back())}
        style={styles.backButton}
        hitSlop={8}>
        <AppText style={styles.backText}>‹ Voltar</AppText>
      </Pressable>
      {step ? <AppText style={[Type.mono12, { fontSize: 11 }]}>{step}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  fill: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 14, flexGrow: 1 },
  backRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { minHeight: 44, justifyContent: 'center' },
  backText: { fontFamily: Fonts.semibold, fontSize: 15 },
});
