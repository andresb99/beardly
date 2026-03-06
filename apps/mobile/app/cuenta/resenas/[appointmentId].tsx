import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ActionButton,
  Card,
  ErrorText,
  Label,
  MultilineField,
  MutedText,
  Screen,
} from '../../../components/ui/primitives';
import {
  hasExternalApi,
  listAccountAppointmentsViaApi,
  submitAccountAppointmentReviewViaApi,
} from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import { supabase } from '../../../lib/supabase';
import { palette } from '../../../lib/theme';

interface AppointmentForReview {
  id: string;
  startAt: string;
  status: string;
  serviceName: string;
  staffName: string;
  hasReview: boolean;
}

export default function CuentaResenaScreen() {
  const params = useLocalSearchParams<{ appointmentId?: string }>();
  const appointmentId = String(params.appointmentId || '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentForReview | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const canSubmitReview = useMemo(() => {
    if (!appointment) {
      return false;
    }
    return appointment.status === 'done' && !appointment.hasReview;
  }, [appointment]);

  const loadAppointment = useCallback(async () => {
    if (!appointmentId) {
      setLoading(false);
      setError('No se recibio una cita valida.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token || '';

    if (hasExternalApi && accessToken) {
      try {
        const response = await listAccountAppointmentsViaApi({ accessToken });
        const item = response?.items.find((entry) => entry.id === appointmentId);
        if (!item) {
          setAppointment(null);
          setError('No encontramos esa cita en tu cuenta.');
          setLoading(false);
          return;
        }

        setAppointment({
          id: item.id,
          startAt: item.startAt,
          status: item.status,
          serviceName: item.serviceName || 'Servicio',
          staffName: item.staffName || 'Barbero',
          hasReview: Boolean(item.hasReview),
        });

        if (item.hasReview) {
          setMessage('Esta cita ya fue calificada.');
        }

        setLoading(false);
        return;
      } catch {
        // fallback below
      }
    }

    const { data: row, error: rowError } = await supabase
      .from('appointments')
      .select('id, start_at, status, services(name), staff(name)')
      .eq('id', appointmentId)
      .maybeSingle();

    if (rowError || !row) {
      setAppointment(null);
      setError(rowError?.message || 'No encontramos esa cita en tu cuenta.');
      setLoading(false);
      return;
    }

    setAppointment({
      id: String(row.id),
      startAt: String(row.start_at),
      status: String(row.status || 'pending'),
      serviceName: String((row.services as { name?: string } | null)?.name || 'Servicio'),
      staffName: String((row.staff as { name?: string } | null)?.name || 'Barbero'),
      hasReview: false,
    });
    setLoading(false);
  }, [appointmentId]);

  useFocusEffect(
    useCallback(() => {
      void loadAppointment();
    }, [loadAppointment]),
  );

  async function submitReview() {
    if (!appointment) {
      return;
    }

    if (!hasExternalApi) {
      setError('Configura EXPO_PUBLIC_API_BASE_URL para enviar reseñas desde mobile.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token || '';
      if (!accessToken) {
        throw new Error('Debes iniciar sesion para calificar la cita.');
      }

      const result = await submitAccountAppointmentReviewViaApi({
        accessToken,
        appointmentId: appointment.id,
        rating,
        comment: comment.trim() || null,
      });

      if (!result?.success) {
        throw new Error('No se pudo guardar la reseña.');
      }

      setMessage('Reseña enviada. Gracias por calificar tu experiencia.');
      setAppointment((current) => (current ? { ...current, hasReview: true } : current));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la reseña.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Calificar cita" subtitle="Comparte como fue tu experiencia">
      {loading ? <MutedText>Cargando detalle de la cita...</MutedText> : null}
      <ErrorText message={error} />
      {message ? <Text style={styles.success}>{message}</Text> : null}

      {appointment ? (
        <Card>
          <Text style={styles.title}>{formatDateTime(appointment.startAt)}</Text>
          <Text style={styles.meta}>
            {appointment.serviceName} - {appointment.staffName}
          </Text>
          <Text style={styles.meta}>Estado: {appointment.status}</Text>
        </Card>
      ) : null}

      <Card>
        <Label>Puntaje</Label>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              style={[styles.ratingChip, rating === value ? styles.ratingChipActive : null]}
              onPress={() => setRating(value)}
            >
              <Text style={[styles.ratingChipText, rating === value ? styles.ratingChipTextActive : null]}>
                {value}
              </Text>
            </Pressable>
          ))}
        </View>

        <Label>Comentario (opcional)</Label>
        <MultilineField value={comment} onChangeText={setComment} />

        {canSubmitReview ? (
          <ActionButton
            label={saving ? 'Enviando...' : 'Enviar reseña'}
            onPress={() => {
              void submitReview();
            }}
            disabled={saving}
            loading={saving}
          />
        ) : (
          <MutedText>Esta cita no esta disponible para calificacion.</MutedText>
        )}

        <ActionButton
          label="Volver a mi cuenta"
          variant="secondary"
          onPress={() => router.replace('/(tabs)/cuenta')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: '#64748b',
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  ratingChipActive: {
    borderColor: palette.text,
    backgroundColor: palette.text,
  },
  ratingChipText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  ratingChipTextActive: {
    color: '#fff',
  },
  success: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
  },
});
