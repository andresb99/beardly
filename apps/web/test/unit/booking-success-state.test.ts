import { describe, expect, it } from 'vitest';
import { resolveBookingSuccessState } from '@/lib/booking-success-state';

describe('booking-success-state', () => {
  it('marks success without appointment or payment context as incomplete', () => {
    expect(
      resolveBookingSuccessState({
        appointmentId: null,
        queryPaymentStatus: null,
        intentPaymentStatus: null,
        providerPaymentId: null,
      }),
    ).toBe('incomplete');
  });

  it('keeps approved bookings as approved when an appointment already exists', () => {
    expect(
      resolveBookingSuccessState({
        appointmentId: 'appointment-1',
        queryPaymentStatus: 'failure',
        intentPaymentStatus: 'pending',
      }),
    ).toBe('approved');
  });

  it('marks abandoned checkout without provider payment as incomplete', () => {
    expect(
      resolveBookingSuccessState({
        appointmentId: null,
        queryPaymentStatus: 'pending',
        intentPaymentStatus: 'pending',
        providerPaymentId: null,
      }),
    ).toBe('incomplete');
  });

  it('keeps payment in pending state when Mercado Pago already created a payment record', () => {
    expect(
      resolveBookingSuccessState({
        appointmentId: null,
        queryPaymentStatus: 'pending',
        intentPaymentStatus: 'processing',
        providerPaymentId: '149523944098',
      }),
    ).toBe('pending');
  });

  it('treats rejected payments as failures', () => {
    expect(
      resolveBookingSuccessState({
        appointmentId: null,
        queryPaymentStatus: 'failure',
        intentPaymentStatus: 'rejected',
      }),
    ).toBe('failure');
  });

  it('treats explicit approved statuses as approved', () => {
    expect(
      resolveBookingSuccessState({
        appointmentId: null,
        queryPaymentStatus: 'approved',
        intentPaymentStatus: null,
      }),
    ).toBe('approved');
  });
});
