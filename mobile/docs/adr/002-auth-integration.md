# Mobile ADR 002: Auth Integration

## Status

Accepted

## Context

The mobile app shares the API's auth (API ADR 002): bearer JWT (30 min) + rotating refresh tokens. The webapp gets its Google identity through NextAuth, which does not exist on React Native. The magic link email pointed only at the webapp (`FRONTEND_URL/auth/magic-link`), so a customer who asked for a link from the app could not finish the login in the app. The "Na Régua App" design (Claude Design) defines the screens: customer login (Google + magic link), staff login (e-mail + password), reset by 6-digit code, and a "use the web panel" screen for super admins.

## Decision

### Customers

- **Google**: native account picker via `@react-native-google-signin/google-signin`. `GoogleSignin.configure({ webClientId })` uses the **Web** OAuth client, so the ID token's audience is the API's `GOOGLE_CLIENT_ID` and `POST /auth/google` works unchanged on both platforms. The module is loaded lazily; in Expo Go/web the button shows "Login com Google indisponível nesta versão do app."
- **Magic link**: the app calls `POST /auth/magic-link` with `client: "mobile"`. The API then emails `MOBILE_MAGIC_LINK_URL?token=…` (default `naregua://auth/magic-link`) instead of the webapp URL. The route `src/app/auth/magic-link.tsx` calls `POST /auth/magic-link/verify` and shows the "link inválido ou expirado" state on failure. It is outside the protected groups so it works while signed out.

### Staff

- `POST /auth/login`. The role in the response decides the tabs: `BARBER` → Agenda, Faturamento; `BARBERSHOP_ADMIN` → Painel, Agenda, Equipe, Serviços, Horários.
- `SUPER_ADMIN` (or staff without a barbershop) is not signed in: the app revokes the refresh token it just got (`POST /auth/logout`) and shows "Use o painel web".
- Password reset: `POST /auth/forgot-password` → `POST /auth/reset-password` (OTP + new password; rules mirrored in `src/lib/validation.ts`).

### Session

- Access token, refresh token and the signed-in user are stored with `expo-secure-store` (never AsyncStorage).
- `src/lib/api.ts` sends the bearer token and, on a 401, refreshes once (shared by concurrent requests), stores the rotated pair and retries. If the refresh fails it clears storage and the auth provider sends the user to login.
- Navigation uses `Stack.Protected` guards per group: `(auth)` when signed out, `(customer)` for customers, `(staff)` for staff. The root `index` route is the anchor and redirects each role to its home.

### Configuration

| Variable | Where | Purpose |
|----------|-------|---------|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | EAS environments + `.env` | Web OAuth client (same value as the API `GOOGLE_CLIENT_ID`) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | EAS environments + `.env` | iOS OAuth client |
| `GOOGLE_IOS_URL_SCHEME` | EAS environments | Reversed iOS client ID. `app.config.ts` adds the Google config plugin only when it is set, because the plugin throws without it |
| `MOBILE_MAGIC_LINK_URL` | API env | Base URL of the link in the magic link email for `client: "mobile"` |

Android also needs an **Android** OAuth client in Google Cloud with the package `com.naregua.app` and the SHA-1 of each signing key (EAS development/preview key and Play App Signing key).

## Consequences

- Adding the Google module is a native change: a new EAS build is needed before Google login works (ADR 001 handles this through the fingerprint).
- `GOOGLE_IOS_URL_SCHEME` changes the native config. It must have the same value in every EAS environment that builds or publishes updates, or build and OTA fingerprints will differ.
- Custom-scheme links (`naregua://…`) open the app only on a device where it is installed, and some e-mail clients (notably Gmail on the web) remove non-HTTP links. Once there is a domain for the app, set `MOBILE_MAGIC_LINK_URL` to an HTTPS universal/app link. No client change is needed.
- Not covered by the API yet, so not in the app: a customer list for admins ("Clientes" tab in the design), editing the cancellation lead time (read-only in "Horários"), reactivating a deactivated service, and an open/closed status in the barbershop search results (the list shows the neighborhood instead).
