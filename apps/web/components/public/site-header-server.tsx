import { SiteHeader } from '@/components/public/site-header';
import { getSiteHeaderInitialState } from '@/lib/site-header-state.server';

export async function SiteHeaderServer() {
  const initialState = await getSiteHeaderInitialState();
  return <SiteHeader initialState={initialState} />;
}
