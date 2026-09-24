import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { useCancelAppointment, useMarkAppointmentDone } from '@/hooks/use-appointments';
import { errorMessage } from '@/lib/api';
import { brl, formatTime } from '@/lib/format';
import type { Appointment } from '@/types/api';

const REASONS = ['Cliente não veio', 'Pedido do cliente', 'Imprevisto meu', 'Outro'];
export const STATUS_PILL = {
  BOOKED: { label: 'Agendado', bg: Colors.fill, fg: Colors.ink },
  DONE: { label: 'Concluído', bg: Colors.successBg, fg: Colors.success },
  CANCELLED: { label: 'Cancelado', bg: Colors.dangerBg, fg: Colors.danger },
};

type Props = { appointment?: Appointment; timeZone: string; onClose: () => void };

export function AppointmentSheet({ appointment: a, timeZone, onClose }: Props) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const markDone = useMarkAppointmentDone();
  const cancel = useCancelAppointment();

  const close = () => {
    setCancelling(false);
    setReason(null);
    markDone.reset();
    cancel.reset();
    onClose();
  };

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      close();
    } catch {
      // Error message rendered in the sheet.
    }
  };

  const error = markDone.error ?? cancel.error;

  return (
    <Sheet visible={!!a} onClose={close}>
      {a && (
        <>
          <View style={styles.titleRow}>
            <AppText style={[Type.sheetTitle, { flexShrink: 1 }]}>{a.customer?.name ?? 'Cliente'}</AppText>
            <AppText style={styles.time}>{formatTime(a.startTime, timeZone)}</AppText>
          </View>
          <AppText style={Type.body}>
            {`${a.serviceName} · ${a.durationAtBooking} min · ${brl(a.priceAtBooking)}`}
          </AppText>

          {a.status === 'BOOKED' && !cancelling && (
            <>
              <Button
                label="Marcar como concluído"
                onPress={() => run(() => markDone.mutateAsync(a.id))}
                loading={markDone.isPending}
                style={{ marginTop: 4 }}
              />
              <Button
                label="Cancelar atendimento"
                variant="secondary"
                onPress={() => setCancelling(true)}
                height={48}
                style={{ borderColor: Colors.border }}
              />
            </>
          )}

          {a.status === 'BOOKED' && cancelling && (
            <>
              <AppText style={[Type.eyebrow, { marginTop: 6 }]}>Motivo do cancelamento</AppText>
              <View style={styles.reasons}>
                {REASONS.map((r) => (
                  <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />
                ))}
              </View>
              <Button
                label="Confirmar cancelamento"
                variant="dangerSolid"
                dimmed={!reason}
                disabled={!reason}
                loading={cancel.isPending}
                onPress={() => run(() => cancel.mutateAsync({ id: a.id, reason: reason ?? undefined }))}
                style={{ marginTop: 4 }}
              />
            </>
          )}

          {a.status !== 'BOOKED' && (
            <AppText style={{ fontFamily: Fonts.semibold, fontSize: 14, color: STATUS_PILL[a.status].fg }}>
              {a.status === 'CANCELLED' && a.cancellationReason
                ? `${STATUS_PILL[a.status].label} · ${a.cancellationReason}`
                : STATUS_PILL[a.status].label}
            </AppText>
          )}

          {error ? <AppText style={styles.error}>{errorMessage(error)}</AppText> : null}
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  time: { fontFamily: Fonts.monoMedium, fontSize: 14 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.danger },
});
