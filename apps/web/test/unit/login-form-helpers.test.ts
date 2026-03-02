import { isEmailValid, mapAuthError } from '@/components/public/login-form';

describe('login form helpers', () => {
  it('validates basic email inputs', () => {
    expect(isEmailValid('andre@example.com')).toBe(true);
    expect(isEmailValid('andre')).toBe(false);
  });

  it('maps common auth provider errors to user-facing copy', () => {
    expect(mapAuthError('Invalid login credentials')).toBe('Email o contrasena incorrectos.');
    expect(mapAuthError('Provider is not enabled')).toContain('Google no esta habilitado');
    expect(mapAuthError('Algo inesperado')).toBe('Algo inesperado');
  });
});
