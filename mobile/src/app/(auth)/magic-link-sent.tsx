import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { IconBadge } from '@/components/auth/icon-badge';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useSendMagicLink } from '@/hooks/use-auth-api';
import { errorMessage } from '@/lib/api';
import { MOCKS_ENABLED } from '@/mocks/config';

const COOLDOWN_SECONDS = 30;

export default function MagicLinkSentScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const resend = useSendMagicLink();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const onResend = async () => {
    if (cooldown > 0 || resend.isPending || !email) return;
    try {
      await resend.mutateAsync(email);
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      // Error message rendered below.
    }
  };

  return (
    <AuthScreen>
      <View style={styles.body}>
        <IconBadge glyph="@" tone="ink" />
        <View style={{ gap: 8 }}>
          <AppText style={Type.display} accessibilityRole="header">
            Confira seu e-mail
          </AppText>
          <AppText style={styles.text}>
            Enviamos um link de acesso para <AppText style={styles.strong}>{email}</AppText>. Abra o e-mail neste
            celular: ele vale por 15 minutos e só pode ser usado uma vez.
          </AppText>
        </View>
        <View style={styles.list}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: cooldown > 0 }}
            onPress={onResend}
            style={[styles.row, styles.rowBorder, (cooldown > 0 || resend.isPending) && { opacity: 0.45 }]}>
            <AppText style={styles.rowText}>Reenviar link</AppText>
            <AppText style={Type.mono12}>
              {resend.isPending ? 'enviando…' : cooldown > 0 ? `em ${cooldown}s` : 'novo link'}
            </AppText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={[styles.row, styles.rowBorder]}>
            <AppText style={styles.rowText}>Usar outro e-mail</AppText>
          </Pressable>
          {MOCKS_ENABLED && (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/auth/magic-link', params: { token: `mock-magic:${email}` } })}
                style={[styles.row, styles.rowBorder]}>
                <AppText style={styles.rowText}>Demo: abrir link do e-mail</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/auth/magic-link', params: { token: 'expired' } })}
                style={styles.row}>
                <AppText style={[Type.small, { fontSize: 13 }]}>Demo: simular link expirado</AppText>
              </Pressable>
            </>
          )}
        </View>
        {resend.error ? <AppText style={styles.error}>{errorMessage(resend.error)}</AppText> : null}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 20, paddingTop: 28 },
  text: { fontSize: 15, lineHeight: 22, color: Colors.muted },
  strong: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.ink },
  list: { borderTopWidth: 1, borderTopColor: Colors.lineStrong },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.line },
  rowText: { fontFamily: Fonts.semibold, fontSize: 15 },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
});
