import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';

// Android runs edge-to-edge (SDK 54+), so the window no longer resizes for the keyboard:
// "padding" is needed on both platforms to keep the focused input visible.
export function AuthScreen({ children, back }: { children: ReactNode; back?: boolean }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {back ? <BackHeader /> : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },
  body: { flex: 1 },
});
