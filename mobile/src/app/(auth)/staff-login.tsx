import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AuthScreen } from '@/components/auth/auth-screen';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/misc';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useStaffLogin } from '@/hooks/use-auth-api';
import { errorMessage } from '@/lib/api';
import { emailField } from '@/lib/validation';
import { MOCKS_ENABLED } from '@/mocks/config';

const schema = z.object({
  email: emailField,
  password: z.string().min(8, 'A senha tem no mínimo 8 caracteres.'),
});
type Form = z.infer<typeof schema>;

export default function StaffLoginScreen() {
  const params = useLocalSearchParams<{ email?: string; info?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const login = useStaffLogin();
  const { control, handleSubmit, formState, getValues } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.email ?? '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await login.mutateAsync(values);
    if (result.kind === 'superAdmin') router.push('/super-admin');
    // Signed-in users are moved out of (auth) by the root layout guards.
  });

  const { errors } = formState;
  const error = errors.email?.message || errors.password?.message || (login.error ? errorMessage(login.error) : '');
  const credentialsError = !!login.error;

  return (
    <AuthScreen back>
      <View style={styles.body}>
        <View style={styles.header}>
          <AppText style={[Type.eyebrow, { color: Colors.accent, letterSpacing: 0.66 }]}>Equipe</AppText>
          <AppText style={Type.display} accessibilityRole="header">
            Entrar na barbearia
          </AppText>
          <AppText style={Type.body}>Use o e-mail e a senha criados no convite do administrador.</AppText>
        </View>

        {params.info === 'reset' ? <Notice tone="success">Senha alterada. Entre com a nova senha.</Notice> : null}
        {MOCKS_ENABLED && (
          <Notice tone="neutral">
            {'Modo demo · senha admin123\nze@barbearia.com (admin) · carlos@barbearia.com (barbeiro) · super@naregua.app'}
          </Notice>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label="E-mail"
              value={field.value}
              onChangeText={(v) => {
                field.onChange(v);
                login.reset();
              }}
              onBlur={field.onBlur}
              placeholder="voce@barbearia.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="username"
              invalid={!!errors.email}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label="Senha"
              value={field.value}
              onChangeText={(v) => {
                field.onChange(v);
                login.reset();
              }}
              onBlur={field.onBlur}
              onSubmitEditing={onSubmit}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              invalid={!!errors.password || (credentialsError && !errors.email)}
              accessory={
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.toggle}>
                  <AppText style={styles.toggleText}>{showPassword ? 'Ocultar' : 'Mostrar'}</AppText>
                </Pressable>
              }
            />
          )}
        />
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <Button
          label={login.isPending ? 'Entrando…' : 'Entrar'}
          onPress={onSubmit}
          loading={login.isPending}
          height={54}
          style={{ marginTop: 4 }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/forgot-password', params: { email: getValues('email') } })}
          style={styles.forgot}>
          <AppText style={styles.forgotText}>Esqueci minha senha</AppText>
        </Pressable>
        <AppText style={[Type.caption, styles.footer]}>
          Ainda não tem acesso? Peça ao administrador da barbearia um convite por e-mail.
        </AppText>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 14, paddingTop: 12 },
  header: { gap: 6, marginBottom: 10 },
  toggle: { height: 40, paddingHorizontal: 10, justifyContent: 'center' },
  toggleText: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.muted },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
  forgot: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
  forgotText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.accentText },
  footer: { marginTop: 'auto', textAlign: 'center' },
});
