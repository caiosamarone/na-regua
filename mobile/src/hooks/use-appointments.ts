import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/query-keys';
import { api } from '@/lib/api';
import type { Appointment, CancelAppointmentResult, Envelope, Paginated } from '@/types/api';

export function useMyAppointments() {
  return useQuery({
    queryKey: queryKeys.myAppointments,
    queryFn: () =>
      api.get<Paginated<Appointment>>('/customers/me/appointments', { pageSize: 100 }).then((r) => r.data),
  });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.appointment(id ?? ''),
    queryFn: () => api.get<Envelope<Appointment>>(`/appointments/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { barbershopId: string; barberId: string; serviceId: string; startTime: string }) =>
      api.post<Envelope<Appointment>>('/appointments', input).then((r) => r.data),
    onSuccess: (appointment) => {
      queryClient.setQueryData(queryKeys.appointment(appointment.id), appointment);
      queryClient.invalidateQueries({ queryKey: queryKeys.myAppointments });
      queryClient.invalidateQueries({ queryKey: ['barbershops', appointment.barbershopId, 'slots'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch<Envelope<CancelAppointmentResult>>(`/appointments/${id}/cancel`, { reason }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myAppointments });
      queryClient.invalidateQueries({ queryKey: ['barbershops'] });
      queryClient.invalidateQueries({ queryKey: ['staff', 'me'] });
    },
  });
}

export function useShopAppointments(shopId: string, params: { from: string; to: string; barberId?: string }) {
  return useQuery({
    queryKey: queryKeys.shopAppointments(shopId, params),
    queryFn: () =>
      api
        .get<Paginated<Appointment>>(`/barbershops/${shopId}/appointments`, { ...params, pageSize: 100 })
        .then((r) => r.data),
  });
}

export function useMarkAppointmentDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<Envelope<Appointment>>(`/appointments/${id}/done`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbershops'] });
      queryClient.invalidateQueries({ queryKey: ['staff', 'me'] });
    },
  });
}
