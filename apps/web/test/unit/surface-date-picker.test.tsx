import { render } from '@testing-library/react';
import {
  parseSurfaceCalendarDateTime,
  SurfaceDatePicker,
  SurfaceDateTimePicker,
  serializeSurfaceCalendarDateTime,
} from '@/components/heroui/surface-field';

describe('SurfaceDatePicker', () => {
  it('submits date-only values through a hidden input for HTML forms', () => {
    const { container } = render(
      <form>
        <SurfaceDatePicker
          name="from"
          label="Desde"
          labelPlacement="inside"
          defaultValue="2026-03-13"
          disableAnimation
        />
      </form>,
    );

    expect(container.querySelector('input[name="from"]')).toHaveValue('2026-03-13');
  });

  it('keeps datetime values serialized without seconds for existing server actions', () => {
    const { container } = render(
      <form>
        <SurfaceDateTimePicker
          name="start_at"
          label="Inicio"
          labelPlacement="inside"
          defaultValue="2026-03-13T14:45"
          disableAnimation
        />
      </form>,
    );

    expect(container.querySelector('input[name="start_at"]')).toHaveValue('2026-03-13T14:45');
  });

  it('updates the hidden input when the controlled string value changes', () => {
    const { container, rerender } = render(
      <form>
        <SurfaceDateTimePicker
          name="start_at"
          label="Inicio"
          labelPlacement="inside"
          value="2026-03-13T09:00"
          disableAnimation
        />
      </form>,
    );

    expect(container.querySelector('input[name="start_at"]')).toHaveValue('2026-03-13T09:00');

    rerender(
      <form>
        <SurfaceDateTimePicker
          name="start_at"
          label="Inicio"
          labelPlacement="inside"
          value="2026-03-13T11:30"
          disableAnimation
        />
      </form>,
    );

    expect(container.querySelector('input[name="start_at"]')).toHaveValue('2026-03-13T11:30');
  });

  it('serializes HeroUI calendar datetime values to the legacy minute format', () => {
    expect(serializeSurfaceCalendarDateTime(parseSurfaceCalendarDateTime('2026-03-13T08:05:00'))).toBe(
      '2026-03-13T08:05',
    );
  });
});
