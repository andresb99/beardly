'use server';

import {
  courseSessionUpsertSchema,
  courseUpsertSchema,
  jobApplicationUpdateSchema,
  modelApplicationStatusUpdateSchema,
  modelRequirementsInputSchema,
  serviceUpsertSchema,
  staffUpsertSchema,
  timeOffUpsertSchema,
  updateAppointmentStatusSchema,
  uuidSchema,
  workingHoursUpsertSchema,
} from '@navaja/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentAuthContext, requireAdmin, requireStaff } from '@/lib/auth';
import { env } from '@/lib/env';
import { createSignedReviewToken } from '@/lib/review-links';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildAdminHref } from '@/lib/workspace-routes';

function formValue(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key);
  if (typeof raw !== 'string') {
    return undefined;
  }
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}

function formDateTimeIso(formData: FormData, key: string): string | undefined {
  const value = formValue(formData, key);
  if (!value) {
    return undefined;
  }

  const normalized = /z$|[+-]\d{2}:\d{2}$/i.test(value) ? value : `${value}:00Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

function parseIntegerValue(value?: string): number {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/\s+/g, '').replace(',', '.');
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
    return Number.NaN;
  }

  return numeric;
}

function parsePriceCentsValue(value?: string): number {
  if (!value) {
    return 0;
  }

  const digitsOnly = value.replace(/[^\d]/g, '');
  if (!digitsOnly) {
    return Number.NaN;
  }

  return Number(digitsOnly);
}

function getValidationErrorMessage(
  error: z.ZodError,
  fallback: string,
  fieldLabels?: Record<string, string>,
) {
  const flattened = error.flatten();
  const formErrors = flattened.formErrors.filter(Boolean);
  const fieldErrors = Object.entries(flattened.fieldErrors)
    .flatMap(([field, messages]) =>
      (messages || [])
        .filter(Boolean)
        .map((message) => `${fieldLabels?.[field] || field}: ${message}`),
    );
  const messages = [...formErrors, ...fieldErrors];

  return messages.join(', ') || fallback;
}

const markAppointmentCompletedInputSchema = z.object({
  appointmentId: uuidSchema,
  shopId: uuidSchema,
  priceCents: z.number().int().nonnegative().optional(),
});

function requireFormShopId(formData: FormData) {
  const parsed = uuidSchema.safeParse(formValue(formData, 'shop_id'));
  if (!parsed.success) {
    throw new Error('No se recibio una barberia valida para esta accion.');
  }

  return parsed.data;
}

function requireFormShopSlug(formData: FormData) {
  return formValue(formData, 'shop_slug') || undefined;
}

function revalidateAppointmentMetrics() {
  revalidatePath('/staff');
  revalidatePath('/admin/appointments');
  revalidatePath('/admin/metrics');
  revalidatePath('/cuenta');
}

async function ensureCourseBelongsToShop(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  courseId: string,
  shopId: string,
) {
  const { data: course } = await supabase
    .from('courses')
    .select('id, shop_id')
    .eq('id', courseId)
    .maybeSingle();

  if (!course || String(course.shop_id || '') !== shopId) {
    throw new Error('El curso no pertenece a la barberia seleccionada.');
  }
}

async function ensureSessionBelongsToShop(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sessionId: string,
  shopId: string,
) {
  const { data: session } = await supabase
    .from('course_sessions')
    .select('id, course_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session?.course_id) {
    throw new Error('La sesion no existe en la barberia seleccionada.');
  }

  await ensureCourseBelongsToShop(supabase, String(session.course_id), shopId);
}

async function ensureStaffBelongsToShop(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  staffId: string,
  shopId: string,
) {
  const { data: staffMember } = await supabase
    .from('staff')
    .select('id, shop_id')
    .eq('id', staffId)
    .eq('shop_id', shopId)
    .maybeSingle();

  if (!staffMember?.id) {
    throw new Error('El personal seleccionado no pertenece a la barberia activa.');
  }
}

export interface MarkAppointmentCompletedResult {
  reviewLink: string | null;
}

export async function markAppointmentCompletedAction(
  input: { appointmentId: string; shopId: string; priceCents?: number },
): Promise<MarkAppointmentCompletedResult> {
  const parsed = markAppointmentCompletedInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join(', ') || 'Datos de finalizacion invalidos.');
  }

  const ctx = await getCurrentAuthContext({ shopId: parsed.data.shopId });

  if (
    (ctx.selectedWorkspaceRole !== 'admin' && ctx.selectedWorkspaceRole !== 'staff') ||
    !ctx.shopId
  ) {
    throw new Error('No tienes acceso a esta barberia.');
  }

  const { signedToken, tokenHash } = createSignedReviewToken();
  const sentAt = new Date();
  const expiresAt = new Date(sentAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 14);

  const userScopedSupabase = await createSupabaseServerClient();
  const { data: appointment, error: accessError } = await userScopedSupabase
    .from('appointments')
    .select('id')
    .eq('id', parsed.data.appointmentId)
    .eq('shop_id', ctx.shopId)
    .single();

  if (accessError || !appointment) {
    throw new Error(ctx.selectedWorkspaceRole === 'admin' ? 'No se encontro la cita.' : 'No tienes acceso a esta cita.');
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data, error } = await adminSupabase.rpc('complete_appointment_and_create_review_invite', {
    p_appointment_id: parsed.data.appointmentId,
    p_price_cents: parsed.data.priceCents ?? null,
    p_token_hash: tokenHash,
    p_sent_at: sentAt.toISOString(),
    p_expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data)
    ? (data[0] as { review_invite_created?: boolean } | undefined)
    : undefined;

  revalidateAppointmentMetrics();

  return {
    reviewLink:
      row?.review_invite_created === true
        ? `${env.NEXT_PUBLIC_APP_URL}/review/${encodeURIComponent(signedToken)}`
        : null,
  };
}

export async function upsertStaffAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  await requireAdmin({ shopId });

  const parsed = staffUpsertSchema.safeParse({
    id: formValue(formData, 'id'),
    shop_id: shopId,
    auth_user_id: formValue(formData, 'auth_user_id') || null,
    name: formValue(formData, 'name'),
    role: formValue(formData, 'role'),
    phone: formValue(formData, 'phone'),
    is_active: formData.get('is_active') === 'on',
  });

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join(', ') || 'Datos de personal invalidos.');
  }

  const supabase = await createSupabaseServerClient();
  if (parsed.data.id) {
    await supabase.from('staff').update(parsed.data).eq('id', parsed.data.id).eq('shop_id', parsed.data.shop_id);
  } else {
    await supabase.from('staff').insert(parsed.data);
  }

  revalidatePath('/admin/staff');
}

export async function upsertServiceAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  await requireAdmin({ shopId });

  const parsed = serviceUpsertSchema.safeParse({
    id: formValue(formData, 'id'),
    shop_id: shopId,
    name: formValue(formData, 'name'),
    price_cents: Number(formValue(formData, 'price_cents') || 0),
    duration_minutes: Number(formValue(formData, 'duration_minutes') || 0),
    is_active: formData.get('is_active') === 'on',
  });

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join(', ') || 'Datos de servicio invalidos.');
  }

  const supabase = await createSupabaseServerClient();
  if (parsed.data.id) {
    await supabase
      .from('services')
      .update(parsed.data)
      .eq('id', parsed.data.id)
      .eq('shop_id', parsed.data.shop_id);
  } else {
    await supabase.from('services').insert(parsed.data);
  }

  revalidatePath('/admin/services');
  revalidatePath('/book');
}

export async function upsertWorkingHoursAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  await requireAdmin({ shopId });

  const parsed = workingHoursUpsertSchema.safeParse({
    id: formValue(formData, 'id'),
    shop_id: shopId,
    staff_id: formValue(formData, 'staff_id'),
    day_of_week: Number(formValue(formData, 'day_of_week') || -1),
    start_time: formValue(formData, 'start_time'),
    end_time: formValue(formData, 'end_time'),
  });

  if (!parsed.success) {
    throw new Error(
      getValidationErrorMessage(parsed.error, 'Datos de horario invalidos.', {
        staff_id: 'Personal',
        day_of_week: 'Dia',
        start_time: 'Desde',
        end_time: 'Hasta',
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  await ensureStaffBelongsToShop(supabase, parsed.data.staff_id, parsed.data.shop_id);
  if (parsed.data.id) {
    await supabase
      .from('working_hours')
      .update(parsed.data)
      .eq('id', parsed.data.id)
      .eq('shop_id', parsed.data.shop_id);
  } else {
    await supabase.from('working_hours').insert(parsed.data);
  }

  revalidatePath('/admin/staff');
}

export async function createTimeOffAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  await requireAdmin({ shopId });

  const parsed = timeOffUpsertSchema.safeParse({
    shop_id: shopId,
    staff_id: formValue(formData, 'staff_id'),
    start_at: formDateTimeIso(formData, 'start_at'),
    end_at: formDateTimeIso(formData, 'end_at'),
    reason: formValue(formData, 'reason') || null,
  });

  if (!parsed.success) {
    throw new Error(
      getValidationErrorMessage(parsed.error, 'Datos de bloqueo invalidos.', {
        staff_id: 'Personal',
        start_at: 'Inicio',
        end_at: 'Fin',
        reason: 'Motivo',
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  await ensureStaffBelongsToShop(supabase, parsed.data.staff_id, parsed.data.shop_id);
  await supabase.from('time_off').insert(parsed.data);

  revalidatePath('/admin/staff');
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  const ctx = await requireAdmin({ shopId });

  const parsed = updateAppointmentStatusSchema.safeParse({
    appointment_id: formValue(formData, 'appointment_id'),
    status: formValue(formData, 'status'),
    price_cents: formValue(formData, 'price_cents') ? Number(formValue(formData, 'price_cents')) : undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join(', ') || 'Datos de actualizacion de cita invalidos.');
  }

  if (parsed.data.status === 'done') {
    return markAppointmentCompletedAction(
      typeof parsed.data.price_cents === 'number'
        ? {
            appointmentId: parsed.data.appointment_id,
            shopId,
            priceCents: parsed.data.price_cents,
          }
        : {
            appointmentId: parsed.data.appointment_id,
            shopId,
          },
    );
  }

  const supabase = await createSupabaseServerClient();
  const updatePayload: Record<string, unknown> = {
    status: parsed.data.status,
    completed_at: null,
    cancelled_by: parsed.data.status === 'cancelled' ? 'admin' : null,
    cancellation_reason: null,
  };

  const { error } = await supabase
    .from('appointments')
    .update(updatePayload)
    .eq('id', parsed.data.appointment_id)
    .eq('shop_id', ctx.shopId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAppointmentMetrics();

  return null;
}

export async function upsertCourseAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  await requireAdmin({ shopId });

  const parsed = courseUpsertSchema.safeParse({
    id: formValue(formData, 'id'),
    shop_id: shopId,
    title: formValue(formData, 'title'),
    description: formValue(formData, 'description'),
    price_cents: parsePriceCentsValue(formValue(formData, 'price_cents')),
    duration_hours: parseIntegerValue(formValue(formData, 'duration_hours')),
    level: formValue(formData, 'level'),
    is_active: formData.get('is_active') === 'on',
    image_url: formValue(formData, 'image_url') || null,
  });

  if (!parsed.success) {
    throw new Error(
      getValidationErrorMessage(parsed.error, 'Datos de curso invalidos.', {
        title: 'Titulo',
        description: 'Descripcion',
        price_cents: 'Precio',
        duration_hours: 'Horas',
        level: 'Nivel',
        image_url: 'Imagen',
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  if (parsed.data.id) {
    const { error } = await supabase
      .from('courses')
      .update(parsed.data)
      .eq('id', parsed.data.id)
      .eq('shop_id', parsed.data.shop_id);
    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from('courses').insert(parsed.data);
    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath('/admin/courses');
  revalidatePath('/courses');
}

export async function upsertCourseSessionAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  await requireAdmin({ shopId });

  const parsed = courseSessionUpsertSchema.safeParse({
    id: formValue(formData, 'id'),
    course_id: formValue(formData, 'course_id'),
    start_at: formDateTimeIso(formData, 'start_at'),
    capacity: Number(formValue(formData, 'capacity') || 0),
    location: formValue(formData, 'location'),
    status: formValue(formData, 'status') || 'scheduled',
  });

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join(', ') || 'Datos de sesion invalidos.');
  }

  const supabase = await createSupabaseServerClient();
  await ensureCourseBelongsToShop(supabase, parsed.data.course_id, shopId);
  if (parsed.data.id) {
    await ensureSessionBelongsToShop(supabase, parsed.data.id, shopId);
    await supabase.from('course_sessions').update(parsed.data).eq('id', parsed.data.id);
  } else {
    await supabase.from('course_sessions').insert(parsed.data);
  }

  revalidatePath('/admin/courses');
  revalidatePath('/courses');
}

export async function updateJobApplicationAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  const ctx = await requireAdmin({ shopId });

  const parsed = jobApplicationUpdateSchema.safeParse({
    application_id: formValue(formData, 'application_id'),
    status: formValue(formData, 'status'),
    notes: formValue(formData, 'notes') || null,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join(', ') || 'Datos de postulacion invalidos.');
  }

  const supabase = await createSupabaseServerClient();
  const { data: application } = await supabase
    .from('job_applications')
    .select('id, shop_id')
    .eq('id', parsed.data.application_id)
    .maybeSingle();

  if (!application || String(application.shop_id || '') !== ctx.shopId) {
    throw new Error('La postulacion no pertenece a la barberia seleccionada.');
  }

  await supabase
    .from('job_applications')
    .update({ status: parsed.data.status, notes: parsed.data.notes || null })
    .eq('id', parsed.data.application_id);

  revalidatePath('/admin/applicants');
}

export async function upsertModelRequirementsAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  const shopSlug = requireFormShopSlug(formData);
  const ctx = await requireAdmin({ shopId });

  const parsed = modelRequirementsInputSchema.safeParse({
    session_id: formValue(formData, 'session_id'),
    models_needed: Number(formValue(formData, 'models_needed') || 0),
    beard_required: formData.get('beard_required') === 'on',
    hair_length_category: formValue(formData, 'hair_length_category') || 'indistinto',
    hair_type: formValue(formData, 'hair_type') || null,
    compensation_type: formValue(formData, 'compensation_type'),
    compensation_value_cents: formValue(formData, 'compensation_value_cents')
      ? Number(formValue(formData, 'compensation_value_cents'))
      : undefined,
    notes_public: formValue(formData, 'notes_public') || null,
    is_open: formData.get('is_open') === 'on',
  });

  const fallbackSessionId = formValue(formData, 'session_id') || '';
  const sessionId = parsed.success ? parsed.data.session_id : fallbackSessionId;
  const redirectBase = buildAdminHref(
    `/admin/courses/sessions/${sessionId}/modelos`,
    shopSlug || ctx.shopSlug,
  );

  if (!parsed.success) {
    redirect(`${redirectBase}?error=${encodeURIComponent('No se pudieron guardar los requisitos de modelos.')}`);
  }

  const requirements = {
    models_needed: parsed.data.models_needed,
    beard_required: parsed.data.beard_required || false,
    hair_length_category: parsed.data.hair_length_category || 'indistinto',
    hair_type: parsed.data.hair_type || null,
  };

  const supabase = await createSupabaseServerClient();
  await ensureSessionBelongsToShop(supabase, parsed.data.session_id, shopId);
  const { error } = await supabase.from('model_requirements').upsert(
    {
      session_id: parsed.data.session_id,
      requirements,
      compensation_type: parsed.data.compensation_type,
      compensation_value_cents:
        parsed.data.compensation_type === 'gratis'
          ? null
          : (parsed.data.compensation_value_cents ?? null),
      notes_public: parsed.data.notes_public || null,
      is_open: parsed.data.is_open,
    },
    { onConflict: 'session_id' },
  );

  if (error) {
    redirect(
      `${redirectBase}?error=${encodeURIComponent('No se pudieron guardar los requisitos. Revisa los datos.')}`,
    );
  }

  revalidatePath('/modelos');
  revalidatePath('/modelos/registro');
  revalidatePath(redirectBase);
  redirect(`${redirectBase}?ok=${encodeURIComponent('Requisitos de modelos actualizados.')}`);
}

export async function updateModelApplicationStatusAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  const shopSlug = requireFormShopSlug(formData);
  const ctx = await requireAdmin({ shopId });

  const parsed = modelApplicationStatusUpdateSchema.safeParse({
    application_id: formValue(formData, 'application_id'),
    status: formValue(formData, 'status'),
    notes_internal: formValue(formData, 'notes_internal') || null,
  });

  if (!parsed.success) {
    redirect(
      buildAdminHref('/admin/modelos', shopSlug || ctx.shopSlug, {
        error: 'No se pudo actualizar el estado.',
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: application, error: applicationError } = await supabase
    .from('model_applications')
    .select('id, session_id, status')
    .eq('id', parsed.data.application_id)
    .single();

  if (applicationError || !application) {
    redirect(
      buildAdminHref('/admin/modelos', shopSlug || ctx.shopSlug, {
        error: 'No se encontro la postulacion.',
      }),
    );
  }

  const sessionId = String(application.session_id);
  await ensureSessionBelongsToShop(supabase, sessionId, shopId);
  const redirectBase = buildAdminHref(
    `/admin/courses/sessions/${sessionId}/modelos`,
    shopSlug || ctx.shopSlug,
  );

  if (parsed.data.status === 'confirmed' && application.status !== 'confirmed') {
    const { data: requirement } = await supabase
      .from('model_requirements')
      .select('requirements')
      .eq('session_id', sessionId)
      .maybeSingle();

    const modelsNeeded = Number(
      ((requirement?.requirements as Record<string, unknown> | null)?.models_needed as number | undefined) || 0,
    );

    if (modelsNeeded > 0) {
      const { count: confirmedCount } = await supabase
        .from('model_applications')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('status', 'confirmed');

      if ((confirmedCount || 0) >= modelsNeeded) {
        redirect(
          `${redirectBase}?error=${encodeURIComponent('No podes confirmar mas modelos que el cupo definido.')}`,
        );
      }
    }
  }

  const { error } = await supabase
    .from('model_applications')
    .update({
      status: parsed.data.status,
      notes_internal: parsed.data.notes_internal || null,
    })
    .eq('id', parsed.data.application_id);

  if (error) {
    redirect(`${redirectBase}?error=${encodeURIComponent('No se pudo actualizar el estado del modelo.')}`);
  }

  revalidatePath('/admin/modelos');
  revalidatePath(redirectBase);
  redirect(`${redirectBase}?ok=${encodeURIComponent('Estado de postulacion actualizado.')}`);
}

export async function updateModelInternalNotesAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  const shopSlug = requireFormShopSlug(formData);
  const ctx = await requireAdmin({ shopId });

  const modelId = formValue(formData, 'model_id');
  if (!modelId) {
    redirect(
      buildAdminHref('/admin/modelos', shopSlug || ctx.shopSlug, {
        error: 'Modelo invalido.',
      }),
    );
  }

  const notes = formValue(formData, 'notes_internal') || null;
  const supabase = await createSupabaseServerClient();
  const { data: model } = await supabase
    .from('models')
    .select('id, shop_id')
    .eq('id', modelId)
    .maybeSingle();

  if (!model || String(model.shop_id || '') !== shopId) {
    redirect(
      buildAdminHref('/admin/modelos', shopSlug || ctx.shopSlug, {
        error: 'Modelo fuera de la barberia seleccionada.',
      }),
    );
  }

  const { error } = await supabase
    .from('models')
    .update({ notes_internal: notes })
    .eq('id', modelId)
    .eq('shop_id', shopId);

  if (error) {
    redirect(
      buildAdminHref('/admin/modelos', shopSlug || ctx.shopSlug, {
        error: 'No se pudieron guardar las notas.',
      }),
    );
  }

  revalidatePath('/admin/modelos');
  redirect(
    buildAdminHref('/admin/modelos', shopSlug || ctx.shopSlug, {
      model_id: modelId,
      ok: 'Notas internas actualizadas.',
    }),
  );
}

export async function updateOwnAppointmentStatusAction(formData: FormData) {
  const shopId = requireFormShopId(formData);
  const ctx = await requireStaff({ shopId });

  const parsed = updateAppointmentStatusSchema.safeParse({
    appointment_id: formValue(formData, 'appointment_id'),
    status: formValue(formData, 'status'),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join(', ') || 'Datos de actualizacion invalidos.');
  }

  if (!['done', 'no_show', 'cancelled'].includes(parsed.data.status)) {
    throw new Error('Estado no permitido para el equipo.');
  }

  if (parsed.data.status === 'done') {
    await markAppointmentCompletedAction({
      appointmentId: parsed.data.appointment_id,
      shopId,
    });
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('appointments')
    .update({
      status: parsed.data.status,
      completed_at: null,
      cancelled_by: parsed.data.status === 'cancelled' ? 'staff' : null,
      cancellation_reason: null,
    })
    .eq('id', parsed.data.appointment_id)
    .eq('staff_id', ctx.staffId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAppointmentMetrics();
}

