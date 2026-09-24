import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/query-keys';
import { api } from '@/lib/api';
import type {
  AdminService,
  BarberCommissions,
  BarbershopMetrics,
  Envelope,
  OperatingHour,
  StaffMember,
} from '@/types/api';

export function useMyCommissions(params: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys.myCommissions(params),
    queryFn: () => api.get<Envelope<BarberCommissions>>('/staff/me/commissions', params).then((r) => r.data),
  });
}

export function useBarbershopMetrics(shopId: string, params: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys.shopMetrics(shopId, params),
    queryFn: () =>
      api.get<Envelope<BarbershopMetrics>>(`/barbershops/${shopId}/metrics`, params).then((r) => r.data),
  });
}

export function useStaffMembers(shopId: string) {
  return useQuery({
    queryKey: queryKeys.staff(shopId),
    queryFn: () => api.get<Envelope<StaffMember[]>>(`/barbershops/${shopId}/staff`, { all: true }).then((r) => r.data),
  });
}

export function useUpdateStaffMember(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; isBookable?: boolean; commissionPercent?: number | null }) =>
      api.patch<Envelope<StaffMember>>(`/staff/${id}`, input).then((r) => r.data),
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.staff(shopId) });
      const previous = queryClient.getQueryData<StaffMember[]>(queryKeys.staff(shopId));
      queryClient.setQueryData<StaffMember[]>(queryKeys.staff(shopId), (list) =>
        list?.map((m) => (m.id === id ? { ...m, ...input } : m)),
      );
      return { previous };
    },
    onError: (_error, _input, context) => queryClient.setQueryData(queryKeys.staff(shopId), context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff(shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.barbershop(shopId) });
    },
  });
}

export function useInviteStaff(shopId: string) {
  return useMutation({
    mutationFn: (input: { name: string; email: string; role: 'BARBER'; commissionPercent?: number }) =>
      api.post<Envelope<unknown>>(`/barbershops/${shopId}/staff`, input),
  });
}

export function useAdminServices(shopId: string) {
  return useQuery({
    queryKey: queryKeys.services(shopId),
    queryFn: () =>
      api.get<Envelope<AdminService[]>>(`/barbershops/${shopId}/services`, { all: true }).then((r) => r.data),
  });
}

export function useUpdateService(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; price?: number; durationMinutes?: number }) =>
      api.patch<Envelope<AdminService>>(`/services/${id}`, input).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services(shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.barbershop(shopId) });
    },
  });
}

/** The API has no "reactivate": deactivating a service is a soft delete. */
export function useDeactivateService(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services(shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.barbershop(shopId) });
    },
  });
}

export function useReplaceOperatingHours(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hours: OperatingHour[]) => api.put<Envelope<unknown>>(`/barbershops/${shopId}/operating-hours`, hours),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.barbershop(shopId) }),
  });
}
