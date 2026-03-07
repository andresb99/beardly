import 'server-only';

import { courseEnrollmentCreateSchema } from '@navaja/shared';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface CourseEnrollmentIntentPayload {
  session_id: string;
  course_id: string;
  shop_id: string;
  course_title: string;
  name: string;
  phone: string;
  email: string;
}

export interface CreatedCourseEnrollmentResult {
  enrollmentId: string;
  sessionId: string;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return normalized || null;
}

export async function createCourseEnrollmentFromIntent(
  payload: CourseEnrollmentIntentPayload,
  options?: { paymentIntentId?: string | null },
): Promise<CreatedCourseEnrollmentResult> {
  const parsed = courseEnrollmentCreateSchema.safeParse({
    session_id: payload.session_id,
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
  });

  if (!parsed.success) {
    throw new Error('Payload de inscripcion invalido para generar el cupo.');
  }

  const normalizedPaymentIntentId = String(options?.paymentIntentId || '').trim() || null;
  const normalizedEmail = normalizeEmail(payload.email);
  if (!normalizedEmail) {
    throw new Error('La inscripcion necesita un email valido.');
  }

  const supabase = createSupabaseAdminClient();

  if (normalizedPaymentIntentId) {
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id, session_id')
      .eq('payment_intent_id', normalizedPaymentIntentId)
      .maybeSingle();

    if (existingEnrollment?.id) {
      return {
        enrollmentId: String(existingEnrollment.id),
        sessionId: String(existingEnrollment.session_id),
      };
    }
  }

  const { data: session, error: sessionError } = await supabase
    .from('course_sessions')
    .select('id, course_id, capacity, status')
    .eq('id', payload.session_id)
    .eq('status', 'scheduled')
    .maybeSingle();

  if (sessionError) {
    throw new Error(sessionError.message || 'No se pudo validar la sesion del curso.');
  }

  if (!session?.id || !session.course_id || String(session.course_id) !== payload.course_id) {
    throw new Error('La sesion seleccionada no esta disponible.');
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, shop_id, is_active')
    .eq('id', payload.course_id)
    .eq('shop_id', payload.shop_id)
    .eq('is_active', true)
    .maybeSingle();

  if (courseError) {
    throw new Error(courseError.message || 'No se pudo validar el curso.');
  }

  if (!course?.id || !course.shop_id) {
    throw new Error('El curso ya no esta disponible para inscripcion.');
  }

  const [{ count: activeEnrollmentCount, error: countError }, { data: duplicateEnrollment, error: duplicateError }] =
    await Promise.all([
      supabase
        .from('course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', payload.session_id)
        .in('status', ['pending', 'confirmed']),
      supabase
        .from('course_enrollments')
        .select('id, status, session_id')
        .eq('session_id', payload.session_id)
        .eq('email', normalizedEmail)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (countError) {
    throw new Error(countError.message || 'No se pudo validar la capacidad del curso.');
  }

  if (duplicateError) {
    throw new Error(duplicateError.message || 'No se pudo validar si ya estabas inscripto.');
  }

  if (duplicateEnrollment?.id) {
    if (normalizedPaymentIntentId) {
      return {
        enrollmentId: String(duplicateEnrollment.id),
        sessionId: String(duplicateEnrollment.session_id),
      };
    }

    throw new Error('Ya existe una inscripcion activa para este email en la sesion.');
  }

  const capacity = Number(session.capacity || 0);
  if (capacity > 0 && (activeEnrollmentCount || 0) >= capacity) {
    throw new Error('Esta sesion ya no tiene cupos disponibles.');
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .insert({
      session_id: payload.session_id,
      name: payload.name,
      phone: payload.phone,
      email: normalizedEmail,
      status: normalizedPaymentIntentId ? 'confirmed' : 'pending',
      payment_intent_id: normalizedPaymentIntentId,
    })
    .select('id, session_id')
    .single();

  if (enrollmentError || !enrollment) {
    throw new Error(enrollmentError?.message || 'No se pudo registrar la inscripcion.');
  }

  return {
    enrollmentId: String(enrollment.id),
    sessionId: String(enrollment.session_id),
  };
}
