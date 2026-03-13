import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AdminHomeSchedule,
  type AdminHomeScheduleEvent,
} from '@/components/admin/admin-home-schedule';

describe('AdminHomeSchedule', () => {
  const originalMatchMedia = window.matchMedia;
  const staff = [
    { id: 'staff-1', name: 'Mauro' },
    { id: 'staff-2', name: 'Andres' },
  ];

  const events: AdminHomeScheduleEvent[] = [
    {
      id: 'appointment:1',
      title: 'Corte premium',
      clientName: 'Diego Perez',
      resourceId: 'staff-1',
      resourceName: 'Mauro',
      start: new Date('2026-03-10T10:00:00'),
      end: new Date('2026-03-10T11:00:00'),
      status: 'confirmed',
    },
    {
      id: 'appointment:2',
      title: 'Barba',
      clientName: 'Lucia Gomez',
      resourceId: 'staff-2',
      resourceName: 'Andres',
      start: new Date('2026-03-10T10:15:00'),
      end: new Date('2026-03-10T11:00:00'),
      status: 'pending',
    },
  ];

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('filters the owner calendar by barber pills without leaving the summary', async () => {
    const user = userEvent.setup();

    render(
      <AdminHomeSchedule
        staff={staff}
        events={events}
        startHour={9}
        endHour={20}
        initialDate={new Date('2026-03-09T08:00:00')}
      />,
    );

    expect(screen.getByText('Diego Perez')).toBeInTheDocument();
    expect(screen.getByText('Lucia Gomez')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mes' }));

    await user.click(screen.getByRole('button', { name: 'Mauro' }));

    expect(screen.getByText(/Diego Perez/i)).toBeInTheDocument();
    expect(screen.queryByText(/Lucia Gomez/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Todos' }));

    expect(screen.getByText(/Lucia Gomez/i)).toBeInTheDocument();
  });

  it('preserves explicit absence tones in the owner summary calendar', () => {
    const absenceEvent: AdminHomeScheduleEvent = {
      id: 'time-off:1',
      title: 'Vacaciones',
      clientName: 'Ausencia aprobada',
      resourceId: 'staff-1',
      resourceName: 'Mauro',
      start: new Date('2026-03-10T12:00:00'),
      end: new Date('2026-03-10T13:00:00'),
      tone: 'absence',
      statusLabel: 'Ausencia',
    };

    render(
      <AdminHomeSchedule
        staff={staff}
        events={[absenceEvent]}
        startHour={9}
        endHour={20}
        initialDate={new Date('2026-03-09T08:00:00')}
      />,
    );

    expect(screen.getByRole('button', { name: /Ausencia aprobada/i })).toHaveAttribute(
      'data-event-tone',
      'absence',
    );
  });
});
