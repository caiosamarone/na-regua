import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { IconBadge } from '@/components/auth/icon-badge';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useSendMagicLink, useVerifyMagicLink } from '@/hooks/use-auth-api';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getLastMagicLinkEmail } from '@/lib/validation';

/** Target of naregua://auth/magic-link?token=… (the e-mail sent with client "mobile"). */
export default function MagicLinkScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { session } = useAuth();
  const verify = useVerifyMagicLink();
  const resend = useSendMagicLink();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !token) return;
    started.current = true;
    verify.mutate(token);
  }, [token, verify]);

  const failed = !token || verify.isError;

  // Navigate only once the new session is in state, so the (customer) guard lets us through.
  if (verify.isSuccess && session?.kind === 'customer') return <Redirect href="/explore" />;

  if (!failed) {
    return (
      <AuthScreen>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.ink} />
          <AppText style={Type.body}>Entrando…</AppText>
        </View>
      </AuthScreen>
    );
  }

  const email = getLastMagicLinkEmail();
  const onResend = async () => {
    try {
      await resend.mutateAsync(email);
      router.replace({ pathname: '/magic-link-sent', params: { email } });
    } catch {
      // Error message rendered below.
    }
  };

  return (
    <AuthScreen>
      <View style={styles.body}>
        <IconBadge glyph="!" tone="warning" />
        <View style={{ gap: 8 }}>
          <AppText style={Type.display} accessibilityRole="header">
            Link inválido ou expirado
          </AppText>
          <AppText style={styles.text}>
            Links de acesso valem 15 minutos e funcionam uma única vez.
            {email ? ` Peça um novo para ${email}.` : ' Peça um novo na tela de entrada.'}
          </AppText>
        </View>
        {email ? <Button label="Enviar novo link" onPress={onResend} loading={resend.isPending} height={54} /> : null}
        {resend.error ? <AppText style={styles.error}>{errorMessage(resend.error)}</AppText> : null}
        <Button
          label="Voltar ao início"
          variant="secondary"
          onPress={() => router.replace('/login')}
          height={48}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  body: { flex: 1, gap: 20, paddingTop: 28 },
  text: { fontSize: 15, lineHeight: 22, color: Colors.muted },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
});
