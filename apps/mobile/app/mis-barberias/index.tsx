import { router } from 'expo-router';
import { ActionButton, Card, Screen } from '../../components/ui/primitives';

export default function MisBarberiasScreen() {
  return (
    <Screen
      title="Mis barberias"
      subtitle="La app mobile usa el workspace configurado actualmente para operaciones de staff/admin."
    >
      <Card>
        <ActionButton
          label="Ir a mi cuenta"
          variant="secondary"
          onPress={() => router.replace('/(tabs)/cuenta')}
        />
      </Card>
    </Screen>
  );
}
