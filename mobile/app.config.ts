import type { ConfigContext, ExpoConfig } from 'expo/config';

// Static config lives in app.json. This file only adds what depends on env vars.
export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins = [...(config.plugins ?? [])];

  // Native Google Sign-In needs the iOS client's reversed ID as a URL scheme at build time.
  // Without it the plugin throws, so it is only added when the variable is set (EAS env / .env).
  const iosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;
  if (iosUrlScheme) {
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  return { ...config, name: config.name ?? 'Na Régua', slug: config.slug ?? 'na-regua', plugins };
};
