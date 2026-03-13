import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar, type CalendarEvent } from '@/components/calendar/calendar';

describe('Calendar', () => {
  const originalMatchMedia = window.matchMedia;
  const appointment: CalendarEvent = {
    id: 'evt-1',
    title: 'Corte premium',
    clientName: 'Diego Perez',
    start: new Date('2026-03-10T10:00:00'),
    end: new Date('2026-03-10T11:00:00'),
    status: 'confirmed',
  };

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('renders weekly events and triggers click callbacks from the event card', async () => {
    const user = userEvent.setup();
    const onEventClick = vi.fn();

    render(
      <Calendar
        events={[appointment]}
        startHour={9}
        endHour={20}
        initialDate={new Date('2026-03-09T08:00:00')}
        locale="en-US"
        onEventClick={onEventClick}
      />,
    );

    const eventButton = screen.getByRole('button', { name: /Diego Perez/i });

    expect(eventButton).toHaveAttribute('data-event-tone', 'confirmed');
    expect(screen.getByText('Diego Perez')).toBeInTheDocument();
    expect(screen.getByText('Corte premium')).toBeInTheDocument();

    await user.click(eventButton);

    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(onEventClick).toHaveBeenCalledWith(appointment);
  });

  it('supports explicit tones for absences and keeps pending absences on the pending palette', () => {
    const events: CalendarEvent[] = [
      {
        id: 'time-off:approved',
        title: 'Vacaciones',
        clientName: 'Ausencia aprobada',
        start: new Date('2026-03-10T12:00:00'),
        end: new Date('2026-03-10T13:00:00'),
        tone: 'absence',
        statusLabel: 'Ausencia',
      },
      {
        id: 'time-off:pending',
        title: 'Consulta medica',
        clientName: 'Ausencia pendiente',
        start: new Date('2026-03-10T14:00:00'),
        end: new Date('2026-03-10T15:00:00'),
        tone: 'pending',
        statusLabel: 'Pendiente',
      },
    ];

    render(
      <Calendar
        events={events}
        startHour={9}
        endHour={20}
        initialDate={new Date('2026-03-09T08:00:00')}
        locale="en-US"
      />,
    );

    expect(screen.getByText('Canceladas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ausencia aprobada/i })).toHaveAttribute(
      'data-event-tone',
      'absence',
    );
    expect(screen.getByRole('button', { name: /Ausencia pendiente/i })).toHaveAttribute(
      'data-event-tone',
      'pending',
    );
  });

  it('navigates across weeks without carrying previous events into the new range', async () => {
    const user = userEvent.setup();

    render(
      <Calendar
        events={[appointment]}
        startHour={9}
        endHour={20}
        initialDate={new Date('2026-03-09T08:00:00')}
        locale="en-US"
      />,
    );

    expect(screen.getByText('Diego Perez')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Semana siguiente' }));

    expect(screen.queryByText('Diego Perez')).not.toBeInTheDocument();
  });

  it('lays out overlapping events in separate columns for shared team views', () => {
    const overlappingEvents: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: 'Corte',
        clientName: 'Diego Perez',
        resourceName: 'Mauro',
        start: new Date('2026-03-10T10:00:00'),
        end: new Date('2026-03-10T11:00:00'),
        status: 'confirmed',
      },
      {
        id: 'evt-2',
        title: 'Barba',
        clientName: 'Lucia Gomez',
        resourceName: 'Andres',
        start: new Date('2026-03-10T10:15:00'),
        end: new Date('2026-03-10T11:15:00'),
        status: 'pending',
      },
    ];

    const { container } = render(
      <Calendar
        events={overlappingEvents}
        startHour={9}
        endHour={20}
        initialDate={new Date('2026-03-09T08:00:00')}
        locale="en-US"
      />,
    );

    expect(container.querySelector('[data-event-id="evt-1"]')).toHaveAttribute(
      'data-overlap-columns',
      '2',
    );
    expect(container.querySelector('[data-event-id="evt-2"]')).toHaveAttribute(
      'data-overlap-columns',
      '2',
    );
  });

  it('switches between day, week and month views from the header controls', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Calendar
        events={[appointment]}
        startHour={9}
        endHour={20}
        initialDate={new Date('2026-03-09T08:00:00')}
        locale="en-US"
      />,
    );

    expect(container.querySelector('[data-calendar-view="week"]')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dia' }));

    expect(container.querySelector('[data-calendar-view="day"]')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dia siguiente' }));

    expect(screen.getByText(/Diego Perez/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mes' }));

    expect(container.querySelector('[data-calendar-view="month"]')).toBeInTheDocument();
  });

  it('renders the mobile weekly agenda variant on narrow screens', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(
      <Calendar
        events={[appointment]}
        startHour={9}
        endHour={20}
        initialDate={new Date('2026-03-09T08:00:00')}
        locale="en-US"
      />,
    );

    expect(container.querySelector('[data-mobile-time-grid="week"]')).toBeInTheDocument();
  });
});
