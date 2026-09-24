import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Avatar, ErrorState, LoadingState, Notice } from '@/components/ui/misc';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { Stepper } from '@/components/ui/stepper';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Toggle } from '@/components/ui/toggle';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useInviteStaff, useStaffMembers, useUpdateStaffMember } from '@/hooks/use-staff-area';
import { errorMessage } from '@/lib/api';
import { useStaffSession } from '@/lib/auth';
import { emailField } from '@/lib/validation';
import type { StaffMember } from '@/types/api';

const COMMISSION_STEP = 5;
const DEFAULT_INVITE_COMMISSION = 40;

export default function TeamScreen() {
  const user = useStaffSession();
  const staff = useStaffMembers(user.barbershopId);
  const update = useUpdateStaffMember(user.barbershopId);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invited, setInvited] = useState('');

  const setCommission = (m: StaffMember, delta: number) => {
    if (m.commissionPercent == null) return;
    const next = Math.min(100, Math.max(0, m.commissionPercent + delta));
    if (next !== m.commissionPercent) update.mutate({ id: m.id, commissionPercent: next });
  };

  return (
    <Screen contentStyle={{ gap: 6 }} refreshing={staff.isRefetching} onRefresh={() => void staff.refetch()}>
      <View style={styles.titleRow}>
        <ScreenTitle title="Equipe" />
        <Button
          label="+ Convidar"
          onPress={() => {
            setInvited('');
            setInviteOpen(true);
          }}
          height={36}
          style={{ borderRadius: 18, paddingHorizontal: 14 }}
        />
      </View>
      {invited ? <Notice tone="success">{`Convite enviado para ${invited}.`}</Notice> : null}
      {update.error ? <AppText style={styles.error}>{errorMessage(update.error)}</AppText> : null}

      {staff.isLoading ? (
        <LoadingState />
      ) : !staff.data ? (
        <ErrorState message={errorMessage(staff.error)} onRetry={() => void staff.refetch()} />
      ) : (
        staff.data.map((m) => (
          <View key={m.id} style={[styles.member, !m.isActive && { opacity: 0.5 }]}>
            <View style={styles.memberTop}>
              <Avatar name={m.name} uri={m.avatarUrl} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText style={Type.rowTitle}>{m.name}</AppText>
                <AppText style={Type.small}>
                  {!m.isActive ? 'Inativo' : m.role === 'BARBERSHOP_ADMIN' ? 'Admin' : 'Barbeiro'}
                </AppText>
              </View>
            </View>
            <View style={styles.controls}>
              <View style={styles.control}>
                <AppText style={Type.small}>Comissão</AppText>
                <Stepper
                  label="comissão"
                  value={m.commissionPercent == null ? '—' : `${m.commissionPercent}%`}
                  disabled={m.commissionPercent == null}
                  onDecrement={() => setCommission(m, -COMMISSION_STEP)}
                  onIncrement={() => setCommission(m, COMMISSION_STEP)}
                />
              </View>
              <View style={styles.control}>
                <AppText style={Type.small}>Agendável</AppText>
                <Toggle
                  label={`${m.name} agendável`}
                  value={m.isBookable}
                  onChange={(isBookable) => update.mutate({ id: m.id, isBookable })}
                />
              </View>
            </View>
          </View>
        ))
      )}
      <AppText style={[Type.caption, { marginTop: 8 }]}>
        Só membros agendáveis aparecem para o cliente na escolha de barbeiro. Convidados aparecem aqui depois de criar a
        senha.
      </AppText>

      <InviteSheet
        open={inviteOpen}
        shopId={user.barbershopId}
        onClose={() => setInviteOpen(false)}
        onInvited={(email) => {
          setInvited(email);
          setInviteOpen(false);
        }}
      />
    </Screen>
  );
}

const inviteSchema = z.object({ name: z.string().trim().min(1, 'Informe o nome.'), email: emailField });
type InviteForm = z.infer<typeof inviteSchema>;

function InviteSheet({
  open,
  shopId,
  onClose,
  onInvited,
}: {
  open: boolean;
  shopId: string;
  onClose: () => void;
  onInvited: (email: string) => void;
}) {
  const invite = useInviteStaff(shopId);
  const { control, handleSubmit, formState, reset } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    mode: 'onChange',
    defaultValues: { name: '', email: '' },
  });

  const close = () => {
    reset();
    invite.reset();
    onClose();
  };
  const submit = handleSubmit(async (values) => {
    await invite.mutateAsync({ ...values, role: 'BARBER', commissionPercent: DEFAULT_INVITE_COMMISSION });
    reset();
    onInvited(values.email);
  });

  return (
    <Sheet visible={open} onClose={close}>
      <AppText style={Type.sheetTitle}>Convidar barbeiro</AppText>
      <AppText style={Type.body}>Enviamos um e-mail para ele criar a senha.</AppText>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField value={field.value} onChangeText={field.onChange} placeholder="Nome" height={48} autoCapitalize="words" />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            value={field.value}
            onChangeText={field.onChange}
            placeholder="E-mail"
            height={48}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      {invite.error ? <AppText style={styles.error}>{errorMessage(invite.error)}</AppText> : null}
      <Button label="Enviar convite" onPress={submit} loading={invite.isPending} dimmed={!formState.isValid} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  member: { gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.line },
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingLeft: 56 },
  control: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
});
