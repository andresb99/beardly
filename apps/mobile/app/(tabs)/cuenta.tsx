import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ActionButton,
  Card,
  Chip,
  ErrorText,
  Field,
  HeroPanel,
  Label,
  MutedText,
  Screen,
  SurfaceCard,
} from '../../components/ui/primitives';
import { AppRole, getAuthContext } from '../../lib/auth';
import { formatDateTime } from '../../lib/format';
import { listMarketplaceShops } from '../../lib/marketplace';
import { supabase } from '../../lib/supabase';
import { useNavajaTheme } from '../../lib/theme';

interface MyAppointment {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  service_name: string | null;
  staff_name: string | null;
}

interface InvitationItem {
  id: string;
  role: string;
  createdAt: string;
  shopName: string;
}

const roleLabel: Record<AppRole, string> = {
  guest: 'Invitado',
  user: 'Cliente',
  staff: 'Staff',
  admin: 'Admin',
};

const toneByRole: Record<AppRole, 'neutral' | 'success' | 'warning' | 'danger'> = {
  guest: 'neutral',
  user: 'neutral',
  staff: 'warning',
  admin: 'success',
};

export default function CuentaScreen() {
  const { colors } = useNavajaTheme();
  const [role, setRole] = useState<AppRole>('guest');
  const [userId, setUserId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canEditProfile = useMemo(
    () => Boolean(userId && (role === 'user' || role === 'staff' || role === 'admin')),
    [role, userId],
  );

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const auth = await getAuthContext();
    setRole(auth.role);
    setEmail(auth.email || '');
    setUserId(auth.userId || '');

    if (auth.userId) {
      const [{ data: profile }, { data: membershipRows }, marketplaceShops] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('full_name, phone, avatar_url')
          .eq('auth_user_id', auth.userId)
          .maybeSingle(),
        supabase
          .from('shop_memberships')
          .select('id, shop_id, role, created_at')
          .eq('user_id', auth.userId)
          .eq('membership_status', 'invited')
          .order('created_at', { ascending: false }),
        listMarketplaceShops(),
      ]);

      setFullName(String(profile?.full_name || ''));
      setPhone(String(profile?.phone || ''));
      setAvatarUrl(String(profile?.avatar_url || ''));

      const shopIds = [...new Set((membershipRows || []).map((item) => String(item.shop_id || '')))];
      const { data: inviteShops } = shopIds.length
        ? await supabase
            .from('shops')
            .select('id, name')
            .in('id', shopIds)
            .eq('status', 'active')
        : { data: [] as Array<{ id: string; name: string }> };
      const shopsById = new Map(
        ((inviteShops || []) as Array<{ id: string; name: string }>).map((item) => [
          String(item.id),
          String(item.name),
        ]),
      );

      setInvitations(
        (membershipRows || []).map((item) => ({
          id: String(item.id),
          role: String(item.role || 'staff'),
          createdAt: String(item.created_at),
          shopName: shopsById.get(String(item.shop_id || '')) || 'Barberia',
        })),
      );

      if (auth.role === 'user' || auth.role === 'staff' || auth.role === 'admin') {
        const appointmentResponses = await Promise.all(
          marketplaceShops.map((shop) =>
            supabase.rpc('get_my_appointments', {
              p_shop_id: shop.id,
            }),
          ),
        );
        const failedResponse = appointmentResponses.find((result) => result.error);

        if (failedResponse?.error) {
          setAppointments([]);
          setError(failedResponse.error.message);
        } else {
          const mergedAppointments = appointmentResponses
            .flatMap((result) => (result.data || []) as Array<Record<string, unknown>>)
            .map((item) => ({
              id: String(item.id),
              start_at: String(item.start_at),
              end_at: String(item.end_at),
              status: String(item.status),
              service_name: item.service_name ? String(item.service_name) : null,
              staff_name: item.staff_name ? String(item.staff_name) : null,
            }))
            .sort((a, b) => (a.start_at < b.start_at ? 1 : -1));

          setAppointments(mergedAppointments);
        }
      } else {
        setAppointments([]);
      }
    } else {
      setFullName('');
      setPhone('');
      setAvatarUrl('');
      setInvitations([]);
      setAppointments([]);
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAccount();
    }, [loadAccount]),
  );

  async function saveProfile() {
    if (!userId) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const { error: saveError } = await supabase.from('user_profiles').upsert(
      {
        auth_user_id: userId,
        full_name: fullName || null,
        phone: phone || null,
        avatar_url: avatarUrl || null,
      },
      { onConflict: 'auth_user_id' },
    );

    if (saveError) {
      setSaving(false);
      setError(saveError.message);
      return;
    }

    setSaving(false);
    setMessage('Perfil actualizado.');
  }

  async function signOut() {
    await supabase.auth.signOut();
    await loadAccount();
  }

  return (
    <Screen
      eyebrow="Cuenta"
      title="Perfil, invitaciones y reservas"
      subtitle="La cuenta mobile ahora sigue la misma estructura principal que la web: perfil editable, notificaciones y seguimiento de reservas."
    >
      <HeroPanel
        eyebrow="Mi cuenta"
        title={email || 'Sin sesion activa'}
        description={
          role === 'guest'
            ? 'Ingresa para sincronizar perfil, invitaciones y reservas.'
            : 'Tu rol actual define que paneles puedes abrir desde la app.'
        }
      >
        <Chip label={roleLabel[role]} tone={toneByRole[role]} />
      </HeroPanel>

      <Card elevated>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mi perfil</Text>
        {canEditProfile ? (
          <>
            <Label>Nombre y apellido</Label>
            <Field value={fullName} onChangeText={setFullName} />
            <Label>Telefono</Label>
            <Field value={phone} onChangeText={setPhone} />
            <Label>Avatar URL (opcional)</Label>
            <Field
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <ActionButton
              label={saving ? 'Guardando...' : 'Guardar perfil'}
              onPress={saveProfile}
              loading={saving}
              disabled={saving}
            />
          </>
        ) : (
          <MutedText>Inicia sesion para editar tu perfil.</MutedText>
        )}

        {message ? <Text style={[styles.success, { color: colors.success }]}>{message}</Text> : null}
        <ErrorText message={error} />

        <View style={styles.actions}>
          {role === 'guest' ? (
            <ActionButton
              label="Ingresar o registrarme"
              onPress={() => router.push('/(auth)/login')}
            />
          ) : (
            <ActionButton label="Cerrar sesion" variant="danger" onPress={signOut} />
          )}

          {role === 'staff' || role === 'admin' ? (
            <ActionButton
              label="Ir a panel staff"
              variant="secondary"
              onPress={() => router.push('/staff/index')}
            />
          ) : null}

          {role === 'admin' ? (
            <ActionButton
              label="Ir a panel admin"
              variant="secondary"
              onPress={() => router.push('/admin/index')}
            />
          ) : null}
        </View>
      </Card>

      <Card elevated>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notificaciones</Text>
          <Chip
            label={`${invitations.length} pendiente${invitations.length === 1 ? '' : 's'}`}
            tone={invitations.length ? 'warning' : 'neutral'}
          />
        </View>

        {!invitations.length ? (
          <MutedText>No tienes invitaciones pendientes en este momento.</MutedText>
        ) : null}

        <View style={styles.list}>
          {invitations.map((item) => (
            <SurfaceCard key={item.id} style={styles.infoCard}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>{item.shopName}</Text>
              <Text style={[styles.infoMeta, { color: colors.textMuted }]}>
                Rol propuesto: {item.role === 'admin' ? 'Administrador' : 'Staff'}
              </Text>
              <Text style={[styles.infoMeta, { color: colors.textMuted }]}>
                Recibida el {formatDateTime(item.createdAt)}
              </Text>
              <Text style={[styles.infoHint, { color: colors.warning }]}>
                La respuesta de invitaciones sigue disponible en la web.
              </Text>
            </SurfaceCard>
          ))}
        </View>
      </Card>

      <Card elevated>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mis reservas</Text>
        {loading ? <MutedText>Cargando...</MutedText> : null}
        {!loading && !appointments.length ? (
          <MutedText>No encontramos reservas asociadas a tu cuenta.</MutedText>
        ) : null}

        <View style={styles.list}>
          {appointments.map((item) => (
            <SurfaceCard
              key={item.id}
              onPress={() => router.push(`/appointment/${item.id}`)}
              style={styles.infoCard}
            >
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                {formatDateTime(item.start_at)}
              </Text>
              <Text style={[styles.infoMeta, { color: colors.textMuted }]}>
                {item.service_name || 'Servicio'} - {item.staff_name || 'Sin asignar'}
              </Text>
              <Text style={[styles.infoMeta, { color: colors.textMuted }]}>
                Estado: {item.status}
              </Text>
            </SurfaceCard>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  actions: {
    gap: 8,
  },
  list: {
    gap: 8,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 3,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoMeta: {
    fontSize: 12,
  },
  infoHint: {
    fontSize: 12,
    marginTop: 2,
  },
  success: {
    fontSize: 13,
  },
});
