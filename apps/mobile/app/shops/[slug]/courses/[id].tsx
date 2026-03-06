import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ShopCourseDetailAliasScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = String(params.id || '');

  if (!id) {
    return <Redirect href="/(tabs)/cursos" />;
  }

  return (
    <Redirect
      href={{
        pathname: '/courses/[id]',
        params: { id },
      }}
    />
  );
}
