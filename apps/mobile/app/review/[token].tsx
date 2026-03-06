import { useCallback, useState } from 'react';
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
} from '../../components/ui/primitives';
import {
  getReviewInvitePreviewViaApi,
  hasExternalApi,
  submitSignedReviewViaApi,
} from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { palette } from '../../lib/theme';

interface ReviewPreview {
  appointmentId: string;
  staffName: string;
  serviceName: string;
  appointmentStartAt: string;
  expiresAt: string;
}

export default function PublicReviewScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const signedToken = String(params.token || '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReviewPreview | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!signedToken) {
      setLoading(false);
      setError('No se recibio un enlace de reseña valido.');
      return;
    }

    if (!hasExternalApi) {
      setLoading(false);
      setError('Configura EXPO_PUBLIC_API_BASE_URL para abrir enlaces de reseña.');
      return;
    }

    try {
      const response = await getReviewInvitePreviewViaApi({ signedToken });
      if (!response) {
        setPreview(null);
        setError('No se pudo validar el enlace de reseña.');
      } else {
        setPreview({
          appointmentId: response.appointmentId,
          staffName: response.staffName,
          serviceName: response.serviceName,
          appointmentStartAt: response.appointmentStartAt,
          expiresAt: response.expiresAt,
        });
      }
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : 'No se pudo validar el enlace.');
    } finally {
      setLoading(false);
    }
  }, [signedToken]);

  useFocusEffect(
    useCallback(() => {
      void loadPreview();
    }, [loadPreview]),
  );

  async function submitReview() {
    if (!preview) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await submitSignedReviewViaApi({
        signedToken,
        rating,
        comment: comment.trim() || null,
      });

      if (!response?.reviewId) {
        throw new Error('No se pudo enviar la reseña.');
      }

      setMessage('Reseña enviada correctamente. Gracias por compartir tu experiencia.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo enviar la reseña.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Tu experiencia" subtitle="Califica la cita desde este enlace seguro">
      {loading ? <MutedText>Validando enlace...</MutedText> : null}
      <ErrorText message={error} />
      {message ? <Text style={styles.success}>{message}</Text> : null}

      {preview ? (
        <>
          <Card>
            <Text style={styles.title}>
              {preview.serviceName} con {preview.staffName}
            </Text>
            <Text style={styles.meta}>Cita: {formatDateTime(preview.appointmentStartAt)}</Text>
            <Text style={styles.meta}>Expira: {formatDateTime(preview.expiresAt)}</Text>
          </Card>

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

            <ActionButton
              label={saving ? 'Enviando...' : 'Enviar reseña'}
              onPress={() => {
                void submitReview();
              }}
              disabled={saving || Boolean(message)}
              loading={saving}
            />
          </Card>
        </>
      ) : null}

      <ActionButton
        label="Ir al inicio"
        variant="secondary"
        onPress={() => router.replace('/(tabs)/inicio')}
      />
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
