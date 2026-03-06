import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NavajaThemeProvider, useNavajaTheme } from '../lib/theme';

function RootNavigator() {
  const { colors } = useNavajaTheme();

  return (
    <>
      <StatusBar style={colors.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.nav },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          headerTitleStyle: {
            fontSize: 15,
            fontWeight: '700',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="courses/[id]" options={{ title: 'Detalle del curso' }} />
        <Stack.Screen name="book/success" options={{ title: 'Reserva confirmada' }} />
        <Stack.Screen name="staff/index" options={{ title: 'Panel staff' }} />
        <Stack.Screen name="admin/index" options={{ title: 'Panel admin' }} />
        <Stack.Screen name="admin/appointments" options={{ title: 'Citas' }} />
        <Stack.Screen name="admin/staff" options={{ title: 'Equipo' }} />
        <Stack.Screen name="admin/barbershop" options={{ title: 'Barbería' }} />
        <Stack.Screen name="admin/services" options={{ title: 'Servicios' }} />
        <Stack.Screen name="admin/courses" options={{ title: 'Cursos' }} />
        <Stack.Screen name="admin/modelos" options={{ title: 'Modelos' }} />
        <Stack.Screen
          name="admin/session-modelos/[sessionId]"
          options={{ title: 'Modelos por sesion' }}
        />
        <Stack.Screen name="admin/applicants" options={{ title: 'Postulantes' }} />
        <Stack.Screen name="admin/metrics" options={{ title: 'Metricas' }} />
        <Stack.Screen name="admin/performance/[staffId]" options={{ title: 'Performance' }} />
        <Stack.Screen name="appointment/[id]" options={{ title: 'Detalle de cita' }} />
        <Stack.Screen name="cuenta/resenas/[appointmentId]" options={{ title: 'Calificar cita' }} />
        <Stack.Screen name="review/[token]" options={{ title: 'Reseña' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <NavajaThemeProvider>
      <RootNavigator />
    </NavajaThemeProvider>
  );
}
