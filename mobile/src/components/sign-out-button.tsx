import { Alert, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export function SignOutButton() {
  const { signOut } = useAuth();
  const confirm = () =>
    Alert.alert('Sair da conta?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);
  return (
    <Pressable accessibilityRole="button" onPress={confirm} style={styles.button} hitSlop={6}>
      <AppText style={styles.text}>Sair</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  text: { fontFamily: Fonts.semibold, fontSize: 13 },
});
