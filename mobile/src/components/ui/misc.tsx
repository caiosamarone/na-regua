import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { initials } from '@/lib/format';

export function Eyebrow({ children, color, style }: { children: string; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <AppText style={[Type.eyebrow, color ? { color } : null]}>{children}</AppText>
    </View>
  );
}

/** Photo slot: shows the image when there is one, otherwise the design's neutral placeholder. */
export function PhotoPlaceholder({
  uri,
  label = 'foto',
  style,
}: {
  uri?: string | null;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.photo, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
      ) : (
        <AppText style={styles.photoLabel}>{label}</AppText>
      )}
    </View>
  );
}

export function Avatar({ name, size = 44, uri }: { name: string; size?: number; uri?: string | null }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <AppText style={[styles.avatarText, { fontSize: size >= 50 ? 14 : 13 }]}>{initials(name)}</AppText>
      )}
    </View>
  );
}

export function StatusDot({ color }: { color: string }) {
  return <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />;
}

export function LoadingState() {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={Colors.ink} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.errorBox}>
      <AppText style={Type.body}>{message}</AppText>
      {onRetry && (
        <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
          <AppText style={styles.retry}>Tentar de novo</AppText>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyText({ children }: { children: string }) {
  return <AppText style={[Type.body, { paddingVertical: 12 }]}>{children}</AppText>;
}

export function Notice({ tone, children }: { tone: 'success' | 'warning' | 'neutral'; children: string }) {
  const palette = {
    success: { bg: Colors.successBg, fg: Colors.successText, font: Fonts.semibold },
    warning: { bg: Colors.warningBg, fg: Colors.ink, font: Fonts.regular },
    neutral: { bg: 'rgba(28,26,23,0.06)', fg: Colors.ink, font: Fonts.regular },
  }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: palette.bg }]}>
      <AppText style={{ fontFamily: palette.font, fontSize: 13, lineHeight: 19, color: palette.fg }}>{children}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: Colors.placeholder,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.faint },
  avatar: {
    backgroundColor: Colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontFamily: Fonts.semibold, color: Colors.muted },
  state: { paddingVertical: 48, alignItems: 'center' },
  errorBox: { paddingVertical: 24, gap: 8, alignItems: 'flex-start' },
  retry: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.accentText },
  notice: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
});
