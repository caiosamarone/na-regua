import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AuthScreen } from '@/components/auth/auth-screen';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useGoogleLogin, useSendMagicLink } from '@/hooks/use-auth-api';
import { errorMessage } from '@/lib/api';
import { getGoogleIdToken } from '@/lib/google-sign-in';
import { emailField, rememberMagicLinkEmail } from '@/lib/validation';
import { MOCKS_ENABLED } from '@/mocks/config';
import { MockGoogleSheet } from '@/mocks/mock-google-sheet';

const schema = z.object({ email: emailField });
type Form = z.infer<typeof schema>;

export default function CustomerLoginScreen() {
  const [googleError, setGoogleError] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [mockPickerOpen, setMockPickerOpen] = useState(false);
  const googleLogin = useGoogleLogin();
  const sendMagicLink = useSendMagicLink();
  const { control, handleSubmit, formState } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const loginWithGoogleToken = async (getToken: () => Promise<string | null>) => {
    setGoogleError('');
    setGoogleBusy(true);
    try {
      const idToken = await getToken();
      if (idToken) await googleLogin.mutateAsync(idToken);
    } catch (error) {
      setGoogleError(errorMessage(error, 'Não foi possível entrar com Google.'));
    } finally {
      setGoogleBusy(false);
    }
  };

  const onGoogle = () => {
    if (MOCKS_ENABLED) setMockPickerOpen(true);
    else void loginWithGoogleToken(getGoogleIdToken);
  };

  const onMagicLink = handleSubmit(async ({ email }) => {
    await sendMagicLink.mutateAsync(email);
    rememberMagicLinkEmail(email);
    router.push({ pathname: '/magic-link-sent', params: { email } });
  });

  const error = formState.errors.email?.message || (sendMagicLink.error ? errorMessage(sendMagicLink.error) : '') || googleError;

  return (
    <AuthScreen>
      <View style={styles.hero}>
        <AppText style={[Type.eyebrow, { color: Colors.accent, letterSpacing: 0.66 }]}>Na Régua</AppText>
        <AppText style={styles.heroTitle} accessibilityRole="header">
          {'Seu horário,\nsem fila.'}
        </AppText>
        <AppText style={styles.heroText}>Entre para encontrar barbearias perto de você e agendar em segundos.</AppText>
      </View>

      <View style={styles.form}>
        <Pressable
          accessibilityRole="button"
          onPress={onGoogle}
          disabled={googleBusy}
          style={({ pressed }) => [styles.google, (pressed || googleBusy) && { backgroundColor: '#f0ede7' }]}>
          <View style={styles.gMark}>
            <AppText style={styles.gText}>G</AppText>
          </View>
          <AppText style={styles.googleLabel}>{googleBusy ? 'Entrando…' : 'Continuar com Google'}</AppText>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.line} />
          <AppText style={[Type.mono12, { fontSize: 11 }]}>OU COM E-MAIL</AppText>
          <View style={styles.line} />
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              value={field.value}
              onChangeText={(v) => {
                field.onChange(v);
                sendMagicLink.reset();
                setGoogleError('');
              }}
              onBlur={field.onBlur}
              onSubmitEditing={onMagicLink}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              invalid={!!formState.errors.email}
              accessibilityLabel="E-mail"
            />
          )}
        />
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <Button
          label={sendMagicLink.isPending ? 'Enviando…' : 'Receber link de acesso'}
          onPress={onMagicLink}
          loading={sendMagicLink.isPending}
          height={54}
        />
        <AppText style={[Type.caption, { textAlign: 'center' }]}>
          Sem senha: enviamos um link de acesso. Se for seu primeiro acesso, a conta é criada automaticamente.
        </AppText>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/staff-login')} style={styles.staffRow}>
        <View style={{ gap: 2 }}>
          <AppText style={{ fontFamily: Fonts.bold, fontSize: 15 }}>Trabalha numa barbearia?</AppText>
          <AppText style={Type.small}>Barbeiros e administradores entram aqui</AppText>
        </View>
        <AppText style={styles.chevron}>›</AppText>
      </Pressable>

      {MOCKS_ENABLED && (
        <MockGoogleSheet
          visible={mockPickerOpen}
          onClose={() => setMockPickerOpen(false)}
          onPick={(idToken) => {
            setMockPickerOpen(false);
            void loginWithGoogleToken(async () => idToken);
          }}
        />
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, minHeight: 200, justifyContent: 'flex-end', gap: 10, paddingBottom: 36 },
  heroTitle: { fontFamily: Fonts.extrabold, fontSize: 40, lineHeight: 42, letterSpacing: -1.2 },
  heroText: { fontSize: 15, lineHeight: 22, color: Colors.muted },
  form: { gap: 12 },
  google: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gText: { fontFamily: Fonts.extrabold, fontSize: 12 },
  googleLabel: { fontFamily: Fonts.bold, fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(28,26,23,0.12)' },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger, marginTop: -4 },
  staffRow: {
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.lineStrong,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  chevron: { fontSize: 22, color: Colors.muted },
});
