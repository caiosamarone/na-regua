import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AuthScreen } from '@/components/auth/auth-screen';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useResetPassword } from '@/hooks/use-auth-api';
import { errorMessage } from '@/lib/api';
import { PASSWORD_RULES } from '@/lib/validation';
import { MOCKS_ENABLED } from '@/mocks/config';

const schema = z.object({
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z.string().refine((v) => PASSWORD_RULES.every((r) => r.test(v))),
});
type Form = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const reset = useResetPassword();
  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { otp: '', newPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword' });

  const onSubmit = handleSubmit(async (values) => {
    await reset.mutateAsync({ email, ...values });
    router.dismissTo({ pathname: '/staff-login', params: { email, info: 'reset' } });
  });

  return (
    <AuthScreen back>
      <View style={styles.body}>
        <View style={styles.header}>
          <AppText style={Type.display} accessibilityRole="header">
            Nova senha
          </AppText>
          <AppText style={Type.body}>
            Código enviado para {email}.{MOCKS_ENABLED ? ' Modo demo: qualquer código de 6 dígitos (000000 simula erro).' : ''}
          </AppText>
        </View>
        <Controller
          control={control}
          name="otp"
          render={({ field }) => (
            <TextField
              label="Código"
              value={field.value}
              onChangeText={(v) => field.onChange(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              height={56}
              mono
              style={{ fontSize: 24, letterSpacing: 9.6 }}
            />
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({ field }) => (
            <TextField
              label="Nova senha"
              value={field.value}
              onChangeText={field.onChange}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
            />
          )}
        />
        <View style={{ gap: 6 }}>
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(newPassword);
            const color = ok ? Colors.success : Colors.muted;
            return (
              <View key={rule.label} style={styles.rule} accessibilityLabel={`${rule.label}: ${ok ? 'ok' : 'pendente'}`}>
                <View style={[styles.ruleMark, { borderColor: color, backgroundColor: ok ? color : 'transparent' }]}>
                  {ok ? <AppText style={styles.ruleCheck}>✓</AppText> : null}
                </View>
                <AppText style={[styles.ruleText, { color }]}>{rule.label}</AppText>
              </View>
            );
          })}
        </View>
        {reset.error ? <AppText style={styles.error}>{errorMessage(reset.error)}</AppText> : null}
        <Button
          label="Salvar nova senha"
          onPress={onSubmit}
          loading={reset.isPending}
          dimmed={!formState.isValid}
          height={54}
          style={{ marginTop: 6 }}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 14, paddingTop: 12 },
  header: { gap: 6, marginBottom: 6 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleMark: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ruleCheck: { fontFamily: Fonts.bold, fontSize: 10, color: '#ffffff' },
  ruleText: { fontFamily: Fonts.medium, fontSize: 13 },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
});
