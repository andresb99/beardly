import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { courseEnrollmentCreateSchema } from '@navaja/shared';
import {
  ActionButton,
  Card,
  ErrorText,
  Field,
  HeroPanel,
  Label,
  MutedText,
  Screen,
} from '../../components/ui/primitives';
import { formatCurrency, formatDateTime } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { useNavajaTheme } from '../../lib/theme';

interface CourseData {
  id: string;
  shop_id: string;
  shop_name: string;
  title: string;
  description: string;
  price_cents: number;
  duration_hours: number;
  level: string;
}

interface SessionData {
  id: string;
  start_at: string;
  capacity: number;
  location: string;
}

export default function CourseDetailsScreen() {
  const { colors } = useNavajaTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSessionId, setActiveSessionId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [activeSessionId, sessions],
  );

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError(null);

    const [{ data: courseRow, error: courseError }, { data: sessionRows, error: sessionsError }] =
      await Promise.all([
        supabase
          .from('courses')
          .select('id, shop_id, title, description, price_cents, duration_hours, level, is_active')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('course_sessions')
          .select('id, start_at, capacity, location')
          .eq('course_id', id)
          .eq('status', 'scheduled')
          .order('start_at'),
      ]);

    if (courseError || !courseRow || !courseRow.is_active) {
      setLoading(false);
      setCourse(null);
      setSessions([]);
      setError(courseError?.message || 'Curso no encontrado.');
      return;
    }

    if (sessionsError) {
      setLoading(false);
      setCourse(null);
      setSessions([]);
      setError(sessionsError.message);
      return;
    }

    const { data: shopRow } = await supabase
      .from('shops')
      .select('name')
      .eq('id', courseRow.shop_id)
      .eq('status', 'active')
      .maybeSingle();

    setCourse({
      id: String(courseRow.id),
      shop_id: String(courseRow.shop_id),
      shop_name: String(shopRow?.name || 'Barberia'),
      title: String(courseRow.title),
      description: String(courseRow.description || ''),
      price_cents: Number(courseRow.price_cents || 0),
      duration_hours: Number(courseRow.duration_hours || 0),
      level: String(courseRow.level || ''),
    });

    const mappedSessions = (sessionRows || []).map((session) => ({
      id: String(session.id),
      start_at: String(session.start_at),
      capacity: Number(session.capacity || 0),
      location: String(session.location || ''),
    }));

    setSessions(mappedSessions);
    if (!mappedSessions.find((session) => session.id === activeSessionId)) {
      setActiveSessionId(mappedSessions[0]?.id || '');
    }
    setLoading(false);
  }, [activeSessionId, id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function submitEnrollment() {
    if (!activeSession) {
      setError('Selecciona una sesion.');
      return;
    }

    const parsed = courseEnrollmentCreateSchema.safeParse({
      session_id: activeSession.id,
      name,
      phone,
      email,
    });

    if (!parsed.success) {
      setError('Revisa los datos de inscripcion.');
      return;
    }

    setSending(true);
    setError(null);
    setMessage(null);

    const { error: insertError } = await supabase.from('course_enrollments').insert({
      session_id: parsed.data.session_id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      status: 'pending',
    });

    if (insertError) {
      setSending(false);
      setError(insertError.message);
      return;
    }

    setSending(false);
    setMessage('Inscripcion enviada. Te vamos a confirmar por WhatsApp.');
    setName('');
    setPhone('');
    setEmail('');
  }

  return (
    <Screen
      eyebrow="Detalle"
      title="Informacion del curso y reserva de cupo"
      subtitle="Mantiene la misma estructura de la web: resumen del curso, sesiones activas y formulario de inscripcion."
    >
      {loading ? (
        <Card>
          <MutedText>Cargando curso...</MutedText>
        </Card>
      ) : null}

      <ErrorText message={error} />

      {!loading && !course ? (
        <Card>
          <MutedText>No hay informacion para este curso.</MutedText>
        </Card>
      ) : null}

      {course ? (
        <>
          <HeroPanel
            eyebrow={course.shop_name}
            title={course.title}
            description={course.description}
          >
            <Text style={[styles.metaItem, { color: colors.text }]}>Nivel: {course.level}</Text>
            <Text style={[styles.metaItem, { color: colors.text }]}>
              Duracion: {course.duration_hours} h
            </Text>
            <Text style={[styles.metaItem, { color: colors.text }]}>
              Inversion: {formatCurrency(course.price_cents)}
            </Text>
          </HeroPanel>

          <Card elevated>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sesiones programadas</Text>
            {sessions.length === 0 ? (
              <MutedText>No hay sesiones activas en este momento.</MutedText>
            ) : null}
            <View style={styles.list}>
              {sessions.map((session) => (
                <Pressable
                  key={session.id}
                  style={[
                    styles.sessionRow,
                    {
                      backgroundColor:
                        activeSessionId === session.id ? colors.panelRaised : colors.panelMuted,
                      borderColor:
                        activeSessionId === session.id
                          ? colors.borderActive
                          : colors.borderMuted,
                    },
                  ]}
                  onPress={() => setActiveSessionId(session.id)}
                >
                  <Text style={[styles.sessionTitle, { color: colors.text }]}>
                    {formatDateTime(session.start_at)}
                  </Text>
                  <Text style={[styles.sessionMeta, { color: colors.textMuted }]}>
                    {session.location}
                  </Text>
                  <Text style={[styles.sessionMeta, { color: colors.textMuted }]}>
                    Capacidad: {session.capacity}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card elevated>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Anotarme a la sesion</Text>
            <Label>Nombre y apellido</Label>
            <Field value={name} onChangeText={setName} />
            <Label>Telefono</Label>
            <Field value={phone} onChangeText={setPhone} />
            <Label>Email</Label>
            <Field
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {message ? <Text style={[styles.success, { color: colors.success }]}>{message}</Text> : null}
            <ActionButton
              label={sending ? 'Enviando...' : 'Anotarme'}
              onPress={submitEnrollment}
              disabled={!activeSession || !name || !phone || !email || sending}
              loading={sending}
            />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  metaItem: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 17,
  },
  list: {
    gap: 8,
  },
  sessionRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 3,
  },
  sessionTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  sessionMeta: {
    fontSize: 12,
  },
  success: {
    fontSize: 13,
  },
});
