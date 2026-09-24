import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

/** 56×56 rounded badge ("@" on the e-mail screen, "!" on the expired link screen). */
export function IconBadge({ glyph, tone }: { glyph: string; tone: 'ink' | 'warning' }) {
  const warning = tone === 'warning';
  return (
    <View style={[styles.badge, { backgroundColor: warning ? Colors.warningBg : Colors.ink }]}>
      <AppText style={[styles.glyph, { color: warning ? Colors.warningText : Colors.onInk }]}>{glyph}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontFamily: Fonts.extrabold, fontSize: 23 },
});
