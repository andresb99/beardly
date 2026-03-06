import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export function getAuthorizationBearerToken(request: NextRequest) {
  const raw = request.headers.get('authorization') || '';
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function resolveAuthenticatedUser(request: NextRequest): Promise<User | null> {
  const admin = createSupabaseAdminClient();
  const accessToken = getAuthorizationBearerToken(request);

  if (accessToken) {
    const { data, error } = await admin.auth.getUser(accessToken);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  }

  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  return user || null;
}
