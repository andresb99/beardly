import { render, screen } from '@testing-library/react';
import { PublicSectionEmptyState } from '@/components/public/public-section-empty-state';

describe('PublicSectionEmptyState', () => {
  it('renders its message and recovery links', () => {
    render(
      <PublicSectionEmptyState
        eyebrow="Reservas"
        title="Sin barberias"
        description="No hay resultados para este escenario."
      />,
    );

    expect(screen.getByText('Reservas')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Sin barberias',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('No hay resultados para este escenario.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al marketplace' })).toHaveAttribute(
      'href',
      '/shops',
    );
    expect(screen.getByRole('link', { name: 'Crear la primera barberia' })).toHaveAttribute(
      'href',
      '/onboarding/barbershop',
    );
  });
});
