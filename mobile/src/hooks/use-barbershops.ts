import { useQueries, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/query-keys';
import { api } from '@/lib/api';
import type { BarbershopListItem, BarbershopProfile, Envelope, Slot } from '@/types/api';

export type BarbershopSearchParams = { lat?: number; lng?: number; radiusKm?: number; q?: string };

export function useBarbershopSearch(params: BarbershopSearchParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.barbershopSearch(params),
    queryFn: () => api.get<Envelope<BarbershopListItem[]>>('/barbershops/search', params).then((r) => r.data),
    enabled,
  });
}

const fetchBarbershop = (id: string) =>
  api.get<Envelope<BarbershopProfile>>(`/barbershops/${id}`).then((r) => r.data);

export function useBarbershop(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.barbershop(id ?? ''),
    queryFn: () => fetchBarbershop(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/** Profiles for several shops (e.g. to show names and timezones next to appointments). */
export function useBarbershops(ids: string[]) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.barbershop(id),
      queryFn: () => fetchBarbershop(id),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const byId = new Map<string, BarbershopProfile>();
  results.forEach((r) => r.data && byId.set(r.data.id, r.data));
  return { byId, isLoading: results.some((r) => r.isLoading) };
}

export function useSlots(
  shopId: string | undefined,
  params: { barberId?: string; serviceId?: string; date?: string },
) {
  const { barberId, serviceId, date } = params;
  return useQuery({
    queryKey: queryKeys.slots(shopId ?? '', { barberId: barberId ?? '', serviceId: serviceId ?? '', date: date ?? '' }),
    queryFn: () =>
      api.get<Envelope<Slot[]>>(`/barbershops/${shopId}/slots`, { barberId, serviceId, date }).then((r) => r.data),
    enabled: !!shopId && !!barberId && !!serviceId && !!date,
  });
}
