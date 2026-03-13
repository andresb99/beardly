export type BookingSuccessState = 'approved' | 'pending' | 'failure' | 'incomplete';

function normalizePaymentState(input: string | null | undefined) {
  const normalized = String(input || '').trim().toLowerCase();

  if (
    normalized === 'approved' ||
    normalized === 'authorized' ||
    normalized === 'paid' ||
    normalized === 'accredited'
  ) {
    return 'approved' as const;
  }

  if (normalized === 'pending' || normalized === 'processing') {
    return 'pending' as const;
  }

  if (
    normalized === 'failure' ||
    normalized === 'rejected' ||
    normalized === 'cancelled' ||
    normalized === 'expired'
  ) {
    return 'failure' as const;
  }

  return null;
}

export function resolveBookingSuccessState(input: {
  appointmentId?: string | null;
  queryPaymentStatus?: string | null;
  intentPaymentStatus?: string | null;
  providerPaymentId?: string | null;
}) {
  const appointmentId = String(input.appointmentId || '').trim() || null;
  if (appointmentId) {
    return 'approved' satisfies BookingSuccessState;
  }

  const queryState = normalizePaymentState(input.queryPaymentStatus);
  const intentState = input.intentPaymentStatus
      ? normalizePaymentState(input.intentPaymentStatus)
    : null;
  const hasProviderPaymentId = Boolean(String(input.providerPaymentId || '').trim());
  const hasPaymentSignal = Boolean(queryState || intentState || hasProviderPaymentId);

  if (!hasPaymentSignal) {
    return 'incomplete' satisfies BookingSuccessState;
  }

  if (intentState === 'failure' || queryState === 'failure') {
    return 'failure' satisfies BookingSuccessState;
  }

  if (intentState === 'pending' && !hasProviderPaymentId) {
    return 'incomplete' satisfies BookingSuccessState;
  }

  if (intentState === 'pending' || queryState === 'pending') {
    return 'pending' satisfies BookingSuccessState;
  }

  if (intentState === 'approved' || queryState === 'approved') {
    return 'approved' satisfies BookingSuccessState;
  }

  return hasProviderPaymentId ? 'pending' : 'incomplete';
}
