import { Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

/** Text with the app font; custom fonts do not apply by default in React Native. */
export function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.ink }, style]} />;
}
