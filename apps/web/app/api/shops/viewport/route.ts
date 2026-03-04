import { NextRequest, NextResponse } from 'next/server';
import { listMarketplaceShopsInBounds } from '@/lib/shops';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const north = Number(searchParams.get('north'));
  const south = Number(searchParams.get('south'));
  const east = Number(searchParams.get('east'));
  const west = Number(searchParams.get('west'));
  const limitParam = searchParams.get('limit');
  const limit = typeof limitParam === 'string' && limitParam.trim() !== '' ? Number(limitParam) : undefined;

  if (![north, south, east, west].every((value) => Number.isFinite(value))) {
    return NextResponse.json(
      {
        message: 'Los bounds del viewport son invalidos.',
      },
      {
        status: 400,
      },
    );
  }

  const items = await listMarketplaceShopsInBounds({
    north,
    south,
    east,
    west,
    ...(Number.isFinite(limit) ? { limit: limit as number } : {}),
  });

  return NextResponse.json({
    items,
  });
}
