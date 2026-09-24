import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TurboModuleRegistry } from 'react-native';

const mockRequired = jest.fn();
jest.mock('@react-native-google-signin/google-signin', () => {
  mockRequired();
  throw new Error("TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found.");
});

// eslint-disable-next-line import/first
import { getGoogleIdToken, signOutFromGoogle } from '@/lib/google-sign-in';

describe('google sign-in without the native module (Expo Go)', () => {
  beforeEach(() => {
    mockRequired.mockClear();
    jest.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
  });

  it('signs out without loading the package', async () => {
    await expect(signOutFromGoogle()).resolves.toBeUndefined();
    expect(mockRequired).not.toHaveBeenCalled();
  });

  it('reports Google login as unavailable', async () => {
    await expect(getGoogleIdToken()).rejects.toMatchObject({ code: 'GOOGLE_UNAVAILABLE' });
    expect(mockRequired).not.toHaveBeenCalled();
  });
});
