import { AppText } from '@/components/ui/text';
import { Type } from '@/constants/theme';
import { useSlots } from '@/hooks/use-barbershops';
import { addDays, todayIn } from '@/lib/format';

type Props = { shopId: string; barberId: string; serviceId?: string; timeZone: string };

/** "Próximo horário: hoje 11:00", looking at today and then tomorrow. */
export function NextSlotText({ shopId, barberId, serviceId, timeZone }: Props) {
  const today = todayIn(timeZone);
  const tomorrow = addDays(today, 1);
  const todaySlots = useSlots(shopId, { barberId, serviceId, date: today.iso });
  const needTomorrow = todaySlots.isSuccess && todaySlots.data.length === 0;
  const tomorrowSlots = useSlots(shopId, { barberId, serviceId: needTomorrow ? serviceId : undefined, date: tomorrow.iso });

  let text = ' ';
  if (todaySlots.data?.length) text = `Próximo horário: hoje ${todaySlots.data[0].startTimeLocal}`;
  else if (tomorrowSlots.data?.length) text = `Próximo horário: amanhã ${tomorrowSlots.data[0].startTimeLocal}`;
  else if (tomorrowSlots.isSuccess) text = 'Sem horários hoje nem amanhã';
  else if (todaySlots.isError || tomorrowSlots.isError) text = 'Ver horários';

  return <AppText style={Type.small}>{text}</AppText>;
}
