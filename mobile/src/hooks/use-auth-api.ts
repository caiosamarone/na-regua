import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { AuthTokens, CustomerPayload, Envelope, StaffPayload } from '@/types/api';

type CustomerAuth = AuthTokens & { customer: CustomerPayload };
type StaffAuth = AuthTokens & { staff: StaffPayload };

export function useGoogleLogin() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: (idToken: string) =>
      api.post<Envelope<CustomerAuth>>('/auth/google', { idToken }, { auth: false }).then((r) => r.data),
    onSuccess: ({ customer, ...tokens }) => signIn(tokens, { kind: 'customer', user: customer }),
  });
}

export function useSendMagicLink() {
  return useMutation({
    mutationFn: (email: string) => api.post('/auth/magic-link', { email, client: 'mobile' }, { auth: false }),
  });
}

export function useVerifyMagicLink() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: (token: string) =>
      api.post<Envelope<CustomerAuth>>('/auth/magic-link/verify', { token }, { auth: false }).then((r) => r.data),
    onSuccess: ({ customer, ...tokens }) => signIn(tokens, { kind: 'customer', user: customer }),
  });
}

export type StaffLoginResult = { kind: 'signedIn' } | { kind: 'superAdmin' };

export function useStaffLogin() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: async (input: { email: string; password: string }): Promise<StaffLoginResult> => {
      const { data } = await api.post<Envelope<StaffAuth>>('/auth/login', input, { auth: false });
      const { staff, ...tokens } = data;
      if (staff.role === 'SUPER_ADMIN' || !staff.barbershopId) {
        // Platform management is web-only: drop the session we just got.
        await api.post('/auth/logout', { refreshToken: tokens.refreshToken }, { auth: false }).catch(() => undefined);
        return { kind: 'superAdmin' };
      }
      await signIn(tokens, {
        kind: 'staff',
        user: { ...staff, role: staff.role, barbershopId: staff.barbershopId },
      });
      return { kind: 'signedIn' };
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api.post('/auth/forgot-password', { email }, { auth: false }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { email: string; otp: string; newPassword: string }) =>
      api.post('/auth/reset-password', input, { auth: false }),
  });
}
