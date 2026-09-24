import { TurboModuleRegistry } from 'react-native';

import { ApiError } from '@/lib/api';

// @react-native-google-signin needs native code: it is missing in Expo Go and on web.
// Load it lazily so the rest of the app still runs there.
type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

const NATIVE_MODULE_NAME = 'RNGoogleSignin';
let configured = false;

function loadModule(): GoogleSignInModule | null {
  // Check the native side first: requiring the package without it throws during module init,
  // which the dev client reports as an error even when caught.
  if (!TurboModuleRegistry.get(NATIVE_MODULE_NAME)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-google-signin/google-signin') as GoogleSignInModule;
  } catch {
    return null;
  }
}

/** Returns the module ready to use, or null when Google Sign-In is not available in this build. */
function loadConfigured(): GoogleSignInModule | null {
  const mod = loadModule();
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!mod || !webClientId) return null;
  if (!configured) {
    // webClientId makes the ID token's audience match the API's GOOGLE_CLIENT_ID.
    mod.GoogleSignin.configure({ webClientId, iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID });
    configured = true;
  }
  return mod;
}

/** Opens the native Google account picker. Resolves the ID token, or null if the user cancelled. */
export async function getGoogleIdToken(): Promise<string | null> {
  const mod = loadConfigured();
  if (!mod) {
    throw new ApiError(0, 'GOOGLE_UNAVAILABLE', 'Login com Google indisponível nesta versão do app.');
  }
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = mod;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;
    if (!response.data.idToken) throw new ApiError(0, 'GOOGLE_NO_TOKEN', 'Não foi possível entrar com Google.');
    return response.data.idToken;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return null;
    if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new ApiError(0, 'GOOGLE_PLAY_SERVICES', 'Atualize o Google Play Services para entrar com Google.');
    }
    throw new ApiError(0, 'GOOGLE_FAILED', 'Não foi possível entrar com Google.');
  }
}

/** Clears the Google account picked in this app, so the next login shows the picker again. No-op without the module. */
export async function signOutFromGoogle() {
  const mod = loadConfigured();
  if (!mod) return;
  await mod.GoogleSignin.signOut().catch(() => undefined);
}
