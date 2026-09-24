import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Type } from '@/constants/theme';
import { GOOGLE_ACCOUNTS } from '@/mocks/data';

type Props = { visible: boolean; onClose: () => void; onPick: (idToken: string) => void };

/** Demo mode: stands in for the native Google account picker (as in the design prototype). */
export function MockGoogleSheet({ visible, onClose, onPick }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} background={Colors.surface}>
      <View style={{ gap: 2, marginBottom: 6 }}>
        <AppText style={{ fontFamily: Fonts.bold, fontSize: 17 }}>Escolha uma conta</AppText>
        <AppText style={Type.small}>para continuar no Na Régua · modo demo</AppText>
      </View>
      {GOOGLE_ACCOUNTS.map((account) => (
        <Pressable
          key={account.id}
          accessibilityRole="button"
          onPress={() => onPick(`mock-google:${account.id}`)}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
          <Avatar name={account.name} size={40} />
          <View style={{ gap: 2 }}>
            <AppText style={{ fontFamily: Fonts.semibold, fontSize: 15 }}>{account.name}</AppText>
            <AppText style={Type.small}>{account.email}</AppText>
          </View>
        </Pressable>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
});
