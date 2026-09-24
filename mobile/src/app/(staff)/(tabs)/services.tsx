import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/misc';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Toggle } from '@/components/ui/toggle';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useAdminServices, useDeactivateService, useUpdateService } from '@/hooks/use-staff-area';
import { errorMessage } from '@/lib/api';
import { useStaffSession } from '@/lib/auth';
import { brl } from '@/lib/format';
import type { AdminService } from '@/types/api';

export default function ServicesScreen() {
  const user = useStaffSession();
  const services = useAdminServices(user.barbershopId);
  const deactivate = useDeactivateService(user.barbershopId);
  const [editing, setEditing] = useState<AdminService | null>(null);

  const confirmDeactivate = (service: AdminService) =>
    Alert.alert(
      `Desativar ${service.name}?`,
      'O serviço some do agendamento. Por enquanto, reativar só é possível pelo painel web.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desativar', style: 'destructive', onPress: () => deactivate.mutate(service.id) },
      ],
    );

  return (
    <Screen contentStyle={{ gap: 6 }} refreshing={services.isRefetching} onRefresh={() => void services.refetch()}>
      <View style={{ marginBottom: 8 }}>
        <ScreenTitle title="Serviços" />
      </View>
      {deactivate.error ? <AppText style={styles.error}>{errorMessage(deactivate.error)}</AppText> : null}
      {services.isLoading ? (
        <LoadingState />
      ) : !services.data ? (
        <ErrorState message={errorMessage(services.error)} onRetry={() => void services.refetch()} />
      ) : (
        services.data.map((v) => (
          <View key={v.id} style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar ${v.name}`}
              onPress={() => setEditing(v)}
              style={[styles.rowBody, !v.isActive && { opacity: 0.5 }]}>
              <AppText style={Type.rowTitle}>{v.name}</AppText>
              <AppText style={Type.mono12}>{`${v.durationMinutes} min · ${brl(v.price)} · editar`}</AppText>
            </Pressable>
            <Toggle
              label={`${v.name} ativo`}
              value={v.isActive}
              disabled={!v.isActive || deactivate.isPending}
              onChange={() => confirmDeactivate(v)}
            />
          </View>
        ))
      )}
      <AppText style={[Type.caption, { marginTop: 8 }]}>
        Serviços inativos somem do agendamento. Agendamentos já feitos mantêm o preço da época.
      </AppText>
      <EditServiceSheet shopId={user.barbershopId} service={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}

const editSchema = z.object({
  price: z.string().regex(/^\d+$/, 'Preço inválido.'),
  duration: z
    .string()
    .regex(/^\d+$/, 'Duração inválida.')
    .refine((v) => Number(v) >= 5 && Number(v) <= 480, 'A duração vai de 5 a 480 min.'),
});
type EditForm = z.infer<typeof editSchema>;

function EditServiceSheet({ shopId, service, onClose }: { shopId: string; service: AdminService | null; onClose: () => void }) {
  const update = useUpdateService(shopId);
  const { control, handleSubmit, reset, formState } = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (service) reset({ price: String(Math.round(service.price)), duration: String(service.durationMinutes) });
  }, [service, reset]);

  const close = () => {
    update.reset();
    onClose();
  };
  const save = handleSubmit(async ({ price, duration }) => {
    if (!service) return;
    await update.mutateAsync({ id: service.id, price: Number(price), durationMinutes: Number(duration) });
    close();
  });

  const error = formState.errors.price?.message || formState.errors.duration?.message || (update.error ? errorMessage(update.error) : '');

  return (
    <Sheet visible={!!service} onClose={close}>
      <AppText style={Type.sheetTitle}>{service?.name ?? ''}</AppText>
      <View style={styles.fields}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <TextField
                label="Preço (R$)"
                value={field.value}
                onChangeText={(v) => field.onChange(v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                height={48}
                mono
              />
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="duration"
            render={({ field }) => (
              <TextField
                label="Duração (min)"
                value={field.value}
                onChangeText={(v) => field.onChange(v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                height={48}
                mono
              />
            )}
          />
        </View>
      </View>
      {error ? <AppText style={styles.error}>{error}</AppText> : null}
      <Button label="Salvar" onPress={save} loading={update.isPending} style={{ marginTop: 4 }} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  rowBody: { flex: 1, gap: 3 },
  fields: { flexDirection: 'row', gap: 10 },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
});
