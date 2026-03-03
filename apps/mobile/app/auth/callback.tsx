import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { HeroPanel, Screen } from '../../components/ui/primitives';
import { completeAuthRedirectUrl } from '../../lib/auth-links';
import { useNavajaTheme } from '../../lib/theme';

export default function AuthCallbackScreen() {
  const { colors } = useNavajaTheme();
  const liveUrl = Linking.useURL();
  const [status, setStatus] = useState('Procesando autenticacion...');

  useEffect(() => {
    let active = true;

    void (async () => {
      const urlValue = liveUrl || (await Linking.getInitialURL()) || '';

      if (!urlValue) {
        if (active) {
          setStatus('No se encontro el retorno de autenticacion.');
          router.replace('/(auth)/login');
        }
        return;
      }

      const result = await completeAuthRedirectUrl(urlValue);

      if (!active) {
        return;
      }

      if (result.error) {
        setStatus(result.error);
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 900);
        return;
      }

      setStatus('Sesion restaurada. Redirigiendo...');
      router.replace(result.nextPath);
    })();

    return () => {
      active = false;
    };
  }, [liveUrl]);

  return (
    <Screen
      eyebrow="Auth"
      title="Sincronizando tu sesion"
      subtitle="Procesando el retorno de Google o de recuperacion de contrasena."
      showThemeToggle={false}
    >
      <HeroPanel
        eyebrow="Autenticacion"
        title="Validando credenciales"
        description="Este paso existe para que Expo procese el retorno igual que la web procesa /auth/callback."
      >
        <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>{status}</Text>
      </HeroPanel>
    </Screen>
  );
}
