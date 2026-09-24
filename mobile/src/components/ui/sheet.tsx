import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

type Props = { visible: boolean; onClose: () => void; children: ReactNode; background?: string };

/** Bottom sheet from the design: dimmed backdrop, rounded top, grab handle. */
export function Sheet({ visible, onClose, children, background = Colors.background }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* "padding" on both platforms: with Android edge-to-edge the window does not resize for the keyboard. */}
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={[styles.sheet, { backgroundColor: background, paddingBottom: Math.max(insets.bottom, 20) + 14 }]}>
          <View style={styles.handle} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: Colors.overlay },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingHorizontal: 20, gap: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(28,26,23,0.2)', alignSelf: 'center' },
});
