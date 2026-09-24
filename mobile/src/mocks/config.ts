// Demo mode: every API call is answered in memory by src/mocks/server.ts.
// Turn on with EXPO_PUBLIC_USE_MOCKS=true in mobile/.env (restart `npx expo start -c` after changing it).
// Expo inlines EXPO_PUBLIC_* at build time. The API client checks the variable inline so the mock server
// is dropped from the bundle when the flag is off; only the small demo UI pieces stay.
export const MOCKS_ENABLED = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

/** Simulated network latency, so loading states are visible. */
export const MOCK_LATENCY_MS = 350;
