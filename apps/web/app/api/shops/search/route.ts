import { NextRequest, NextResponse } from 'next/server';
import { searchMarketplaceShops } from '@/lib/shops';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const intentParam = searchParams.get('intent');
  const latitudeParam = searchParams.get('lat');
  const longitudeParam = searchParams.get('lng');
  const radiusKmParam = searchParams.get('radiusKm');
  const limitParam = searchParams.get('limit');

  const intent: Parameters<typeof searchMarketplaceShops>[0]['intent'] =
    intentParam === 'name' || intentParam === 'area' || intentParam === 'smart' ? intentParam : 'smart';
  const latitude =
    typeof latitudeParam === 'string' && latitudeParam.trim() !== '' ? Number(latitudeParam) : null;
  const longitude =
    typeof longitudeParam === 'string' && longitudeParam.trim() !== '' ? Number(longitudeParam) : null;
  const radiusKm =
    typeof radiusKmParam === 'string' && radiusKmParam.trim() !== '' ? Number(radiusKmParam) : undefined;
  const limit =
    typeof limitParam === 'string' && limitParam.trim() !== '' ? Number(limitParam) : undefined;

  const searchOptions: Parameters<typeof searchMarketplaceShops>[0] = {
    query,
    intent,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    ...(Number.isFinite(radiusKm) ? { radiusKm: radiusKm as number } : {}),
    ...(Number.isFinite(limit) ? { limit: limit as number } : {}),
  };

  const { items, mode } = await searchMarketplaceShops(searchOptions);

  return NextResponse.json({
    items,
    mode,
  });
}
