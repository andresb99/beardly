import { NextResponse, type NextRequest } from 'next/server';
import { courseEnrollmentCreateSchema } from '@navaja/shared';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = courseEnrollmentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return new NextResponse(parsed.error.flatten().formErrors.join(', ') || 'Datos de inscripcion invalidos.', {
      status: 400,
    });
  }

  const supabase = createSupabaseAdminClient();
  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const normalizedPhone = parsed.data.phone.trim();

  const { data: session, error: sessionError } = await supabase
    .from('course_sessions')
    .select('id, course_id, capacity, status')
    .eq('id', parsed.data.session_id)
    .eq('status', 'scheduled')
    .maybeSingle();

  if (sessionError) {
    return new NextResponse(sessionError.message || 'No se pudo validar la sesion.', { status: 400 });
  }

  if (!session?.id || !session.course_id) {
    return new NextResponse('La sesion seleccionada no esta disponible.', { status: 400 });
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, shop_id, is_active')
    .eq('id', String(session.course_id))
    .eq('is_active', true)
    .maybeSingle();

  if (courseError) {
    return new NextResponse(courseError.message || 'No se pudo validar el curso.', { status: 400 });
  }

  if (!course?.id || !course.shop_id) {
    return new NextResponse('El curso ya no esta disponible para inscripcion.', { status: 400 });
  }

  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id, status')
    .eq('id', String(course.shop_id))
    .eq('status', 'active')
    .maybeSingle();

  if (shopError) {
    return new NextResponse(shopError.message || 'No se pudo validar la barberia.', { status: 400 });
  }

  if (!shop?.id) {
    return new NextResponse('La barberia de este curso no esta disponible.', { status: 400 });
  }

  const [{ count: activeEnrollmentCount, error: countError }, { data: duplicateEnrollment, error: duplicateError }] =
    await Promise.all([
      supabase
        .from('course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', parsed.data.session_id)
        .in('status', ['pending', 'confirmed']),
      supabase
        .from('course_enrollments')
        .select('id, status')
        .eq('session_id', parsed.data.session_id)
        .eq('email', normalizedEmail)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (countError) {
    return new NextResponse(countError.message || 'No se pudo validar la capacidad del curso.', {
      status: 400,
    });
  }

  if (duplicateError) {
    return new NextResponse(duplicateError.message || 'No se pudo validar si ya estabas inscripto.', {
      status: 400,
    });
  }

  const capacity = Number(session.capacity || 0);
  if (capacity > 0 && (activeEnrollmentCount || 0) >= capacity) {
    return new NextResponse('Esta sesion ya no tiene cupos disponibles.', { status: 400 });
  }

  if (duplicateEnrollment?.id) {
    return new NextResponse('Ya existe una inscripcion activa para este email en la sesion.', {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from('course_enrollments')
    .insert({
      session_id: parsed.data.session_id,
      name: parsed.data.name,
      phone: normalizedPhone,
      email: normalizedEmail,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) {
    return new NextResponse(error?.message || 'No se pudo registrar la inscripcion.', { status: 400 });
  }

  return NextResponse.json({ enrollment_id: data.id });
}

