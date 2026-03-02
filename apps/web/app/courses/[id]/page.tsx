import { notFound, redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

interface CourseDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, shop_id, is_active')
    .eq('id', id)
    .maybeSingle();

  if (!course || !course.is_active) {
    notFound();
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('slug, status')
    .eq('id', String(course.shop_id))
    .eq('status', 'active')
    .maybeSingle();

  if (!shop?.slug) {
    notFound();
  }

  redirect(`/shops/${shop.slug}/courses/${id}`);
}
