import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AuthScreen } from '@/components/auth/auth-screen';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useForgotPassword } from '@/hooks/use-auth-api';
import { errorMessage } from '@/lib/api';
import { emailField } from '@/lib/validation';

const schema = z.object({ email: emailField });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const forgot = useForgotPassword();
  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.email ?? '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    await forgot.mutateAsync(email);
    router.push({ pathname: '/reset-password', params: { email } });
  });

  const error = formState.errors.email?.message || (forgot.error ? errorMessage(forgot.error) : '');

  return (
    <AuthScreen back>
      <View style={styles.body}>
        <View style={styles.header}>
          <AppText style={Type.display} accessibilityRole="header">
            Redefinir senha
          </AppText>
          <AppText style={Type.body}>Enviaremos um código de 6 dígitos para o seu e-mail.</AppText>
        </View>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={onSubmit}
              placeholder="voce@barbearia.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              invalid={!!formState.errors.email}
              accessibilityLabel="E-mail"
            />
          )}
        />
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <Button label="Enviar código" onPress={onSubmit} loading={forgot.isPending} height={54} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 14, paddingTop: 12 },
  header: { gap: 6, marginBottom: 10 },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
});
