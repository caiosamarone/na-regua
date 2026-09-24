import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Type } from '@/constants/theme';

export default function SuperAdminScreen() {
  return (
    <AuthScreen back>
      <View style={styles.body}>
        <View style={{ gap: 8 }}>
          <AppText style={Type.eyebrow}>Super admin</AppText>
          <AppText style={Type.display} accessibilityRole="header">
            Use o painel web
          </AppText>
          <AppText style={[Type.body, { fontSize: 15, lineHeight: 22 }]}>
            A gestão da plataforma (criar barbearias, convidar admins) fica no painel web. O app é para clientes e
            equipes das barbearias.
          </AppText>
        </View>
        <Button label="Entendi" onPress={() => router.back()} height={54} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({ body: { flex: 1, gap: 20, paddingTop: 28 } });
