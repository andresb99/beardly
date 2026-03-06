import { Redirect, useLocalSearchParams } from 'expo-router';

export default function AdminSessionModelosAliasScreen() {
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const sessionId = String(params.sessionId || '');

  if (!sessionId) {
    return <Redirect href="/admin/courses" />;
  }

  return (
    <Redirect
      href={{
        pathname: '/admin/session-modelos/[sessionId]',
        params: { sessionId },
      }}
    />
  );
}
